import { Firestore, DocumentReference } from "firebase-admin/firestore";
import { getMetersPerPixel } from "./tangibles";
import {
  COLLECTIONS,
  createStoragePublicUrl,
  getCollectionDocumentsFromRef,
  makeDateIDString,
  uploadToStorage,
} from "./utils";
import sharp from "sharp";
import { osmsC } from "./osms";

export const getAreaDocument = async (wsID: string, areaID: string, db: Firestore) => {
  const wRef = db.collection(COLLECTIONS.WORKSPACES).doc(wsID);
  const aRef = wRef.collection(COLLECTIONS.AREAS).doc(areaID);
  const doc = await aRef.get();
  if (doc.exists) {
    return doc.data();
  } else {
    console.log("Data not found, doc: " + wsID + "/" + areaID);
  }
  return undefined;
};

// Areaとマーカー情報取得（areaとして選択した駒。配置駒ではない）
export const getRawAreaInfo = async (wRef: DocumentReference) => {
  const rawAreas = await getCollectionDocumentsFromRef(wRef, COLLECTIONS.AREAS);
  const areas = await Promise.all(rawAreas.map(async (rawArea) => {
    const aRef = wRef.collection(COLLECTIONS.AREAS).doc(rawArea.docId);
    const markers = await getCollectionDocumentsFromRef(aRef, COLLECTIONS.MARKERS);
    return {
      ...rawArea,
      markers: markers,
    };
  }));
  return areas;
};


export const getAreaMapUrl = async (mapName: string | undefined, wsID: string) => {
  if (!mapName) {
    return undefined;
  }
  const refPath = "workspaces/" + wsID + "/" + mapName;
  const url = await createStoragePublicUrl(refPath);
  return url;
};

export const uploadMapImage = async (wsID: string, areaID: string, buffer: Buffer) => {
  const dateID = makeDateIDString(new Date(), "-");
  const name = "map_" + areaID + "_" + dateID + ".png";
  const pathref = "workspaces/" + wsID + "/" + name;
  if (await uploadToStorage(pathref, buffer)) {
    return name;
  }
  return undefined;
};

export const createGsiImageBuffer = async (
  zoom: number,
  center: { lat: number, lng: number },
  size: { w: number, h: number }
) => {
  const mpp = getMetersPerPixel(center.lat, zoom);
  const mpp17 = getMetersPerPixel(center.lat, 17);
  const r = mpp / mpp17;
  // return 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
  // const r = Math.cos(center.lat * Math.PI / 180) / Math.pow(2, (zoom - 17));
  const w = Math.floor(size.w * r);
  const h = Math.floor(size.h * r);
  const centerStr = "" + center.lng + "," + center.lat;
  const url = process.env.GSI_DOMAIN + "xyz/pale/{z}/{x}/{y}.png";
  const params = {
    tileserverUrl: url,
    height: h,
    width: w,
    zoom: 17,
    center: centerStr,
    type: "png" as "png" | "jpeg",
    attribution: "",
  };

  try {
    const imageBinaryBuffer = await osmsC(params);
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      sharp(imageBinaryBuffer)
        .resize(size.w, size.h)
        .toBuffer((err, buffer) => {
          if (err) {
            reject(err);
          } else {
            resolve(buffer);
          }
        });
    });
    return buffer;
  } catch (e) {
    console.log(e);
  }
  return undefined;
};
