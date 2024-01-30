import {
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  orderBy,
  limit,
  startAt,
  endAt,
  where,
  DocumentReference,
  serverTimestamp,
  DocumentData,
} from "firebase/firestore";
import { httpsCallable /*, connectFunctionsEmulator*/ } from "firebase/functions";
import { ref, getBlob, getDownloadURL, uploadBytes, deleteObject } from "firebase/storage";

import { db, auth, storage, functions } from "./init"
import { GeoUtils } from "../GeoUtils";
import { Area, AreaUtils } from "../models/Area";
import { Building, BuildingUtils } from "../models/Building";
import { Furniture, FrnUtils, SpecialFrn, SFrnUtils } from "../models/Furniture";
import { Marker, MarkerType, MarkerUtils, TangibleMarker, TangibleMarkerUtils } from "../models/Marker";
import { Photo, PhotoUtils } from "../models/Photo";
import { Snapshot, SnapshotUtils } from "../models/Snapshot";
import { Tangible, TangibleUtils } from "../models/Tangible";
import { Workspace, WorkspaceUtils } from "../models/Workspace";

// connectFunctionsEmulator(functions, "localhost", 5001);

const COLLECTIONS = {
  USERS: "users",
  BUILDINGS: "buildings",
  TRANS: "trans",
  TANGIBLES: "tangibles",
  TANGIBLE_DATA: "rawdata",
  WORKSPACES: "workspaces",
  AREAS: "areas",
  FURNITURES: "furnitures",
  MARKERS: "markers",
  SNAPSHOTS: "snapshots",
};

export const getUserID = () => {
  return auth.currentUser?.uid;
};

export const convertCallableApiTimeObj = (obj: any) => {
  const temp = { ...obj };
  if(temp.created) {
    temp.created = new Date(obj.created._seconds * 1000);
  }
  if(temp.modified) {
    temp.modified = new Date(obj.modified._seconds * 1000);
  }
  return temp;
};

export const getUserData = async (userId: string) => {
  const uid = getUserID();
  if (uid) {
    console.log(uid);
    const col = collection(db, COLLECTIONS.USERS);
    const docRef = doc(col, userId);
    try {
      const snapShot = await getDoc(docRef)
      if (snapShot.exists()) {
        const data = snapShot.data();
        return {
          displayName: data.displayName,
          profile: data.profile,
          group: data.group,
          uid: userId,
          isLogin: true,
        };
      }
    } catch (e) {
      console.log("Api Error: get user data failed, " + userId);
    }
    return {
      displayName: "",
      profile: "",
      group: "",
      uid: userId,
      isLogin: true,
    };
  } else {
    console.log("user id is null");
  }
  return {
    displayName: "",
    profile: "",
    group: "",
    uid: "",
    isLogin: false,
  };
};

export const updateUserData = async (
  displayName: string,
  photo: Photo | undefined
) => {
  const uid = getUserID()
  if (uid) {
    const data: any = {
      displayName: displayName,
      modified: serverTimestamp()
    };
    if (photo && !photo.isStorage) {
      const dateString = PhotoUtils.makeDateIDString(new Date(), "-");
      const fA = photo.file.name.split(".");
      let ext = "png";
      if (fA.length > 1) {
        ext = fA[fA.length - 1];
      }
      const storageRef = ref(storage, "users/" + uid + "/profile_" + dateString + "." + ext);
      const snapShot = await uploadBytes(storageRef, photo.file);
      data.profile = snapShot.ref.name;
    }

    const col = collection(db, COLLECTIONS.USERS);
    const uRef = doc(col, uid);
    const snap = await getDoc(uRef);
    if (snap.exists()) {
      await updateDoc(uRef, data);
    } else {
      data.created = serverTimestamp();
      await setDoc(uRef, data);
    }
    return true;
  }
  return false;
};

export const getBuildingWithRadius = async (lat: number, lng: number, radius: number) => {
  const func = httpsCallable(functions, "getBuildingWithRadius");
  const data = {
    lat: lat,
    lng: lng,
    radius: radius,
  };
  try {
    const res = await func(data);
    return res;
  } catch (e) {
    console.log(e);
  }
  return undefined;
};

