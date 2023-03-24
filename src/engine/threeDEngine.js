import * as THREE from "three";
/*import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  renderer,
  container,
} from "./utilityFunctions.js";
*/
let _3D = {};
let container;

function init3DSetup() {
  container = document.createElement("div");
  document.body.appendChild(container);

  _3D.scene = new THREE.Scene();

  initCameras();

  // add light
  var light = new THREE.PointLight(0xffffff, 10000);
  light.position.set(50, 50, 50);
  _3D.scene.add(light);

  //
  createStarScape();
  addLogo();

  //
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  container.appendChild(renderer.domElement);

  renderer.autoClear = false;
  //
  stats = new Stats();
  container.appendChild(stats.dom);

  window.addEventListener("resize", onWindowResize);
  onWindowResize();
}

function initCameras() {
  _3D.mainCamera = new THREE.PerspectiveCamera(45, 1 * aspect, 1, 1300);

  _3D.mainCameraHelper = new THREE.CameraHelper(_3D.mainCamera);
  _3D.scene.add(_3D.mainCameraHelper);

  _3D.activeCamera = _3D.mainCamera;
  console.log("_3D.activeCamera", _3D.activeCamera);
  _3D.activeCameraHelper = _3D.mainCameraHelper;

  _3D.backstageCamera = new THREE.PerspectiveCamera(1500, 1 * aspect, 0, 10000);
  _3D.backstageCameraHelper = new THREE.CameraHelper(_3D.backstageCamera);

  // counteract different front orientation of mainCameras vs rig
  _3D.mainCamera.rotation.y = -Math.PI;
  //mainCamera.rotation.x = Math.PI * 2;
  //mainCamera.rotation.z = Math.PI;
  _3D.mainCamera.updateProjectionMatrix();
  _3D.mainCameraRig = new THREE.Group();
  _3D.mainCameraRig.add(_3D.mainCamera);

  _3D.focalPoint = new THREE.Mesh(
    new THREE.BoxGeometry(10, 50, 70, 2, 5, 5),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );
  _3D.focalPoint.position.z = -700;
  _3D.focalPoint.visible = false;
  _3D.scene.add(_3D.focalPoint);

  _3D.mainCameraRig.lookAt(_3D.focalPoint.position);
  _3D.mainCameraRig.position.z += 300;
  _3D.mainCameraRig.position.y += 50;

  _3D.scene.add(_3D.mainCameraRig);
  _3D.scene.add(_3D.backstageCamera);

  console.log("_3D.mainCamera.position", _3D.mainCamera.position);
  console.log("_3D.backstageCamera.position", _3D.backstageCamera.position);
}

export { _3D, container, init3DSetup, initCameras };
