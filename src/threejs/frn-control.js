// import * as THREE from "three";
import { WrapController } from "./meshwrap-control";

class FrnController extends WrapController{
  constructor(wrapname) {
    super(wrapname);
  };

  // gmlIDはfrnIDとmarkerIDを繋げたもの
  setNewItems(newItems, loader) {
    const self = this;
    this.items.forEach((item) => {
      const obj = newItems.find((nItem) => nItem.gmlID === item.gmlID);
      if(!obj) {
        self.removeMesh(item.gmlID);
      }
    });
    newItems.forEach((nItem) => {
      const obj = self.findMesh(nItem.gmlID);
      if(!obj) {
        self.createMesh(nItem, loader);
      }
    });
    this.items = newItems;
    // if (newItems.length === 0) {
    //   this.removeAllMesh();
    // }
    this.updatePosition();
  }

  updatePosition() {
    const self = this;
    this.items.forEach((item) => {
      self.updateItemPosition(item);
    });
  }
  
  updateItemPosition(item) {
    const mesh = this.findMesh(item.gmlID);
    if (mesh) {
      const mPos = item.position;
      if (!mesh || !mPos) {
        return;
      }
      const cW = this.lonLatToWorldCoords(mPos.center.lng, mPos.center.lat);
      mesh.position.x = cW[0];
      mesh.position.y = 0;
      mesh.position.z = cW[1];
      mesh.rotation.y = mPos.rotation;
    }
  }


  setVisibility(visible) {
    const self = this;
    this.items.forEach((item) => {
      const obj = self.findMesh(item.gmlID);
      if(obj) {
        obj.visible = visible;
      }
    });
  }

  createMesh(item, loader) {
    const fname = item.objUrl;
    const fbxMesh = loader.get3D(fname);
    if (fbxMesh) {
      fbxMesh.name = item.gmlID;
      fbxMesh.visible = false;
      this.wrap.add(fbxMesh);
      return true;
    }
    return false;
  }

  loadCheck(loader) {
    const self = this;
    self.items.forEach((item) => {
      const obj = self.findMesh(item.gmlID);
      if(!obj) {
        if (self.createMesh(item, loader)) {
          self.updateItemPosition(item);
        }
      }
    });
  }

  transfromPosition(center, positionList) {
    const self = this;
    const cW = this.lonLatToWorldCoords(center.longitude, center.latitude);
    const pLW = positionList.map(position => {
      const wP = self.lonLatToWorldCoords(position.longitude, position.latitude);
      return [wP[0] - cW[0], wP[1] - cW[1]];
    })

    return {
      center: cW,
      footprint: pLW,
    };
  }
}

export { FrnController };