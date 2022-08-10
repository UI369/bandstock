import { createMachine, interpret } from "xstate";
import { inspect } from "@xstate/inspect";
import { EventEmitter } from "./event_emitter";

inspect({
  iframe: false,
  url: "https://stately.ai/viz?inspect",
});
export const emit = new EventEmitter();
const playerMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOk3VTACd0SAHa2BzAF1wDcwBiAcQHkA+nwBKAFQASfRKDoB7WLjaz80kAA9EARgAsADhLaA7AE5TAJmPbNu3QGZtAGhABPRAFpDZkrYCsABl8-Qz8jXWNNAF8IpzQsPEJSckoaElkqFmxZXkEABQBRYQBlfIBhUQBJADU81TkFJRUkdS1NHxJLTT9TI2sfXQA2HydXBDczM36SfrNdH1tLQ1ndM2somIwcAmISACMAG1lMAGsSADN0KmyBADk8gEFhWvlFXGVVDVHbPzbtM1tbQz9axWYy6bRDFzuKwkTz9KwzGx+frGaZrECxTYJXYHY4kQgXK4AMQeT3qr0aoA+blsMxhmmM300cL8mk0hmGWhW3m0tiZukMwWm-yi0RA+FkEDgqgx8W2SWotAYVCYYFYHDApJebyaVNZ3laXTMgPpvlMtg5o1aXh8Rn+Pk8YOMdrRMq2iQoCtS6Uymoa70Q-20JH8fmWXSZPj55shlp81ttvgd2idvhdG1l7uS6F95P9nzavP8xiNQKdPlMFrGoODxk8gPC9L0OjTcTd2MOJ3OVBz2sp7laQeT9jZuk0M1syIhIzCJBW-nBIUBJmLLcx232HbxYAuPYpzVG2iMMLMhvBhj6PPZMb6UxCNORrUCoNXGfbx13ebcPWPp-tF4BlasrYUzGJGNjjDaE5-C+bofjqUKgT+xZnv+V4jNSwTBv0-R+H8hrzKy-QihEQA */
  createMachine(
    {
      predictableActionArguments: true,
      id: "(machine)",
      type: "parallel",
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
              entry: "far_action",
              on: {
                GO_NEAR: {
                  target: "near",
                },
              },
            },
            near: {
              entry: "near_action",
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
          emit.emit("near_action");
        },
        far_action: (context, event) => {
          emit.emit("far_action");
        },
      },
    }
  );

export let service = interpret(playerMachine, { devTools: true }).start();
