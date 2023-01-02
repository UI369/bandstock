import * as THREE from "three";
import { Tween, Easing, update } from "@tweenjs/tween.js";
import * as Stats from "stats.js";
import { timer } from "/src/util/timer.js";
import { scriptRunner } from "/src/util/scriptRunner.js";

import { assign, createMachine, interpret, send, spawn } from "xstate";
import { EventEmitter } from "/src/util/event_emitter.ts";
import { BlockMaker } from "/src/data/blocks.js";
import * as ETHERS from "ethers";
import Web3 from "web3";

import { Auth } from "/src/util/auth.js";
import { Machines } from "/src/util/machines.js";

let auth = new Auth();
let machines;

window.auth = auth;
let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;
let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

let _3D = {};

let container, stats, focalPoint;
let renderer;

let emit = new EventEmitter();
let blockMaker = new BlockMaker();

let blockServices = [];
let blockMachines = [];
let blockService, mainCameraService, boardService;

let currentTile;
let clock = new THREE.Clock();
let clockDelta = 0;
// 30 fps
let framerate = 1 / 30;
let tiles = [];
let theta = 0;
let delta = 0.1;

let requestAccounts = [];

let web3 = new Web3(Web3.givenProvider);

let textures = {
  magenta3: "/src/assets/magenta3.png",
  teal6: "/src/assets/teal6.png",
  purple9: "/src/assets/purple9.png",
};

// allow mousepick
let raycaster, INTERSECTED;

const frustumSize = 600;

function init() {
  init3DSetup();
  initGameSystem();
  initGUI();
}

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

function initGameSystem() {
  console.log("initGameSystem");

  addMouseHandlers();
  //initBlockMachines();
  initServices();

  window.blockServices = blockServices;
  window.mainCameraService = mainCameraService;
  window.boardService = boardService;

  window.addEventListener("keydown", onKeyDown);
}

function initGUI() {
  auth.requestAccounts();

  document.getElementById("next").addEventListener("click", () => {
    boardService.send({ type: "PRESENT_NEXT" });
  });

  document.getElementById("prev").addEventListener("click", () => {
    boardService.send({ type: "PRESENT_PREV" });
  });

  document.getElementById("claim").addEventListener("click", async () => {
    boardService.send({ type: "CLAIM" });
    auth.doUnlockTransaction();
  });
}

const initServices = () => {
  machines = new Machines(_3D);
  mainCameraService = interpret(machines.createCameraMachine(), {
    devTools: true,
  }).start();

  boardService = interpret(
    machines.createBoardMachine("board1", 0, 0, 0, blockMaker),
    {
      devTools: true,
    }
  ).start();
};

/*********************/
/* UTILITY FUNCTIONS */
/*********************/
function addMouseHandlers() {
  let clickMouse = new THREE.Vector2();
  let moveMouse = new THREE.Vector2();

  document.addEventListener("pointermove", (event) => {
    moveMouse.x = (event.clientX / SCREEN_WIDTH) * 2 - 1;
    moveMouse.y = -(event.clientY / SCREEN_HEIGHT) * 2 + 1;

    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(moveMouse, _3D.activeCamera);
    let intersects = raycaster.intersectObjects(tiles, true);

    if (intersects.length > 0) {
      //found intersections
      if (!currentTile) {
        //no current tile? use hovered object.
        currentTile = intersects[0].object;
        emit.emit(currentTile.userData.name + ".hover");
      } else if (currentTile && intersects[0] != currentTile) {
        //current tile? replace it with hovered object if different.
        emit.emit(currentTile.userData.name + ".unhover");
        currentTile = intersects[0].object;
        emit.emit(currentTile.userData.name + ".hover");
      }
    } else {
      // nothing hovered?
      emit.emit(currentTile?.userData.name + ".unhover");
      currentTile = null;
    }
  });
}

function onWindowResize() {
  var bounding_rect = window.visualViewport;
  //Removing the -20 will fix the offset issue, but adds scrollbars. TODO: Why?
  SCREEN_WIDTH = bounding_rect.width - 20;
  SCREEN_HEIGHT = bounding_rect.height - 20;
  //SCREEN_WIDTH = window.innerWidth;
  //SCREEN_HEIGHT = window.innerHeight;
  aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

  _3D.activeCamera.aspect = 1 * aspect;
  _3D.activeCamera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  update();
  clockDelta += clock.getDelta();

  if (clockDelta > framerate) {
    // The draw or time dependent code are here
    render();

    clockDelta = clockDelta % framerate;
  }

  stats.update();
}

