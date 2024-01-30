import { Raycaster, Vector2, Vector3 } from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { SphMercProjection } from "./utils/sphmerc-projection";
import Hammer from '@egjs/hammerjs'

class CameraController {
  constructor(scene, camera, canvas, options = {}) {
    this._scene = scene;
    this.camera = camera;
    this._canvas = canvas;
    this._proj = new SphMercProjection();
    this._eventHandlers = {};
    this._raycaster = new Raycaster();


    this.pointer = new Vector2();
    this.lastPointer = new Vector2();
    this.xyPoint = {
      x: 0, y: 0
    };
    this.counter = 0;

    this.initialPosition = null;
    this.initialPositionAsOrigin = options.initialPositionAsOrigin || false;
    this._scene.add(this.camera);

    this._orbitControll = new OrbitControls(this.camera, this._canvas);
    // this.camera.lookAt(this._scene.position);
    this._hammer = new Hammer(this._canvas);
    this._hammer.get('pinch').set({enable: true});
    this._hammer.get('pan').set({direction: Hammer.DIRECTION_ALL});

    this.latScale = 1.0;
  }

  on(eventName, eventHandler) {
    this._eventHandlers[eventName] = eventHandler;
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

  setupTouchEvent() {
    const self = this;

    this._hammer.on('tap', e => {
      // console.log('tap')
      // console.log(e)
      self.handlePointerMove(e)
      if (self._eventHandlers["tap"]) {
        self._eventHandlers["tap"](self.pointer);
      }
    })
    this._hammer.on('pinchstart', e => {
      // console.log('pinchstart')
      self.counter = 0
    })
    this._hammer.on('pinchend', e => {
      // console.log('pinchend')
      self.counter = 0
      if (self._eventHandlers["pinch-end"]) {
        self._eventHandlers["pinch-end"]("pinch-end");
      }
    })
    this._hammer.on('pinch', e => {
      // console.log('pinch')
      self.handlePointerMove(e)
      self.counter = (self.counter + 1) % 5
      if(self.counter === 0) {
        if (self._eventHandlers["pinch"]) {
          self._eventHandlers["pinch"](e.additionalEvent);
        }
      }
    })

    this._hammer.on('panmove', e => {
      // console.log('pan')
      self.handlePointerMove(e)
      // self.counter = (self.counter + 1) % 2
      if(self.counter === 0) {
        if (self._eventHandlers["pan"]) {
          self._eventHandlers["pan"](e.additionalEvent);
        }
      }
    })

    this._hammer.on('panend', e => {
      // console.log('panend')
      if (self._eventHandlers["pan-end"]) {
        self._eventHandlers["pan-end"]("pan-end");
      }
    })
  }

  // hammerjsのイベントの座標処理
  handlePointerMove(e) {
    this.lastPointer.x = this.pointer.x;
    this.lastPointer.y = this.pointer.y;

    const element = e.target;
    const rect = element.getBoundingClientRect();

    // canvas要素上のXY座標
    const x = e.center.x - rect.left;
    const y = e.center.y - rect.top;

    // canvas要素の幅・高さ
    const w = element.offsetWidth;
    const h = element.offsetHeight;

    // -1〜+1の範囲で現在のマウス座標を登録する
    this.pointer.x = ( x / w ) * 2 - 1;
    this.pointer.y = -( y / h ) * 2 + 1;
    this.xyPoint.x = x;
    this.xyPoint.y = y;
  }

  checkRayCast(targets) {
    if(targets.length === 0) {
      return {
        intersects: [],
      };
    }
    this._raycaster.setFromCamera(this.pointer, this.camera)
    // その光線とぶつかったオブジェクトを得る
    const intersects = this._raycaster.intersectObjects(targets);
    // ぶつかったオブジェクトに対してなんかする
    return {
      intersects: intersects,
      pointer: this.pointer,
      xy: this.xyPoint,
    };
  }

  rotateCameraY(deg) {
    this.camera.rotation.y = this.camera.rotation.y + deg;
  }

  rotateCameraX(deg) {
    this.camera.rotation.x = this.camera.rotation.x + deg;
  }

  initTarget() {
    this.updateOrbitTarget(new Vector3(this.camera.position.x - 100, this.camera.position.y,this.camera.position.z - 100));
  }

  renderUpdate() {
    this._orbitControll.update();
  }

  updateOrbitTarget(position) {
    console.log('updateTarget');
    const newTarget = new Vector3(position.x, position.y, position.z);
    this._orbitControll.target = newTarget;
    this._orbitControll.update();
  }

  retainOrbitTarget() {
    this.updateOrbitTarget(this._orbitControll.target);
  }

  copyOrbitTargetPosition() {
    return new Vector3(this._orbitControll.target.x, this._orbitControll.target.y, this._orbitControll.target.z);
  }

  updateCameraPositionAndTarget(params) {
    const position = params.position;
    const target = params.target;

    const world1 = this.lonLatToWorldCoords(position.lng, position.lat);
    this.camera.position.x = world1[0];
    this.camera.position.z = world1[1];
    const height = position.alt ? position.alt : 1.6;
    this.camera.position.y = height * this.latScale;
    this.camera.lookAt(this.camera.position);

    const world2 = this.lonLatToWorldCoords(target.lng, target.lat);
    const tPos = { x: world2[0], y: target.alt, z: world2[1] };
    this.updateOrbitTarget(tPos);
  }

  moveCameraLatLng(lat, lng) {
    const worldCoords = this.lonLatToWorldCoords(lng, lat);
    this.camera.position.x = worldCoords[0];
    this.camera.position.z = worldCoords[1];
    this.camera.position.y = 1.6 * this.latScale;
    this.camera.lookAt(this.camera.position);
  }

  moveCameraHeight(height) {
    this.camera.position.y = height * this.latScale;
  }

  getCameraLatLng() {
    const lat = this._proj.sphMercToLat(- this.camera.position.z);
    const lng = this._proj.sphMercToLon(this.camera.position.x);
    return {
      lat: lat,
      lng: lng,
      alt: Number(this.camera.position.y / this.latScale),
    };
  }

  getTargetLatLng() {
    const pos = this.copyOrbitTargetPosition();
    const lat = this._proj.sphMercToLat(- pos.z);
    const lng = this._proj.sphMercToLon(pos.x);
    return {
      lat: lat,
      lng: lng,
      alt: pos.y * this.latScale,
    };
  }

  setWorldOrigin(lon, lat) {
    this.initialPosition = this._proj.project(lon, lat);
  }

  lonLatToWorldCoords(lon, lat) {
    const projectedPos = this._proj.project(lon, lat);
    if (this.initialPositionAsOrigin) {
      if (this.initialPosition) {
        projectedPos[0] -= this.initialPosition[0];
        projectedPos[1] -= this.initialPosition[1];
      } else {
        throw "Trying to use 'initial position as origin' mode with no initial position determined";
      }
    }
    return [projectedPos[0], -projectedPos[1]];
  }

  releaseAll() {
    this._orbitControll.dispose();
    if (this.camera) {
      this._scene.remove(this.camera);
      if(this.camera.dispose) {
        this.camera.dispose();
      }
    }
    this._eventHandlers = {};
    this._scene = null;
    this._raycaster = null;
    this._canvas = null;
    this._hammer.destroy();
  }
}
export { CameraController };