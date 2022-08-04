import { createMachine, assign, interpret } from "xstate";
import { inspect } from "@xstate/inspect";

inspect({
  iframe: false,
  url: "https://stately.ai/viz?inspect",
});

const playerMachine = createMachine({
  initial: "near",
  states: {
    far: {
      on: {
        GO_NEAR: { target: "near" },
      },
    },
    near: {
      on: {
        GO_FAR: { target: "far" },
      },
    },
  },
});

export let service = interpret(playerMachine, { devTools: true }).start();
