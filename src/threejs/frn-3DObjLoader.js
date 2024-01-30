import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { STLLoader } from "three/examples/jsm/loaders/FBXLoader";
import { TGALoader } from "three/addons/loaders/TGALoader.js";

class Frn3DObjLoader {
  constructor() {
    const manager = new THREE.LoadingManager();
    manager.addHandler(/\.tga$/i, new TGALoader() );
    this.fbxLoader = new FBXLoader(manager);
    this.gltfLoader = new GLTFLoader();
    this.isLoading = false;
    this.queneList = [];
    this.objList = [];
    this._eventHandlers = {};
    this.checkList = [
      "Bench.fbx", "Hikawamaru.fbx", "Objects.fbx",
      "YamashitaPark_Cafe.fbx", "YamashitaPark_WaterTower.fbx", "Hikawamaru.fbx",
      "Objects.fbx", "YamashitaPark_Cafe.fbx", "YamashitaPark_WaterTower.fbx", /*"BayBike03.fbx",*/
      "Ashiyu.fbx", "SlowMobility_big_p3.fbx", "SlowMobility_small_p2.fbx",
      "StreetPerformer01.fbx", "StreetPerformer02.fbx",
      "family.fbx", "human_and_dog.fbx", "human_pair.fbx",
      "Tree_Max01.fbx", "Tree_Max02.fbx", "Tree_Max03.fbx",
      "stagnation01.fbx","stagnationWide01.fbx", "LightHouse_White.fbx",
      "Row_Short01.fbx", "row_Stay01.fbx", 
      "People_on_the_lawn_with_dog.fbx", "People_on_the_lawn_3person.fbx",
    ];
    this.checkList2 = [
      "SlowMobility_big.fbx", "SlowMobility_small.fbx", "LightHouse_Red.fbx",
      "Wooddeck_With_People01.fbx", "Wooddeck_With_People02.fbx", 
    ];
    this.latScale = 1.0;
  }

  // ３D座標の１ポイントは１ｍではない。緯度によって１ポイントごとの実距離は変化する。
  // オブジェクトのロード時にそれをスケーリングする必要がある
  setLatScaleCoefficient(lat) {
    if (Math.abs(lat) === 90) {
      this.latScale = 1 / Math.cos(89 * Math.PI / 180);
    } else {
      this.latScale = 1 / Math.cos(lat * Math.PI / 180);
    }
    console.log(this.latScale);
  }

  on(eventName, eventHandler) {
    this._eventHandlers[eventName] = eventHandler;
  }

  addQuene(filename) {
    if (!this.has3D(filename)) {
      if (!this.queneList.find(name => name === filename)) {
        this.queneList.push(filename);
      }
    }
    this.startQuene();
  }

  async startQuene () {
    if (this.isLoading) {
      return;
    }
    if (this.queneList.length === 0) {
      return;
    }
    const filename = this.queneList[0];
    if (!filename) {
      return;
    }
    this.isLoading = true;
    try {
      await this.runQuene(filename);
    } catch (e) {
      console.log(e);
    }
    if (this.isLoading) {
      this.queneList.shift();
      this.isLoading = false;
      if (this.has3D(filename)) {
        const mesh = this.get3D(filename);
        if (this._eventHandlers["load"]) {
          this._eventHandlers["load"]({
            file: filename,
            mesh: mesh
          });
        }
      }
      this.startQuene();
    }
  }

  async runQuene(filename) {
    console.log("run quene")
    this.consoleFileName(filename);

    const scFile = filename.toLowerCase();
    let group = undefined;
    if (scFile.indexOf(".fbx") > -1) {
      group = await this.loadFbx(filename);
    } else if (scFile.indexOf(".glb") > -1 || scFile.indexOf(".gltf") > -1) {
      console.log("gltf!!!!");
      group = await this.loadGltf(filename);
    }
    if (!group) {
      console.log('download error')
      return;
    }
    if (this.isLoading) {
      this.objList.push({
        file: filename,
        mesh: group,
      });
    }
    return;
  }

