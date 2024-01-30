// Tangible unit (rasberry pi)とのAPI

import express from "express";
import { getFirestore, Firestore, DocumentData, Timestamp } from "firebase-admin/firestore";
import { getAreaMapUrl, getAreaDocument } from "./areas";
import { createBuildingFromSnapshot } from "./buildings";
import { authorizeWithApiKey } from "./users";
import {
  COLLECTIONS,
  MarkerType,
  getDocumentsFromGeoHashAndRadius,
  catchEResponse,
} from "./utils";
import { WorldProjection, getRadius } from "./GeoUtils";
import { getOtherTangibleMarkers } from "./workspaces";


export const tangibleApp = express();

tangibleApp.use(express.json());

// tangible machine からのpost
tangibleApp.route("/post")
  .post(async (req, res) => {
    const authCheck = authorizeWithApiKey(req);
    if (!authCheck.access) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: authCheck.message });
    }
    const timestart = Date.now();
    const db = getFirestore();
    const col = db.collection(COLLECTIONS.TANGIBLES);
    const body = req.body;
    const tangibleId = body.unitID;

    try {
      const docRef = col.doc(tangibleId);
      const doc = await docRef.get();
      if (doc.exists) {
        const data = doc.data();
        if (data && data.active) {
          // data.rawData = body;
          const dataCol = docRef.collection(COLLECTIONS.TANGIBLE_DATA);
          const query = dataCol.orderBy("created", "asc").limit(15);
          const snaps = await query.get();
          if (snaps.docs.length > 10) {
            const snapDocId = snaps.docs[0].id;
            const delDocRef = dataCol.doc(snapDocId);
            await delDocRef.delete();
          }
          const dataRef = dataCol.doc();
          const timestamp = Timestamp.now();
          const sBody = {
            ...body,
            created: timestamp,
          };
          await dataRef.set(sBody);
          // await docRef.set({ rawData: body }, { merge: true });
          const millisspend = Date.now() - timestart;
          console.log("post: " + tangibleId + ", " + millisspend);
          return res
            .status(200)
            .json({ message: "ok" });
        } else {
          return res
            .status(500)
            .json({ error: "error", message: "You need to activate first. Please call api /tangibles/" + tangibleId + "/activate" });
        }
      } else {
        return res
          .status(402)
          .json({ error: "error", message: "not data found with " + tangibleId });
      }
    } catch (e) {
      return catchEResponse(e, res);
    }
  });

// tangibleデータ取得
tangibleApp.route("/:id")
  .get(async (req, res) => {
    const authCheck = authorizeWithApiKey(req);
    if (!authCheck.access) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: authCheck.message });
    }
    const db = getFirestore();
    if (req.params.id !== null) {
      console.log("get:" + req.params.id);
      try {
        const tangible = await getTangibleDocument(req.params.id, db);
        if (tangible) {
          return res
            .status(200)
            .json(tangible);
        } else {
          return res
            .status(402)
            .json({ error: "error", message: "Document is not found. ID:" + req.params.id });
        }
      } catch (e) {
        return catchEResponse(e, res);
      }
    }
    return res
      .status(404)
      .json({ error: "error", message: "this is error" });
  });

// tangibleのアクティベート
tangibleApp.route("/:id/activate")
  .get(async (req, res) => {
    const authCheck = authorizeWithApiKey(req);
    if (!authCheck.access) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: authCheck.message });
    }
    const db = getFirestore();
    if (req.params.id !== null) {
      console.log("activate:" + req.params.id);
      try {
        const col = db.collection(COLLECTIONS.TANGIBLES);
        const docRef = col.doc(req.params.id);
        const doc = await docRef.get();
        if (doc.exists) {
          await docRef.set({ active: true }, { merge: true });
          return res
            .status(200)
            .json({ message: "ok" });
        } else {
          return res
            .status(402)
            .json({ error: "error", message: "not data found with " + req.params.id });
        }
      } catch (e) {
        return catchEResponse(e, res);
      }
    }
    return res
      .status(404)
      .json({ error: "error", message: "this is error" });
  });


// tangibleのインアクティベート
tangibleApp.route("/:id/inactivate")
  .get(async (req, res) => {
    const authCheck = authorizeWithApiKey(req);
    if (!authCheck.access) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: authCheck.message });
    }
    const db = getFirestore();
    if (req.params.id !== null) {
      console.log("inactivate:" + req.params.id);
      try {
        const col = db.collection(COLLECTIONS.TANGIBLES);
        const docRef = col.doc(req.params.id);
        const doc = await docRef.get();
        if (doc.exists) {
          await docRef.set({ active: false }, { merge: true });
          return res
            .status(200)
            .json({ message: "ok" });
        } else {
          return res
            .status(402)
            .json({ error: "error", message: "not data found with " + req.params.id });
        }
      } catch (e) {
        return catchEResponse(e, res);
      }
    }
    return res
      .status(404)
      .json({ error: "error", message: "this is error" });
  });

