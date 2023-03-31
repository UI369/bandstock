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

function addMouseHandlers() {
  let clickMouse = new THREE.Vector2();
  let moveMouse = new THREE.Vector2();

  document.addEventListener("pointermove", (event) => {
    moveMouse.x = (event.clientX / SCREEN_WIDTH) * 2 - 1;
    moveMouse.y = -(event.clientY / SCREEN_HEIGHT) * 2 + 1;

    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(moveMouse, _3D.activeCamera);
    let intersects = raycaster.intersectObjects(tiles, true);

    if (intersects.length > 0) {
      //found intersections
      if (!currentTile) {
        //no current tile? use hovered object.
        currentTile = intersects[0].object;
        emit.emit(currentTile.userData.name + ".hover");
      } else if (currentTile && intersects[0] != currentTile) {
        //current tile? replace it with hovered object if different.
        emit.emit(currentTile.userData.name + ".unhover");
        currentTile = intersects[0].object;
        emit.emit(currentTile.userData.name + ".hover");
      }
    } else {
      // nothing hovered?
      emit.emit(currentTile?.userData.name + ".unhover");
      currentTile = null;
    }
  });
}

const initServices = () => {
  machines = new Machines(_3D);
  mainCameraService = interpret(machines.createCameraMachine(), {
    devTools: true,
  }).start();

  boardService = interpret(
    machines.createBoardMachine("board1", 0, 0, 0, blockMaker),
    {
      devTools: true,
    }
  ).start();
};
