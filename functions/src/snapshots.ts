// Tangible unit (rasberry pi)とのAPI

import {
  Firestore,
  DocumentData,
  DocumentReference,
} from "firebase-admin/firestore";

import {
  getRawAreaInfo,
} from "./areas";
import {
  COLLECTIONS,
  createStoragePublicUrl,
  getCollectionDocumentsFromRef,
} from "./utils";
import { getTangibleDocument, parseRawMarkers } from "./tangibles";
import { loadMarkerObject } from "./markers";


// 最新のスナップショット情報取得
export const getLatestRawSnapshotFromRef = async (wRef: DocumentReference) => {
  try {
    const col = wRef.collection(COLLECTIONS.SNAPSHOTS);
    const query = col.orderBy("created", "desc").limit(1);
    const snaps = await query.get();
    if (snaps.docs.length === 0) {
      return undefined;
    }
    const snapDoc = snaps.docs[0];
    return snapDoc;
  } catch (e) {
    console.log(e);
  }
  return undefined;
};

// スナップショットのrawデータから詳細情報（下層情報）をロード
export const loadSnapShotDetailFromRaw = async (
  docId: string,
  data: DocumentData | undefined,
  wRef: DocumentReference,
  markerFlag: boolean,
  urlFlag: boolean
) => {
  if (!data) {
    return undefined;
  }
  let snap1: any = {
    ...data,
    docId: docId,
  };
  if (urlFlag) {
    const snapRefPath = "workspaces/" + wRef.id + "/" + data.screenshot;
    const snapUrl = await createStoragePublicUrl(snapRefPath);
    console.log(snapUrl);
    if (snapUrl) {
      snap1 = {
        ...snap1,
        screenUrl: snapUrl,
      };
    }
  }
  const sRef = wRef.collection(COLLECTIONS.SNAPSHOTS).doc(snap1.docId);
  const rawAreas = await getCollectionDocumentsFromRef(sRef, COLLECTIONS.AREAS);
  // Areaのマーカー情報取得（配置されている駒。座標、本体情報付き）
  const areas = await Promise.all(rawAreas.map(async (rawArea) => {
    const aRef = sRef.collection(COLLECTIONS.AREAS).doc(rawArea.docId);
    const markers = await getCollectionDocumentsFromRef(aRef, COLLECTIONS.MARKERS);
    if (markerFlag) {
      const m2 = await Promise.all(markers.map(async (marker) => {
        return await loadMarkerObject(marker);
      }));
      return {
        ...rawArea,
        markers: m2,
      };
    } else {
      return {
        ...rawArea,
        markers: markers,
      };
    }
  }));
  return {
    ...snap1,
    areas: areas,
  };
};

const makeSnapAreaDict = (tArea: any) => {
  return {
    docId: tArea.docId,
    area: tArea.area,
    title: tArea.title,
    created: tArea.created,
    modified: tArea.modified,
    tangibleID: tArea.tangibleID,
  };
};

export const makeSnapShotInfo = async (db: Firestore, wRef: DocumentReference) => {
  const rawAreas = await getRawAreaInfo(wRef);
  const sAreas = await getLatestSnapAreaInfo(wRef);
  const tAreas = await getLatestTangibleInfo(rawAreas, db);
  let activeFlag = false;
  const areas = tAreas.map((tarea) => {
    if (tarea.tangible.active) {
      activeFlag = true;
      return {
        ...makeSnapAreaDict(tarea),
        tMarkers: tarea.tangible.markers,
      };
    } else {
      const sarea = sAreas.find((sa) => {
        return sa.docId === tarea.docId;
      });
      if (sarea) {
        return {
          ...makeSnapAreaDict(tarea),
          tMarkers: sarea.markers,
        };
      } else {
        return {
          ...makeSnapAreaDict(tarea),
          tMarkers: [],
        };
      }
    }
  });
  if (activeFlag) {
    return areas;
  }
  return [];
};

// 最新のsnapshotのArea情報取得（マーカーの詳細情報なし）
export const getLatestSnapAreaInfo = async (wRef: DocumentReference) => {
  const snapDoc = await getLatestRawSnapshotFromRef(wRef);
  if (snapDoc) {
    const snap = await loadSnapShotDetailFromRaw(snapDoc.id, snapDoc.data(), wRef, false, false);
    if (snap) {
      return snap.areas as any[];
    }
  }
  return [];
};

// 最後のtangible（active inactive含む）のマーカー情報
export const getLatestTangibleInfo = async (rawAreas: any[], db: Firestore) => {
  const areas = await Promise.all(rawAreas.map(async (rawArea) => {
    try {
      // tangibleのrawDataからデータをParse。タンジブル側がactiveの場合のみ
      const tangible = await getTangibleDocument(rawArea.tangibleID, db);
      if (tangible && tangible.rawData) {
        const tangibleTimestamp = tangible.rawData.timestamp;
        const markersT = parseRawMarkers(tangible);
        // rawDataのマーカーが、rawAreaのマーカーに含まれているか否か
        const cashMarkers: any[] = [];
        for (const markerT of markersT) {
          const list = rawArea.markers.filter((m: any) => m.docId === markerT.markerID);
          if (list.length > 0) {
            const m = list[0];
            cashMarkers.push({
              ...m,
              center: markerT.center,
              rotation: markerT.rotation,
            });
          }
        }
        return {
          ...rawArea,
          tangible: {
            active: tangible.active,
            timestamp: tangibleTimestamp,
            markers: cashMarkers,
          },
        };
      } else {
        return {
          ...rawArea,
          tangible: {},
        };
      }
    } catch (et) {
      console.log(et);
      return {
        ...rawArea,
        tangible: {},
      };
    }
  }));
  return areas;
};
