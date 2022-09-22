import * as THREE from "three";
import { Tween, Easing, update } from "@tweenjs/tween.js";
import * as Stats from "stats.js";
import { timer } from "/src/util/timer.js";
import { assign, createMachine, interpret } from "xstate";
import { EventEmitter } from "/src/util/event_emitter.ts";

let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;
let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

let emit = new EventEmitter();
let container, stats, mesh;
let blockServices = [];
let blockMachines = [];
let blockService, cameraService, boardService;
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

let textures = {
  magenta3: "/src/assets/magenta3.png",
  magenta9: "/src/assets/magenta9.png",
  teal6: "/src/assets/teal6.png",
  purple3: "/src/assets/purple3.png",
  purple9: "/src/assets/purple9.png",
  pinkTile: "/src/assets/pinktile.png",
  orangeTile: "/src/assets/orangetile.png",
  blackTile: "/src/assets/blacktile2.png",
  purpleTile: "/src/assets/purpleTexture.png",
  tealTile: "/src/assets/tealTexture.png",
  magentaTile: "/src/assets/magentaTexture.png",
};

// allow mousepick
let raycaster, INTERSECTED;

const frustumSize = 600;

function init() {
  init3DSetup();

  addMouseHandlers();

  initGameSystem();

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", onWindowResize);
  onWindowResize();
}

function init3DSetup() {
  container = document.createElement("div");
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(80, 5 * aspect, 0.1, 5500);
  camera.position.z = 3500;
  cameraPerspective = new THREE.PerspectiveCamera(1500, 1 * aspect, 150, 200);
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
  //
  stats = new Stats();
  container.appendChild(stats.dom);
}

function initGameSystem() {
  console.log("initGameSystem");
  // inspect({
  //   iframe: false,
  //   url: "https://stately.ai/viz?inspect",
  // });

  initBlockMachines();
  initServices();

  window.blockServices = blockServices;
  window.cameraService = cameraService;
  window.boardService = boardService;
}

const initBlockMachines = () => {
  //Create (ySet.length ^ 2) blockMachines - incomprehensible algorithm determining the pattern of cubes.
  let ySet = [-250, -200, -150, -100, -50, 0, 50, 100, 150, 200, 250];
  let types = ["teal6", "purple3", "magenta9"];
  let k = 0;
  for (let i = 0; i < ySet.length; i++) {
    for (let j = 0; j < ySet.length; j++) {
      const border = 3;
      let edge =
        i < border ||
        i > ySet.length - (border + 1) ||
        j < border ||
        j > ySet.length - (border + 1)
          ? 1
          : 0;
      edge = i % 2 == 0 || j % 2 == 0 ? 1 : 0;
      edge = i == 5 && j == 5 ? 2 : edge;
      blockMachines[k] = createBlockMachine(
        "tile" + k,
        types[edge],
        800,
        ySet[j],
        ySet[i]
      );

      k++;
    }
  }
};

