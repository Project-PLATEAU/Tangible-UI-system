// import { atom } from 'recoil'
import { DocumentData } from "firebase/firestore"
import { MarkerPosition, TangibleMarker } from "./Marker"
import { GeoUtils, WorldProjection } from "../GeoUtils"

export type Building = {
  gmlID: string
  footprint: {
    latitude: number
    longitude: number
    altitude: number
  }[]
  center: {
    latitude: number
    longitude: number
    altitude: number
  }
  height: number
  bldgID: string
  created: Date
  modified: Date
  radius: number
}

export type ThreeBuilding = Building & {
  markerID: string
  position: MarkerPosition
}

const createBuildingFromFirestoreDoc = (docID: string, data: DocumentData) => {
  const created = data.created.toDate();
  const modified = data.modified.toDate();
  const center = {
    latitude: data.geoPoint.latitude,
    longitude: data.geoPoint.longitude,
    altitude: data.altitude
  }
  const bldg = {
    gmlID: docID,
    bldgID: data.bldgID,
    height: data.height,
    center: center,
    footprint: data.footprint,
    created: created,
    modified: modified
  } as Building;
  return bldg;
}

const createNew = () => {
  return {
    gmlID: "",
    footprint: [],
    center: {
      latitude: GeoUtils.defaultCenter.lat,
      longitude: GeoUtils.defaultCenter.lng,
      altitude: 0,
    },
    height: 0,
    bldgID: "",
    created: new Date(),
    modified: new Date(),
    radius: 0,
  } as Building;
};

const transrateFromTangibleMarker = (marker: TangibleMarker) => {
  if (!marker.bldg) {
    return undefined;
  }
  const mBldg = { ...marker.bldg };

  mBldg.footprint = transferFootPrintsWithMarkerPosition(
    { lat: mBldg.center.latitude, lng: mBldg.center.longitude },
    mBldg.footprint,
    marker.position
  );
  mBldg.center = {
    latitude: marker.position.center.lat,
    longitude: marker.position.center.lng,
    altitude: mBldg.center.altitude,
  }
  return mBldg;
}

const createThreeBuildingFromBuilding = (bldg: Building) => {
  const tB: ThreeBuilding = {
    ...bldg,
    position: { center: { lat: bldg.center.latitude, lng: bldg.center.longitude }, rotation: 0 },
    markerID: bldg.bldgID,
  };
  return tB;
}

const createThreeBuildingFromTangibleMarker = (marker: TangibleMarker) => {
  if (marker.bldg) {
    const bldg = marker.bldg;
    const tB: ThreeBuilding = {
      ...bldg,
      position: marker.position,
      markerID: marker.markerID,
    };
    return tB;
  }
  return undefined;
}

const createThreeBuildingsFromTangibleMarkers = (markers: TangibleMarker[]) => {
  const bldgs: ThreeBuilding[] = [];
  for (const m of markers) {
    const b = createThreeBuildingFromTangibleMarker(m);
    if (b) {
      bldgs.push(b);
    }
  }
  return bldgs;
}

const findBuildingFromBuildingID = (
  bldgID: string,
  buildingList: Array<Building>
) => {
  const objList = buildingList.filter((building: Building) => {
    return building.bldgID === bldgID
  })
  if (objList.length > 0) {
    return objList[0]
  } else {
    return null
  }
}

const findBuildingFromGmlID = (
  gmlID: string,
  buildingList: Array<Building>
) => {
  const objList = buildingList.filter((building: Building) => {
    return building.gmlID === gmlID
  })
  if (objList.length > 0) {
    return objList[0]
  } else {
    return null
  }
}

const transferFootPrintsWithMarkerPosition = (
  center: {lat: number, lng: number},
  footprint: {latitude: number, longitude: number, altitude?: number}[],
  mPos: MarkerPosition
) => {
  const bldgWC = {
    y: WorldProjection.latToSphMerc(center.lat),
    x: WorldProjection.lngToSphMerc(center.lng),
  };
  const mWC = {
    y: WorldProjection.latToSphMerc(mPos.center.lat),
    x: WorldProjection.lngToSphMerc(mPos.center.lng),
  };
  const r = mPos.rotation;
  const newFoots = footprint.map((pos: {latitude: number, longitude: number, altitude?: number}) => {
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
      latitude: WorldProjection.sphMercToLat(fixWP.y),
      longitude: WorldProjection.sphMercToLng(fixWP.x),
      altitude: pos.altitude ?? 0,
    };
    return fixLonLat;
  });
  return newFoots;
};

export const BuildingUtils = {
  findBuildingFromBuildingID,
  findBuildingFromGmlID,
  createBuildingFromFirestoreDoc,
  transrateFromTangibleMarker,
  createNew,
  createThreeBuildingFromBuilding,
  createThreeBuildingFromTangibleMarker,
  createThreeBuildingsFromTangibleMarkers,
};
