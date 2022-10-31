

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

}
