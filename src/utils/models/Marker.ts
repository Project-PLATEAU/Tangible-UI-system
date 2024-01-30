import { DocumentData, serverTimestamp } from "firebase/firestore"
import { Building } from './Building'
import { Furniture, SpecialFrn } from './Furniture'

export type Marker = {
  docID: string,
  markerID: string,
  type: string
  objID: string
  uniqueID: string
  bldg?: Building
  frn?: Furniture
  special?: SpecialFrn
  comment?: string
  created: Date
  modified: Date
  isNew: boolean,
  delete: boolean,
  // position? : MarkerPosition
}

export type RawMarker = MarkerPosition & {
  markerID: string,
}

export type TangibleMarker = Marker & {
  position: MarkerPosition,
}

export type SnapMarker = TangibleMarker & {
  areaID: string,
}

export type MarkerPosition = {
  center: {
    lat: number,
    lng: number
  }
  rotation: number
}

export const MarkerType = {
  Furniture: "furniture",
  Building: "building",
  Special: "special",
};

const createMarkerFromFirestoreDoc = (docID: string, data: DocumentData) => {
  const created = data.created.toDate();
  const modified = data.modified.toDate();
  const uniqueID = data.type !== MarkerType.Furniture ? data.objID : data.objID + "_" + data.markerID;
  const marker: Marker = {
    docID: docID,
    markerID: data.markerID,
    type: data.type,
    uniqueID: uniqueID,
    objID: data.objID,
    created: created,
    modified: modified,
    isNew: false,
    delete: false,
  }
  return marker
}

const createFirestoreDocFromMarker = (marker: Marker) => {
  const time = serverTimestamp();
  return {
    type: marker.type,
    objID: marker.objID,
    markerID: marker.markerID,
    created: marker.isNew ? time: marker.created,
    modified: time,
    comment: marker.comment ?? "",
  };
}

const createMarkerFromFrn = (frn: Furniture, markers: Marker[]) => {
  const markerID = getNextMarkerID(markers);
  const marker: Marker = {
    docID: "",
    markerID: markerID,
    type: MarkerType.Furniture,
    created: new Date(),
    modified: new Date(),
    isNew: true,
    objID: frn.id,
    uniqueID: frn.id + "_" + markerID,
    frn: frn,
    delete: false,
  };
  return marker;
}

const createMarkerFromSpecialFrn = (sFrn: SpecialFrn) => {
  const marker: Marker = {
    docID: "",
    markerID: sFrn.markerID,
    type: MarkerType.Special,
    created: new Date(),
    modified: new Date(),
    isNew: true,
    objID: sFrn.id,
    uniqueID: sFrn.id,
    special: sFrn,
    delete: false,
  };
  return marker;
}

const createMarkerFromBuilding = (bldg: Building, markers: Marker[]) => {
  const markerID = getNextMarkerID(markers);
  const marker: Marker = {
    docID: "",
    markerID: markerID,
    type: MarkerType.Building,
    created: new Date(),
    modified: new Date(),
    isNew: true,
    objID: bldg.gmlID,
    uniqueID: bldg.gmlID,
    bldg: bldg,
    delete: false
  };
  return marker
}

const createTangibleMarker = (marker: Marker, raw: RawMarker) => {
  return {
    ...marker,
    position: raw as MarkerPosition,
  } as TangibleMarker;
};

const createTangibleMarkerFromFirestoreDoc = (docID: string, data: DocumentData) => {
  const created = data.created.toDate();
  const modified = data.modified.toDate();
  const position: MarkerPosition = {
    center: data.position,
    rotation: data.rotation,
  };
  const uniqueID = data.type === MarkerType.Building ? data.objID : data.objID + "_" + data.markerID;
  const marker: SnapMarker = {
    docID: docID,
    markerID: data.markerID,
    areaID: data.areaID,
    type: data.type,
    objID: data.objID,
    uniqueID: uniqueID,
    created: created,
    modified: modified,
    position: position,
    isNew: false,
    delete: false,
  };
  if (data.comment) {
    marker.comment = data.comment;
  }
  return marker;
};

const createFirestoreDocFromSnapMarker = (marker: SnapMarker) => {
  const time = serverTimestamp();
  return {
    areaID: marker.areaID,
    markerID: marker.markerID,
    type: marker.type,
    objID: marker.objID,
    created: marker.isNew ? time: marker.created,
    modified: time,
    comment: marker.comment ?? "",
    position: marker.position.center,
    rotation: marker.position.rotation,
  };
}

const createFirestoreDocFromTangibleMarker = (marker: TangibleMarker) => {
  const time = serverTimestamp();
  return {
    type: marker.type,
    objID: marker.objID,
    markerID: marker.markerID,
    created: marker.created,
    modified: time,
    comment: marker.comment ?? "",
    position: marker.position.center,
    rotation: marker.position.rotation,
  };
}

const findMarkerFromUniqueID = (uniqueID: string, type: string, markers: Marker[]) => {
  const objList = markers.filter((marker: Marker) => {
    if (marker.uniqueID === uniqueID && marker.type === type && !marker.delete) {
      return true;
    }
    return false;
  });
  // if (isBldg) {
  //   objList = markers.filter((marker: Marker) => {
  //     if (marker.isBldg && marker.bldgID === objID) {
  //       return true;
  //     }
  //     return false;
  //   })
  // } else {
  //   objList = markers.filter((marker: Marker) => {
  //     if (!marker.isBldg && marker.frnID === objID) {
  //       return true;
  //     }
  //     return false;
  //   })
  // }
  if (objList.length > 0) {
    return objList[0];
  } else {
    return null;
  }
}

