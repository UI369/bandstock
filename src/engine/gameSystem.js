import { _3D, emit, tiles } from "./utilityFunctions.js";
import { Machines } from "/src/util/machines.js";
import { BlockMaker } from "/src/data/blocks.js";

function initGameSystem() {
  console.log("initGameSystem");

  addMouseHandlers();
  //initBlockMachines();
  initServices();

  window.blockServices = blockServices;
  window.mainCameraService = mainCameraService;
  window.boardService = boardService;
}
