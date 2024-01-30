import { DocumentData, serverTimestamp } from "firebase/firestore"
import { RawMarker } from './Marker'
import { GeoUtils, WorldProjection } from '../GeoUtils'
import { Area } from "./Area"
// 立て322、横548 mm
// 1980 * 1080
// https://docs.mapbox.com/jp/help/glossary/zoom-level/

export type Tangible = {
  id: string
  width: number
  height: number
  rawData: any
  created: Date
  modified: Date
  active: boolean
  area?: {
    workspaceID: string
    areaID: string
    center: {
      lat: number,
      lng: number
    },
    zoom: number,
    rotation?: number,
  }
  rawMarkers: RawMarker[]
  isBlank?: boolean
}

const createBlank = () => {
  return {
    id: "",
    width: 0,
    height: 0,
    rawData: {},
    created: new Date(),
    modified: new Date(),
    active: false,
    isBlank: true,
    rawMarkers: []
  } as Tangible;
}

const createTangibleFromFirestoreDoc = (docID: string, data: DocumentData, rawData: any, area?: Area, ) => {
  const created = data.created.toDate();
  const modified = data.modified.toDate();
  const tangible: Tangible = {
    id: docID,
    width: data.width,
    height: data.height,
    rawData: rawData,
    active: data.active,
    created: created,
    modified: modified,
    rawMarkers: []
  }
  if (data.area) {
    tangible.area = data.area
  }
  if (area) {
    tangible.rawMarkers = parseRawMarkersWithArea(area);
  } else {
    tangible.rawMarkers = parseRawMarkers(tangible);
  }
  return tangible;
}

const addAreaInfomation = (t: Tangible, area: Area, wsID: string) => {
  const aInfo = {
    workspaceID: wsID,
    areaID: area.id,
    center: area.area.center,
    zoom: area.area.zoom,
    rotation: area.area.rotation,
  };
  const t2 = { ...t };
  t2.area = aInfo;
  return t2;
}

const createUpdateFirebaseDocument = (t: Tangible) => {
  const time = serverTimestamp();
  if (t.area) {
    const doc = {
      active: t.active,
      area: t.area,
      modified: time
    };
    return doc;
  } else {
    return {
      active: false,
      modified: time,
    };
  }
}

// https://docs.mapbox.com/jp/help/glossary/zoom-level/
// 緯度0（赤道）
// const meterPerPixel0 = [
//   78271.484, 39135.742, 19567.871, 9783.936, 4891.968,
//   2445.984, 1222.992, 611.496, 305.748, 152.874,
//   76.437, 38.218, 19.109, 9.555, 4.777,
//   2.389, 1.194, 0.597, 0.299, 0.149,
//   0.075, 0.037, 0.019,
// ]

// // 緯度+-20（メキシコシティ、ムタレ、ジンバブエ）
// const meterPerPixel20 = [
//   73551.136, 36775.568, 18387.784, 9193.892, 4596.946,
//   2298.473, 1149.237, 574.618, 287.309, 143.655,
//   71.827, 35.914, 17.957, 8.978, 4.489,
//   2.245, 1.122, 0.561, 0.281, 0.140,
//   0.070, 0.035, 0.018,
// ]

// // 緯度+plusmn;40（シンシナティ、メルボルン）
// const meterPerPixel40 = [
//   59959.436, 29979.718, 14989.859, 7494.929, 3747.465,
//   1873.732, 936.866, 468.433, 234.217, 117.108,
//   58.554, 29.277, 14.639, 7.319, 3.660,
//   1.830, 0.915, 0.457, 0.229, 0.114,
//   0.057, 0.029, 0.014,

// ]

// // 緯度+plusmn;60（アンカレッジ）
// const meterPerPixel60 = [
//   39135.742, 19567.871, 9783.936, 4891.968, 2445.984,
//   1222.992, 611.496, 305.748, 152.874, 76.437,
//   38.218, 19.109, 9.555, 4.777, 2.389,
//   1.194, 0.597, 0.299, 0.149, 0.075,
//   0.037, 0.019, 0.009,
  
