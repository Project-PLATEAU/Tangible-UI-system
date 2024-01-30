import * as THREE from "three";
import { WrapController } from "./meshwrap-control";

class BuildingController extends WrapController{
  constructor(wrapname) {
    super(wrapname);
    this.type = "normal";
    this.isMarker = false;
  }

  setMode(type, isMarker) {
    this.type = type;
    this.isMarker = isMarker;
  }

  setNewItems(newItems) {
    const self = this;
    this.items.forEach((item) => {
      const obj = newItems.find((nItem) => nItem.gmlID === item.gmlID);
      if(!obj) {
        self.removeMesh(item.gmlID)
      }
    })
    newItems.forEach((nItem) => {
      const obj = self.findMesh(nItem.gmlID);
      if(!obj) {
        self.createMesh(nItem);
      }
    })
    this.items = newItems;
    this.updatePosition();
  }

  updatePosition() {
    const self = this;
    if(this.isMarker) {
      this.items.forEach((item) => {
        self.updateItemPosition(item);
      })
    }
  }

  updateItemPosition(item) {
    const mesh = this.findMesh(item.gmlID);
    const mPos = item.position;
    if (!mesh || !mPos) {
      return;
    }
    const cW = this.lonLatToWorldCoords(mPos.center.lng, mPos.center.lat);
    mesh.position.x = cW[0];
    mesh.position.y = 0;
    mesh.position.z = cW[1];
    mesh.rotation.y = mPos.rotation;
    // mesh.rotation.z = mPos.rotation;

  }

  createMesh(item) {
    let c = 0xcc9911;
    let alpha = 0.3;
    if (this.type === "marked1") {
      c = 0xccaa11;
      alpha = 0.05;
    } else if (this.type === "marked2") {
      c = 0x88cc33;
      alpha = 0.5;
    }
    let material = new THREE.MeshToonMaterial({color: c, opacity: alpha, transparent: true});
    const shape = new THREE.Shape();
    const worldPosition = this.transfromPosition(item.center, item.footprint);
    worldPosition.footprint.forEach((pW, index) => {
      if(index === 0) {
        shape.moveTo(pW[0], -pW[1])
      } else {
        shape.lineTo(pW[0], -pW[1])
      }
    });
    const extrudeSettings = {
        steps: 1,
        depth: item.height * this.latScale,
        bevelEnabled: false
    }
    const extrudeGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    extrudeGeom.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(extrudeGeom, material);
    mesh.name = item.gmlID;
    mesh.position.x = worldPosition.center[0];
    // mesh.position.y = item.center.altitude;
    mesh.position.y = 0;
    mesh.position.z = worldPosition.center[1];
    mesh.visible = false;
    this.wrap.add(mesh);
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

export { BuildingController };