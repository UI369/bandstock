import { assign, createMachine, interpret, sendParent, send } from "xstate";
import { inspect } from "@xstate/inspect";
import { EventEmitter } from "./event_emitter";

inspect({
  iframe: false,
  url: "https://stately.ai/viz?inspect",
});
export const emit = new EventEmitter();

const cameraMachine = createMachine(
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
        emit.emit("ortho_action");
      },
      perspective_action: (context, event) => {
        emit.emit("perspective_action");
      },
    },
  }
);

// Invoked child machine
const delayMachine = createMachine({
  id: "pong",
  initial: "active",
  states: {
    active: {
      on: {
        DELAY: {
          actions: sendParent("GO_NEAR", {
            delay: 5000,
          }),
        },
      },
    },
  },
});

const blockMachine = createMachine(
  {
    id: "block_machine",

    context: { x: 0, y: 0, z: 0 },
    initial: "loading",
    states: {
      loading: {
        invoke: {
          id: "delay",
          src: delayMachine,
        },
        entry: send({ type: "DELAY" }, { to: "delay" }),
        on: {
          GO_NEAR: {
            target: "near",
          },
        },
      },
      far: {
        entry: ["far_assign", "far_action"],
        on: {
          GO_NEAR: {
            target: "near",
          },
        },
        invoke: [
          {
            src: (context, event) =>
              new Promise((res) => {
                setTimeout(() => {
                  res(42);
                }, 1000);
              }),
            onDone: {
              target: "near",
              actions: (_, event) => {},
            },
          },
        ],
      },
      near: {
        entry: ["near_assign", "near_action"],
        on: {
          GO_FAR: {
            target: "far",
          },
        },
        invoke: [
          {
            src: (context, event) =>
              new Promise((res) => {
                setTimeout(() => {
                  res(43);
                }, 1000);
              }),
            onDone: {
              target: "far",
              actions: (_, event) => {
                //console.log("done", event);
              },
            },
          },
        ],
      },
    },
  },
  {
    actions: {
      near_action: (context, event) => {
        emit.emit("near_action", context);
      },
      far_action: (context, event) => {
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