// ]

// // 緯度+plusmn;80（ロングイヤービーン、スバールバル・ノルウェー
// const meterPerPixel80 = [
//   13591.701, 6795.850, 3397.925, 1698.963, 849.481,
//   424.741, 212.370, 106.185, 53.093, 26.546,
//   13.273, 6.637, 3.318, 1.659, 0.830,
//   0.415, 0.207, 0.104, 0.052, 0.026,
//   0.013, 0.006, 0.003,
  
// ]

const getMetersPerPixel = (lat: number, zoom: number) => {
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
}

// タンジブルユニットの描画の実寸範囲
const getSizeMetersOfTangible = (lat: number, zoom: number, width: number, height: number) => {
  const meters_per_pixel = getMetersPerPixel(lat, zoom);
  const w = width * meters_per_pixel;
  const h = height * meters_per_pixel;
  return {
    w: w, h: h
  };
}

// タンジブルの緯度経度範囲（Areaの緯度経度範囲）
const getRectangleLatLng = (tangibleData: Tangible) => {
  const area = tangibleData.area ?? { center: GeoUtils.defaultCenter, zoom: 18 };
  const tSize = getSizeMetersOfTangible(area.center.lat, area.zoom, tangibleData.width, tangibleData.height);
  const wY = WorldProjection.latToSphMerc(area.center.lat);
  const wX = WorldProjection.lngToSphMerc(area.center.lng);
  const effect = 1 / Math.cos(area.center.lat * Math.PI / 180);
  const wNE = {
    y: wY + tSize.h * effect / 2,
    x: wX + tSize.w * effect / 2
  };
  const wSW = {
    y: wY - tSize.h * effect / 2,
    x: wX - tSize.w * effect / 2
  };
  const NE = {
    lat: WorldProjection.sphMercToLat(wNE.y),
    lng: WorldProjection.sphMercToLng(wNE.x)
  };
  const SW = {
    lat: WorldProjection.sphMercToLat(wSW.y),
    lng: WorldProjection.sphMercToLng(wSW.x)
  };
  return {
    NE: NE,
    SW: SW
  };
};

// Areaの緯度経度範囲（編集中に呼ばれる）
const getRectanglePolygon =(center: { lat: number, lng: number }, zoom: number, width: number, height: number) => {
  // この座標系は1point = 1mとみなすが、実際は違うので注意
  const tSize = getSizeMetersOfTangible(center.lat, zoom, width, height);
  const wY = WorldProjection.latToSphMerc(center.lat);
  const wX = WorldProjection.lngToSphMerc(center.lng);
  const effect = 1 / Math.cos(center.lat * Math.PI / 180);
// Math.cos(lat * Math.PI / 180)
  const wNE = {
    y: wY + tSize.h * effect / 2,
    x: wX + tSize.w * effect / 2
  };
  const wSW = {
    y: wY - tSize.h * effect / 2,
    x: wX - tSize.w * effect / 2
  };
  const NE = {
    lat: WorldProjection.sphMercToLat(wNE.y),
    lng: WorldProjection.sphMercToLng(wNE.x)
  };
  const SW = {
    lat: WorldProjection.sphMercToLat(wSW.y),
    lng: WorldProjection.sphMercToLng(wSW.x)
  };
  // console.log(GeoUtils.getDistance(NE, SW))
  // const rn = {
  //   x: WorldProjection.lngToSphMerc(NE.lng),
  //   y: WorldProjection.latToSphMerc(NE.lat)
  // }
  // const rs = {
  //   x: WorldProjection.lngToSphMerc(SW.lng),
  //   y: WorldProjection.latToSphMerc(SW.lat)
  // }
  return {
    NE: NE,
    SW: SW
  };
}

