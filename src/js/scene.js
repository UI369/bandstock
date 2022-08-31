import * as THREE from "three";
import * as Stats from "stats.js";
import { timer } from "./timer.js";
import { assign, createMachine, interpret } from "xstate";
import { inspect } from "@xstate/inspect";
import { Vector4 } from "three";
import { EventEmitter } from "./event_emitter.ts";

let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;
let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

let emit = new EventEmitter();
let container, stats, mesh;
let blockServices = [];
let blockService, cameraService;
let camera, scene, renderer;
let cameraRig, activeCamera, activeHelper;
let cameraPerspective, cameraOrtho;
let cameraPerspectiveHelper, cameraOrthoHelper;
let currentTile;
let clock = new THREE.Clock();
let clockDelta = 0;
// 30 fps
let framerate = 1 / 30;
let tiles = [];
let theta = 0;
let delta = 0.1;

// allow mousepick
let raycaster, INTERSECTED;

const frustumSize = 600;

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(80, 5 * aspect, 0.1, 2500);
  camera.position.z = 2500;
  cameraPerspective = new THREE.PerspectiveCamera(50, 1 * aspect, 150, 1500);
  cameraPerspectiveHelper = new THREE.CameraHelper(cameraPerspective);

  //camera visualizer - LineSegments
  scene.add(cameraPerspectiveHelper);

  //
  cameraOrtho = new THREE.OrthographicCamera();
  setOrthoFOV();

  //the camera visualizer - LineSegments
  cameraOrthoHelper = new THREE.CameraHelper(cameraOrtho);
  scene.add(cameraOrthoHelper);

  //
  activeCamera = cameraPerspective;
  activeHelper = cameraPerspectiveHelper;

  // counteract different front orientation of cameras vs rig
  cameraOrtho.rotation.y = Math.PI;
  cameraPerspective.rotation.y = Math.PI;

  cameraRig = new THREE.Group();
  cameraRig.add(cameraPerspective);
  cameraRig.add(cameraOrtho);
  scene.add(cameraRig);

  // add light
  var light = new THREE.PointLight(0xffffff, 10000);
  light.position.set(50, 50, 50);
  scene.add(light);

  //
  mesh = new THREE.Mesh(
    new THREE.BoxGeometry(10, 50, 70, 2, 5, 5),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );
  mesh.position.x = 800; // * Math.cos(r);
  mesh.visible = false;
  scene.add(mesh);

  createStarScape();

  //
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  container.appendChild(renderer.domElement);

  renderer.autoClear = false;

  //find intersections
  // allow mousepick
  addMouseHandlers();
  //
  stats = new Stats();
  container.appendChild(stats.dom);

  //
  window.addEventListener("resize", onWindowResize);
  document.addEventListener("keydown", onKeyDown);
  onWindowResize();
  createGameSystem();
}

function addMouseHandlers() {
  clickMouse = new THREE.Vector2();
  moveMouse = new THREE.Vector2();

  document.addEventListener("pointermove", (event) => {
    let vp = new Vector4();
    renderer.getCurrentViewport(vp);

    moveMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    moveMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(moveMouse, activeCamera);
    intersects = raycaster.intersectObjects(tiles, true);
    if (intersects.length > 0) {
      console.log(intersects);
      if (!currentTile) {
        currentTile = intersects[0].object;
        console.log("object:", intersects[0].object);
        emit.emit(currentTile.userData.name + ".hover");
      } else if (currentTile && intersects[0] != currentTile) {
        emit.emit(currentTile.userData.name + ".unhover");
        currentTile = intersects[0].object;
        emit.emit(currentTile.userData.name + ".hover");
      }
    } else {
      emit.emit(currentTile?.userData.name + ".unhover");
      currentTile = null;
    }
  });
}

function onWindowResize() {
  var bounding_rect = window.visualViewport;
  SCREEN_WIDTH = bounding_rect.width - 25;
  SCREEN_HEIGHT = bounding_rect.height - 25;
  //SCREEN_WIDTH = window.innerWidth;
  //SCREEN_HEIGHT = window.innerHeight;
  aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

  camera.aspect = 1 * aspect;
  camera.updateProjectionMatrix();

  cameraPerspective.aspect = 1 * aspect;
  cameraPerspective.updateProjectionMatrix();

  setOrthoFOV();
}

