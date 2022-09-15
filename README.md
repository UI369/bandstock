# bandstock

Clone the repo with ```git clone -b master https://github.com/UI369/bandstock.git```

Run in terminal:

```cd bandstock```

```npm install```

```npm run build```
//npm run build copies image folders into the deploy director. 
#TODO: File manager improvements to combine into one command. 

```npm run dev```

View app at localhost:1234

Note, If you want to see live updating XState machine charts: 
* be sure to allow bandstock to do "popups" in your browser, as state charts open in a new tab. 
* This is a dev only feature and can be disabled with 

There are a few keymappings that change aspects of the 3D display. 
Pressing these keys send events to the XState machines - represented by cameraService and blockService. 

cameraService valid event types:
GO_ORTHO
GO_PERSPECTIVE
GO_LIVE
GO_BACKSTAGE

blockService valid event types:
GO_NEAR
GO_FAR


Testing and feature requests welcome.

Active events:

 ```switch (event.keyCode) {
    case 79 /*O*/:
      console.log("go_ortho");
      cameraService.send({ type: "GO_ORTHO" });
      break;
    case 80 /*P*/:
      console.log("go_perspective");
      cameraService.send({ type: "GO_PERSPECTIVE" });
      break;
    case 76 /*L*/:
      console.log("go_live");
      cameraService.send({ type: "GO_LIVE" });
      break;
    case 59 /*;*/:
      console.log("go_backstage");
      cameraService.send({ type: "GO_BACKSTAGE" });
      break;
    case 78 /*N*/:
      console.log("sending GO_NEAR");
      blockService.send({ type: "GO_NEAR" });
      break;
    case 70 /*F*/:
      console.log("sending GO_FAR");
      blockService.send({ type: "GO_FAR" });
      break;
  }```



https://www.twitter.com/@ui_369 
