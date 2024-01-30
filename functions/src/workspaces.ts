// Tangible unit (rasberry pi)とのAPI

import express from "express";
import * as fs from "fs";
import {
  getFirestore,
  Firestore,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase-admin/firestore";
// import { getStorage } from "firebase-admin/storage";
import { HttpsError, CallableContext } from "firebase-functions/v1/https";
import {
  getAreaDocument,
  getAreaMapUrl,
  getRawAreaInfo,
  createGsiImageBuffer,
  uploadMapImage,
} from "./areas";
import { loadMarkerObject } from "./markers";
import { getLatestRawSnapshotFromRef, loadSnapShotDetailFromRaw, makeSnapShotInfo } from "./snapshots";
import { getTangibleDocument, parseRawMarkers } from "./tangibles";
import { authorizeWithApiKey, authorizeError } from "./users";
import {
  COLLECTIONS,
  createStoragePublicUrl,
  getCollectionDocumentsFromRef,
  makeDateIDString,
  makeDateIDString2,
  parsePostRequest,
  uploadToStorage,
  catchEResponse,
} from "./utils";


const getWorkSpacesDocument = async (id: string, db: Firestore) => {
  const col = db.collection(COLLECTIONS.WORKSPACES);
  const doc = await col.doc(id).get();
  if (doc.exists) {
    return doc;
  } else {
    throw new Error("Data not found, doc: " + id);
  }
};


export const wsApp = express();
wsApp.use(express.json());

// ワークスペースの基本情報取得（エリア、エリアのマーカー（マーカーのオブジェクト本体は取得しない））
wsApp.route("/:id")
  .get(async (req, res) => {
    const authCheck = authorizeWithApiKey(req);
    if (!authCheck.access) {
      return authorizeError(res, authCheck);
    }
    const db = getFirestore();
    if (req.params.id !== null) {
      console.log(req.params.id);
      try {
        const doc = await getWorkSpacesDocument(req.params.id, db);
        const wRef = db.collection(COLLECTIONS.WORKSPACES).doc(req.params.id);
        const areas = await getRawAreaInfo(wRef);
        return res
          .status(200)
          .json({
            ...doc.data(),
            areas: areas,
          });
      } catch (e) {
        return catchEResponse(e, res);
      }
    }
    return res
      .status(404)
      .json({ error: "error", message: "this is error" });
  });

// 最新情報（タンジブルのマーカーを緯度経度変換して返す。こちらのマーカーには本体情報付与）
wsApp.route("/:id/tangible")
  .get(async (req, res) => {
    const authCheck = authorizeWithApiKey(req);
    if (!authCheck.access) {
      return authorizeError(res, authCheck);
    }
    const db = getFirestore();
    if (req.params.id !== null) {
      console.log(req.params.id);
      try {
        const wRef = db.collection(COLLECTIONS.WORKSPACES).doc(req.params.id);
        const rawAreas = await getRawAreaInfo(wRef);
        const areas = await Promise.all(rawAreas.map(async (rawArea) => {
          try {
            // tangibleのrawDataからデータをParse。タンジブル側がactiveの場合のみ
            const tangible = await getTangibleDocument(rawArea.tangibleID, db);
            if (tangible && tangible.rawData) {
              const tangibleTimestamp = tangible.rawData.timestamp;
              if (tangible.active) {
                // rawDataを緯度経度、回転方向を算出
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
                // マーカーの本体情報取得
                const finalM = await Promise.all(cashMarkers.map(async (m) => {
                  return await loadMarkerObject(m);
                }));
                return {
                  ...rawArea,
                  tangible: {
                    active: tangible.active,
                    timestamp: tangibleTimestamp,
                    markers: finalM,
                  },
                };
              } else {
                return {
                  ...rawArea,
                  tangible: {
                    active: tangible.active,
                    timestamp: tangibleTimestamp,
                  },
                };
              }
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
        return res
          .status(200)
          .json(areas);
      } catch (e) {
        return catchEResponse(e, res);
      }
    }
    res
      .status(404)
      .json({ error: "error", message: "this is error" });
    return;
  });

// スナップショットのリスト取得（エリア情報などは取得しない）
wsApp.route("/:id/snapshots")
  .get(async (req, res) => {
    const authCheck = authorizeWithApiKey(req);
    if (!authCheck.access) {
      return authorizeError(res, authCheck);
    }
    try {
      const db = getFirestore();
      const wRef = db.collection(COLLECTIONS.WORKSPACES).doc(req.params.id);
      const sCol = wRef.collection(COLLECTIONS.SNAPSHOTS);
      const query = sCol.orderBy("created", "desc");
      const snaps = await query.get();
      const docs: any[] = [];
      snaps.docs.forEach((doc: QueryDocumentSnapshot) => {
        const data = {
          ...doc.data(),
          docId: doc.id,
        };
        docs.push(data);
      });
      const docs2 = await Promise.all(docs.map(async (doc) => {
        const snapRefPath = "workspaces/" + wRef.id + "/" + doc.screenshot;
        const snapUrl = await createStoragePublicUrl(snapRefPath);
        if (snapUrl) {
          return {
            ...doc,
            screenUrl: snapUrl,
          };
        } else {
          return doc;
        }
      }));
      res
        .status(200)
        .json(docs2);
      return;
    } catch (e) {
      return catchEResponse(e, res);
    }
  })
  .post(async (req, res) => {
    const authCheck = authorizeWithApiKey(req);
    if (!authCheck.access) {
      return authorizeError(res, authCheck);
    }
    if (req.params.id === null) {
      return res
        .status(401)
        .json({ error: "Request parameters", message: "workspaceId is required." });
    }

    // バリデーション
    const data: any = await parsePostRequest(req);
    console.log(data);
    if (!data.files.file) {
      return res
        .status(401)
        .json({ error: "File identfication Failed.", message: "" });
    }
    if (!data.fields) {
      return res
        .status(401)
        .json({ error: "Request parameters", message: "title, camera are required." });
    }
    const fields = data.fields;
    if (!fields.title || !fields.camera) {
      return res
        .status(401)
        .json({ error: "Request parameters", message: "title, camera are required." });
    }
    const title = fields.title;
    const comment = fields.comment ? fields.comment : "";
    let camera: any = {};
    try {
      camera = JSON.parse(fields.camera);
    } catch (e) {
      if (e instanceof Error) {
        return res
          .status(401)
          .json({ error: "Parameter error", message: e.message });
      } else {
        console.log(e);
        return res
          .status(401)
          .json({ error: "Parameter error", message: "incorrect camera object" });
      }
    }
    if (!camera.position || !camera.position.lat || !camera.position.lng || !camera.position.alt) {
      return res
        .status(401)
        .json({ error: "Request parameters", message: "camera object is wrong." });
    }
    if (!camera.target || !camera.target.lat || !camera.target.lng || !camera.target.alt) {
      return res
        .status(401)
        .json({ error: "Request parameters", message: "camera object is wrong." });
    }
    try {
      const db = getFirestore();
      const wRef = db.collection(COLLECTIONS.WORKSPACES).doc(req.params.id);
      const sAreas = await makeSnapShotInfo(db, wRef);
      if (sAreas.length === 0) {
        // アクティブなtangibleが無し。ただのsnapshotの量産になるので不許可
        return res
          .status(402)
          .json({ error: "Inactive", message: "All tangible units are inactive. Please use latest snapshot." });
      }

      // 先にイメージの保存
      const buffer = await fs.readFileSync(data.files.file.path);
      const dateID = makeDateIDString(new Date(), "-");
      const name = "snapshot_api_" + dateID + "_" + data.files.file.name;
      const pathref = "workspaces/" + req.params.id + "/" + name;
      if (!await uploadToStorage(pathref, buffer)) {
        return res
          .status(404)
          .json({ error: "Upload error", message: "upload failed." });
      }

      const sRef = wRef.collection(COLLECTIONS.SNAPSHOTS).doc(dateID);
      const timestamp = Timestamp.now();
      const sBody = {
        title: title,
        comment: comment,
        screenshot: name,
        camera: camera,
        created: timestamp,
      };
      await sRef.set(sBody);

      await Promise.all(sAreas.map(async (sa) => {
        const batch = db.batch();
        const saRef = sRef.collection(COLLECTIONS.AREAS).doc(sa.docId);
        const saBody = {
          title: sa.title,
          tangibleID: sa.tangibleID,
          area: sa.area,
          created: sa.created,
          modified: timestamp,
        };
        batch.set(saRef, saBody);
        for (const marker of sa.tMarkers) {
          const mRef = saRef.collection(COLLECTIONS.MARKERS).doc(marker.markerID);
          const mDict = {
            type: marker.type,
            objID: marker.objID,
            created: marker.created,
            modified: timestamp,
            comment: marker.comment ?? "",
            position: marker.center,
            rotation: marker.rotation,
          };
          batch.set(mRef, mDict);
        }
        await batch.commit();
        return true;
      }));
      return res
        .status(200)
        .json({ message: "New snapshot is Created! id is " + dateID });
    } catch (e) {
      return catchEResponse(e, res);
    }
  });

// １つのスナップショット情報の詳細を取得。エリア情報、マーカーを本体情報付きでロード
// snapIdがlatestの場合、最新のスナップショットを返却（スナップショットIDを事前取得する必要なし）
wsApp.route("/:id/snapshots/:snapId")
  .get(async (req, res) => {
    const authCheck = authorizeWithApiKey(req);
    if (!authCheck.access) {
      return authorizeError(res, authCheck);
    }
    if (req.params.id === null || req.params.snapId === null) {
      return res
        .status(401)
        .json({ error: "Request parameters", message: "workspaceId and snapshotId are required." });
    }
    try {
      const db = getFirestore();
      const wRef = db.collection(COLLECTIONS.WORKSPACES).doc(req.params.id);
      if (req.params.snapId === "latest") {
        const snapDoc = await getLatestRawSnapshotFromRef(wRef);
        if (snapDoc) {
          const snap = await loadSnapShotDetailFromRaw(snapDoc.id, snapDoc.data(), wRef, true, true);
          if (snap) {
            return res
              .status(200)
              .json(snap);
          }
        }
      } else {
        const sCol = wRef.collection(COLLECTIONS.SNAPSHOTS);
        const sRef = sCol.doc(req.params.snapId);
        const doc = await sRef.get();
        if (doc.exists) {
          const snap = await loadSnapShotDetailFromRaw(doc.id, doc.data(), wRef, true, true);
          if (snap) {
            return res
              .status(200)
              .json(snap);
          }
        }
      }
    } catch (e) {
      return catchEResponse(e, res);
    }
    return res
      .status(402)
      .json({ error: "Error", message: "some errors" });
  });

wsApp.route("/:id/areas/:areaId/unitymap")
  .get(async (req, res) => {
    const authCheck = authorizeWithApiKey(req);
    if (!authCheck.access) {
      return authorizeError(res, authCheck);
    }
    if (req.params.id === null || req.params.areaId === null) {
      return res
        .status(401)
        .json({ error: "Request parameters", message: "workspaceId and snapshotId are required." });
    }
    const wsId = req.params.id;
    const areaId = req.params.areaId;
    try {
      const db = getFirestore();
      const aDoc = await getAreaDocument(wsId, areaId, db);
      if (aDoc && aDoc.area && aDoc.area.unity) {
        const url = await getAreaMapUrl(aDoc.area.unity, wsId);
        if (url) {
          return res
            .status(200)
            .json({ url: url });
        } else {
          return res
            .status(409)
            .json({ error: "unknown error", message: "Could not create public url." });
        }
      }
      return res
        .status(402)
        .json({ error: "data error", message: "no data found." });
    } catch (e) {
      if (e instanceof Error) {
        return res
          .status(404)
          .json({ error: "unknown", message: e.message });
      }
    }
    return res
      .status(405)
      .json({ error: "unknown", message: "unknown error" });
  })
  .post(async (req, res) => {
    const authCheck = authorizeWithApiKey(req);
    if (!authCheck.access) {
      return authorizeError(res, authCheck);
    }
    if (req.params.id === null || req.params.areaId === null) {
      return res
        .status(401)
        .json({ error: "Request parameters", message: "workspaceId and snapshotId are required." });
    }
    const wsId = req.params.id;
    const areaId = req.params.areaId;
    try {
      const db = getFirestore();
      const wRef = db.collection(COLLECTIONS.WORKSPACES).doc(wsId);
      const aRef = wRef.collection(COLLECTIONS.AREAS).doc(areaId);
      const aDoc = await getAreaDocument(wsId, areaId, db);
      if (!aDoc) {
        return res
          .status(402)
          .json({ error: "Parameter Error", message: "workspaceId and areaId were wrong." });
      }
      const data: any = await parsePostRequest(req);
      if (!data.files.file) {
        return res
          .status(403)
          .json({ error: "File identfication Failed.", message: "" });
      }
      const buffer = await fs.readFileSync(data.files.file.path);
      const dateID = makeDateIDString2(new Date(), "-");
      const name = "unity_map_" + areaId + "_" + dateID + "_" + data.files.file.name;
      const pathref = "workspaces/" + wsId + "/" + name;
      if (!await uploadToStorage(pathref, buffer)) {
        return res
          .status(404)
          .json({ error: "Upload error", message: "upload failed." });
      }
      const refArea = { ...aDoc.area };
      refArea.unity = name;
      refArea.modified = Timestamp.now();
      await aRef.update({ area: refArea });
      const url = await getAreaMapUrl(name, wsId);
      if (url) {
        return res
          .status(200)
          .json({ url: url });
      } else {
        return res
          .status(409)
          .json({ error: "unknown error", message: "upload successed. but creating public url was failed." });
      }
    } catch (e) {
      if (e instanceof Error) {
        return res
          .status(404)
          .json({ error: "unknown", message: e.message });
      }
    }
    return res
      .status(407)
      .json({ error: "unknown", message: "unknown error" });
  });

// 余分なstorageのマップ画像の削除
// wsApp.route("/:id/areas/:areaId/check")
//   .get(async (req, res) => {
//     if (req.params.id === null || req.params.areaId === null) {
//       return res
//         .status(401)
//         .json({ error: "Request parameters", message: "workspaceId and snapshotId are required." });
//     }
//     const wsId = req.params.id;
//     const areaId = req.params.areaId;
//     const storageBucket = getStorage().bucket(process.env.BUCKET_NAME);
//     const result = await storageBucket.getFiles({
//       prefix: "workspaces/" + wsId + "/unity_map_" + areaId
//     });
//     const files = result[0];
//     console.log(files.length);
//     for (const f2 of files) {
//       await f2.delete();
//     }
//     for (let d = 10; d < 31; d= d+ 1) {
//       const fStr = "2023-10-" + d;
//       const f =files.filter((f) => {
//         if (f.id) {
//           return f.id?.indexOf(fStr) > -1;
//         } else {
//           return false;
//         }
//       })
//       if (d === 23) {
//         for (const f2 of f) {
//           if (f2.id) {
//             if (f2.id.indexOf("10-23-09-40-10") > -1) {
//               continue;
//             }
//           }
//           await f2.delete();
//         }
//       } else {
//         for (const f2 of f) {
//           await f2.delete();
//         }
//       }
//       console.log(fStr + ":" + f.length)
//     }
//     for (let d = 1; d < 15; d= d+ 1) {
//       const ds = d < 10 ? "0" + d : "" + d;
//       const fStr = "2023-11-" + ds;
//       const f =files.filter((f) => {
//         if (f.id) {
//           return f.id?.indexOf(fStr) > -1;
//         } else {
//           return false;
//         }
//       })
//       console.log(fStr + ":" + f.length)
//     }
//     console.log(files[0]);
//     const name = "unity_map_" + areaId + "_" + dateID + "_" + data.files.file.name;
//     const pathref = "workspaces/" + wsId + "/" + name;
//     const storageRef = storageBucket.file(refPath);
//     return res
//       .status(407)
//       .json({ error: "unknown", message: "unknown error" });
//   });

export const refreshMapImage = async (data: any, context: CallableContext) => {
  console.log("refrech function start");
  if (context.auth === null || context.auth === undefined) {
    throw new HttpsError("permission-denied", "You are not authorized.");
  }
  console.log(data);
  if (!data.workspace || !data.area) {
    throw new HttpsError("invalid-argument", "coord and radius are required.");
  }

  const wsID = data.workspace;
  const areaID = data.area;

  const db = getFirestore();
  try {
    const wRef = db.collection(COLLECTIONS.WORKSPACES).doc(wsID);
    const aRef = wRef.collection(COLLECTIONS.AREAS).doc(areaID);
    const aDoc = await getAreaDocument(wsID, areaID, db);
    if (aDoc) {
      const defSize = { w: 1920, h: 1080 };
      const tangible = await getTangibleDocument(aDoc.tangibleID, db);
      if (tangible) {
        defSize.w = tangible.width;
        defSize.h = tangible.height;
      }
      const area = aDoc.area;
      const buffer = await createGsiImageBuffer(area.zoom, area.center, defSize);
      if (!buffer) {
        throw new HttpsError("data-loss", "Create map image was failed.");
      }
      const fileName = await uploadMapImage(wsID, areaID, buffer);
      if (!fileName) {
        throw new HttpsError("data-loss", "Could not upload map image.");
      }

      const refArea = { ...aDoc.area };
      refArea.map = fileName;
      console.log(fileName);
      await aRef.update({ area: refArea });
      const url = await getAreaMapUrl(fileName, wsID);
      if (url) {
        return { message: "OK", url: url };
      } else {
        throw new HttpsError("data-loss", "Cound not get public url. map:" + fileName);
      }
    } else {
      throw new HttpsError("data-loss", "Document data of area not found.");
    }
  } catch (e) {
    if (e instanceof Error) {
      throw new HttpsError("unknown", e.message);
    } else {
      console.log(e);
      throw new HttpsError("unknown", "unknown error");
    }
  }
};

// Tangible側からの呼び出しFunction
// TODO: Tangible側からの呼び出しで他所のTangible（Area）データを引っ張って良いものか。

export const getOtherTangibleMarkers = async (tangbleID: string, areaInfo: any) => {
  const db = getFirestore();
  try {
    const wRef = db.collection(COLLECTIONS.WORKSPACES).doc(areaInfo.workspaceID.id);
    const rawAreas = await getCollectionDocumentsFromRef(wRef, COLLECTIONS.AREAS);
    const areas = await Promise.all(rawAreas.map(async (rawArea) => {
      if (rawArea.tangbleID === tangbleID) {
        return [];
      }
      const aRef = wRef.collection(COLLECTIONS.AREAS).doc(rawArea.docId);
      const markers = await getCollectionDocumentsFromRef(aRef, COLLECTIONS.MARKERS);
      try {
        // tangibleのrawDataからデータをParse。実機が稼働しているかどうかは判断しない
        const tangible = await getTangibleDocument(rawArea.tangibleID, db);
        if (tangible) {
          const tangibleTimestamp = tangible.timetamp;
          const markersT = parseRawMarkers(tangible);
          const cashMarkers: any[] = [];
          for (const markerT of markersT) {
            const list = markers.filter((m) => m.id === markerT.markerID);
            if (list.length > 0) {
              const m = list[0];
              cashMarkers.push({
                ...m,
                center: markerT.center,
                rotation: markerT.rotation,
                areaID: rawArea.docId,
                timestamp: tangibleTimestamp,
              });
            }
          }
          return cashMarkers;
        }
        return [];
      } catch (et) {
        console.log(et);
        return [];
      }
    }));
    let fMarkers: any[] = [];
    for (const aArea of areas) {
      fMarkers = fMarkers.concat(aArea);
    }
    return fMarkers;
  } catch (e) {
    console.log(e);
  }
  return [];
};
