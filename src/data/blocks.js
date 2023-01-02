import { randFloat, randInt } from "three/src/math/MathUtils";

export let BlockMaker = function BlockMaker() {
  let that = this;

  this.makeBlocks = function makeBlocks() {
    let x = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
    let y = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
    let c = ["magenta3", "teal6", "purple9"];
    let result = Array();
    let i = 0;

    x.forEach((xe) => {
      y.forEach((ye) => {
        result.push({
          name: "block-" + i,
          c: c[i % c.length],
          x: xe,
          y: ye,
          z: 0,
        });
        i++;
      });
    });

    that.blocks = result;
  };

  this.getCycleScript = function getCycleScript() {
    // let grid = [
    //   [212, 173, 138, 107, 83, 60, 61, 86, 112, 145, 182],
    //   [172, 137, 106, 82, 59, 40, 41, 62, 87, 113, 146],
    //   [104, 80, 57, 38, 23, 12, 13, 26, 43, 64, 89],
    //   [79, 56, 37, 22, 11, 4, 5, 14, 27, 44, 65],
    //   [55, 36, 21, 10, 3, 0, 1, 6, 15, 28, 45],
    //   [77, 54, 35, 20, 9, 2, 7, 16, 29, 46, 67],
    //   [100, 76, 53, 34, 19, 8, 17, 30, 47, 68, 90],
    //   [130, 99, 75, 52, 33, 18, 31, 48, 69, 91, 120],
    //   [164, 129, 98, 74, 51, 32, 49, 70, 92, 121, 154],
    //   [202, 163, 128, 97, 73, 50, 71, 93, 122, 155, 192],
    // ];

    let grid = [
      [116, 117, 118, 119, 120, 81, 82, 83, 84, 85, 86],
      [115, 77, 78, 79, 80, 49, 50, 51, 52, 53, 87],
      [114, 76, 46, 47, 48, 25, 26, 27, 28, 54, 88],
      [113, 75, 45, 23, 24, 9, 10, 11, 29, 55, 89],
      [112, 74, 44, 22, 8, 1, 2, 12, 30, 56, 90],
      [111, 73, 43, 21, 7, 0, 3, 13, 31, 57, 91],
      [110, 72, 42, 20, 6, 5, 4, 14, 32, 58, 92],
      [109, 71, 41, 19, 18, 17, 16, 15, 33, 59, 93],
      [108, 70, 40, 39, 38, 37, 36, 35, 34, 60, 94],
      [107, 69, 68, 67, 66, 65, 64, 63, 62, 61, 95],
      [106, 105, 104, 103, 102, 101, 100, 99, 98, 97, 96],
    ];

    let ndx = 0;
    let grid2 = grid.map((row, i) => {
      var res = row.map((col, j) => {
        return { index: ndx++, value: col, offset: col * 300 };
      });
      return res;
    });

    grid2 = grid2.flat();
    grid2.sort((a, b) => {
      return a.offset - b.offset;
    });

    console.log("grid2", grid2);
    return grid2;
  };

  this.initBlockScript = function initBlockScript(lenIn) {
    that.script = Array.from({ length: lenIn }).map((_, i) => {
      return "block-" + i;
    });
    that.index = 0;
  };

  this.getNextBlock = function getNextBlock() {
    that.index += 1;
    if (that.index >= that.script.length) {
      that.index = 0;
    }

    return that.script[that.index];
  };

  this.getPrevBlock = function getPrevBlock() {
    that.index -= 1;
    if (that.index < 0) {
      that.index = that.script.length - 1;
    }
    return that.script[that.index];
  };

  this.getBlockByIndex = function getBlockByIndex(index) {
    return that.script[index];
  };

  this.getCurBlock = function getCurBlock() {
    let val = that.script[that.index];
    return val;
  };
};

// const initBlockMachines = () => {
//   console.log("initBlockMachines");
//   //Create (ySet.length ^ 2) blockMachines - incomprehensible algorithm determining the pattern of cubes.
//   let ySet = [-250, -200, -150, -100, -50, 0, 50, 100, 150, 200, 250];
//   let types = ["teal6", "purple3", "magenta9"];
//   let k = 0;
//   for (let i = 0; i < ySet.length; i++) {
//     for (let j = 0; j < ySet.length; j++) {
//       const border = 3;
//       let edge =
//         i < border ||
//         i > ySet.length - (border + 1) ||
//         j < border ||
//         j > ySet.length - (border + 1)
//           ? 1
//           : 0;
//       edge = i % 2 == 0 || j % 2 == 0 ? 1 : 0;
//       edge = i == 5 && j == 5 ? 2 : edge;
//       blockMachines[k] = machines.createBlockMachine(
//         "tile" + k,
//         types[edge],
//         ySet[j],
//         ySet[i],
//         _3D.focalPoint.position.z
//       );

//       k++;
//     }
//   }
//   console.log("end initBlock blockMachines[0]", blockMachines[0]);
// };