function render() {
  const r = Date.now() * 0.0005;

  //Wibble wobble camera thing
  //theta += delta;
  /*activeCamera.position.x = 50 * Math.sin(THREE.MathUtils.degToRad(theta));
  activeCamera.position.y = 50 * Math.sin(THREE.MathUtils.degToRad(theta));
  activeCamera.position.z = 50 * Math.sin(THREE.MathUtils.degToRad(theta));
  activeCamera.lookAt(focalPoint.position);
  if (theta > 5) {
    delta = -delta;
  }*/

  theta += delta;
  //_3D.logoBlock.rotation.z = Math.sin(THREE.MathUtils.degToRad(theta));
  _3D.logoBlock.rotation.y = Math.sin(THREE.MathUtils.degToRad(theta)) / 18;
  //activeCamera.rotation.x = Math.sin(THREE.MathUtils.degToRad(theta));
  //activeCamera.rotation.z = activeCamera.rotation.z + 0.01;

  //render from current activeCamera
  renderer.clear();
  renderer.setViewport(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  renderer.render(_3D.scene, _3D.activeCamera);
}

function createStarScape() {
  //
  const geometry = new THREE.BufferGeometry();
  const vertices = [];

  for (let i = 0; i < 5000; i++) {
    vertices.push(THREE.MathUtils.randFloatSpread(2000)); // x
    vertices.push(THREE.MathUtils.randFloatSpread(2000)); // y
    vertices.push(THREE.MathUtils.randFloatSpread(2000)); // z
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  const particles = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0x888888 })
  );
  _3D.scene.add(particles);
}

function addLogo() {
  const textureLoader = new THREE.TextureLoader();
  const material = new THREE.MeshBasicMaterial({
    map: textureLoader.load("/src/assets/bandstock_logo.png"),
  });

  _3D.logoBlock = new THREE.Mesh(
    new THREE.BoxGeometry(500, 100, 10, 2, 2, 2),
    material
  );

  _3D.logoBlock.position.y = 350;
  _3D.logoBlock.position.z = -650;
  _3D.scene.add(_3D.logoBlock);
}
//https://tweenjs.github.io/tween.js/examples/03_graphs.html
_3D.transform = function transform(object, target, duration) {
  let distance = object.position.distanceTo(target.position);

  new Tween(object.position)
    .to(
      { x: target.position.x, y: target.position.y, z: target.position.z },
      duration
    )
    .easing(Easing.Exponential.Out)
    .start();

  new Tween(object.rotation)
    .to(
      { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z },
      duration
    )
    .easing(Easing.Linear.None)
    .start();

  new Tween(this)
    .to({}, duration * 2)
    .onUpdate(render)
    .start();
};

function onKeyDown(event) {
  switch (event.keyCode) {
    case 80 /*P*/:
      console.log("go_perspective");
      mainCameraService.send({ type: "GO_PERSPECTIVE" });
      break;
    case 76 /*L*/:
      console.log("go_live");
      mainCameraService.send({ type: "GO_LIVE" });
      break;
    case 75 /*K*/:
      console.log("go_backstage");
      mainCameraService.send({ type: "GO_BACKSTAGE" });
      break;
    case 79 /*O*/:
      console.log("sending SWAP");
      blockService.send({ type: "SWAP" });
      break;
    case 70 /*F*/:
      console.log("sending SWAP");
      blockService.send({ type: "SWAP" });
      break;
    case 78 /*N*/:
      console.log("sending PRESENT");
      boardService.send({ type: "PRESENT_NEXT" });
      break;
    case 66 /*B*/:
      console.log("sending PRESENT");
      boardService.send({ type: "PRESENT_PREV" });
      break;
    case 67 /*C*/:
      console.log("sending CLAIM_CURRENT");
      boardService.send({ type: "CLAIM_CURRENT" });
      break;
    case 82 /*R*/:
      console.log("Sending DO_RIPPLE");
      doCycle();
      break;
    case 83 /*S*/:
      console.log("Sending DO_RIPPLE");
      doRipple();
      break;
  }
}

function doCycle() {
  let script = blockMaker.getCycleScript();
  //blockMaker.boardService.send({ type: "DO_RIPPLE" });
  let workFunc = (element) => {
    boardService.send({ type: "PRESENT_INDEX", index: element.index });
  };
  script.forEach((element) => {
    setTimeout(workFunc, element.offset, element);
  });
}

function doTimer(services, doLog, label) {
  let interval = 400;

  let t1 = new timer(
    () => {
      services.map((s) => {
        s.send("SWAP");
      });
    },
    interval,
    (now, expected, drift, interval) => {
      console.log("now", now);
      // console.log("drift", drift);
      // console.log("expected", expected);
      // console.log("interval", interval);
    },
    doLog,

    (logLabel, now, expected, drift, interval, lastInterval) => {
      if (drift > 20) {
        console.log("logLabel", logLabel);
        // console.log("now", now / 1000);
        // console.log("expected", expected);
        // console.log("drift", drift);
        // console.log("lastInterval", lastInterval);
      }
    },
    label
  );

  t1.start();
}

function updateCamera() {
  _3D.mainCamera.updateProjectionMatrix();
}

class MinMaxGUIHelper {
  constructor(obj, minProp, maxProp, minDif) {
    this.obj = obj;
    this.minProp = minProp;
    this.maxProp = maxProp;
    this.minDif = minDif;
  }
  get min() {
    return this.obj[this.minProp];
  }
  set min(v) {
    this.obj[this.minProp] = v;
    this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
  }
  get max() {
    return this.obj[this.maxProp];
  }
  set max(v) {
    this.obj[this.maxProp] = v;
    this.min = this.min; // this will call the min setter
  }
}

//Start the show
init();
animate();