const getRectanglePolygonFromArea = (area: Area) => {
  const center = area.area.center;
  const zoom = area.area.zoom;
  const width = area.tangible ? area.tangible.width : 1980;
  const height = area.tangible ? area.tangible.height : 1080;
  return getRectanglePolygon (center, zoom, width, height);
}

const getAreaCenterWithReferenceAndDirection = (area: Area, refArea: Area, type: number) => {
  const RA = refArea.area;
  const width = area.tangible ? area.tangible.width : 1980;
  const height = area.tangible ? area.tangible.height : 1080;
  const tSize = getSizeMetersOfTangible(RA.center.lat, area.area.zoom, width, height);
  const effect = 1 / Math.cos(RA.center.lat * Math.PI / 180);
  const dLngM = tSize.w * effect / 2;
  const dLatM = tSize.h * effect / 2;
  let centerM = {
    xLng: WorldProjection.lngToSphMerc(area.area.center.lng),
    yLat: WorldProjection.latToSphMerc(area.area.center.lat),
  };
  switch (type) {
    case 1: // TopOut-LeftOut (North West)
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.SW.lng) - dLngM,
        yLat: WorldProjection.latToSphMerc(RA.NE.lat) + dLatM,
      };
      break;
    case 2: // TopOut-LeftIn
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.SW.lng) + dLngM,
        yLat: WorldProjection.latToSphMerc(RA.NE.lat) + dLatM,
      };
      break;
    case 3: // TopOut-Center (North)
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.center.lng),
        yLat: WorldProjection.latToSphMerc(RA.NE.lat) + dLatM,
      };
      break;
    case 4: // TopOut-RightIn
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.NE.lng) - dLngM,
        yLat: WorldProjection.latToSphMerc(RA.NE.lat) + dLatM,
      };
      break;
    case 5: // TopOut-RightOut (North East)
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.NE.lng) + dLngM,
        yLat: WorldProjection.latToSphMerc(RA.NE.lat) + dLatM,
      };
      break;
    case 6: // TopIn-LeftOut
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.SW.lng) - dLngM,
        yLat: WorldProjection.latToSphMerc(RA.NE.lat) - dLatM,
      };
      break;
    case 7: // TopIn-LeftIn
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.SW.lng) + dLngM,
        yLat: WorldProjection.latToSphMerc(RA.NE.lat) - dLatM,
      };
      break;
    case 8: // TopIn-Center
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.center.lng),
        yLat: WorldProjection.latToSphMerc(RA.NE.lat) - dLatM,
      };
      break;
    case 9: // TopIn-RightIn
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.NE.lng) - dLngM,
        yLat: WorldProjection.latToSphMerc(RA.NE.lat) - dLatM,
      };
      break;
    case 10: // TopIn-RightOut
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.NE.lng) + dLngM,
        yLat: WorldProjection.latToSphMerc(RA.NE.lat) - dLatM,
      };
      break;
    case 11: // Center-LeftOut
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.SW.lng) - dLngM,
        yLat: WorldProjection.latToSphMerc(RA.center.lat),
      };
      break;
    case 12: // Center-LeftIn
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.SW.lng) + dLngM,
        yLat: WorldProjection.latToSphMerc(RA.center.lat),
      };
      break;
    case 13: // Center-Center
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.center.lng),
        yLat: WorldProjection.latToSphMerc(RA.center.lat),
      };
      break;
    case 14: // Center-RightIn
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.NE.lng) - dLngM,
        yLat: WorldProjection.latToSphMerc(RA.center.lat),
      };
      break;
    case 15: // Center-RightOut
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.NE.lng) + dLngM,
        yLat: WorldProjection.latToSphMerc(RA.center.lat),
      };
      break;
    case 16: // BottomIn-LeftOut
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.SW.lng) - dLngM,
        yLat: WorldProjection.latToSphMerc(RA.SW.lat) + dLatM,
      };
      break;
    case 17: // BottomIn-LeftIn
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.SW.lng) + dLngM,
        yLat: WorldProjection.latToSphMerc(RA.SW.lat) + dLatM,
      };
      break;
    case 18: // BottomIn-Center
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.center.lng),
        yLat: WorldProjection.latToSphMerc(RA.SW.lat) + dLatM,
      };
      break;
    case 19: // BottomIn-RightIn
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.NE.lng) - dLngM,
        yLat: WorldProjection.latToSphMerc(RA.SW.lat) + dLatM,
      };
      break;
    case 20: // BottomIn-RightOut
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.NE.lng) + dLngM,
        yLat: WorldProjection.latToSphMerc(RA.SW.lat) + dLatM,
      };
      break;
    case 21: // BottomIn-LeftOut
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.SW.lng) - dLngM,
        yLat: WorldProjection.latToSphMerc(RA.SW.lat) - dLatM,
      };
      break;
    case 22: // BottomIn-LeftIn
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.SW.lng) + dLngM,
        yLat: WorldProjection.latToSphMerc(RA.SW.lat) - dLatM,
      };
      break;
    case 23: // BottomIn-Center
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.center.lng),
        yLat: WorldProjection.latToSphMerc(RA.SW.lat) - dLatM,
      };
      break;
    case 24: // BottomIn-RightIn
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.NE.lng) - dLngM,
        yLat: WorldProjection.latToSphMerc(RA.SW.lat) - dLatM,
      };
      break;
    case 25: // BottomIn-RightOut
      centerM = {
        xLng: WorldProjection.lngToSphMerc(RA.NE.lng) + dLngM,
        yLat: WorldProjection.latToSphMerc(RA.SW.lat) - dLatM,
      };
      break;

  }
  return {
    lat: WorldProjection.sphMercToLat(centerM.yLat),
    lng: WorldProjection.sphMercToLng(centerM.xLng),
  };
}


