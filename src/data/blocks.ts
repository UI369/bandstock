

export class BlockMaker {

    public makeBlocks(){
        let x = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
        let y = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
        let result = Array();
        let i = 0;

        x.forEach((xe) => {
            y.forEach((ye) => {
                result.push({ name: "block-" + i, x: xe, y: ye, z: 0 });
            });
        });

        return result;
    }

}
