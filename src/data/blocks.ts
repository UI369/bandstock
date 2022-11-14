

export class BlockMaker {

    public makeBlocks(){
        let x = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
        let y = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
        let c = ["magenta3","teal6","purple9",]
        let result = Array();
        let i = 0;

        x.forEach((xe) => {
            y.forEach((ye) => {
                result.push({ name: "block-" + i, c: c[(i%c.length)], x: xe, y: ye, z: 0 });
                i++
            });
        });

        return result;
    }

    public getBlockScript(){
         let script = Array.from({ length: 121 }).map((_, i) =>{
            return "block-"+i;
         })

         return {
            script: script,
            index: 0
         }
    }



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


}