export const downloadProfileImageFromStorage = async (
  userId: string,
  filename: string
) => {
  const storageRef = ref(storage, "users/" + userId + "/" + filename);
  try {
    const blob = await getBlob(storageRef);
    if (blob) {
      return new File([blob], filename);
    } else {
      console.log("download blob is null:" + filename);
    }
  } catch (e) {
    console.log("download profile image err:" + filename);
  }
  return undefined;
};

export const createPublicUrlFromRefPath = async (
  refpath: string,
) => {
  const storageRef = ref(storage, refpath);
  try {
    const result = await getDownloadURL(storageRef);
    return result;
  } catch (e) {
    console.log("download err:" + refpath);
  }
  return undefined;
};

export const uploadArrayBuffer = async (refpath: string, buffer: ArrayBuffer) => {
  const storageRef = ref(storage, refpath);
  try {
    const result = await uploadBytes(storageRef, buffer);
    return result.ref.name;
  } catch (e) {
    console.log(e);
  }
  return undefined;
};

export const getAllFurnitures = async () => {
  const uid = getUserID();
  const frns: Furniture[] = [];
  if (uid) {
    const col = collection(db, COLLECTIONS.FURNITURES);
    const q = query(col, orderBy('created', 'desc'), limit(500));
    try {
      const snapShots = await getDocs(q);
      if (snapShots.docs.length === 0) {
        return [];
      } else {
        snapShots.docs.forEach((doc) => {
          const obj: Furniture = FrnUtils.createFrnFromFirestoreDoc(doc.id, doc.data());
          frns.push(obj);
        });
        return frns;
      }
    } catch (e) {
      console.log("Api Error: get Furnitures data failed, ");
      console.log(e);
    }
    return frns;
  } else {
    console.log("user id is null");
  }
  return frns;
};

export const deleteStorageFile = async (refPath: string) => {
  const storageRef = ref(storage, refPath);
  try {
    await deleteObject(storageRef);
    return true;
  } catch (e) {
    console.log(e);
  }
  return undefined;
};

/*
 * WorkSpace
 */

export const getSimpleWorkSpaceAndArea = async (wsID: string, areaID: string) => {
  const col = collection(db, COLLECTIONS.WORKSPACES);
  const wRef = doc(col, wsID);
  const aRef = doc(collection(wRef, COLLECTIONS.AREAS), areaID);
  try {
    const wDoc = await getDoc(wRef);
    if (wDoc.exists()) {
      const ws = WorkspaceUtils.createWSFromFirestoreDoc(wsID, wDoc.data());
      const aDoc = await getDoc(aRef);
      if (aDoc.exists()) {
        const area = AreaUtils.createAreaFromFirestoreDoc(areaID, aDoc.data());
        ws.areas.push(area);
        return ws;
      }
    }
  } catch (e) {
    console.log(e);
  }
  return undefined;
};

export const getWorkSpaces = async () => {
  const uid = getUserID();
  const wss: Workspace[] = [];
  if (uid) {
    const col = collection(db, COLLECTIONS.WORKSPACES);
    const q = query(col, where("organizer", "==", uid), orderBy("modified", "desc"), limit(200));
    try {
      const snapShots = await getDocs(q);
      if (snapShots.docs.length === 0) {
        return [];
      } else {
        snapShots.docs.forEach((doc) => {
          const obj: Workspace = WorkspaceUtils.createWSFromFirestoreDoc(doc.id, doc.data());
          wss.push(obj);
        })
        return wss;
      }
    } catch (e) {
      console.log(e);
    }
  } else {
    console.log("user id is null");
  }
  return wss;
};

export const getSingleWorkSpace = async (wsID: string) => {
  const uid = getUserID();
  if (uid) {
    const col = collection(db, COLLECTIONS.WORKSPACES);
    const wRef = doc(col, wsID);

    try {
      const wDoc = await getDoc(wRef);
      if (wDoc.exists()) {
        const ws: Workspace = WorkspaceUtils.createWSFromFirestoreDoc(wDoc.id, wDoc.data());
        const areas = await getAreasFromWsID(wsID);
        const snaps = await getSnapshotsFromWsID(wsID);
        ws.areas = areas;
        ws.snapshots = snaps;
        return ws;
      }
    } catch (e) {
      console.log(e);
    }
  } else {
    console.log("user id is null");
  }
  return undefined;
};

