
import busboy from "busboy";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

import { DocumentData, getFirestore, DocumentReference, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getStorage, getDownloadURL } from "firebase-admin/storage";
import { getGeoBounds } from "./GeoUtils";

export const COLLECTIONS = {
  USERS: "users",
  BUILDINGS: "buildings",
  TRANS: "trans",
  TANGIBLES: "tangibles",
  TANGIBLE_DATA: "rawdata",
  WORKSPACES: "workspaces",
  AREAS: "areas",
  FURNITURES: "furnitures",
  SPECIALS: "specials",
  MARKERS: "markers",
  SNAPSHOTS: "snapshots",
};

export const MarkerType = {
  Furniture: "furniture",
  Building: "building",
  Special: "special",
};

export const makeDateIDString = (date: Date, separator: string) => {
  const year = date.getFullYear().toString().padStart(4, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hour = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  const sec = date.getSeconds().toString().padStart(2, "0");
  return "" + year + separator + month + separator + day + separator + hour + separator + min + separator + sec;
};

export const makeDateIDString2 = (date: Date, separator: string) => {
  const year = date.getFullYear().toString().padStart(4, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hour = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  return "" + year + separator + month + separator + day + separator + hour + separator + min;
};

const documentListFromBoundsSnaps = (boundsSnaps: DocumentData[]) => {
  const items: DocumentData[] = [];
  for (const bSnap of boundsSnaps) {
    if (bSnap === null) {
      continue;
    }
    bSnap.docs.forEach((doc: DocumentData) => {
      // 一応重複チェック
      if (
        items.filter((item) => {
          return item.id === doc.id;
        }).length > 0
      ) {
        return;
      }
      items.push(doc);
    });
  }
  return items;
};

export const createCenterPoint = (data: any) => {
  if (data.geoPoint) {
    return {
      latitude: data.geoPoint.latitude,
      longitude: data.geoPoint.longitude,
      altitude: data.altitude,
    };
  }
  if (data.geopoint) {
    return {
      latitude: data.geopoint.latitude,
      longitude: data.geopoint.longitude,
      altitude: data.altitude,
    };
  }
  return {
    latitude: 0,
    longitude: 0,
    altitude: data.altitude,
  };
};

export const getDocumentsFromGeoHashAndRadius = async (
  colName: string,
  hashName: string,
  latitude: number,
  longitude: number,
  radius: number
) => {
  const colRef = getFirestore().collection(colName);
  const bounds = getGeoBounds(latitude, longitude, radius);
  const boundsSnaps = await Promise.all(
    bounds.map((b) => {
      const q = colRef.orderBy(hashName).startAt(b[0]).endAt(b[1]);
      return q.get();
    })
  );
  const dList = documentListFromBoundsSnaps(boundsSnaps);
  return dList;
};

export const getCollectionDocumentsFromRef = async (ref: DocumentReference, colName: string) => {
  const col = ref.collection(colName);
  const query = col.orderBy("modified", "desc");
  const snaps = await query.get();
  const docs: any[] = [];
  snaps.forEach((doc: QueryDocumentSnapshot) => {
    docs.push({
      ...doc.data(),
      docId: doc.id,
    });
  });
  return docs;
};

export const createStoragePublicUrl = async (refPath: string) => {
  try {
    const storageBucket = getStorage().bucket(process.env.BUCKET_NAME);
    const storageFile = storageBucket.file(refPath);
    // firebase-admin > 11.10
    const downloadURL = await getDownloadURL(storageFile);
    return downloadURL;
  } catch (e) {
    console.log(e);
  }
  return undefined;
};

export const uploadToStorage = async (refPath: string, buffer: Buffer) => {
  const storageBucket = getStorage().bucket(process.env.BUCKET_NAME);
  const storageRef = storageBucket.file(refPath);
  try {
    await storageRef.save(buffer);
    return true;
  } catch (e) {
    console.log(e);
  }
  return false;
};

export const catchEResponse = (e: any, res: any) => {
  if (e instanceof Error) {
    return res
      .status(401)
      .json({ error: "error", message: e.message });
  } else {
    console.log(e);
    return res
      .status(403)
      .json({ error: "error", message: "unknown error" });
  }
};

export const parsePostRequest = (req: any) => {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    const tmpdir = os.tmpdir();
    const fields: {[key:string]:string} = {};
    const files: {[key:string]: {name: string, path: string }} = {};
    const fileWrites: Array<Promise<any>> = [];

    bb.on("field", (name: string, val: string) => {
      fields[name] = val;
    });
    bb.on("file", (name: string, stream: any, info: busboy.FileInfo) => {
      const filepath = path.join(tmpdir, info.filename);
      const writeStream = fs.createWriteStream(filepath);
      stream.pipe(writeStream);
      const promise = new Promise((resolve2, reject2) => {
        stream.on("end", () => writeStream.end());
        writeStream.on("finish", () => {
          files[name] = { name: info.filename, path: filepath };
          resolve2(filepath);
        });
        writeStream.on("error", reject2);
      });
      fileWrites.push(promise);
    });
    bb.on("finish", async () => {
      await Promise.all(fileWrites);
      resolve({ files: files, fields: fields });
    });

    bb.on("error", async () => {
      console.log("busboy on error");
      reject(new Error("busboy on error"));
    });
    bb.end(req.rawBody);
  });
};
