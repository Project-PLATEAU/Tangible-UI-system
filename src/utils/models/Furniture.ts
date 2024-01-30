import { createPublicUrlFromRefPath } from "../firebase/firebase"
import { DocumentData } from "firebase/firestore"
import { MarkerPosition, TangibleMarker } from "./Marker"
// import { atom } from 'recoil'

export type Furniture = {
  id: string
  name: string
  type: string
  objName: string
  thumbnail: string
  objUrl?: string
  thumbUrl?: string
  created: Date
}

export type ThreeFurniture = Furniture & {
  gmlID: string,
  markerID: string,
  position: MarkerPosition
}

const loadObjUrl = async (frn: Furniture) => {
  if (frn.objUrl) {
    return frn.objUrl;
  } else if (frn.objName !== "") {
    const path = "frn/" + frn.type + "/" + frn.objName
    const url = await createPublicUrlFromRefPath(path)
    if(url) {
      return url;
    }
  }
  return undefined;
}

const loadThumbUrl = async (frn: Furniture) => {
  if (frn.thumbUrl) {
    return frn.thumbUrl;
  } else if (frn.thumbnail !== "") {
    const path = "frn/" + frn.type + "/" + frn.thumbnail
    const url = await createPublicUrlFromRefPath(path)
    if(url) {
      return url;
    }
  }
  return undefined;
}

const createFrnFromFirestoreDoc = (docID: string, data: DocumentData) => {
  const created = data.created.toDate();
  const frn = {
    id: docID,
    name: data.name,
    type: data.type,
    objName: data.objName,
    thumbnail: data.thumbnail,
    created: created
  } as Furniture;
  return frn;
}

const createThreeFrnFromFrn = (frn: Furniture) => {
  const nF: ThreeFurniture = {
    ...frn,
    position: { center: { lat: 0, lng: 0}, rotation: 0 },
    gmlID: frn.id,
    markerID: frn.id,
  };
  return nF;
};

const createThreeFrnFromTangibleMarker = (marker: TangibleMarker) => {
  if (marker.frn) {
    const frn = marker.frn;
    const nF: ThreeFurniture = {
      ...frn,
      position: marker.position,
      gmlID: frn.id + "_" + marker.markerID,
      markerID: marker.markerID,
    };
    return nF;
  }
  return undefined;
};

const createThreeFrnsFromTangibleMarkers = (markers: TangibleMarker[]) => {
  const frns: ThreeFurniture[] = [];
  for (const m of markers) {
    const f = createThreeFrnFromTangibleMarker(m);
    if (f) {
      frns.push(f);
    }
  }
  return frns;
};


export const FrnUtils = {
  loadObjUrl,
  loadThumbUrl,
  createFrnFromFirestoreDoc,
  createThreeFrnFromFrn,
  createThreeFrnFromTangibleMarker,
  createThreeFrnsFromTangibleMarkers,
};

/*
 * 特殊オブジェクト
 */

export type SpecialFrn = {
  id: string
  name: string
  type: string
  thumbUrl?: string
  markerID: string
  created: Date
};

const SFrns = [
  { id: "camera_01", name: "カメラ（人・標準レンズ・1.5m）", type: "camera", markerID: "90", created: new Date() } as SpecialFrn,
  { id: "camera_02", name: "カメラ（人・広角レンズ・1.5m）", type: "camera", markerID: "91", created: new Date() } as SpecialFrn,
  { id: "camera_03", name: "カメラ（ドローン・広角レンズ・5m）", type: "camera", markerID: "92", created: new Date() } as SpecialFrn,
  { id: "camera_04", name: "カメラ（ドローン・広角レンズ・10m）", type: "camera", markerID: "93", created: new Date() } as SpecialFrn,
  { id: "camera_05", name: "カメラ（ヘリコプター・広角レンズ・30m）", type: "camera", markerID: "94", created: new Date() } as SpecialFrn,
  { id: "special_01", name: "特殊駒1", type: "special", markerID: "100", created: new Date() } as SpecialFrn,
  { id: "special_02", name: "特殊駒2", type: "special", markerID: "101", created: new Date() } as SpecialFrn,
  { id: "special_03", name: "特殊駒3", type: "special", markerID: "102", created: new Date() } as SpecialFrn,
  { id: "special_04", name: "特殊駒4", type: "special", markerID: "103", created: new Date() } as SpecialFrn,
  { id: "special_05", name: "特殊駒5", type: "special", markerID: "104", created: new Date() } as SpecialFrn,
  { id: "special_06", name: "特殊駒6", type: "special", markerID: "105", created: new Date() } as SpecialFrn,
  { id: "special_07", name: "特殊駒7", type: "special", markerID: "106", created: new Date() } as SpecialFrn,
  { id: "special_08", name: "特殊駒8", type: "special", markerID: "107", created: new Date() } as SpecialFrn,
  { id: "special_09", name: "特殊駒9", type: "special", markerID: "108", created: new Date() } as SpecialFrn,
  { id: "special_10", name: "特殊駒10", type: "special", markerID: "109", created: new Date() } as SpecialFrn,
  { id: "special_11", name: "特殊駒11", type: "special", markerID: "110", created: new Date() } as SpecialFrn,
  { id: "special_12", name: "特殊駒12", type: "special", markerID: "111", created: new Date() } as SpecialFrn,
  { id: "special_13", name: "特殊駒13", type: "special", markerID: "112", created: new Date() } as SpecialFrn,
  { id: "special_14", name: "特殊駒14", type: "special", markerID: "113", created: new Date() } as SpecialFrn,
  { id: "special_15", name: "特殊駒15", type: "special", markerID: "114", created: new Date() } as SpecialFrn,
  { id: "special_16", name: "特殊駒16", type: "special", markerID: "115", created: new Date() } as SpecialFrn,
];

const loadSpecialFrns = () => {
  return SFrns;
};

export const SFrnUtils = {
  loadSpecialFrns,
};