function setOrthoFOV() {
  cameraOrtho.left = (-1 * frustumSize * aspect) / 8;
  cameraOrtho.right = (1 * frustumSize * aspect) / 8;
  cameraOrtho.top = frustumSize / 8;
  cameraOrtho.bottom = -frustumSize / 8;
  cameraOrtho.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  clockDelta += clock.getDelta();

  if (clockDelta > framerate) {
    // The draw or time dependent code are here
    render();

    clockDelta = clockDelta % framerate;
  }

  stats.update();
}

function render() {
  //const r = Date.now() * 0.0005;

  theta += delta;
  activeCamera.position.x = 50 * Math.sin(THREE.MathUtils.degToRad(theta));
  activeCamera.position.y = 50 * Math.sin(THREE.MathUtils.degToRad(theta));
  activeCamera.position.z = 50 * Math.sin(THREE.MathUtils.degToRad(theta));
  activeCamera.lookAt(mesh.position);
  if (theta > 5) {
    delta = -delta;
  }

  cameraRig.lookAt(mesh.position);

  //render from current activeCamera
  renderer.clear();
  renderer.setViewport(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  renderer.render(scene, activeCamera);
}

function createStarScape() {
  //
  const geometry = new THREE.BufferGeometry();
  const vertices = [];

  for (let i = 0; i < 50000; i++) {
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
  scene.add(particles);
}

function transform(object, target, duration) {
  new TWEEN.Tween(object.position)
    .to(
      { x: target.position.x, y: target.position.y, z: target.position.z },
      duration
    )
    .easing(TWEEN.Easing.Exponential.InOut)
    .start();

  new TWEEN.Tween(object.rotation)
    .to(
      { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z },
      duration
    )
    .easing(TWEEN.Easing.Exponential.InOut)
    .start();

  new TWEEN.Tween(this)
    .to({}, duration * 2)
    .onUpdate(render)
    .start();
}

function onKeyDown(event) {
  switch (event.keyCode) {
    case 79 /*O*/:
      console.log("go_ortho");
      cameraService.send({ type: "GO_ORTHO" });
      break;
    case 80 /*P*/:
      console.log("go_perspective");
      cameraService.send({ type: "GO_PERSPECTIVE" });
      break;
    case 76 /*L*/:
      console.log("go_live");
      cameraService.send({ type: "GO_LIVE" });
      break;
    case 59 /*;*/:
      console.log("go_backstage");
      cameraService.send({ type: "GO_BACKSTAGE" });
      break;
    case 78 /*N*/:
      console.log("sending GO_NEAR");
      blockService.send({ type: "GO_NEAR" });
      break;
    case 70 /*F*/:
      console.log("sending GO_FAR");
      blockService.send({ type: "GO_FAR" });
      break;
  }
}

const createBlockMachine = (nameIn, xIn, yIn, zIn) => {
  return createMachine(
    {
      id: "block_machine." + nameIn,
      predictableActionArguments: true,
      context: {
        x: xIn,
        y: yIn,
        z: zIn,
        speed: 200,
        block: undefined,
        name: nameIn,
        count: 0,
      },
      initial: "ready",
      states: {
        ready: {
          entry: ["ready_assign", "ready_init"],
          on: {
            SWAP: {
              target: "near",
            },
          },
        },
        far: {
          entry: ["far_action"],
          on: {
            SWAP: {
              target: "near",
            },
          },
          invoke: [],
        },
        near: {
          entry: ["near_action"],
          on: {
            SWAP: {
              target: "far",
            },
          },
          invoke: [],
        },
        right: {
          entry: ["right_action"],
          on: {
            SWAP: {
              target: "left",
            },
          },
          invoke: [],
        },
        left: {
          entry: ["left_action"],
          on: {
            SWAP: {
              target: "near",
            },
          },
          invoke: [],
        },
      },
    },
    {
      actions: {
        ready_init: (ctx, event) => {
          ctx.block.position.x = ctx.x;
          ctx.block.position.y = ctx.y;
          ctx.block.position.z = ctx.z;
          ctx.block.userData.blockService = ctx.blockService;
          ctx.block.userData.name = ctx.name;
          scene.add(ctx.block);
        },
        ready_assign: assign({
          block: () => {
            const textureLoader = new THREE.TextureLoader();
            const texture = textureLoader.load("assets/blacktile.png");
            const material = new THREE.MeshBasicMaterial({ map: texture });

            let block = new THREE.Mesh(
              new THREE.BoxGeometry(50, 50, 50, 5, 5, 5),
              material
            );
            block.userData.type = "tile";
            tiles.push(block);
            return block;
          },
        }),
        near_action: (ctx, event) => {
          ctx.x -= 80;

          let object = new THREE.Object3D();
          object.position.x = ctx.x;
          object.position.y = ctx.y;
          object.position.z = ctx.z;
          transform(ctx.block, object, ctx.speed);
        },
        far_action: (ctx, event) => {
          ctx.x += 80;

          const object = new THREE.Object3D();
          object.position.x = ctx.x;
          object.position.y = ctx.y;
          object.position.z = ctx.z;
          transform(ctx.block, object, ctx.speed);
        },
        right_action: (ctx, event) => {
          const object = new THREE.Object3D();
          object.position.x = ctx.x;
          object.position.y = ctx.y;
          object.position.z = ctx.z;
          transform(ctx.block, object, ctx.speed);
        },
        left_action: (ctx, event) => {
          const object = new THREE.Object3D();
          object.position.x = ctx.x;
          object.position.y = ctx.y;
          object.position.z = ctx.z;
          transform(ctx.block, object, ctx.speed);
        },
        right_assign: assign({
          y: (ctx, event) => {
            return ctx.y + 5;
          },
        }),
        left_assign: assign({
          y: (ctx, event) => {
            return ctx.y - 5;
          },
        }),
      },
    }
  );
};

function createGameSystem() {
  inspect({
    iframe: false,
    url: "https://stately.ai/viz?inspect",
  });
  let blockMachines = [];

  let ySet = [-50, 0, 50];
  let k = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      blockMachines[k] = createBlockMachine("tile" + k, 800, ySet[j], ySet[i]);
      k++;
    }
  }

  let cameraMachine = createMachine(
    {
      id: "camera_machine",
      initial: "live",
      states: {
        live: {
          entry: "live_action",
          initial: "perspective",
          on: {
            GO_BACKSTAGE: {
              target: "backstage",
            },
          },
          states: {
            perspective: {
              entry: "perspective_action",
              on: {
                GO_ORTHO: {
                  target: "ortho",
                },
              },
            },
            ortho: {
              entry: "ortho_action",
              on: {
                GO_PERSPECTIVE: {
                  target: "perspective",
                },
              },
            },
          },
        },
        backstage: {
          entry: "backstage_action",
          on: {
            GO_LIVE: {
              target: "live",
            },
          },
        },
      },
    },
    {
      actions: {
        ortho_action: (context, event) => {
          console.log("ortho");
          cameraOrtho.far = 1300;
          cameraOrtho.updateProjectionMatrix();

          cameraOrthoHelper.update();

          activeCamera = cameraOrtho;
          activeHelper = cameraOrthoHelper;
        },
        perspective_action: (context, event) => {
          console.log("perspective");

          cameraPerspective.fov = 15; //Math.sin(0.5);
          cameraPerspective.far = 1300;
          cameraPerspective.updateProjectionMatrix();

          cameraPerspectiveHelper.update();

          activeCamera = cameraPerspective;
          activeHelper = cameraPerspectiveHelper;
        },
        live_action: (context, event) => {
          cameraOrtho.visible = false;
          cameraOrthoHelper.visible = false;
          cameraPerspectiveHelper.visible = false;
          cameraOrthoHelper.visible = false;
        },
        backstage_action: (context, event) => {
          console.log("backstage");
          activeHelper.visible = true;
          activeCamera = camera;
        },
      },
    }
  );

  for (let i = 0; i < 9; i++) {
    blockServices[i] = interpret(blockMachines[i], { devTools: true }).start();
    blockMachines[i].config.context = {
      ...blockMachines[i].config.context,
      blockService: blockServices[i],
    };

    emit.subscribe("tile" + i + ".hover", () => {
      blockServices[i].send("SWAP");
    });
    emit.subscribe("tile" + i + ".unhover", () => {
      blockServices[i].send("SWAP");
    });
  }

  cameraService = interpret(cameraMachine, { devTools: true }).start();
  window.cameraService = cameraService;
}

function doTimer(services, doLog, label) {
  interval = 400;

  let t1 = new timer(
    () => {
      services.map((s) => {
        s.send("SWAP");
      });
    },
    interval,
    (now, expected, drift, interval) => {
      // console.log("now", now);
      // console.log("drift", drift);
      // console.log("expected", expected);
      // console.log("interval", interval);
    },
    doLog,

    (logLabel, now, expected, drift, interval, lastInterval) => {
      if (drift > 20) {
        // console.log("logLabel", logLabel);
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

init();
animate();