/*
 * workspace 保存
 * area, markerなどの情報は書き込まない。[saveArea]を呼び出す必要あり
 */

export const createOrUpdateWorkspace = async (ws: Workspace) => {
  const uid = getUserID();
  if (uid) {
    const col = collection(db, COLLECTIONS.WORKSPACES);
    const wDoc = ws.isNew ? doc(col) : doc(col, ws.id);
    const dict = WorkspaceUtils.createFirestoreDocFromObject(ws);
    try {
      await setDoc(wDoc, dict);
      return wDoc.id;
    } catch (e) {
      console.log(e);
    } 
  }
  return undefined;
};

const workspaceUpdateTimestamp = async (wRef: DocumentReference) => {
  try {
    const dict = { modified: serverTimestamp() };
    await updateDoc(wRef, dict);
    return true;
  } catch (e) {
    console.log(e);
  } 
  return false;
};

// Delete workspace

export const deleteWorkspace = async (wsId: string) => {
  const col = collection(db, COLLECTIONS.WORKSPACES);
  const wRef = doc(col, wsId);
  try {
    await deleteDoc(wRef);
    return true;
  } catch (e) {
    console.log(e);
  }
  return false;
};

// Area

export const getBuildingsInArea = async (area: Area) => {
  const uid = getUserID()
  if (uid) {
    const { radius, center } = AreaUtils.getCenterAndRadius(area);
    const colRef = collection(db, COLLECTIONS.BUILDINGS);
    const bounds = GeoUtils.getGeoBounds(center.lat, center.lng, radius + 20);
    try {
      const boundsSnaps = await Promise.all(
        bounds.map((b) => {
          const q = query(colRef, orderBy('geoHash'), startAt(b[0]), endAt(b[1]))
          return getDocs(q)
        })
      )
      const ne = area.area.NE;
      const sw = area.area.SW;
      const items: Building[] = [];
      for (const bSnap of boundsSnaps) {
        // console.log('snap length: ' + bSnap.docs.length);
        bSnap.docs.forEach((doc) => {
          // 重複チェック, Areaの本来の緯度経度範囲かチェック
          if (items.filter((item) => { return item.gmlID === doc.id; }).length > 0) {
            return;
          }
          const data = doc.data()
          const r = data.footprint.filter((p: { latitude: number, longitude: number, altitude?: number }) => {
            if (p.latitude >= sw.lat && p.latitude <= ne.lat &&
              p.longitude >= sw.lng && p.longitude <= ne.lng) {
                return true;
            }
            return false;
          });
          // console.log(r.length);
          if (r.length > 0) {
            const item = BuildingUtils.createBuildingFromFirestoreDoc(doc.id, data);
            items.push(item);
          }
        })
      }
      return items;
    } catch (e) {
      console.log(e);
    }
  } else {
    console.log("Authentification failed.");
  }
  return [];
};

export const getAreasFromWsID = async (wsID: string) => {
  const areas: Area[] = [];
  const areaRef = collection(
    doc(collection(db, COLLECTIONS.WORKSPACES), wsID),
    COLLECTIONS.AREAS
  );
  const q = query(areaRef, orderBy("modified", "desc"));
  try {
    const snapShots = await getDocs(q);
    if (snapShots.docs.length === 0) {
      return [];
    } else {
      snapShots.docs.forEach((doc) => {
        const obj: Area = AreaUtils.createAreaFromFirestoreDoc(doc.id, doc.data());
        areas.push(obj);
      });
      const loadedArea = await Promise.all(
        areas.map(async (area: Area) => {
          const docRef = doc(areaRef, area.id);
          const tangible = await getTangibleDocument(area);
          const markers = await getMarkersFromArea(docRef);
          const nA = { ...area };
          nA.markers = markers;
          nA.tangible = tangible;
          return nA;
        })
      );
      return loadedArea;
    }
  } catch (e) {
    console.log(e);
  }
  return [];
};

