// Copyright (c) 2023 bench.co.,ltd

import {skySampleScenePipelineModule} from './sky-scene-pipeline-module'
import {joyStickPipelineModule} from './joystick'
import './index.css'
import './reset.css'

SkyCoachingOverlay.configure({
  animationColor: '#fff',
  promptText: 'Look up in the sky and operate robot!',
})

const onxrloaded = () => {
  XR8.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR8.CameraPixelArray.pipelineModule({luminance: false}),
    XR8.GlTextureRenderer.pipelineModule(),      // Draws the camera feed.
    XR8.Threejs.pipelineModule(),                // Creates a ThreeJS AR Scene as well as a Sky scene.
    window.LandingPage.pipelineModule(),         // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.

    // Enables Sky Segmentation.
    XR8.LayersController.pipelineModule(),
    SkyCoachingOverlay.pipelineModule(),

    // Custom pipeline module to add virtual content to the sky scene.
    skySampleScenePipelineModule(),
    // customThreejsPipelineModule(),
    joyStickPipelineModule(),
  ])

  XR8.LayersController.configure({nearClip: 0.1, farClip: 1000, layers: {sky: {invertLayerMask: false}}})
  XR8.Threejs.configure({layerScenes: ['sky']})

  // Add a canvas to the document for our xr scene.
  document.body.insertAdjacentHTML('beforeend', `
    <canvas id="camera" width="${window.innerWidth}" height="${window.innerHeight}"></canvas>
  `)

  // Open the camera and start running the camera run loop.
  XR8.run({
    canvas: document.getElementById('camera'),
    verbose: true,
  })
}
window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)

const load = () => {
  XRExtras.Loading.showLoading()
  const loadImage = document.getElementById('loadImage')
  if (loadImage) {
    loadImage.src = require('./assets/images/earth.png')
  }
}
window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load)
