import * as THREE from "three";
import { WrapController } from "./meshwrap-control";

class TranController extends WrapController{
  constructor(wrapname) {
    super(wrapname);
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
  }

  createMesh(item) {
    let material = new THREE.MeshToonMaterial({color: 0x999999, opacity: 0.3, transparent: true});
    const shape = new THREE.Shape();
    const worldPosition = this.transfromPosition(item.center, item.footprint);
    worldPosition.footprint.forEach((pW, index) => {
      if(index === 0) {
        shape.moveTo(pW[0], -pW[1])
      } else {
        shape.lineTo(pW[0], -pW[1])
      }
    });
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geometry, material);
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

export { TranController };