export const getSimpleAreasFromRef = async (ref: DocumentReference) => {
  const areas: Area[] = [];
  const areaRef = collection(ref, COLLECTIONS.AREAS);
  const q = query(areaRef, orderBy("modified", "desc"));
  try {
    const snapShots = await getDocs(q);
    if (snapShots.docs.length === 0) {
      return [];
    } else {
      snapShots.docs.forEach((doc) => {
        const obj: Area = AreaUtils.createAreaFromFirestoreDoc(doc.id, doc.data());
        areas.push(obj);
      });
      return areas;
    }
  } catch (e) {
    console.log(e);
  }
  return [];
};

/*
 * Area 保存
 * markerなどの情報も書き込む。try catch必要
 */

export const saveArea = async (ws: Workspace, area: Area) => {
  const wRef = doc(collection(db, COLLECTIONS.WORKSPACES), ws.id);
  const areaID = await createOrUpdateArea(wRef, area);
  if (areaID) {
    const newArea = { ...area };
    newArea.id = areaID;
    newArea.isNew = false;
    if (area.tangibleUpdate && area.tangible) {
      const t = TangibleUtils.addAreaInfomation(area.tangible, newArea, ws.id);
      await updateTangibleDocument(t);
    }
    const aRef = doc(collection(wRef, COLLECTIONS.AREAS), areaID);
    const markers = await updateMarkers(aRef, area.markers);
    if (markers) {
      newArea.markers = markers;
    }
    await workspaceUpdateTimestamp(wRef);
    return newArea;
  }
  return undefined;
};

export const createNewArea = async (ws: Workspace, newArea: Area) => {
  const areaID = await updateSingleArea(ws, newArea, false);
  return areaID;
}

export const updateSingleArea = async (ws: Workspace, area: Area, markerFlag: boolean) => {
  const wRef = doc(collection(db, COLLECTIONS.WORKSPACES), ws.id);
  const areaID = await createOrUpdateArea(wRef, area);
  if (areaID) {
    try {
      if (area.tangibleUpdate && area.tangible) {
        const a = { ...area };
        a.id = areaID;
        const t = TangibleUtils.addAreaInfomation(area.tangible, a, ws.id);
        if (!await updateTangibleDocument(t)) {
          throw new Error("Tangible update Error");
        }
      }
      if (markerFlag) {
        const aRef = doc(collection(wRef, COLLECTIONS.AREAS), areaID);
        const markers = await updateMarkers(aRef, area.markers);
        if (!markers) {
          throw new Error("Marker Update Error");
        }
      }
    } catch (e) {
      console.log(e)
    }
    await workspaceUpdateTimestamp(wRef);
    return areaID;
  }
  return undefined;
};

export const deleteArea = async (wsId: string, area: Area) => {
  const col = collection(db, COLLECTIONS.WORKSPACES);
  const wRef = doc(col, wsId);
  try {
    const aCol = collection(wRef, COLLECTIONS.AREAS);
    const aDoc = doc(aCol, area.id);
    await deleteDoc(aDoc);
    await workspaceUpdateTimestamp(wRef);
    return true;
  } catch (e) {
    console.log(e);
  }
  return false;
};


const createOrUpdateArea = async (wRef: DocumentReference, area: Area) => {
  try {
    const aCol = collection(wRef, COLLECTIONS.AREAS);
    const aDoc = area.isNew ? doc(aCol) : doc(aCol, area.id);
    const dict = AreaUtils.createFirestoreDocFromArea(area);
    setDoc(aDoc, dict);
    return aDoc.id;
  } catch (e) {
    console.log(e);
  }
  return undefined;
};

export const refreshAreaMapImage = async (wsID: string, areaID: string) => {
  const func = httpsCallable(functions, "callRefreshMapImage");
  const data = { workspace: wsID, area: areaID, };
  try {
    const res = await func(data);
    console.log(res);
    return res.data;
  } catch (e) {
    console.log(e);
  }
  return undefined;
};

/*
 * marker一括保存
 * deleteフラグなどの処理がある。ここだけbatch処理。
 */ 

