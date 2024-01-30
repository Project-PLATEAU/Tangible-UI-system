import * as THREE from "three";
// import { Math as MathUtils } from "three";
import { CameraController } from "./camera-control";
import { BuildingController } from "./building-control";
import { TranController } from "./tran-control";
// import { DemController } from "./dem-control";
import { FrnController } from "./frn-control";
import { Frn3DObjLoader } from "./frn-3DObjLoader";
import { AreaPlaneController } from "./areaplane-control";


class VRController {
  constructor(divId) {
    console.log('VRC constructor ' + divId);
    const root = document.getElementById(divId);

    this.frameID = -1;
    this._eventHandlers = {};
    this.stopped = false;
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
    });
    this.renderer.setClearColor(0xffffff, 1.0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(root.clientWidth, root.clientHeight);
    
    root.appendChild(this.renderer.domElement);

    // カメラコントローラー。
    this.cameraC = new CameraController(this.scene, new THREE.PerspectiveCamera(75, root.clientWidth / root.clientHeight, 0.1, 50000), this.renderer.domElement);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 3.0); // 光源色と光強度を指定して生成
    directionalLight.position.set(0, 10000, -1); // 光源位置を設定
    this.scene.add(directionalLight);
    const light = new THREE.HemisphereLight(0xFFFFFF, 0x666666, 3.0);
    this.scene.add(light);
    // const axes = new THREE.AxesHelper();
    // this.scene.add(axes);

    this.position = { lat: 0, lng: 0 };
    this.areaSet = {};
    this.frn3DLoader = new Frn3DObjLoader();

    // this.demC = new DemController("dem_c");
    // this.scene.add(this.demC.wrap);

    this.tranC = new TranController("tran_c");
    this.scene.add(this.tranC.wrap);

    this.queneList = [];
    this.requestFbxCheck = false;

    const dir = new THREE.Vector3( 0, 0, -1);
    dir.normalize()
    this.arrow = new THREE.ArrowHelper(dir, new THREE.Vector3( 0, 0, 0 ), 15, 0xFF0000, 3, 3);
    this.scene.add(this.arrow);

    this.lod1visiblity = true;
  }

  setUp(areas, center) {

    const self = this;
    this.cameraC.setupTouchEvent();
    this.cameraC.on("pan", (eventType) => {
      // if(eventType === 'panright') {
      //   self.cameraC.rotateCameraY(THREE.MathUtils.degToRad(0.5));
      // } else if(eventType === 'panleft') {
      //   self.cameraC.rotateCameraY(-THREE.MathUtils.degToRad(0.5));
      // } else if(eventType === 'panup') {
      //   self.cameraC.rotateCameraX(THREE.MathUtils.degToRad(0.5));
      // } else if(eventType === 'pandown') {
      //   self.cameraC.rotateCameraX(-THREE.MathUtils.degToRad(0.5));
      // }
    })

    this.cameraC.on("pinch", (eventType) => {
      if(eventType === 'pinchin') {
      } else if(eventType === 'pinchout') {
      }
    })

    // オブジェクトのクリックイベント（カメラのフォーカス）
    this.cameraC.on("tap", (pointer) => {
      // ファニチャー系マーカーの検出
      // Fbxだとオブジェクト全体はグループなのでイベント検出は面になってしまうのでparentからポジションを検出
      const resultsM = self.cameraC.checkRayCast(self.getRaycastFbxTargets());
      if (resultsM.intersects && resultsM.intersects.length > 0) {
        // const parent = resultsM.intersects[0].object.parent;
        console.log(resultsM.intersects[0].object)
        const pos = self.findFbxGroupPosition(resultsM.intersects[0].object);
        // console.log(pos)
        if (pos) {
          self.cameraC.updateOrbitTarget(pos);
        }
        return;
      }
      const resultsB = self.cameraC.checkRayCast(self.getRaycastBldgTargets());
      if (resultsB.intersects && resultsB.intersects.length > 0) {
        self.cameraC.updateOrbitTarget(resultsB.intersects[0].object.position);
        return;
      }
      console.log('no intersects');
      self.cameraC.retainOrbitTarget();
    })

    this.cameraC.on("pan-end", (type) => {
      // if (self._eventHandlers["offsetupdate"]) {
      //   self._eventHandlers["offsetupdate"]()
      // }
      // console.log(this.cameraC.camera.position);
    })

    this.cameraC.on("pinch-end", (type) => {
      // if (self._eventHandlers["offsetupdate"]) {
      //   self._eventHandlers["offsetupdate"]()
      // }
    })

    this.initCameraPosition(center, 1.6);

    for (const area of areas) {
      const aCN = new AreaPlaneController("area_" + area.id);
      aCN.setLatScaleCoefficient(center.lat);
      const bCN = new BuildingController("building_n_" + area.id);
      bCN.setMode("normal", false);
      const bCM = new BuildingController("building_m_" + area.id);
      bCM.setMode("marked1", false);
      const markerC1 = new BuildingController("marker_c1_" + area.id);
      markerC1.setMode("marked2", true);
      const markerC2 = new FrnController("frn_" + area.id);
      this.scene.add(aCN.wrap);
      this.scene.add(bCN.wrap);
      this.scene.add(bCM.wrap);
      this.scene.add(markerC1.wrap);
      this.scene.add(markerC2.wrap);
      const oneSet = {
        bldg1: bCN, bldg2: bCM, markerB: markerC1, markerF: markerC2, area: aCN,
      };
      this.areaSet[area.id] = oneSet;
    }

    this.frn3DLoader.setLatScaleCoefficient(center.lat);
    this.frn3DLoader.on("load", (obj) => {
      console.log("frn3DLoader load finished");
      self.requestFbxCheck = true;
    });
  }

  checkFbxControllers() {
    const areaIDs = Object.keys(this.areaSet);
    for (const id of areaIDs) {
      const oneSet = this.areaSet[id];
      oneSet.markerF.loadCheck(this.frn3DLoader);
    }
    this.resetVisibility();
  }

  findFbxGroupPosition(fbxObj) {
    if(!fbxObj || !fbxObj.parent) {
      return undefined;
    }
    let parent = fbxObj.parent;
    let position = undefined;
    while (parent) {
      const ud = parent.userData;
      if (ud.type && ud.type === "fbx") {
        position = parent.position;
        break;
      }
      parent = parent.parent;
    }
    return position;
  }

  start() {
    if (this.stopped === false) {
      this.startRendering();
      console.log('rendering starded.');
    } else {
      console.log('rendering not starded because stopped flag is true');
    }
  }

  stop() {
    this.stopped = true;
    this.requestFbxCheck = false;
    this._eventHandlers = {};
    this.removeAllQuene();
    this.stopRendering();
    this.frn3DLoader.stop();

    this.frn3DLoader.releaseAll();

    const ids = Object.keys(this.areaSet);
    for (const id of ids) {
      const oneSet = this.areaSet[id];
      oneSet.bldg1.releaseAll();
      oneSet.bldg2.releaseAll();
      oneSet.markerB.releaseAll();
      oneSet.markerF.releaseAll();
      oneSet.area.releaseAll();
    }

    // this.demC.releaseAll();
    this.tranC.releaseAll();
    this.cameraC.releaseAll();

    const namelist = this.scene.children.map((mesh) => {
      return mesh.name;
    });
    let counter = 0;
    for (const name of namelist) {
      const mesh = this.scene.children.find((item) => item.name === name);
      if(mesh) {
        this.scene.remove(mesh);
        counter ++;
      }
    }
    // console.log("remove root, removed:" + counter + ", rediue " + this.scene.children.length);

    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.renderer.domElement = null;
  }


  startRendering() {
    this.frameID = requestAnimationFrame(this.render.bind(this))
    this.renderingcounter = 0
    this.stopped = false
  }

  stopRendering() {
    if(window.cancelAnimationFrame) {
      cancelAnimationFrame(this.frameID);
    } else {
       console.log('not exist cancelanimationframe');
    }
  }

  render(timestamp) {
    if(this.stopped) {
        return
    }
    if (this.requestFbxCheck) {
      this.checkFbxControllers();
      this.requestFbxCheck = false;
    }
    // this.resizeUpdate();
    this.runQuene();
    this.cameraC.renderUpdate();
    this.renderer.render(this.scene, this.cameraC.camera);
    requestAnimationFrame(this.render.bind(this));
  }

  resizeUpdate() {
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth, height = canvas.clientHeight;
    const pr = window.devicePixelRatio
    if(width * pr != canvas.width || height * pr != canvas.height) {
      console.log('reisizeUp')
      console.log('w:' + width + ', ' + canvas.width + ', h:' + height + ' ,' + canvas.height)
      this.renderer.setSize(width, height);
      this.cameraC.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.cameraC.camera.updateProjectionMatrix();
    }
  }

  // initCameraPosition(key) {
  //   let c = center["00"];
  //   if(center[key]){
  //     c = center[key];
  //   }
  //   this.cameraC.moveCameraLatLng(c.lat, c.lng);
  //   this.position = c;
  // }
  
  initCameraPosition(c, height) {
    this.cameraC.moveCameraLatLng(c.lat, c.lng);
    this.cameraC.moveCameraHeight(height);
    this.cameraC.initTarget();
    this.position = c;
  }

  resetVisibility() {
    const ids = Object.keys(this.areaSet);
    for (const id of ids) {
      const oneSet = this.areaSet[id];
      oneSet.bldg1.setVisibility(this.lod1visiblity);
      oneSet.bldg2.setVisibility(this.lod1visiblity);
      oneSet.markerB.setVisibility(true);
      oneSet.markerF.setVisibility(true);
      oneSet.area.setVisibility(true);
    }
    // this.demC.setVisibility(true);
    this.tranC.setVisibility(true);
  }

  getRaycastBldgTargets() {
    if(this.stopped) {
      return
    }
    let touchableMeshes = [];
    const ids = Object.keys(this.areaSet);
    for (const id of ids) {
      const oneSet = this.areaSet[id];
      touchableMeshes = touchableMeshes.concat(oneSet.bldg1.touchableMeshes());
    }
    return touchableMeshes;
  }

  getRaycastFbxTargets() {
    if(this.stopped) {
      return
    }
    let touchableMeshes = [];
    const ids = Object.keys(this.areaSet);
    for (const id of ids) {
      const oneSet = this.areaSet[id];
      touchableMeshes = touchableMeshes.concat(oneSet.markerF.touchableMeshes());
    }
    return touchableMeshes;
  }


  getCameraParameters() {
    const cPosition = this.cameraC.getCameraLatLng();
    const target = this.cameraC.getTargetLatLng();
    return {
      position: cPosition,
      target: target,
    };
  }

  setCameraParameters(camera) {
    this.cameraC.updateCameraPositionAndTarget(camera);
  }

  setFocusArea(id) {
    console.log("arrowPosition " + id)
    if (this.areaSet && this.areaSet[id]) {
      const oneSet = this.areaSet[id]
      const p = oneSet.area.getCenter();
      this.arrow.position.x = p.x;
      this.arrow.position.y = 30;
      this.arrow.position.z = p.z;
    }
  }

  setGroundMode(mode) {
    const ids = Object.keys(this.areaSet);
    for (const id of ids) {
      const oneSet = this.areaSet[id];
      if (oneSet && oneSet.area) {
        oneSet.area.setTextureMode(mode, false);
      }
    }
  }

  setVrStatus(status) {
    this.addQuene("VrStatus", [status], "");
  }

  addQuene(jobName, list, areID) {
    console.log("addQuene " + jobName + ", " + areID)
    const quene = { job: jobName, areID:areID, dataList: list, status: 0 }
    this.queneList.push(quene)
  }

  runQuene() {
    if(this.queneList.length > 0) {
      const quene = this.queneList[0]
      if (quene.status === 0) {
          quene.status = 1
          console.log("start quene:" + quene.job + ", " + quene.dataList.length + ", " + quene.areID)
          if (!this.stopped) { 
            if(quene.job === "update_building") {
              for (let i = 0; i < quene.dataList.length; i ++) {
                const setObj = quene.dataList[i];
                const oneSet = this.areaSet[setObj.areaID];
                if (oneSet) {
                  oneSet.bldg1.setNewItems(setObj.n);
                  oneSet.bldg2.setNewItems(setObj.m);
                  oneSet.area.setNewItems(setObj.a);
                } 
              }
              // this.buildingC.setNewItems(quene.dataList);
            }
            if(quene.job === "update_markers") {
              // console.log(quene.dataList);
              for (const dataSet of quene.dataList) {
                const oneSet = this.areaSet[dataSet.areaID];
                if (oneSet) {
                  oneSet.markerB.setNewItems(dataSet.bldgs);
                  oneSet.markerF.setNewItems(dataSet.frns, this.frn3DLoader);
                  // oneSet.bldg2.setNewItems(setObj.m);
                } 
              }
            }
            if(quene.job === "update_tran") {
              this.tranC.setNewItems(quene.dataList);
            }
            if(quene.job === "VrStatus") {
              const status = quene.dataList[0];
              this.setFocusArea(status.focus);
              this.setGroundMode(status.ground);
              this.lod1visiblity = status.lod1;
            }
            // if(quene.job === "update_dem") {
            //   this.demC.setDem(quene.dataList);
            //   this.demC.createDemShape2();
            // }
            this.resetVisibility();
          }
          this.queneList.shift();
      } else {
          console.log('running quene:' + quene.job + ', ' + quene.status )
      }
    }
  }

  removeAllQuene() {
    if(this.queneList.length > 0) {
      if(this.queneList.length > 1) {
        this.queneList.length = 1;
      }
      const quene = this.queneList[0];
      if(quene.status === 0) {
        this.queneList.shift();
      }
    }
  }
}

export { VRController };