const findMarkersFromObjID = (objID: string, markers: Marker[]) => {
  const objList = markers.filter((marker: Marker) => {
    if (marker.objID === objID && !marker.delete) {
      return true;
    }
    return false;
  });
  return objList;
}

const findMarkersFromObjIDIncludeDelete = (objID: string, markers: Marker[]) => {
  const objList = markers.filter((marker: Marker) => {
    if (marker.objID === objID) {
      return true;
    }
    return false;
  });
  return objList;
}

// const nextUnitNo = (markers: Marker[]) => {
//   if (markers.length === 0) {
//     return 1;
//   } 
//   const sorted = markers.sort((a: Marker, b: Marker) => {
//     return b.unit - a.unit;
//   })
//   return sorted[0].unit + 1;
// }

// delete待ちのものも考慮に入れる（deleteを確定させないと上限を超えていたら作れない）
const getNextMarkerID = (markers: Marker[]) => {
  const noList = findFreeID(markers);
  if (noList.length > 0) {
    return noList[0];
  }
  return "-1";
}

const getMarkerIDString = (index: number) => {
  if (index < 10) {
    return "0" + index;
  }
  return "" + index;
}

const findFreeID = (markers: Marker[]) => {
  const noList: string[] = [];
  for (let i = 0; i < 100; i ++) {
    const tempID = getMarkerIDString(i);
    const mL = markers.find((marker: Marker) => {
      return marker.markerID ===tempID;
    });
    if (!mL) {
      noList.push(tempID);
    }
  }
  return noList;
}


// マーカー追加（除去フラグを見つけた場合、リストア）
const addMarker = (newMarker: Marker, markers: Marker[]) => {
  const objList: Marker[] = [];
  let restore = false;
  for (const marker of markers) {
    if (marker.uniqueID === newMarker.uniqueID && marker.type === newMarker.type) {
      // 復活 unitは前のものが使用される
      if(marker.delete) {
        restore = true;
        const m2 = { ...marker };
        m2.delete = false;
        objList.push(m2);
      } else {
        // ダブりなのでプッシュしない
        continue;
      }
    } else {
      objList.push(marker);
    }
  }
  if (!restore) {
    // const nM = { ...newMarker };
    objList.push(newMarker);
  }
  return objList;
}

// マーカー削除（リストから削除せず、フラグで一時対処（既存のもののみ）。コメントを消さないため？）
const removeMarkerFromUniqueID = (uniqueID: string, type: string, markers: Marker[]) => {
  const objList: Marker[] = [];
  for (const marker of markers) {
    if (marker.uniqueID === uniqueID && marker.type === type) {
      if(marker.isNew) {
        // 新規追加を削除する分にはそのまま削除
        continue;
      } else {
        const m2 = { ...marker };
        m2.delete = true;
        objList.push(m2);
      }
    } else {
      objList.push(marker);
    }
  }
  // objList = markers.filter((marker: Marker) => {
  //   if (marker.objID === objID && marker.type === type) {
  //     return false;
  //   }
  //   return true;
  // })
  return objList;
}

// マーカのカウント（削除フラグ付きのものは数えない)
const countMarkers = (markers: Marker[]) => {
  const list = markers.filter((marker: Marker) => {
    return !marker.delete;
  })
  return list.length;
}

const findSnapMarkerFromObjID = (objID: string, type: string, markers: SnapMarker[]) => {
  const objList = markers.filter((marker: SnapMarker) => {
    if (marker.objID === objID && marker.type === type) {
      return true;
    }
    return false;
  });
  if (objList.length > 0) {
    return objList[0];
  } else {
    return null;
  }
};

const separateTangibleMarkerWithType = (tMarkers: TangibleMarker[]) => {
  const bldgMarkers: TangibleMarker[] = [];
  const frnMarkers: TangibleMarker[] = [];
  const specialMarkers: TangibleMarker[] = [];
  const otherMarkers: TangibleMarker[] = [];
  for (const m of tMarkers) {
    if (m.type === MarkerType.Building) {
      bldgMarkers.push(m);
    } else if (m.type === MarkerType.Furniture) {
      frnMarkers.push(m);
    } else if (m.type === MarkerType.Special) {
      specialMarkers.push(m);
    } else {
      otherMarkers.push(m);
    }
  }
  return { bldgs: bldgMarkers, frns: frnMarkers, specials: specialMarkers, others: otherMarkers };
}

export const MarkerUtils = {
  createMarkerFromFirestoreDoc,
  createMarkerFromBuilding,
  createMarkerFromFrn,
  createMarkerFromSpecialFrn,
  createFirestoreDocFromMarker,
  findMarkerFromUniqueID,
  findMarkersFromObjID,
  findMarkersFromObjIDIncludeDelete,
  countMarkers,
  addMarker,
  removeMarkerFromUniqueID,
  getNextMarkerID,
}

export const TangibleMarkerUtils = {
  createFirestoreDocFromSnapMarker,
  createFirestoreDocFromTangibleMarker,
  createTangibleMarkerFromFirestoreDoc,
  findSnapMarkerFromObjID,
  createTangibleMarker,
  separateTangibleMarkerWithType,
}