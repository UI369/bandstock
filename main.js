import {
  init3DSetup,
  initCameras,
  _3D,
  container,
} from "./src/engine/threeDEngine.js";
//import { initGameSystem } from "./src/engine/gameSystem.js";
////import { initGUI } from "./gui.js";
//import { animate } from "./utilityFunctions.js";

function init() {
  console.log("_3D", _3D);
  init3DSetup();
  console.log("_3D", _3D);
  initCameras();
  console.log("_3D", _3D);
  //initGameSystem();
  //initGUI();
}

init();
//animate();
