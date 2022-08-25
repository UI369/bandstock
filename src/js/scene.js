import * as THREE from "three";
import * as Stats from "stats.js";
import { timer } from "./timer.js";
import { assign, createMachine, interpret } from "xstate";
import { inspect } from "@xstate/inspect";

let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;
let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

let container, stats;
let mesh;
let material;
let blockService, blockService2, cameraService;
let camera, scene, renderer;
let cameraRig, activeCamera, activeHelper;
let cameraPerspective, cameraOrtho;
let cameraPerspectiveHelper, cameraOrthoHelper;

const frustumSize = 600;

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(80, 5 * aspect, 0.1, 2500);
  camera.position.z = 2500;
  cameraPerspective = new THREE.PerspectiveCamera(50, 0.5 * aspect, 150, 1000);
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

  var light = new THREE.PointLight(0xffffff, 10000);

  //Give it a better x,y,z position
  light.position.set(50, 50, 50);

  //Add it to the scene
  scene.add(light);

  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("assets/crate.gif");
  material = new THREE.MeshBasicMaterial({ map: texture });

  //
  mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 50, 70, 2, 5, 5), material);
  mesh.position.x = 400; // * Math.cos(r);
  mesh.visible = false;
  scene.add(mesh);

  createStarScape();

  //
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  container.appendChild(renderer.domElement);

  renderer.autoClear = false;

  //
  stats = new Stats();
  container.appendChild(stats.dom);

  //
  window.addEventListener("resize", onWindowResize);
  document.addEventListener("keydown", onKeyDown);
  onWindowResize();
  createGameSystem();
}

function onWindowResize() {
  var bounding_rect = window.visualViewport;
  SCREEN_WIDTH = bounding_rect.width - 25;
  SCREEN_HEIGHT = bounding_rect.height - 25;
  //SCREEN_WIDTH = window.innerWidth;
  //SCREEN_HEIGHT = window.innerHeight;
  aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

  camera.aspect = 0.5 * aspect;
  camera.updateProjectionMatrix();

  cameraPerspective.aspect = 0.5 * aspect;
  cameraPerspective.updateProjectionMatrix();

  setOrthoFOV();
}

function setOrthoFOV() {
  cameraOrtho.left = (-0.5 * frustumSize * aspect) / 8;
  cameraOrtho.right = (0.5 * frustumSize * aspect) / 8;
  cameraOrtho.top = frustumSize / 8;
  cameraOrtho.bottom = -frustumSize / 8;
  cameraOrtho.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);

  TWEEN.update();
  render();
  stats.update();
}

