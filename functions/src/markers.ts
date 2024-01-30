import { getFirestore } from "firebase-admin/firestore";
import { createBuildingFromSnapshot } from "./buildings";
import {
  COLLECTIONS,
  createStoragePublicUrl,
  MarkerType,
} from "./utils";

// マーカーの本体（建物、ファニチャー）情報を取得。
export const loadMarkerObject = async (marker: any) => {
  const db = getFirestore();
  if (marker.type === MarkerType.Building) {
    const col = db.collection(COLLECTIONS.BUILDINGS);
    const doc = await col.doc(marker.objID).get();
    if (doc.exists) {
      const obj = createBuildingFromSnapshot(doc);
      return {
        ...marker,
        bldg: obj,
      };
    }
  } else if (marker.type === MarkerType.Furniture) {
    const col = db.collection(COLLECTIONS.FURNITURES);
    const doc = await col.doc(marker.objID).get();
    const data = doc.data();
    if (doc.exists && data) {
      const thumbPath = "frn/" + data.type + "/" + data.thumbnail;
      const thumbUrl = await createStoragePublicUrl(thumbPath);
      const objPath = "frn/" + data.type + "/" + data.objName;
      const objUrl = await createStoragePublicUrl(objPath);
      const obj = {
        ...data,
        thumbUrl: thumbUrl ? thumbUrl : "",
        objUrl: objUrl ? objUrl : "",
      };
      return {
        ...marker,
        frn: obj,
      };
    }
  } else if (marker.type === MarkerType.Special) {
    const col = db.collection(COLLECTIONS.SPECIALS);
    const doc = await col.doc(marker.objID).get();
    const data = doc.data();
    if (doc.exists && data) {
      return {
        ...marker,
        special: data,
      };
    }
  }
  return marker;
};
