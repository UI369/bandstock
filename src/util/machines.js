import { assign, createMachine, interpret, send, spawn } from "xstate";
import * as THREE from "three";

export let Machines = function Machines(_3D) {
  let that = this;
  that._3D = _3D;
  console.log("that.activeCamera", that.activeCamera);

  let textures = {
    magenta3: "/src/assets/magenta3.png",
    teal6: "/src/assets/teal6.png",
    purple9: "/src/assets/purple9.png",
  };
  let tiles = [];

  this.createBlockMachine = function createBlockMachine(
    idIn,
    typeIn,
    xIn,
    yIn,
    zIn
  ) {
    return createMachine(
      {
        id: "block_machine." + idIn,
        predictableActionArguments: true,
        context: {
          id: idIn,
          x: xIn,
          y: yIn,
          z: zIn,
          type: typeIn,
          note: "note",
          speed: 500,
          block: undefined,
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
              PRESENT: {
                target: "presenting",
              },
            },
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
            //ctx.block.userData.blockService = ctx.blockService;
            ctx.block.userData.name = ctx.name;
            tiles.push(ctx.block);
            console.log("adding block to scene: " + ctx.block);
            that._3D.scene.add(ctx.block);
          },
          ready_assign: assign({
            note: () => {
              return "note!";
            },
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
              return block;
            },
          }),
          near_action: (ctx, event) => {
            ctx.z += 80;

            let object = new THREE.Object3D();
            object.position.x = ctx.x;
            object.position.y = ctx.y;
            object.position.z = ctx.z;
            that._3D.transform(ctx.block, object, ctx.speed);
          },
          far_action: (ctx, event) => {
            ctx.z -= 80;

            const object = new THREE.Object3D();
            object.position.x = ctx.x;
            object.position.y = ctx.y;
            object.position.z = ctx.z;
            that._3D.transform(ctx.block, object, ctx.speed);
          },
          presenting_assign: (ctx, e) => {
            console.log("block presenting_assign", e.event);
            ctx.x = e.event.present_to.position.x;
            ctx.y = e.event.present_to.position.y;
            ctx.z = e.event.present_to.position.z;
          },
          presenting_action: (ctx, event) => {
            console.log("block presenting_action ctx", ctx);
            const object = new THREE.Object3D();
            object.position.x = ctx.x;
            object.position.y = ctx.y;
            object.position.z = ctx.z;
            that._3D.transform(ctx.block, object, ctx.speed);
          },
        },
      }
    );
  };

  this.createBoardMachine = function createBoardMachine(
    nameIn,
    macroXIn,
    macroYIn,
    macroZIn,
    blockMaker
  ) {
    blockMaker.makeBlocks();
    blockMaker.initBlockScript(121);

    console.log("blockMaker", blockMaker);
    return createMachine(
      {
        id: "board_machine." + nameIn,
        predictableActionArguments: true,
        context: {
          macroX: macroXIn,
          macroY: macroYIn,
          macroZ: macroZIn,
          blockMaker: blockMaker,
          name: nameIn,
          blockSize: 50,
          next: 0,
        },
        initial: "ready",
        states: {
          ready: {
            entry: ["ready_assign", "ready_action"],
            on: {
              PRESENT_NEXT: {
                target: "present",
              },
            },
          },
          present: {
            entry: ["do_present"],
            exit: ["unpresent_last"],
            on: {
              PRESENT_NEXT: {
                target: "present",
                actions: "present_next_assign",
              },
              PRESENT_PREV: {
                target: "present",
                actions: "present_prev_assign",
              },
              CLAIM_CURRENT: {
                target: "claiming",
              },
            },
          },
          claiming: {
            entry: ["claim_current"],
            exit: ["unpresent_last"],
            on: {
              PRESENT_NEXT: {
                target: "present",
                actions: "present_next_assign",
              },
              PRESENT_PREV: {
                target: "present",
                actions: "present_prev_assign",
              },
            },
          },
        },
      },
      {
        actions: {
          ready_action: (ctx, event) => {
            console.log("ready_action", ctx);
          },
          ready_assign: assign((ctx) => {
            console.log("ready_assign", ctx);
            const blocks = ctx.blockMaker.blocks.map((element, _) => {
              let block = that.createBlockMachine(
                element.name,
                element.c,
                that._3D.focalPoint.position.x + element.x * ctx.blockSize,
                that._3D.focalPoint.position.y + element.y * ctx.blockSize,
                that._3D.focalPoint.position.z + element.z * ctx.blockSize
              );
              spawn(block, { name: element.name });
              return block;
            });

            const actors = blocks.reduce((all, curr, i) => {
              return { ...all, [`block-${i}`]: curr };
            }, {});
            actors.actor = `block-0`;
            return actors;
          }),
          unpresent_last: (() => {
            let s = send(
              (ctx, event) => ({
                type: "PRESENT",
                event: {
                  present_to: {
                    position: {
                      x: ctx[ctx.actor]._context.x,
                      y: ctx[ctx.actor]._context.y,
                      z: ctx[ctx.actor]._context.z,
                    },
                  },
                },
              }),
              { to: (ctx) => ctx.actor }
            );
            return s;
          })(),
          present_next_assign: assign({
            actor: (ctx, e) => {
              let nextBlock = ctx.blockMaker.getNextBlock();
              console.log("prsent_next_assign", nextBlock);
              return nextBlock;
            },
          }),
          present_prev_assign: assign({
            actor: (ctx, e) => {
              return ctx.blockMaker.getPrevBlock();
            },
          }),
          do_present: (() => {
            //let nxt = ctx.next;
            let s = send(
              {
                type: "PRESENT",
                event: {
                  present_to: {
                    position: {
                      x: that._3D.activeCamera.position.x,
                      y: that._3D.activeCamera.position.y + 39.5,
                      z: that._3D.activeCamera.position.z + 72,
                    },
                  },
                },
              },
              { to: (ctx) => ctx.actor }
            );
            return s;
          })(),
          claim_current: (() => {
            console.log("board claim_current");
            //let nxt = ctx.next;
            let s = send(
              {
                type: "PRESENT",
                event: {
                  present_to: {
                    position: {
                      x: that._3D.activeCamera.position.x,
                      y: that._3D.activeCamera.position.y + 45,
                      z: that._3D.activeCamera.position.z + 180,
                    },
                  },
                },
              },
              { to: (ctx) => ctx.actor }
            );
            return s;
          })(),
        },
      }
    );
  };

  this.createCameraMachine = function createCameraMachine() {
    return createMachine(
      {
        id: "mainCamera_machine",
        predictableActionArguments: true,
        initial: "live",
        states: {
          live: {
            initial: "perspective",
            on: {
              GO_BACKSTAGE: {
                target: "backstage",
              },
            },
            states: {
              perspective: {
                entry: "live_action",
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
          live_action: (context, event) => {
            console.log("perspective");
            that._3D.mainCamera.updateProjectionMatrix();
            that._3D.mainCameraHelper.update();
            that._3D.activeCamera = that._3D.mainCamera;
            that._3D.activeHelper = that._3D.mainCameraHelper;
            that._3D.activeHelper.visible = false;
          },
          backstage_action: (context, event) => {
            console.log("backstage");
            that._3D.activeHelper.visible = true;
            that._3D.activeCamera = that._3D.backstageCamera;
            that._3D.activeHelper = that._3D.backstageCameraHelper;
          },
        },
      }
    );
  };
};
