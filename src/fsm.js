import { createMachine, interpret } from "xstate";
import { inspect } from "@xstate/inspect";
import { EventEmitter } from "./event_emitter";

inspect({
  iframe: false,
  url: "https://stately.ai/viz?inspect",
});

const playerMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOk3VTACd0SAHa2BzAF1wDcwBiAcQHkA+nwBKAFQASfRKDoB7WLjaz80kAA9EAJgCMAZhIB2XdoMAWEwFYADAA5dpg9oA0IAJ5btFkgE4r2q5oWFqY2AGxBpgC+kS5oWHiEpOSUNCSyVCzYsryCAAoAosIAygUAwqIAkgBq+apyCkoqSOoe+kYm5gbWdg7ObojaoQY+umYGVkND3gahodGxGDgExCQANrLkjSQAZuhUOQIAcvkAgsJ18oq4yqoaCIOaJKZWuqHa2po2DprhBi7uCF0Nm0JDsunB3gsmlMFm803mIDiS0Saw26C2hD2BwAYmcLg1rk1QHcHk8Xm8Pl8DD8LH9+ghTJpvIZvKEbN5TLpWTCzBZojEQPhZBA4KokQkVslqLQGFQmGBWBwwPirjdmndqf8BqFmbDQrpPuY9KFOQYEeLlkkKNK0hksirGrdEFzhkyOZpPgFRkYtfdqSQrKyDV93q9TebFhKrSl0A7CU6GTZfZCfGzHJ5qentFEBRaUetNoSdns42riVowiRQh7dLDNEYDHYk-SgV44TppoFvIN9Xzc5HLajC8oSJiqKWiS0EJqW3Ynt4PXp-EyLDZNBH4oOC+j4816qrJ3cQr7dIHQSbV1ZGVYLEu5v3N4kJwnob7NPo4XCoaY2dWf-X+UiIA */
  createMachine(
    {
      id: "(machine)",
      type: "parallel",
      predictableActionArguments: true,
      states: {
        camera: {
          initial: "perspective",
          states: {
            perspective: {
              on: {
                GO_ORTHO: {
                  target: "ortho",
                  actions: ["go_ortho_action"],
                },
              },
            },
            ortho: {
              on: {
                GO_PERSPECTIVE: {
                  target: "perspective",
                  actions: ["go_perspective_action"],
                },
              },
            },
          },
        },
        block: {
          initial: "near",
          states: {
            far: {
              on: {
                GO_NEAR: {
                  target: "near",
                  actions: ["go_near_action"],
                },
              },
            },
            near: {
              on: {
                GO_FAR: {
                  target: "far",
                  actions: ["go_far_action"],
                },
              },
            },
          },
        },
      },
    },
    {
      actions: {
        go_ortho_action: (context, event) => {
          emit.emit("go_ortho_action");
        },
        go_perspective_action: (context, event) => {
          emit.emit("go_perspective_action");
        },
        go_near_action: (context, event) => {
          emit.emit("go_near_action");
        },
        go_far_action: (context, event) => {
          emit.emit("go_far_action");
        },
      },
    }
  );

export let service = interpret(playerMachine, { devTools: true }).start();
export const emit = new EventEmitter();
