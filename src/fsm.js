import { assign, createMachine, interpret } from "xstate";
import { inspect } from "@xstate/inspect";
import { EventEmitter } from "./event_emitter";

inspect({
  iframe: false,
  url: "https://stately.ai/viz?inspect",
});
export const emit = new EventEmitter();
const playerMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOk3VTACd0SAHa2BzAF1wDcwBiAcQHkA+nwBKAFQASfRKDoB7WLjaz80kAA9EARgDs2kgGYATJoCsABgAcJgJwAWfbYBsDgDQgAnogC0tiwbOW+vraJhZm+haOFgC+0W5oWHiEpOSUNCSyVCzYsryCAAoAosIAykUAwqIAkgBqhapyCkoqSOpatiYk1rpm1oaOtvZhmoZunghehrbWJCZRtpoR1maavtoxcSAJOATEJABGADaymADWJABm6FR5AgByhQCCwg3yirjKqhoTmhb6XZFDKE7E5DFZHGMtEEDL99I5tL5ViYTB1YvEMDtkgdjmcSIRrrcAGLPV5ND4tUDfLw6TQkTSaMzI2zaRzGAIRSEIfQmWmLFYWaxhZy2MwDWKbfCyCBwVTbJJ7VLUWgMKhMMCsDhgUnvT6tKkWWlBEXGZZGEUWTnU3QkVmaazCkwhUJmQxorYY+UpChKjJZHLa5pfRD6O0GQVg3qrRw6fqWnR6W32hyO5FhExuuW7L1pdAB8lBn6MgwOF128JTSyWoy0kzBTRRA0sqLWDMerPYk7nK5UPO6yneRyOAEWWxg3wBbRTTmGaFwkMCv6OazmXytxLto6dvFga69iltCYRf4zlH2MyDbkz6erWamayreuOUv2teYvabs57gs+Mx6E8X897BMK8PEQaMDGmGxjEGSwLEiV9PS-PVvHsWl-zPC9gP0KtrH+cwbFWaxBXpO1xWiIA */
  createMachine(
    {
      predictableActionArguments: true,
      id: "(machine)",
      type: "parallel",
      context: { x: 0, y: 0, z: 0 },
      states: {
        camera: {
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
        block: {
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

export let service = interpret(playerMachine, { devTools: true }).start();
