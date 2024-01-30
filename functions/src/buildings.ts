import express from "express";
import { HttpsError, CallableContext } from "firebase-functions/v1/https";
import { getFirestore, DocumentData } from "firebase-admin/firestore";
import {
  COLLECTIONS,
  getDocumentsFromGeoHashAndRadius,
  createCenterPoint,
} from "./utils";
import { WorldProjection } from "./GeoUtils";
import { authorizeWithApiKey } from "./users";


// DocumentSnapshotから基本オブジェクトへの変換
export const createBuildingFromSnapshot = (doc: DocumentData) => {
  const data = doc.data();
  const center = createCenterPoint(data);
  const radius = calculateFootprintRadius(data.footprint, center);
  const created = data.created;
  const modified = data.modified;
  const item = {
    gmlID: doc.id,
    footprint: data.footprint,
    center: center,
    bldgID: data.bldgID,
    created: created,
    modified: modified,
    height: data.height,
    radius: radius,
  };
  return item;
};

// DocumentSnapshotから基本オブジェクトへの変換
const createTranFromSnapshot = (doc: any) => {
  const data = doc.data();
  const center = createCenterPoint(data);
  const radius = calculateFootprintRadius(data.footprint, center);
  const created = data.created;
  const modified = data.modified;
  const item = {
    gmlID: doc.id,
    footprint: data.footprint,
    center: center,
    subID: data.gmlID,
    created: created,
    modified: modified,
    radius: radius,
  };
  return item;
};

// フットプリントから建物の専有半径を略算
const calculateFootprintRadius = (
  footprint: { latitude: number, longitude: number, altitude: number }[],
  center: { latitude: number, longitude: number, altitude: number }
) => {
  if (footprint.length === 0) {
    return 0;
  }
  let distanceSum = 0;
  for (const point of footprint) {
    const latDif = WorldProjection.latToSphMerc(point.latitude) - WorldProjection.latToSphMerc(center.latitude);
    const lonDif = WorldProjection.lngToSphMerc(point.longitude) - WorldProjection.lngToSphMerc(center.longitude);
    distanceSum = distanceSum + Math.sqrt(latDif * latDif + lonDif * lonDif);
  }
  return distanceSum / footprint.length;
};

const getBuildingsWithRadius = async (
  lat: number,
  lng: number,
  radius: number
) => {
  const dList = await getDocumentsFromGeoHashAndRadius(
    COLLECTIONS.BUILDINGS,
    "geoHash",
    lat,
    lng,
    radius
  );
  const items = dList.map((doc) => {
    return createBuildingFromSnapshot(doc);
  });
  return items;
};

const getTransWithRadius = async (
  lat: number,
  lng: number,
  radius: number
) => {
  const dList = await getDocumentsFromGeoHashAndRadius(
    COLLECTIONS.TRANS,
    "geoHash",
    lat,
    lng,
    radius
  );
  const items = dList.map((doc) => {
    return createTranFromSnapshot(doc);
  });
  return items;
};

export const getBuildingDocument = async (gmlID: string) => {
  const db = getFirestore();
  const col = db.collection(COLLECTIONS.BUILDINGS);
  const doc = await col.doc(gmlID).get();
  if (doc.exists) {
    return doc.data();
  } else {
    throw new Error("Data not found, doc: " + gmlID);
  }
};

// markerがbuildingの場合、フットプリントを回転した緯度経度に変換して戻す
export const transferMarkerPositionWithBuilding = (bldgDoc: DocumentData, markerObj: any) => {
  const bldgC = createCenterPoint(bldgDoc);
  const bldgWC = {
    y: WorldProjection.latToSphMerc(bldgC.latitude),
    x: WorldProjection.lngToSphMerc(bldgC.longitude),
  };
  const mWC = {
    y: WorldProjection.latToSphMerc(markerObj.center.lat),
    x: WorldProjection.lngToSphMerc(markerObj.center.lng),
  };
  const r = markerObj.rotation;
  const newFoots = bldgDoc.footprint.map((pos: { latitude: number, longitude: number, altitude: number }) => {
    const divWP = {
      y: WorldProjection.latToSphMerc(pos.latitude),
      x: WorldProjection.lngToSphMerc(pos.longitude),
    };
    const divMeter = {
      x: divWP.x - bldgWC.x,
      y: divWP.y - bldgWC.y,
    };
    const rotatedDivMeter = {
      x: divMeter.x * Math.cos(r) - divMeter.y * Math.sin(r),
      y: divMeter.x * Math.sin(r) + divMeter.y * Math.cos(r),
    };
    const fixWP = {
      x: mWC.x + rotatedDivMeter.x,
      y: mWC.y + rotatedDivMeter.y,
    };
    const fixLonLat = {
      lat: WorldProjection.sphMercToLat(fixWP.y),
      lng: WorldProjection.sphMercToLng(fixWP.x),
    };
    return fixLonLat;
  });
  return newFoots;
};


export const getBuildingApiWithRadius = async (data: any, context: CallableContext) => {
  console.log("function start");
  if (context.auth === null || context.auth === undefined) {
    throw new HttpsError("permission-denied", "You are not authorized.");
  }
  console.log(data);
  if (!data.lat || !data.lng || !data.radius) {
    throw new HttpsError("invalid-argument", "coord and radius are required.");
  }
  try {
    const newBuildings = await getBuildingsWithRadius(data.lat, data.lng, data.radius);
    const newTrans = await getTransWithRadius(data.lat, data.lng, data.radius + 100);
    return {
      buildings: newBuildings,
      trans: newTrans,
    };
  } catch (e) {
    console.log(e);
  }
  return {
    buildings: [],
    trans: [],
  };
};

export const getBuildingApiWithArea = async (data: any, context: CallableContext) => {
  console.log("function start");
  if (context.auth === null || context.auth === undefined) {
    throw new HttpsError("permission-denied", "You are not authorized.");
  }
  console.log(data);
  if (!data.wsID || !data.areaID) {
    throw new HttpsError("invalid-argument", "coord and radius are required.");
  }

  if (!data.lat || !data.lng || !data.radius) {
    throw new HttpsError("invalid-argument", "coord and radius are required.");
  }
  try {
    const newBuildings = await getBuildingsWithRadius(data.lat, data.lng, data.radius);
    const newTrans = await getTransWithRadius(data.lat, data.lng, data.radius + 100);
    return {
      buildings: newBuildings,
      trans: newTrans,
    };
  } catch (e) {
    console.log(e);
  }
  return {
    buildings: [],
    trans: [],
  };
};


/*
 * Express API
 */


export const bldgApp = express();

bldgApp.use(express.json());

// 建物情報取得
bldgApp.route("/:id")
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
        const col = db.collection(COLLECTIONS.BUILDINGS);
        const doc = await col.doc(req.params.id).get();
        if (doc.exists) {
          const obj = createBuildingFromSnapshot(doc);
          res
            .status(200)
            .json(obj);
        } else {
          res
            .status(402)
            .json({ error: "error", message: "Building is not found with gmlID:" + req.params.id });
        }
      } catch (e) {
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
      }
      return;
    }
    return res
      .status(404)
      .json({ error: "error", message: "Require gmlID" });
  });

