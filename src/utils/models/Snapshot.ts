import { DocumentData, serverTimestamp } from "firebase/firestore";
// import { SnapMarker } from './Marker'
import { Area, AreaUtils } from "./Area"
import { Workspace } from "./Workspace"
import { uploadArrayBuffer, createPublicUrlFromRefPath, loadSnapShot } from "../firebase/firebase";
import { TangibleUtils } from "./Tangible";

export type Snapshot = {
  id: string
  screenshot: string,
  unityimage: string,
  title: string,
  comment: string,
  camera: {
    position: {
      lat: number,
      lng: number,
      alt: number,
    },
    target: {
      lat: number,
      lng: number,
      alt: number,
    }
  }
  screenUrl?: string,
  unityUrl?: string,
  areas: Area[],
  // markers: SnapMarker[]
  created: Date
}

const createBlank = () => {
  const newSnap: Snapshot = {
    id: "blank",
    created: new Date(),
    areas: [],
    // markers: [],
    screenshot: "",
    unityimage: "",
    title: "",
    comment: "",
    camera: {
      position: { lat: 0, lng: 0, alt: 0},
      target: { lat: 0, lng: 0, alt: 0}
    },
  };
  return newSnap;
}

const createSnapShotFromWorkspace = (ws: Workspace, camera: {
  position: { lat: number, lng: number, alt: number, },
  target: { lat: number, lng: number, alt: number, },
}) => {
  const newSnap: Snapshot = {
    id: ws.id,
    created: new Date(),
    areas: ws.areas,
    // markers: [],
    screenshot: "",
    unityimage: "",
    title: "",
    comment: "",
    camera: camera,
  };
  return newSnap;
}

const createSnapShotFromFirestoreDoc = (docID: string, data: DocumentData) => {
  const created = data.created.toDate();
  const snap = {
    id: docID,
    screenshot: data.screenshot,
    unityimage: data.unityimage,
    created: created,
    camera: data.camera,
    title: data.title,
    comment: data.comment,
    areas: [],
    // markers: []
  } as Snapshot;
  return snap;
}

const createFirestoreDocFromObject = (s: Snapshot) => {
  const time = serverTimestamp();
  return {
    title: s.title,
    comment : s.comment,
    camera: s.camera,
    screenshot: s.screenshot,
    unityimage: s.unityimage,
    created: time,
  };
};

const uploadScreenImage = async (wsID: string, blob: Blob, docID: string) => {
  const fileName = "snapshot_" + docID + ".png";
  const buffer = await blob.arrayBuffer();
  const pathref = "workspaces/" + wsID + "/" + fileName;
  const result = await uploadArrayBuffer(pathref, buffer);
  return result;
};

const loadThumbUrl = async (wsID: string, snap: Snapshot) => {
  if (snap.screenUrl) {
    return snap.screenUrl;
  }
  if(!snap.screenUrl && snap.screenshot !== "") {
    const path ="workspaces/" + wsID + "/" + snap.screenshot;
    const url = await createPublicUrlFromRefPath(path)
    if(url) {
      return url;
    }
  }
  return undefined;
}

const loadDetail = async (ws: Workspace, snap: Snapshot) => {
  const s2 = await loadSnapShot(ws, snap);
  return s2;
}

const findSnapShot = (ws: Workspace, snapId?: string) => {
  if (!snapId) {
    return undefined;
  }
  const snap = ws.snapshots.find((aSnap: Snapshot) => {
    return aSnap.id === snapId;
  })
  return snap;
}

const loadAreasBuildings = async (sn: Snapshot) => {
  const areas = await Promise.all(sn.areas.map(async (a: Area) => {
    const a2 = await AreaUtils.loadBuildings(a);
    return a2;
  }));
  const nSN = { ...sn };
  nSN.areas = areas;
  return nSN;
};

const setDummyActiveTangible = (sn: Snapshot) => {
  const areas = sn.areas.map((a: Area) => {
    const a2 = { ...a };
    a2.tangible = TangibleUtils.createBlank();
    a2.tangible.active = true;
    return a2;
  });
  const nSN = { ...sn };
  nSN.areas = areas;
  return nSN;
};

export const SnapshotUtils = {
  createSnapShotFromFirestoreDoc,
  createBlank,
  createSnapShotFromWorkspace,
  createFirestoreDocFromObject,
  findSnapShot,
  loadAreasBuildings,
  loadDetail,
  loadThumbUrl,
  uploadScreenImage,
  setDummyActiveTangible,
};