function render() {
  //const r = Date.now() * 0.0005;

  mesh.position.z = 0;
  mesh.position.y = 0;

  if (activeCamera === cameraPerspective) {
    cameraPerspective.fov = 15; //Math.sin(0.5);
    cameraPerspective.far = 1300;
    cameraPerspective.updateProjectionMatrix();

    cameraPerspectiveHelper.update();
    cameraPerspectiveHelper.visible = true;

    cameraOrthoHelper.visible = false;
  } else {
    cameraOrtho.far = 1300;
    cameraOrtho.updateProjectionMatrix();

    cameraOrthoHelper.update();
    cameraOrthoHelper.visible = true;

    cameraPerspectiveHelper.visible = false;
  }

  cameraRig.lookAt(mesh.position);

  renderer.clear();

  activeHelper.visible = false;

  renderer.setViewport(0, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT);
  renderer.render(scene, activeCamera);

  activeHelper.visible = true;

  renderer.setViewport(SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT);
  renderer.render(scene, camera);
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
      Math.random() * duration + duration
    )
    .easing(TWEEN.Easing.Exponential.InOut)
    .start();

  new TWEEN.Tween(object.rotation)
    .to(
      { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z },
      Math.random() * duration + duration
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
      cameraService.send({ type: "GO_ORTHO" });
      break;
    case 80 /*P*/:
      cameraService.send({ type: "GO_PERSPECTIVE" });
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

const createBlockMachine = (xIn, yIn, zIn) => {
  return createMachine(
    {
      id: "block_machine",
      predictableActionArguments: true,
      context: { x: xIn, y: yIn, z: zIn, block: undefined, count: 0 },
      initial: "ready",
      states: {
        ready: {
          entry: ["ready_assign", "ready_init"],
          on: {
            GO_NEAR: {
              target: "near",
            },
          },
          after: {
            // after 1 second, transition to yellow
            1000: { target: "near" },
          },
        },
        far: {
          entry: ["far_assign", "far_action"],
          on: {
            SWAP: {
              target: "right",
            },
          },
          invoke: [],
        },
        near: {
          entry: ["near_assign", "near_action"],
          on: {
            SWAP: {
              target: "far",
            },
          },
          invoke: [],
        },
        right: {
          entry: ["right_assign", "right_action"],
          on: {
            SWAP: {
              target: "left",
            },
          },
          invoke: [],
        },
        left: {
          entry: ["left_assign", "left_action"],
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
          scene.add(ctx.block);
        },
        ready_assign: assign({
          block: () => {
            const textureLoader = new THREE.TextureLoader();
            const texture = textureLoader.load("assets/crate.gif");
            const material = new THREE.MeshBasicMaterial({ map: texture });

            let block = new THREE.Mesh(
              new THREE.BoxGeometry(10, 50, 70, 2, 5, 5),
              material
            );
            return block;
          },
        }),
        near_action: (ctx, event) => {
          let object = new THREE.Object3D();
          object.position.x = ctx.x;
          object.position.y = ctx.y;
          object.position.z = ctx.z;
          transform(ctx.block, object, 700);
        },
        far_action: (ctx, event) => {
          const object = new THREE.Object3D();
          object.position.x = ctx.x;
          object.position.y = ctx.y;
          object.position.z = ctx.z;
          transform(ctx.block, object, 700);
        },
        right_action: (ctx, event) => {
          const object = new THREE.Object3D();
          object.position.x = ctx.x;
          object.position.y = ctx.y;
          object.position.z = ctx.z;
          transform(ctx.block, object, 700);
        },
        left_action: (ctx, event) => {
          const object = new THREE.Object3D();
          object.position.x = ctx.x;
          object.position.y = ctx.y;
          object.position.z = ctx.z;
          transform(ctx.block, object, 700);
        },
        far_assign: assign({
          x: 1200,
        }),
        near_assign: assign({
          x: 800,
        }),
        right_assign: assign({
          y: 400,
        }),
        left_assign: assign({
          y: 0,
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
  let blockMachine = createBlockMachine(800, -50, 0);
  let blockMachine2 = createBlockMachine(800, 50, 0);
  let cameraMachine = createMachine(
    {
      id: "camera_machine",
      initial: "perspective",
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
    {
      actions: {
        ortho_action: (context, event) => {
          activeCamera = cameraOrtho;
          activeHelper = cameraOrthoHelper;
        },
        perspective_action: (context, event) => {
          activeCamera = cameraPerspective;
          activeHelper = cameraPerspectiveHelper;
        },
      },
    }
  );

  // Invoked child machine

  let boardMachine = createMachine({
    predictableActionArguments: true,
    id: "block_machine",
    context: { height: 3, height: 3, origin: { x: 0, y: 0 }, blocks: [] },
    initial: "ready",
    states: {
      ready: {
        entry: ["board_init"],
        on: {},
      },
    },
    actions: {
      board_init: (ctx, event) => {
        //ref: spawn(todoMachine, `todo-${event.id}`),},
        // add a new todoMachine actor with a unique name
        // for(let x = 0; x < ctx.width; x++){
        //   for(let y = 0; y < ctx.height; y++){
        //   }
        // }
      },
    },
  });

  blockService = interpret(blockMachine, { devTools: true }).start();
  window.blockService = blockService;
  blockService2 = interpret(blockMachine2, { devTools: true }).start();

  cameraService = interpret(cameraMachine, { devTools: true }).start();
}

function doTimer(service1, doLog, label) {
  interval = 1000;

  let t1 = new timer(
    () => {
      service1.send("SWAP");
    },
    interval,
    (now, expected, drift, interval) => {
      console.log("now", now);
      console.log("drift", drift);
      console.log("expected", expected);
      console.log("interval", interval);
    },
    doLog,

    (logLabel, now, expected, drift, interval, lastInterval) => {
      if (drift > 10) {
        console.log("logLabel", logLabel);
        console.log("now", now / 1000);
        console.log("expected", expected);
        console.log("drift", drift);
        console.log("lastInterval", lastInterval);
      }
    },
    label
  );

  t1.start();
}

init();
animate();
doTimer(blockService, true, "a");
