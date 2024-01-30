
import { DocumentData, serverTimestamp } from "firebase/firestore";
import { GeoUtils } from "../GeoUtils"
import { Marker, TangibleMarker, SnapMarker, RawMarker, TangibleMarkerUtils } from "./Marker";
import { Tangible, TangibleUtils } from "./Tangible";
import { Building } from "./Building";
import { getBuildingsInArea, getTangibleDocument, createPublicUrlFromRefPath } from "../firebase/firebase";

export type Area = {
  id: string
  tangibleID: string
  title: string
  area: {
    NE: {
      lat: number,
      lng: number
    },
    SW: {
      lat: number,
      lng: number
    },
    center: {
      lat: number,
      lng: number
    },
    zoom: number,
    rotation: number,
    map?: string,
    unity?: string,
  }
  created: Date
  modified: Date
  prepared: boolean
  markers: Marker[]
  active: boolean
  isNew: boolean
  tangible?: Tangible
  tangibleUpdate? : boolean
  bldgs? : Building[]
  tMarkers: TangibleMarker[]
  sMarkers?: SnapMarker[]
}

export type ThreeArea = {
  gmlID: string,
  NE: {
    lat: number,
    lng: number
  },
  SW: {
    lat: number,
    lng: number
  },
  center: {
    lat: number,
    lng: number
  },
  zoom: number,
  rotation: number,
  map?: string,
  unity?: string,
  url?: string,
  unityUrl?: string,
}

const createNew = () => {
  return {
    id: "",
    tangibleID: "",
    title: "",
    area: {
      NE: {
        lat: 0,
        lng: 0
      },
      SW: {
        lat: 0,
        lng: 0
      },
      center: {
        lat: 0,
        lng: 0
      },
      zoom: 18.823,
      rotation: 0
    },
    created: new Date(),
    modified: new Date(),
    prepared: false,
    markers: [],
    tMarkers: [],
    active: false,
    isNew: true
  } as Area
};

const createWithPoints = (ne: google.maps.LatLngLiteral, sw: google.maps.LatLngLiteral) => {
  return {
    id: "",
    tangibleID: "",
    title: "",
    area: {
      NE: {
        lat: ne.lat,
        lng: ne.lng
      },
      SW: {
        lat: sw.lat,
        lng: sw.lng
      },
      center: {
        lat: (ne.lat + sw.lat) / 2,
        lng: (ne.lng + sw.lng) / 2
      },
      zoom: 17,
      rotation: 0,
    },
    created: new Date(),
    modified: new Date(),
    prepared: false,
    markers: [],
    tMarkers: [],
    active: false,
    isNew: true
  } as Area
};

const setTangible = (area: Area, tangible: Tangible) => {
  const nA = { ...area };
  nA.tangibleID = tangible.id;
  nA.tangible = tangible;
  nA.tangibleUpdate = true;
  return nA;
};

const updateTangible = (area: Area, tangible: Tangible) => {
  const nA = { ...area };
  nA.tangible = tangible;
  return nA;
};

const isPrepared = (area: Area) => {
  if(area.tangibleID === "") {
    return false;
  }
  if(area.markers.length === 0) {
    return false;
  }
  return true;
};

const createAreaFromFirestoreDoc = (docID: string, data: DocumentData) => {
  const created = data.created.toDate();
  const modified = data.modified.toDate();
  const area = {
    id: docID,
    tangibleID: data.tangibleID,
    title: data.title,
    area: data.area,
    created: created,
    modified: modified,
    active: false,
    isNew: false,
    prepared: false,
    markers: [],
    tMarkers: [],
  } as Area;
  return area;
};

// marker情報は含まない
const createFirestoreDocFromArea = (area: Area) => {
  const time = serverTimestamp();
  return {
    title: area.title,
    tangibleID: area.tangibleID,
    area: area.area,
    created: area.isNew ? time : area.created,
    modified: time,
  };
};

const getCenterAndRadius = (area: Area) => {
  const center = {
    lat: area.area.center.lat,
    lng: area.area.center.lng,
  }
  const radius = GeoUtils.getRadius(area.area.NE, area.area.SW);
  return {radius, center};
};

const loadBuildings = async (area: Area) => {
  const newBldgs = await getBuildingsInArea(area);
  const nA = { ...area };
  nA.bldgs = newBldgs;
  return nA;
};

const refreshTangibleArea = async (area: Area) => {
  const nT = await getTangibleDocument(area);
  if (!nT) {
    return {
      area: { ...area },
      update: false, 
    };
  }
  const nA = updateTangible(area, nT);
  let update = false;
  if (area.tangible) {
    if (area.tangible.active) {
      if (nT.active) { // タンジブル稼働中（タンジブルマーカー更新）
        nA.tMarkers = findTangibleMarkers(nT.rawMarkers, area.markers);
        update = true;
      } else { // タンジブル終了
        update = false;
        // nA.tMarkers = [];
      }
    } else {
      if (nT.active) { // タンジブル開始
        nA.tMarkers = findTangibleMarkers(nT.rawMarkers, area.markers);
        update = true;
      } else {
        update = false;
      }
    }
  } else { // 基本的におかしいルート, tangibleはload出来てないとおかしい
    if (nT.active) { // タンジブル開始
      nA.tMarkers = findTangibleMarkers(nT.rawMarkers, area.markers);
      update = true;
    }
  }
  return { area: nA, update: update };
};

const findTangibleMarkers = (raws: RawMarker[], markers: Marker[]) => {
  const nM = raws.map(rm => {
    const fm = markers.find(m => m.markerID === rm.markerID);
    return fm ? TangibleMarkerUtils.createTangibleMarker(fm, rm) : null;
  });
  const nTM = nM.filter(m => m != null) as TangibleMarker[];
  return nTM;
};

const refreshAreaRectangle = (area: Area) => {
  const { NE, SW } = TangibleUtils.getRectanglePolygonFromArea(area);
  const a = {
    center: area.area.center,
    NE: NE,
    SW: SW,
    rotation: area.area.rotation,
    zoom: area.area.zoom,
  };
  const nA = { ...area };
  nA.area = a;
  return nA;
};

const createThreeArea = async (wsID: string, area: Area) => {
  const url = await loadMapUrl(wsID, area);
  const unity = await loadUnityUrl(wsID, area);
  return {
    gmlID: wsID + "_" + area.id,
    ...area.area,
    url: url,
    unityUrl: unity
  } as ThreeArea;
};

const loadMapUrl = async (wsID: string, area: Area) => {
  const a = area.area;
  if (a.map) {
    const refPath = "workspaces/" + wsID + "/" + a.map;
    const url = await createPublicUrlFromRefPath(refPath)
    if(url) {
      return url;
    }
  }
};

const loadUnityUrl = async (wsID: string, area: Area) => {
  const a = area.area;
  if (a.unity) {
    const refPath = "workspaces/" + wsID + "/" + a.unity;
    const url = await createPublicUrlFromRefPath(refPath)
    if(url) {
      return url;
    }
  }
};

export const AreaUtils = {
  createNew,
  createWithPoints,
  isPrepared,
  createAreaFromFirestoreDoc,
  createFirestoreDocFromArea,
  getCenterAndRadius,
  loadBuildings,
  createThreeArea,
  refreshTangibleArea,
  refreshAreaRectangle,
  setTangible,
};