// tangibleのデータからマーカーの緯度経度情報、回転などを一括変換
const parseRawMarkersWithArea = (area: Area) => {
  if (!area.tangible) {
    return [];
  }
  const tangibleData = area.tangible;
  const markers: RawMarker[] = [];
  if (!tangibleData.rawData || !tangibleData.rawData.data) {
    return markers;
  }
  try {
    const rawData = tangibleData.rawData.data;
    // const { NE, SW } = getRectangleLatLng(tangibleData);
    const { NE, SW } = getRectanglePolygonFromArea(area);
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
        const r = { x: oneData.coordinates.cx / w, y: oneData.coordinates.cy / h};
        const geo = {
          lat: NE.lat - (NE.lat - SW.lat) * r.y,
          lng: SW.lng + (NE.lng - SW.lng) * r.x,
        };
        markers.push({
          center: geo,
          rotation: rotation,
          markerID: markerID
        })
      } catch (e0) {
        console.log(e0);
      }
    }
  } catch (e) {
    console.log(e);
  }
  return markers;
}

const parseRawMarkers = (tangibleData: Tangible) => {
  const markers: RawMarker[] = [];
  if (!tangibleData.rawData || !tangibleData.rawData.data) {
    return markers;
  }
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
        const r = { x: oneData.coordinates.cx / w, y: oneData.coordinates.cy / h};
        const geo = {
          lat: NE.lat - (NE.lat - SW.lat) * r.y,
          lng: SW.lng + (NE.lng - SW.lng) * r.x,
        };
        markers.push({
          center: geo,
          rotation: rotation,
          markerID: markerID
        })
      } catch (e0) {
        console.log(e0);
      }
    }
  } catch (e) {
    console.log(e);
  }
  return markers;
}


export const TangibleUtils = {
  addAreaInfomation,
  createBlank,
  createTangibleFromFirestoreDoc,
  createUpdateFirebaseDocument,
  getRectanglePolygon,
  getRectanglePolygonFromArea,
  getAreaCenterWithReferenceAndDirection,
  parseRawMarkers,
  parseRawMarkersWithArea,
}