const updateMarkers = async (aRef: DocumentReference, markers: Marker[]) => {
  const mCol = collection(aRef, COLLECTIONS.MARKERS);
  const newMarkers: Marker[] = [];
  try {
    // 一度全部消す
    const dDocs = await getDocs(mCol);
    const batch1 = writeBatch(db);
    dDocs.forEach((doc: DocumentData) => {
      batch1.delete(doc.ref);
    });
    await batch1.commit();

    const m2 = markers.filter((m: Marker) => {
      return !m.delete
    });

    const batch2 = writeBatch(db);
    for (const marker of m2) {
      const docID = marker.markerID;
      const mDoc = doc(mCol, docID);
      const dict = MarkerUtils.createFirestoreDocFromMarker(marker);
      batch2.set(mDoc, dict);
      const nM: Marker = { ...marker };
      nM.docID = docID;
      nM.isNew = false;
      newMarkers.push(nM);
    }
    await batch2.commit();
  } catch (e) {
    console.log(e);
    return undefined;
  }
  return newMarkers;
};

// Areaからマーカー情報一括取得（Frn, Buildingなどのオブジェクトは読み込まない）
const getMarkersFromArea = async (docRef: DocumentReference) => {
  const markerRef = collection(docRef, COLLECTIONS.MARKERS);
  const markers = [] as Marker[];
  try {
    const snapShots = await getDocs(markerRef);
    if (snapShots.docs.length === 0) {
      return [];
    } else {
      snapShots.docs.forEach((doc) => {
        const obj: Marker = MarkerUtils.createMarkerFromFirestoreDoc(doc.id, doc.data());
        markers.push(obj);
      });
      const sorted = markers.sort((a: Marker, b: Marker) => {
        return Number(a.markerID) - Number(b.markerID);
      })
      return sorted;
    }
  } catch (e) {
    console.log(e);
  }
  return [];
};

// マーカーのFrn,Buildingなどの詳細オブジェクト一括読み込み
export const loadMarkerObjectFromArea = async (area: Area) => {
  const markers = await Promise.all(area.markers.map(async( m: Marker) => {
    const m2 = await loadMarkerObjDoc(m);
    return m2;
  }));
  const nA = {...area};
  nA.markers = markers;
  return nA;
};

// マーカーのFrn,Buildingなどの詳細オブジェクト読み込み
export const loadMarkerObjDoc = async (marker: Marker) => {
  let collectionName = "";
  if (marker.type === MarkerType.Furniture) {
    collectionName = COLLECTIONS.FURNITURES;
  } else if (marker.type === MarkerType.Building) {
    collectionName = COLLECTIONS.BUILDINGS;
  } else if (marker.type === MarkerType.Special) {
    const sFs = SFrnUtils.loadSpecialFrns();
    const sFrn = sFs.find((sF: SpecialFrn) => sF.id === marker.objID);
    if (sFrn) {
      const newM = { ...marker };
      newM.special = sFrn;
      return newM;
    } else {
      return marker;
    }
  } else {
    return marker;
  }
  try {
    const mRef = doc(collection(db, collectionName), marker.objID);
    const mDoc = await getDoc(mRef);
    if (mDoc.exists()) {
      const newM = { ...marker };
      if (marker.type === MarkerType.Building) {
        const bldg = BuildingUtils.createBuildingFromFirestoreDoc(mDoc.id, mDoc.data());
        newM.bldg = bldg;
      } else if(marker.type === MarkerType.Furniture) {
        const frn = FrnUtils.createFrnFromFirestoreDoc(mDoc.id, mDoc.data());
        frn.objUrl = await FrnUtils.loadObjUrl(frn);
        newM.frn = frn;
      }
      return newM;
    } else {
      throw new Error("Data not found, doc: " + marker.objID);
    }
  } catch (e) {
    console.log(e);
  }
  return marker;
};

