import * as THREE from "three";
import { WrapController } from "./meshwrap-control";
import brassStr from "../images/ground/Brass.jpg";
import grassStr from "../images/ground/turf.jpg";
import woodStr from "../images/ground/Wood_Color_01.jpg";

class AreaPlaneController extends WrapController{
  constructor(wrapname) {
    super(wrapname);
    this.loader = new THREE.TextureLoader();
    this.mapTexture = null;
    this.unityTexture = null;
    this.tMode = 0;
    this.textures = {
      normal: this.createTextures(brassStr),
      grass: this.createTextures(grassStr),
      wood: this.createTextures(woodStr),
    };
  }

  createTextures(name) {
    const t = this.loader.load(name);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.offset.set(0, 0);
    t.repeat.set(10, 10);
    return t;
  }

  // length == 1 only
  setNewItems(newItems) {
    const self = this;
    this.items.forEach((item) => {
      self.removeMesh(item.gmlID)
    });
    newItems.forEach((nItem) => {
      self.loadTexture(nItem);
      //self.createMesh(nItem);
    });
    this.items = newItems;
  }

  setTextureMode(mode, forceFlag) {
    const flag = mode !== this.tMode;
    this.tMode = mode;
    if (flag || forceFlag) {
      const self = this;
      const material = this.createMaterial();
      this.items.forEach((item) => {
        const obj = self.findMesh(item.gmlID);
        if(obj) {
          obj.material = material;
        }
      })
    }
  }

  loadTexture(item) {
    const self = this;
    if (item.url) {
      this.loader.load(item.url, (texture) => {
        self.mapTexture = texture;
        self.createMesh(item);
        self.loadTexture2(item);
      });
    }
  }

  loadTexture2(item) {
    const self = this;
    if (item.unityUrl) {
      this.loader.load(item.unityUrl, (texture2) => {
        self.unityTexture = texture2;
        self.setTextureMode(self.tMode, true);
      });
    }
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

  createMaterial() {
    let material = null;
    if (this.tMode === 0) {
      material = new THREE.MeshBasicMaterial({
        map: this.mapTexture,
        transparent: true,
        side: THREE.FrontSide
      })
    } else if (this.tMode === 1) {
      // material = new THREE.MeshBasicMaterial({color: 0x999999 , side: THREE.DoubleSide});
      material = new THREE.MeshBasicMaterial({
        map: this.textures.normal,
        transparent: false,
        side: THREE.FrontSide
      })
    } else if (this.tMode === 2) {
      material = new THREE.MeshBasicMaterial({
        map: this.textures.grass,
        transparent: false,
        side: THREE.FrontSide
      })
    } else if (this.tMode === 3) {
      material = new THREE.MeshBasicMaterial({
        map: this.textures.wood,
        transparent: false,
        side: THREE.FrontSide
      })
    } else if (this.tMode === 4) {
      if (this.unityTexture) {
        material = new THREE.MeshBasicMaterial({
          map: this.unityTexture,
          transparent: true,
          side: THREE.FrontSide
        })
      } else {
        material = new THREE.MeshBasicMaterial({color: 0x999999});
      }
    } else {
      material = new THREE.MeshBasicMaterial({color: 0x999999});
    }
    return material;
  }

  createMesh(item) {
    const wNE = this.lonLatToWorldCoords(item.NE.lng, item.NE.lat);
    const wSW = this.lonLatToWorldCoords(item.SW.lng, item.SW.lat);
    const w = wNE[0] - wSW[0];
    const h = wSW[1] - wNE[1];
    const r = 1;
    const geometry = new THREE.PlaneGeometry(w * r, h * r);
    geometry.rotateX(- Math.PI / 2);
    const material = this.createMaterial();
    const mesh = new THREE.Mesh(geometry, material);

    const wC = this.lonLatToWorldCoords(item.center.lng, item.center.lat);
    mesh.position.x = wC[0];
    mesh.position.y = 0;
    mesh.position.z = wC[1];
    mesh.name = item.gmlID;
    this.wrap.add(mesh);
  }

  getCenter() {
    if (this.items.length > 0) {
      const item = this.items[0];
      const wC = this.lonLatToWorldCoords(item.center.lng, item.center.lat);
      return {
        x: wC[0], y: 0, z: wC[1]
      };
    } else {
      return {
        x: 0, y: 0, z: 0
      };
    }
  }

  releaseMesh(mesh) {
    super.releaseMesh(mesh);
    this.releaseTexture(this.mapTexture);
    this.releaseTexture(this.unityTexture);
    this.releaseTexture(this.textures.normal);
    this.releaseTexture(this.textures.grass);
    this.releaseTexture(this.textures.wood);
  }

  releaseTexture(texture) {
    if (texture && texture.dispose) {
      texture.dispose();
    }
    texture = null;
  }
}

export { AreaPlaneController };