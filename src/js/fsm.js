import { assign, createMachine, interpret } from "xstate";
import { inspect } from "@xstate/inspect";
import { EventEmitter } from "./event_emitter";

inspect({
  iframe: false,
  url: "https://stately.ai/viz?inspect",
});
export const emit = new EventEmitter();

const cameraMachine = createMachine(
  {
    id: "(camera_machine)",
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
        emit.emit("ortho_action");
      },
      perspective_action: (context, event) => {
        emit.emit("perspective_action");
      },
    },
  }
);

const blockMachine = createMachine(
  {
    id: "(block_machine)",
    context: { x: 0, y: 0, z: 0 },
    initial: "near",
    states: {
      far: {
        entry: ["far_assign", "far_action"],
        on: {
          GO_NEAR: {
            target: "near",
          },
        },
      },
      near: {
        entry: ["near_assign", "near_action"],
        on: {
          GO_FAR: {
            target: "far",
          },
        },
      },
    },
  },
  {
    actions: {
      near_action: (context, event) => {
        console.log("n:");
        console.log(context);
        console.log(event);
        console.log(":n");
        emit.emit("near_action", context);
      },
      far_action: (context, event) => {
        console.log("f:");
        console.log(context);
        console.log(event);
        console.log(":f");
        emit.emit("far_action", context);
      },
      far_assign: assign({
        x: 1200,
      }),
      near_assign: assign({
        x: 400,
      }),
    },
  }
);
export let blockService = interpret(blockMachine, { devTools: true }).start();

export let cameraService = interpret(cameraMachine, { devTools: true }).start();
