import * as THREE from "three";
import { WrapController } from "./meshwrap-control";

class DemController extends WrapController{
  constructor(wrapname) {
    super(wrapname);
    this.demId = "";
    this.center = {};
    this.worldC = [];
  }

  setDem(demData) {
    this.demId = demData.gmlID;
    this.center = demData.center;
    this.worldC = this.lonLatToWorldCoords(this.center.lon, this.center.lat);
    this.items = demData.triangles;
    console.log('demId ' + this.demId);
    console.log(this.center);
    console.log(this.items.length);
  }

  setNewItems(newItems) {
    this.items = newItems;
  }

  createDemShape2() {
    console.log('createDemShape ' + this.items.length);
    let j = 0;
    for (const item of this.items) {
      let material = new THREE.MeshBasicMaterial({color: 0x666666, opacity: 0.7, transparent: true});
      const shape = new THREE.Shape();  
      const worldPosition = this.transfromTriangle(item.triangle);
      console.log(worldPosition);
      shape.moveTo(worldPosition[0][0], -worldPosition[0][1])
      shape.lineTo(worldPosition[1][0], -worldPosition[1][1])
      shape.lineTo(worldPosition[2][0], -worldPosition[2][1])
      shape.lineTo(worldPosition[0][0], -worldPosition[0][1])
      const geometry = new THREE.ShapeGeometry(shape);
      geometry.rotateX(-Math.PI / 2);
      const pL2 = geometry.attributes.position.array;
      pL2[1] = item.triangle[0].alt;
      pL2[3 + 1] = item.triangle[1].alt;
      pL2[6 + 1] = item.triangle[2].alt;
      geometry.computeBoundingBox();
      geometry.computeVertexNormals();
      geometry.attributes.position.needsUpdate = true;
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = this.worldC[0];
      mesh.position.y = this.center.alt;
      mesh.position.z = this.worldC[1];
      mesh.name = item.id;
      this.wrap.add(mesh);
      // j ++;
      // if (j == 20000) {
      //   break;
      // }
    }
  }


  createDemShape() {
    console.log('createDemShape ' + this.items.length);
    let material = new THREE.MeshBasicMaterial({color: 0x666666, opacity: 0.7, transparent: true});
    const shape = new THREE.Shape();
    let j = 0;
    for (const item of this.items) {
      const worldPosition = this.transfromTriangle(item.triangle);
      console.log(worldPosition);
      shape.moveTo(worldPosition[0][0], -worldPosition[0][1])
      shape.lineTo(worldPosition[1][0], -worldPosition[1][1])
      shape.lineTo(worldPosition[2][0], -worldPosition[2][1])
      shape.lineTo(worldPosition[0][0], -worldPosition[0][1])
      j ++;
      if (j == 200) {
        break;
      }
    }
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    const pL2 = geometry.attributes.position.array;
    for (let i = 0; i < this.items.length; i ++) {
      const item = this.items[0];
      pL2[(i * 3 + 0) * 3 + 1] = item.triangle[0].alt;
      pL2[(i * 3 + 1) * 3 + 1] = item.triangle[1].alt;
      pL2[(i * 3 + 2) * 3 + 1] = item.triangle[2].alt;
      if (i == 200) {
        break;
      }
    }
    geometry.computeBoundingBox();
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = this.worldC[0];
    mesh.position.y = this.center.alt;
    mesh.position.z = this.worldC[1];
    mesh.name = this.gmlID;
    this.wrap.add(mesh);
  }

  transfromTriangle(positionList) {
    const self = this;
    const pLW = positionList.map(position => {
      const wP = self.lonLatToWorldCoords(position.lon, position.lat);
      return [wP[0] - self.worldC[0], wP[1] - self.worldC[1]];
    })
    return pLW;
  }
}

export { DemController };