// tangibleユニットが現在リンクしているエリアのビルディング情報
tangibleApp.route("/:id/footprints/buildings")
  .get(async (req, res) => {
    const authCheck = authorizeWithApiKey(req);
    if (!authCheck.access) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: authCheck.message });
    }
    const timestart = Date.now();
    const db = getFirestore();
    if (req.params.id !== null) {
      // console.log(req.params.id);
      try {
        const tangible = await getTangibleDocument(req.params.id, db);
        if (tangible) {
          const { NE, SW } = getRectangleLatLng(tangible);
          const radius = getRadius(NE, SW);
          const bldgs1 = await getDocumentsFromGeoHashAndRadius(
            COLLECTIONS.BUILDINGS,
            "geoHash",
            tangible.area.center.lat,
            tangible.area.center.lng,
            radius + 20);
          const bldgs2 = bldgs1.filter((doc: DocumentData) => {
            const data = doc.data();
            const r = data.footprint.filter((p: { latitude: number, longitude: number, altitude: number }) => {
              if (p.latitude >= SW.lat && p.latitude <= NE.lat &&
                p.longitude >= SW.lng && p.longitude <= NE.lng) {
                return true;
              }
              return false;
            });
            return r.length > 0;
          });
          const bldgs3 = bldgs2.map((doc: DocumentData) => {
            return createBuildingFromSnapshot(doc);
          });
          const millisspend = Date.now() - timestart;
          console.log("build: " + req.params.id + ", " + millisspend);
          return res
            .status(200)
            .json(bldgs3);
        } else {
          return res
            .status(402)
            .json({ error: "error", message: "Document data not found." });
        }
      } catch (e) {
        return catchEResponse(e, res);
      }
    }
    return res
      .status(404)
      .json({ error: "error", message: "this is error" });
  });

// tangibleユニットが現在所属しているworkspaceに属しているマーカーのフットプリント情報取得
// workspaceを作成したユーザーであればworkspaceのマーカー情報をすべて閲覧する権限はあるだろうが、
// tangibleユニットにその権限はあるのだろうか。呼び出し元（APIキー）が違うので。
tangibleApp.route("/:id/footprints/markers")
  .get(async (req, res) => {
    const authCheck = authorizeWithApiKey(req);
    if (!authCheck.access) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: authCheck.message });
    }
    const db = getFirestore();
    if (req.params.id !== null) {
      console.log(req.params.id);
      try {
        const tangible = await getTangibleDocument(req.params.id, db);
        if (tangible) {
          const areaInfo = tangible.area;
          // ユニットが属するworkspaceから他のマーカーを緯度経度で取得
          const otherMarkers = await getOtherTangibleMarkers(req.params.id, areaInfo);

          // マーカーの中心座標がタンジブル領域に含まれている場合のみ抽出 Cameraは除く
          // ある程度幅をもたせたほうが良いかも
          const { NE, SW } = getRectangleLatLng(tangible);
          const otherMarkers2 = otherMarkers.filter((m) => {
            if (m.type === MarkerType.Special) {
              return false;
            }
            if (m.center.lat >= SW.lat && m.center.lat <= NE.lat &&
              m.cener.lng >= SW.lng && m.center.lng <= NE.lng) {
              return true;
            }
            return false;
          });
          // マーカーのフットプリント取得
          const footMarkers = await Promise.all(otherMarkers2.map(async (marker) => {
            if (marker.type === MarkerType.Building) {
              return marker;
            } else if (marker.type === MarkerType.Furniture) {
              return marker;
            } else {
              return marker;
            }
          }));
          return res
            .status(200)
            .json(footMarkers);
        } else {
          return res
            .status(402)
            .json({ error: "error", message: "Document data not founc" });
        }
      } catch (e) {
        return catchEResponse(e, res);
      }
    }
    return res
      .status(404)
      .json({ error: "error", message: "this is error" });
  });

tangibleApp.route("/:id/map")
  .get(async (req, res) => {
    const authCheck = authorizeWithApiKey(req);
    if (!authCheck.access) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: authCheck.message });
    }
    const db = getFirestore();
    if (req.params.id !== null) {
      try {
        const tangible = await getTangibleDocument(req.params.id, db);
        if (tangible && tangible.area) {
          const aDoc = await getAreaDocument(tangible.area.workspaceID, tangible.area.areaID, db);
          if (aDoc && aDoc.area) {
            const mapUrl = aDoc.area.unity ? aDoc.area.unity : aDoc.area.map;
            const url = await getAreaMapUrl(mapUrl, tangible.area.workspaceID);
            if (url) {
              return res
                .status(200)
                .json({ message: "OK", url: url });
            }
          }
        }
        return res
          .status(402)
          .json({ error: "error", message: "Could not get url." });
      } catch (e) {
        return catchEResponse(e, res);
      }
    }
    return res
      .status(404)
      .json({ error: "error", message: "this is error" });
  });


