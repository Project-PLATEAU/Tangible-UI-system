import * as THREE from "three";
import { SphMercProjection } from "./utils/sphmerc-projection";

class WrapController {
  constructor(wrapname) {
    this.wrap = new THREE.Group();
    this.wrap.name = wrapname;
    this.items = [];
    this._proj = new SphMercProjection();
    this.latScale = 1.0;
  }

  setNewItems(newItems) {
    this.items = newItems;
  }

  createMesh(item) {
  }

  findMesh(name) {
    return this.wrap.children.find((item) => item.name === name);
  }

  findItem(gmlID) {
    return this.items.find((item) => item.gmlID === gmlID);
  }

  setVisibility(visible) {
    const self = this;
    this.items.forEach((item) => {
      const obj = self.findMesh(item.gmlID);
      if(obj) {
        if(visible) {
          obj.visible = true;
        } else {
          obj.visible = false;
        }
      }
    })
  }

  touchableMeshes() {
    return this.wrap.children.filter((item) => {
      return item.visible;
    });
  }

  lonLatToWorldCoords(lon, lat) {
    const projectedPos = this._proj.project(lon, lat);
    return [projectedPos[0], -projectedPos[1]];
  }

  // ３D座標の１ポイントは１ｍではない。緯度によって１ポイントごとの実距離は変化する。
  // したがって、メートル値を直接代入（高さなど）する場合はスケーリングする必要がある
  setLatScaleCoefficient(lat) {
    if (Math.abs(lat) === 90) {
      this.latScale = 1 / Math.cos(89 * Math.PI / 180);
    } else {
      this.latScale = 1 / Math.cos(lat * Math.PI / 180);
    }
  }

  releaseMesh(mesh) {
    if(mesh.material) {
      if(mesh.material.map) {
        mesh.material.map.dispose()
        mesh.material.map = null
      }
      mesh.material.dispose()
      mesh.material = null
    }
    if(mesh.geometry) {
      mesh.geometry.dispose()
      mesh.geometry = null
    }
  }

  removeMesh(name) {
    const mesh = this.findMesh(name);
    if (mesh) {
      this.wrap.remove(mesh);
      this.releaseMesh(mesh);
      return true;
    }
    return false;
  } 

  removeAllMesh() {
    const namelist = this.wrap.children.map((mesh) => {
      return mesh.name;
    });
    let counter = 0;
    const n = this.wrap.name;
    const l = this.wrap.children.length;
    for (const name of namelist) {
      if(this.removeMesh(name)) {
        counter ++;
      }
    }
    console.log("remove " + n + ", start: " + l + ", removed:" + counter + ", rediue " + this.wrap.children.length);
  }

  releaseAll() {
    this.removeAllMesh();
    this.items = [];
  }
}

export { WrapController };