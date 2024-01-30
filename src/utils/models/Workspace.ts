import { DocumentData, serverTimestamp } from "firebase/firestore";
import { atom } from "recoil";
import { Area, AreaUtils } from "./Area";
import { GeoUtils } from "../GeoUtils";
import { Snapshot } from "./Snapshot";
import { getSingleWorkSpace, loadMarkerObjectFromArea } from "../firebase/firebase";

export type Workspace = {
  id: string
  title: string
  description: string
  organizer: string
  center: {
    lat: number,
    lng: number
  }
  areas: Area[],
  snapshots: Snapshot[],
  created: Date
  modified: Date
  isNew: boolean
};



const createNew = () => {
  return {
    id: "",
    title: "新規ワークスペース",
    description: "",
    organizer: "",
    center: {
      lat: 0,
      lng: 0
    },
    areas: [],
    snapshots: [],
    created: new Date(),
    modified: new Date(),
    isNew: true,
  } as Workspace;
};

const createWSFromFirestoreDoc = (docID: string, data: DocumentData) => {
  const created = data.created.toDate();
  const modified = data.modified.toDate();
  const workspace = {
    id: docID,
    title: data.title,
    description: data.description,
    organizer: data.organizer,
    center: data.center,
    created: created,
    modified: modified,
    areas: [],
    snapshots: [],
    isNew: false,
  } as Workspace;
  return workspace;
};

const findWorkspaceFromID = (
  id: string,
  dataList: Workspace[]
) => {
  const objList = dataList.filter((obj: Workspace) => {
    return obj.id === id;
  });
  if (objList.length > 0) {
    return objList[0];
  } else {
    return null;
  }
};

const createFirestoreDocFromObject = (ws: Workspace) => {
  const time = serverTimestamp();
  const cDate = ws.isNew ? time : ws.created;
  return {
    title: ws.title,
    description : ws.description,
    organizer: ws.organizer,
    created: cDate,
    modified: time,
  };
};

const hasActiveArea = (ws: Workspace) => {
  const a = ws.areas.filter((area: Area) => {
    if (area.tangible) {
      return area.tangible.active;
    }
    return false;
  });
  return a.length > 0;
};

const loadWorkSpaceWithId = async (id: string) => {
  const ws = await getSingleWorkSpace(id);
  return ws;
}

const loadAreaWithMarkerObj = async (ws: Workspace) => {
  const areas = await Promise.all(ws.areas.map(async (a: Area) => {
    const a2 = await loadMarkerObjectFromArea(a);
    return a2;
  }));
  const nW = { ...ws };
  nW.areas = areas;
  return nW;
};

const loadAreasBuildings = async (ws: Workspace) => {
  const areas = await Promise.all(ws.areas.map(async (a: Area) => {
    const a2 = await AreaUtils.loadBuildings(a);
    return a2;
  }));
  const nW = { ...ws };
  nW.areas = areas;
  return nW;
};

const checkTangibleUpdates = async (ws: Workspace) => {
  const results = await Promise.all(ws.areas.map(async (a: Area) => {
    return await AreaUtils.refreshTangibleArea(a);
  }));
  const areas: Area[] = [];
  const updateAreas: Area[] = [];
  for (const r of results) {
    areas.push(r.area);
    if (r.update) {
      updateAreas.push(r.area);
    }
  }
  const nW = { ...ws };
  nW.areas = areas;
  return { workspace: nW, updateAreas: updateAreas};
};

const getCenter = (ws: Workspace) => {
  if (ws.areas.length === 0) {
    return GeoUtils.defaultCenter;
  }
  let lat = 0, lng = 0;
  for (const area of ws.areas) {
    lat = lat + area.area.center.lat;
    lng = lng + area.area.center.lng;
  }
  return {
    lat: lat / ws.areas.length,
    lng: lng / ws.areas.length,
  };
};

export const WorkspaceUtils = {
  findWorkspaceFromID,
  checkTangibleUpdates,
  createWSFromFirestoreDoc,
  createNew,
  createFirestoreDocFromObject,
  getCenter,
  hasActiveArea,
  loadAreaWithMarkerObj,
  loadAreasBuildings,
  loadWorkSpaceWithId,
}

export const WorkspaceAtom = atom<Workspace>({
  key: 'workspace_atom',
  default: createNew(),
})