// areaから

/*
 * Functions
 */

export const getTangibleDocument = async (id: string, db: Firestore) => {
  const col = db.collection(COLLECTIONS.TANGIBLES);
  const doc = await col.doc(id).get();
  if (doc.exists) {
    const body = doc.data();
    const dataCol = col.doc(id).collection(COLLECTIONS.TANGIBLE_DATA);
    const query = dataCol.orderBy("created", "desc").limit(1);
    const snaps = await query.get();
    let rawData = {};
    if (snaps.docs.length > 0) {
      const snapDoc = snaps.docs[0];
      rawData = snapDoc.data();
    }
    return {
      ...body,
      rawData: rawData,
    } as any;
  } else {
    console.log("Data not found, doc: " + id);
  }
  return undefined;
};


// tangibleのデータからマーカーの緯度経度情報、回転などを一括変換
export const parseRawMarkers = (tangibleData: any) => {
  const markers: any[] = [];
  try {
    const rawData = tangibleData.rawData.data;
    const { NE, SW } = getRectangleLatLng(tangibleData);
    const w = tangibleData.width;
    const h = tangibleData.height;

    for (const oneData of rawData) {
      let markerID = oneData.markerID as string;
      if (typeof oneData.markerID === "number") {
        if (oneData.markerID < 10 && oneData.markerID >= 0) {
          markerID = "0" + oneData.markerID;
        } else {
          markerID = "" + oneData.markerID;
        }
      }
      try {
        const { rotation } = getMarkerRotationAndLength(oneData);
        const r = { x: oneData.coordinates.cx / w, y: oneData.coordinates.cy / h };
        const geo = {
          lat: NE.lat - (NE.lat - SW.lat) * r.y,
          lng: SW.lng + (NE.lng - SW.lng) * r.x,
        };
        markers.push({
          center: geo,
          rotation: rotation,
          markerID: markerID,
        });
      } catch (e0) {
        console.log(e0);
      }
    }
  } catch (e) {
    console.log(e);
  }
  return markers;
};

// ズームレベルとpixelあたりの実寸（meter)
export const getMetersPerPixel = (lat: number, zoom: number) => {
  return 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
};

// rawDataのマーカーから回転とマーカーサイズを求める
const getMarkerRotationAndLength = (markerRaw: any) => {
  const coords = markerRaw.coordinates;
  const c = { x: coords.cx, y: coords.cy };
  const p1 = { x: coords.x1 - c.x, y: coords.y1 - c.y };
  const p2 = { x: coords.x2 - c.x, y: coords.y2 - c.y };
  const p3 = { x: coords.x3 - c.x, y: coords.y3 - c.y };
  const p4 = { x: coords.x4 - c.x, y: coords.y4 - c.y };
  // 左隅の座標は通常なら135度（0.75PI)
  const rad = 0.75 * Math.PI - Math.atan2(p1.y, p1.x);

  const l1 = Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
  const l2 = Math.sqrt((p2.x - p3.x) * (p2.x - p3.x) + (p2.y - p3.y) * (p2.y - p3.y));
  const l3 = Math.sqrt((p3.x - p4.x) * (p3.x - p4.x) + (p3.y - p4.y) * (p3.y - p4.y));
  const l4 = Math.sqrt((p4.x - p1.x) * (p4.x - p1.x) + (p4.y - p1.y) * (p4.y - p1.y));
  const length = (l1 + l2 + l3 + l4) / 4;
  return {
    rotation: rad,
    size: length,
  };
};

// タンジブルユニットの描画の実寸範囲
const getSizeMetersOfTangible = (lat: number, zoom: number, width: number, height: number) => {
  const mppx = getMetersPerPixel(lat, zoom);
  const w = width * mppx;
  const h = height * mppx;
  return {
    w: w, h: h,
  };
};

// タンジブルの緯度経度範囲
const getRectangleLatLng = (tangibleData: DocumentData) => {
  const area = tangibleData.area;
  const tSize = getSizeMetersOfTangible(area.center.lat, area.zoom, tangibleData.width, tangibleData.height);
  const wY = WorldProjection.latToSphMerc(area.center.lat);
  const wX = WorldProjection.lngToSphMerc(area.center.lng);
  const effect = 1 / Math.cos(area.center.lat * Math.PI / 180);

  const wNE = {
    y: wY + tSize.h * effect / 2,
    x: wX + tSize.w * effect / 2,
  };
  const wSW = {
    y: wY - tSize.h * effect / 2,
    x: wX - tSize.w * effect / 2,
  };
  const NE = {
    lat: WorldProjection.sphMercToLat(wNE.y),
    lng: WorldProjection.sphMercToLng(wNE.x),
  };
  const SW = {
    lat: WorldProjection.sphMercToLat(wSW.y),
    lng: WorldProjection.sphMercToLng(wSW.x),
  };
  return {
    NE: NE,
    SW: SW,
  };
};