const initServices = () => {
  //create blockService => Wire them in to blockMachine => Wire them into userData of 3D block

  for (let i = 0; i < blockMachines.length; i++) {
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

  cameraService = interpret(createCameraMachine(), { devTools: true }).start();

  boardService = interpret(
    createBoardMachine("board1", 0, 0, 0, blockMachines),
    {
      devTools: true,
    }
  ).start();
};

const createBlockMachine = (nameIn, typeIn, xIn, yIn, zIn) => {
  return createMachine(
    {
      id: "block_machine." + nameIn,
      predictableActionArguments: true,
      context: {
        x: xIn,
        y: yIn,
        z: zIn,
        type: typeIn,
        speed: 2000,
        block: undefined,
        blockService: undefined,
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
            PRESENT: {
              target: "presenting",
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
        presenting: {
          entry: ["presenting_assign", "presenting_action"],
          on: {
            GO_AWAY: "far",
          },
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
              target: "right",
            },
          },
          invoke: [],
        },
      },
    },
    {
      actions: {
        ready_init: (ctx, event) => {
          //position block and add it to scene
          ctx.block.position.x = ctx.x;
          ctx.block.position.y = ctx.y;
          ctx.block.position.z = ctx.z;
          ctx.block.userData.blockService = ctx.blockService;
          ctx.block.userData.name = ctx.name;

          console.log("block init", ctx);
          scene.add(ctx.block);
        },
        ready_assign: assign({
          block: () => {
            //create the 3D block
            const textureLoader = new THREE.TextureLoader();
            const material = new THREE.MeshBasicMaterial({
              map: textureLoader.load(textures[typeIn]),
            });

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
        presenting_assign: (ctx, event) => {
          ctx.x = event.present_to.position.x;
          ctx.y = event.present_to.position.y;
          ctx.z = event.present_to.position.z;
        },
        presenting_action: (ctx, event) => {
          const object = new THREE.Object3D();
          object.position.x = ctx.x;
          object.position.y = ctx.y;
          object.position.z = ctx.z;
          transform(ctx.block, object, ctx.speed);
        },
        right_action: (ctx, event) => {
          ctx.y += 80;

          const object = new THREE.Object3D();
          object.position.x = ctx.x;
          object.position.y = ctx.y;
          object.position.z = ctx.z;
          transform(ctx.block, object, ctx.speed);
        },
        left_action: (ctx, event) => {
          ctx.y += -80;

          const object = new THREE.Object3D();
          object.position.x = ctx.x;
          object.position.y = ctx.y;
          object.position.z = ctx.z;
          transform(ctx.block, object, ctx.speed);
        },
        right_assign: assign({
          y: (ctx, event) => {
            return ctx.y + 80;
          },
        }),
        left_assign: assign({
          y: (ctx, event) => {
            return ctx.y - 8;
          },
        }),
      },
    }
  );
};

const createBoardMachine = (
  nameIn,
  macroXIn,
  macroYIn,
  macroZIn,
  blockMachinesIn
) => {
  return createMachine(
    {
      id: "board_machine." + nameIn,
      predictableActionArguments: true,
      context: {
        macroX: macroXIn,
        macroY: macroYIn,
        macroZ: macroZIn,
        blockMachines: blockMachinesIn,
        name: nameIn,
        next: { x: 0, y: 0 },
      },
      initial: "ready",
      states: {
        ready: {
          entry: "ready_action",
          on: {
            PRESENT_NEXT: {
              target: "present",
            },
          },
        },
        present: {
          entry: "present_next",
          on: {
            PRESENT_NEXT: {
              target: "present",
            },
          },
        },
      },
    },
    {
      actions: {
        ready_action: (ctx, event) => {},
        present_next: (ctx, event) => {
          blockMachines[
            ctx.next.x * ctx.next.y
          ]._context.block.userData.blockService.send("PRESENT");
          ctx.next = { x: ctx.next.x, y: ctx.next.y + 1 };
        },
      },
    }
  );
};

const createCameraMachine = () => {
  return createMachine(
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

          cameraPerspective.fov = 45; //Math.sin(0.5);
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
};

/*********************/
/* UTILITY FUNCTIONS */
/*********************/

function addMouseHandlers() {
  let clickMouse = new THREE.Vector2();
  let moveMouse = new THREE.Vector2();

  document.addEventListener("pointermove", (event) => {
    moveMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    moveMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(moveMouse, activeCamera);
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
  //const r = Date.now() * 0.0005;

  //theta += delta;
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
  scene.add(particles);
}

function transform(object, target, duration) {
  new Tween(object.position)
    .to(
      { x: target.position.x, y: target.position.y, z: target.position.z },
      duration
    )
    .easing(Easing.Elastic.Out)
    .start();

  new Tween(object.rotation)
    .to(
      { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z },
      duration
    )
    .easing(Easing.Exponential.InOut)
    .start();

  new Tween(this)
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
      console.log("sending SWAP");
      blockService.send({ type: "SWAP" });
      break;
    case 70 /*F*/:
      console.log("sending SWAP");
      blockService.send({ type: "SWAP" });
      break;
    case 65 /*A*/:
      console.log("sending PRESENT");
      boardService.send({ type: "PRESENT_NEXT" });
      break;
  }
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

//Start the show
init();
animate();