// タンジブルマーカーのFrn,Buildingなどの詳細オブジェクト読み込み
export const loadTangibleMarkerObjDoc = async (marker: TangibleMarker) => {
  let collectionName = "";
  if (marker.type === MarkerType.Furniture) {
    collectionName = COLLECTIONS.FURNITURES;
  } else if (marker.type === MarkerType.Building) {
    collectionName = COLLECTIONS.BUILDINGS;
  } else if (marker.type === MarkerType.Special) {
    const sFs = SFrnUtils.loadSpecialFrns();
    const sFrn = sFs.find((sF: SpecialFrn) => sF.id === marker.objID);
    if (sFrn) {
      const newM = { ...marker };
      newM.special = sFrn;
      return newM;
    } else {
      return marker;
    }
  } else {
    return marker;
  }
  try {
    const mRef = doc(collection(db, collectionName), marker.objID);
    const mDoc = await getDoc(mRef);
    if (mDoc.exists()) {
      const newM = { ...marker };
      if (marker.type === MarkerType.Building) {
        const bldg = BuildingUtils.createBuildingFromFirestoreDoc(mDoc.id, mDoc.data());
        newM.bldg = bldg;
      } else if(marker.type === MarkerType.Furniture) {
        const frn = FrnUtils.createFrnFromFirestoreDoc(mDoc.id, mDoc.data());
        frn.objUrl = await FrnUtils.loadObjUrl(frn);
        newM.frn = frn;
      }
      return newM;
    } else {
      throw new Error("Data not found, doc: " + marker.objID);
    }
  } catch (e) {
    console.log(e);
  }
  return marker;
}

/*
 * Tangible
 */ 

export const getAllTangibles = async () => {
  const uid = getUserID()
  const tangibles: Tangible[] = [];
  if (uid) {
    const col = collection(db, COLLECTIONS.TANGIBLES);
    try {
      const docs = await getDocs(col);
      docs.forEach((doc: DocumentData) => {
        const tangible = TangibleUtils.createTangibleFromFirestoreDoc(doc.id, doc.data(), {});
        tangibles.push(tangible);
      })
    } catch (e) {
      console.log(e);
    }
  }
  return tangibles;
};

export const getTangibleDocument = async (area: Area) => {
  try {
    const col = collection(db, COLLECTIONS.TANGIBLES);
    const tRef = doc(col, area.tangibleID);
    const tDoc = await getDoc(tRef);
    if (tDoc.exists()) {
      const dCol = collection(tRef, COLLECTIONS.TANGIBLE_DATA);
      const q = query(dCol, orderBy('created', 'desc'), limit(1));
      const snapShots = await getDocs(q);
      let rawData:any = {};
      if (snapShots.docs.length > 0) {
        const latest = snapShots.docs[0];
        rawData = latest.data();
      }

      const tangible = TangibleUtils.createTangibleFromFirestoreDoc(tDoc.id, tDoc.data(), rawData, area);
      return tangible;
    } else {
      throw new Error("Data not found, doc: " + area.tangibleID);
    }
  } catch (e) {
    console.log(e);
  }
  return undefined;
};

const updateTangibleDocument = async (t: Tangible) => {
  try {
    const col = collection(db, COLLECTIONS.TANGIBLES);
    const tRef = doc(col, t.id);
    const dict = TangibleUtils.createUpdateFirebaseDocument(t);
    await updateDoc(tRef, dict);
    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(e);
    }
  }
  return false;
};

/*
 * SnapShot
 */

export const saveSnapShot = async (wsID: string, snap: Snapshot) => {
  const uid = getUserID();
  if (uid) {
    const col = collection(db, COLLECTIONS.WORKSPACES);
    const wRef = doc(col, wsID);
    const sID = await createOrUpdateSnapShot(wRef, snap);
    if (sID) {
      const sRef = doc(collection(wRef, COLLECTIONS.SNAPSHOTS), sID);
      const results = await Promise.all(snap.areas.map(async (area: Area) => {
        if (await saveSnapArea(sRef, area)) {
          return sID + "_" + area.id;
        }
        return null;
      }));
      const successAreas = results.filter((item) => {
          return item !== null;
      });
      return successAreas;
    }
    return {
      "error": "Update failed."
    };
  }
  return {
    "error": "You are not logged In."
  };
};

const createOrUpdateSnapShot = async (wRef: DocumentReference, s: Snapshot) => {
  try {
    const sCol = collection(wRef, COLLECTIONS.SNAPSHOTS);
    const sDoc = doc(sCol, s.id);
    const dict = SnapshotUtils.createFirestoreDocFromObject(s);
    setDoc(sDoc, dict);
    return sDoc.id;
  } catch (e) {
    if (e instanceof Error) {
      console.error(e);
    }
  }
  return undefined;
};