  async loadFbx (filename) {
    try {
      const group = await this.fbxLoader.loadAsync(filename);
      if (!group) {
        return undefined;
      }
      if (this.checkList.find(s => filename.indexOf(s) > 0)) {
        group.scale.set(0.01 * this.latScale, 0.01 * this.latScale, 0.01 * this.latScale);
      } else if (this.checkList2.find(s => filename.indexOf(s) > 0)) {
        group.scale.set(0.0001 * this.latScale, 0.0001 * this.latScale, 0.0001 * this.latScale);
      } else {
        group.scale.set(1 * this.latScale, 1 * this.latScale, 1 * this.latScale)
      }
      // if (filename.indexOf("SlowMobility_big.fbx") > 0 || filename.indexOf("SlowMobility_small.fbx") > 0) {
      //   group.scale.set(0.0001 * this.latScale, 0.0001 * this.latScale, 0.0001 * this.latScale);
      // }
      group.traverse((child)=>{
        //影を落とすメッシュに対して、Shadowプロパティーを有効
        if(child.isMesh){
            child.castShadow = false;
            child.receiveShadow = false;
        }
      });
      // console.log(group);
      // return group;
      const gwrap = new THREE.Group();
      gwrap.add(group);
      gwrap.userData = {type: 'fbx'};
      return gwrap;
    } catch (e) {
      console.log(e);
    }
    return undefined;
  };

  async loadGltf (filename) {
    this.consoleFileName(filename);
    try {
      const group = await this.gltfLoader.loadAsync(filename);
      if (!group) {
        return undefined;
      }
      if (this.checkList.find(s => filename.indexOf(s) > 0)) {
        group.scene.scale.set(0.01 * this.latScale, 0.01 * this.latScale, 0.01 * this.latScale);
      } else {
        group.scene.scale.set(1 * this.latScale, 1 * this.latScale, 1 * this.latScale)
      }
      console.log(group);
      return group.scene;
      // const gwrap = new THREE.Group();
      // gwrap.add(s1);
      // gwrap.userData = {type: 'gltf'};
      // return gwrap;
      // s1.rotation.set(-1.571, 0, 0);
      // s1.scale.set(0.01, 0.01, 0.01)
    } catch (e) {
      console.log(e);
    }
    return undefined;

  };

  consoleFileName (filename) {
    const fa1 = filename.split("/");
    const f1 = fa1[fa1.length - 1];
    const fa2 = f1.split("?");
    const f2 = fa2[0];
    console.log(f2);
  }

  stop() {
    if (this.isLoading) {
      this.isLoading = false;
      this.queneList = [];
      this._eventHandlers = {};
    }
  }

  has3D(filename) {
    const obj = this.objList.find(o => o.file === filename);
    if (obj) {
      return true;
    }
    return false;
  }

  get3D(filename) {
    const obj = this.objList.find(o => o.file === filename);
    if (obj) {
      if (this._eventHandlers[filename]) {
        this._eventHandlers[filename](obj.mesh.clone());
        this._eventHandlers[filename] = undefined;
      }
      return obj.mesh.clone();
    } else {
      this.addQuene(filename);
    }
    return undefined;
  }

  releaseAll() {
    const self = this;
    for (const obj of this.objList) {
      const g = obj.mesh;
      g.traverse((child)=>{
        //影を落とすメッシュに対して、Shadowプロパティーを有効
        if(child.isMesh){
          self.releaseMesh(child);
        }
        if (child.isGroup) {
          self.releaseGroup(child);
        }
      });
      this.releaseMesh(g);
    }
    this.objList = [];
  }

  releaseGroup(group) {
    const self = this;
    group.traverse((child) => {
      if(child.isMesh){
        self.releaseMesh(child);
      }
      // if (child.isGroup) {
      //   self.releaseGroup(child);
      // }
    })
  }

  releaseMesh(mesh) {
    if(mesh.material) {
      if(mesh.material.map) {
        if (mesh.material.map.dispose) {
          mesh.material.map.dispose()
        }
        mesh.material.map = null
      }
      if (mesh.material.dispose) {
        mesh.material.dispose()
      }
      mesh.material = null
    }
    if(mesh.geometry) {
      mesh.geometry.dispose()
      mesh.geometry = null
    }
  }
}

export { Frn3DObjLoader };