const saveSnapArea = async (sRef: DocumentReference, area: Area) => {
  const areaID = await createOrUpdateArea(sRef, area);
  if (areaID) {
    const aRef = doc(collection(sRef, COLLECTIONS.AREAS), areaID);
    return await saveSnapMarkers(aRef, area.tMarkers);
  }
  return false;
};

const saveSnapMarkers = async (aRef: DocumentReference, markers: TangibleMarker[]) => {
  const mCol = collection(aRef, COLLECTIONS.MARKERS);
  try {
    const batch = writeBatch(db);
    for (const marker of markers) {
      const docID = marker.markerID;
      const mDoc = doc(mCol, docID);
      const dict = TangibleMarkerUtils.createFirestoreDocFromTangibleMarker(marker);
      batch.set(mDoc, dict);
    }
    await batch.commit();
    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(e);
    }
  }
  return false;
};

export const getSnapshotsFromWsID = async (wsID: string) => {
  const snaps: Snapshot[] = []
  const snapRef = collection(
    doc(collection(db, COLLECTIONS.WORKSPACES), wsID),
    COLLECTIONS.SNAPSHOTS
  );
  const q = query(snapRef, orderBy("created", "desc"));
  try {
    const snapShots = await getDocs(q);
    if (snapShots.docs.length === 0) {
      return [];
    } else {
      snapShots.docs.forEach((doc) => {
        const obj: Snapshot = SnapshotUtils.createSnapShotFromFirestoreDoc(doc.id, doc.data());
        snaps.push(obj);
      });
      return snaps;
    }
  } catch (e) {
    if (e instanceof Error) {
      console.error(e);
    }
  }
  return [];
};

export const loadSnapShot = async (ws: Workspace, snap: Snapshot) => {
  const areas: Area[] = [];
  const wRef = doc(collection(db, COLLECTIONS.WORKSPACES), ws.id);
  const sRef = doc(collection(wRef, COLLECTIONS.SNAPSHOTS), snap.id);
  const aRef = collection(sRef, COLLECTIONS.AREAS);
  const q = query(aRef, orderBy("modified", "desc"));
  try {
    const snapShots = await getDocs(q);
    if (snapShots.docs.length === 0) {
      return snap;
    } else {
      snapShots.docs.forEach((doc) => {
        const obj: Area = AreaUtils.createAreaFromFirestoreDoc(doc.id, doc.data());
        areas.push(obj);
      });
      const loadedArea = await Promise.all(
        areas.map(async (area: Area) => {
          const docRef = doc(aRef, area.id);
          const markers = await getTangibleMarkersFromArea(docRef);
          const markers2 = await Promise.all(
            markers.map(async (marker: TangibleMarker) => {
              return await loadTangibleMarkerObjDoc(marker);
            })
          );
          const nA = { ...area };
          nA.markers = markers;
          nA.tMarkers = markers2;
          return nA;
        })
      );
      const nSnap = { ...snap };
      nSnap.areas = loadedArea;
      return nSnap;
    }
  } catch (e) {
    if (e instanceof Error) {
      console.error(e);
    }
  }
  return snap;
};

const getTangibleMarkersFromArea = async (docRef: DocumentReference) => {
  const markerRef = collection(docRef, COLLECTIONS.MARKERS);
  const markers = [] as TangibleMarker[];
  try {
    const snapShots = await getDocs(markerRef);
    if (snapShots.docs.length === 0) {
      return [];
    } else {
      snapShots.docs.forEach((doc) => {
        const obj: TangibleMarker = TangibleMarkerUtils.createTangibleMarkerFromFirestoreDoc(doc.id, doc.data());
        markers.push(obj);
      });
      return markers;
    }
  } catch (e) {
    if (e instanceof Error) {
      console.error(e);
    }
  }
  return [];
};

export const deleteSnapShot = async (ws: Workspace, snap: Snapshot) => {
  const wRef = doc(collection(db, COLLECTIONS.WORKSPACES), ws.id);
  const sRef = doc(collection(wRef, COLLECTIONS.SNAPSHOTS), snap.id);
  try {
    await deleteDoc(sRef);
    const imgPath = "workspaces/" + ws.id + "/" + snap.screenshot;
    await deleteStorageFile(imgPath);
    await workspaceUpdateTimestamp(wRef);
    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(e);
    }
  }
  return undefined;
};
