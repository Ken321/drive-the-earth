/* eslint new-cap: ["error", { "newIsCap": false, "capIsNew": false }] */
export const skySampleScenePipelineModule = () => {
  const DEFAULT_DRACO_DECODER_LOCATION = 'https://www.gstatic.com/draco/versioned/decoders/1.3.6/'

  let camera_
  let cameraFeedRenderer = null
  let canvasWidth_ = null
  let canvasHeight_ = null
  let videoWidth_ = null
  let videoHeight_ = null
  let texProps = null
  const camTexture_ = new THREE.Texture()

  const TEXTURE = require('./assets/sky-textures/space.png')
  const ASTEROID_MODEL = require('./assets/sky-models/asteroid.glb')
  const ASTEROID2_MODEL = require('./assets/sky-models/asteroid2.glb')
  const CALISTO_MODEL = require('./assets/sky-models/calisto.glb')
  const EUROPE_MODEL = require('./assets/sky-models/europe.glb')
  const GANYMEDE_MODEL = require('./assets/sky-models/ganymede.glb')
  const IO_MODEL = require('./assets/sky-models/io.glb')
  const JUPITER_MODEL = require('./assets/sky-models/jupiter.glb')
  const MARS_MODEL = require('./assets/sky-models/mars.glb')
  const MERCURY_MODEL = require('./assets/sky-models/mercury.glb')
  const MOON_MODEL = require('./assets/sky-models/moon.glb')
  const NEPTUNE_MODEL = require('./assets/sky-models/neptune.glb')
  const PLUTO_MODEL = require('./assets/sky-models/pluto.glb')
  const SATURN_MODEL = require('./assets/sky-models/saturn.glb')
  // const SUN_MODEL = require('./assets/sky-models/sun.glb')
  const URANUS_MODEL = require('./assets/sky-models/uranus.glb')
  const VENUS_MODEL = require('./assets/sky-models/venus.glb')
  const CUBE_MODEL = require('./assets/sky-models/cube.glb')
  const STAGE1_POSITION_MODEL = require('./assets/sky-models/stage1-position.glb')
  const STAGE2_POSITION_MODEL = require('./assets/sky-models/stage2-position.glb')
  const STAGE3_POSITION_MODEL = require('./assets/sky-models/stage3-position.glb')
  const PULLER_MODEL = require('./assets/sky-models/puller.glb')
  const PULLER_CHARACTER_MODEL = require('./assets/sky-models/character-fly.glb')
  const MUSIC_MP3 = require('./assets/sky-sounds/music.mp3')
  const FINISH_MUSIC_MP3 = require('./assets/sky-sounds/finish-music.mp3')
  const FINISH_VIDEO = require('./assets/images/salute.mp4')
  const VICTORY_VIDEO = require('./assets/images/victory.mp4')
  const FAILED_VIDEO = require('./assets/images/defeated.mp4')
  const ENGINE_MP3 = require('./assets/sky-sounds/engine.mp3')
  const POINTSOUND_MP3 = require('./assets/sky-sounds/point.mp3')
  const COLLISIONSOUND_MP3 = require('./assets/sky-sounds/collision.mp3')

  const loader = new THREE.GLTFLoader()
  const dracoLoader = new THREE.DRACOLoader()
  dracoLoader.setDecoderPath(DEFAULT_DRACO_DECODER_LOCATION)
  dracoLoader.preload()
  loader.setDRACOLoader(dracoLoader)

  let initialized = false
  let started = false
  let clearedStage = 0
  let currentStagePoint = 0
  let stage1Point = 0
  let stage2Point = 0
  let stage3Point = 0
  let currentLang = 'ja'
  let meteorSpeed = 0.1

  const defaultFps = 0.033  // 秒単位
  let fpsRatio = 1

  let lap1 = 0
  let lap2 = 0
  let lap3 = 0

  // animationmixer
  let mixer

  const clock = new THREE.Clock()
  let deltaTime

  let skyBox

  // 惑星グループと回転のための中心
  const planetCenter = new THREE.Group()
  const planetGroup = new THREE.Group()
  planetCenter.add(planetGroup)
  planetGroup.rotation.set(Math.PI / 4, 0, 0)

  const collisionList = []

  // cloneするために読み込んだgltfをグローバルに持つ
  let asteroidLoadedModel
  let asteroidLoadedModel2
  let calistoLoadedModel
  let europeLoadedModel
  let ganymedeLoadedModel
  let ioLoadedModel
  let jupiterLoadedModel
  let marsLoadedModel
  let mercuryLoadedModel
  let moonLoadedModel
  let neptuneLoadedModel
  let plutoLoadedModel
  let saturnLoadedModel
  let sunLoadedModel
  let uranusLoadedModel
  let venusLoadedModel
  let cubeLoadedModel

  // 地球を牽引するキャラクター
  const puller = new THREE.Group()
  let pullCharacter

  // sfx
  let music
  let finishMusic
  let engineSound
  let pointSound
  let collisionSound

  let invertMaskBoolean = false
  const skyDebugMode = false  // TOGGLE SKY DEBUG MODE HERE

  // ジョイスティック入力値と、その結果の動きや回転のベクターなど
  let inputX = 0
  let inputY = 0
  let inputVelocity = 0
  let moveVelocity = new THREE.Vector3(0, 0, 0)
  const inputAxis = new THREE.Vector3(inputY, inputX, 0)
  let rotationVelocity = 0

  // Pre-allocated objects to avoid per-frame GC pressure
  const _tmpV1 = new THREE.Vector3()
  const _tmpV2 = new THREE.Vector3()
  const _tmpQ1 = new THREE.Quaternion()
  const _tmpQ2 = new THREE.Quaternion()
  const _rootPos = new THREE.Vector3()
  const _meteorVec = new THREE.Vector3()
  let _cubeCamFrame = 0

  // explosion
  const exploded = []
  const goal = []

  let hp = 10
  let hpInterval = 0

  // cubemap
  const renderTarget = new THREE.WebGLCubeRenderTarget(256, {
    format: THREE.RGBFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    encoding: THREE.sRGBEncoding,
  })

  const refMat = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: 0xffffff,
    map: camTexture_,
  })

  // cubemap scene
  const cubeMapScene = new THREE.Scene()
  const cubeCamera = new THREE.CubeCamera(1, 1000, renderTarget)
  const sphere = new THREE.SphereGeometry(100, 15, 15)
  const sphereMesh = new THREE.Mesh(sphere, refMat)
  sphereMesh.scale.set(-1, 1, 1)
  sphereMesh.rotation.set(Math.PI, -Math.PI / 2, 0)
  cubeMapScene.add(sphereMesh)

  // スタート画面
  const startView = document.createElement('div')
  startView.id = 'startView'

  const startViewFlash = document.createElement('div')
  startViewFlash.id = 'startViewFlash'
  startView.appendChild(startViewFlash)

  // benchロゴとそれ以外は切り分ける
  const startViewMain = document.createElement('div')
  startViewMain.id = 'startViewMain'
  startView.appendChild(startViewMain)

  // 言語切り替えセグメンテッドボタン（右上固定）
  const langToggle = document.createElement('div')
  langToggle.id = 'langToggle'
  startViewMain.appendChild(langToggle)

  const langToggleJa = document.createElement('div')
  langToggleJa.className = 'langToggleItem active'
  langToggleJa.innerHTML = '日本語'
  langToggle.appendChild(langToggleJa)

  const langToggleEn = document.createElement('div')
  langToggleEn.className = 'langToggleItem'
  langToggleEn.innerHTML = 'English'
  langToggle.appendChild(langToggleEn)

  // スクロール可能なコンテンツ領域
  const startViewMainInner = document.createElement('div')
  startViewMainInner.id = 'startViewMainInner'
  startViewMain.appendChild(startViewMainInner)

  // タイトル
  const startViewTitle = document.createElement('div')
  startViewTitle.id = 'startViewTitle'
  startViewMainInner.appendChild(startViewTitle)

  const startViewTitleImage = document.createElement('div')
  startViewTitleImage.id = 'startViewTitleImage'
  startViewTitle.appendChild(startViewTitleImage)

  const startViewTitleLogo = document.createElement('div')
  startViewTitleLogo.id = 'startViewTitleLogo'
  startViewTitle.appendChild(startViewTitleLogo)

  // 説明１
  const startViewExp1 = document.createElement('div')
  startViewExp1.id = 'startViewExp1'
  startViewExp1.className = 'startViewExp'
  startViewMainInner.appendChild(startViewExp1)

  const startViewExp1Image = document.createElement('div')
  startViewExp1Image.className = 'startViewExpImage'
  startViewExp1.appendChild(startViewExp1Image)

  const startViewExp1Title = document.createElement('p')
  startViewExp1Title.className = 'startViewExpTitle'
  startViewExp1.appendChild(startViewExp1Title)

  const startViewExp1Text = document.createElement('p')
  startViewExp1Text.className = 'startViewExpText'
  startViewExp1.appendChild(startViewExp1Text)

  // 説明2
  const startViewExp2 = document.createElement('div')
  startViewExp2.id = 'startViewExp2'
  startViewExp2.className = 'startViewExp'
  startViewMainInner.appendChild(startViewExp2)

  const startViewExp2Image = document.createElement('div')
  startViewExp2Image.className = 'startViewExpImage'
  startViewExp2.appendChild(startViewExp2Image)

  const startViewExp2Title = document.createElement('p')
  startViewExp2Title.className = 'startViewExpTitle'
  startViewExp2.appendChild(startViewExp2Title)

  const startViewExp2Text = document.createElement('p')
  startViewExp2Text.className = 'startViewExpText'
  startViewExp2.appendChild(startViewExp2Text)

  // 説明3
  const startViewExp3 = document.createElement('div')
  startViewExp3.id = 'startViewExp3'
  startViewExp3.className = 'startViewExp'
  startViewMainInner.appendChild(startViewExp3)

  const startViewExp3Image = document.createElement('div')
  startViewExp3Image.className = 'startViewExpImage'
  startViewExp3.appendChild(startViewExp3Image)

  const startViewExp3Title = document.createElement('p')
  startViewExp3Title.className = 'startViewExpTitle'
  startViewExp3.appendChild(startViewExp3Title)

  const startViewExp3Text = document.createElement('p')
  startViewExp3Text.className = 'startViewExpText'
  startViewExp3.appendChild(startViewExp3Text)

  // スタートボタン（下部固定）
  const startButton = document.createElement('div')
  startButton.id = 'startButton'
  startViewMain.appendChild(startButton)

  // テキストコンテンツ（日英）
  const uiTexts = {
    ja: {
      exp1Title: 'カメラで空を見上げてください。',
      exp1Text: 'これは空にARを写して遊ぶゲームです。まずはカメラを空に向けてください。',
      exp2Title: '地球を運んで惑星衝突を避けるのが使命',
      exp2Text: 'あなたは地球を運んでいるロボットです。ジョイスティックを使って惑星衝突を避けてください。カメラの向いている方向に進むのでそれも重要です。',
      exp3Title: 'エナジーを欠かさないで',
      exp3Text: 'すぐにエネルギーが切れるので、エナジーボックスにぶつかりながら進んでください。',
      startButton: 'ゲームスタート',
    },
    en: {
      exp1Title: 'Look up at the sky with your camera.',
      exp1Text: 'This is an AR game played in the sky. First, point your camera toward the sky.',
      exp2Title: 'Your mission: carry the Earth and dodge planetary collisions',
      exp2Text: 'You are a robot carrying the Earth. Use the joystick to avoid planetary collisions. The direction your camera faces also determines your movement.',
      exp3Title: "Don't run out of energy",
      exp3Text: 'Energy drains quickly, so keep collecting energy boxes as you move.',
      startButton: 'START GAME',
    },
  }

  const updateTexts = (lang) => {
    const t = uiTexts[lang]
    startViewExp1Title.innerHTML = t.exp1Title
    startViewExp1Text.innerHTML = t.exp1Text
    startViewExp2Title.innerHTML = t.exp2Title
    startViewExp2Text.innerHTML = t.exp2Text
    startViewExp3Title.innerHTML = t.exp3Title
    startViewExp3Text.innerHTML = t.exp3Text
    startButton.innerHTML = t.startButton
  }
  updateTexts('ja')

  const switchLang = (lang) => {
    if (currentLang === lang) return
    currentLang = lang
    updateTexts(lang)
    if (lang === 'ja') {
      langToggleJa.classList.add('active')
      langToggleEn.classList.remove('active')
    } else {
      langToggleEn.classList.add('active')
      langToggleJa.classList.remove('active')
    }
  }
  langToggleJa.addEventListener('touchstart', (e) => { e.preventDefault(); switchLang('ja') })
  langToggleJa.addEventListener('click', () => switchLang('ja'))
  langToggleEn.addEventListener('touchstart', (e) => { e.preventDefault(); switchLang('en') })
  langToggleEn.addEventListener('click', () => switchLang('en'))

  document.body.appendChild(startView)

  const startGame = () => {
    started = true
    startView.style.display = 'none'
    startButton.removeEventListener('touchstart', startGame)
  }
  startButton.addEventListener('touchstart', startGame)

  // クリア画面
  const finishView = document.createElement('div')
  finishView.id = 'finishView'

  const finishViewMain = document.createElement('div')
  finishViewMain.id = 'finishViewMain'
  finishView.appendChild(finishViewMain)

  const finishViewTitle = document.createElement('div')
  finishViewTitle.id = 'finishViewTitle'
  finishViewMain.appendChild(finishViewTitle)

  const finishViewVideo = document.createElement('video')
  finishViewVideo.id = 'finishViewVideo'
  finishViewVideo.muted = true
  finishViewVideo.autoplay = true
  finishViewVideo.setAttribute('playsinline', '')
  finishViewVideo.src = FINISH_VIDEO
  finishViewMain.appendChild(finishViewVideo)

  const finishViewVideo2 = document.createElement('video')
  finishViewVideo2.id = 'finishViewVideo2'
  finishViewVideo2.muted = true
  finishViewVideo2.loop = true
  finishViewVideo2.autoplay = false
  finishViewVideo2.setAttribute('playsinline', '')
  finishViewVideo2.src = VICTORY_VIDEO
  finishViewMain.appendChild(finishViewVideo2)

  const finishViewTime = document.createElement('div')
  finishViewTime.id = 'finishViewTime'
  finishViewMain.appendChild(finishViewTime)

  const finishViewTimeStage1 = document.createElement('div')
  finishViewTimeStage1.id = 'finishViewTimeStage1'
  finishViewTimeStage1.className = 'finishViewTimeStage'
  finishViewTime.appendChild(finishViewTimeStage1)

  const finishViewTimeStage1Title = document.createElement('p')
  finishViewTimeStage1Title.id = 'finishViewTimeStage1Title'
  finishViewTimeStage1Title.className = 'finishViewTimeStageTitle'
  finishViewTimeStage1Title.innerHTML = 'STAGE1'
  finishViewTimeStage1.appendChild(finishViewTimeStage1Title)

  const finishViewTimeStage1Num = document.createElement('p')
  finishViewTimeStage1Num.id = 'finishViewTimeStage1Num'
  finishViewTimeStage1Num.className = 'finishViewTimeStageNum'
  finishViewTimeStage1.appendChild(finishViewTimeStage1Num)

  const finishViewTimeStage2 = document.createElement('div')
  finishViewTimeStage2.id = 'finishViewTimeStage2'
  finishViewTimeStage2.className = 'finishViewTimeStage'
  finishViewTime.appendChild(finishViewTimeStage2)

  const finishViewTimeStage2Title = document.createElement('p')
  finishViewTimeStage2Title.id = 'finishViewTimeStage2Title'
  finishViewTimeStage2Title.className = 'finishViewTimeStageTitle'
  finishViewTimeStage2Title.innerHTML = 'STAGE2'
  finishViewTimeStage2.appendChild(finishViewTimeStage2Title)

  const finishViewTimeStage2Num = document.createElement('p')
  finishViewTimeStage2Num.id = 'finishViewTimeStage2Num'
  finishViewTimeStage2Num.className = 'finishViewTimeStageNum'
  finishViewTimeStage2.appendChild(finishViewTimeStage2Num)

  const finishViewTimeStage3 = document.createElement('div')
  finishViewTimeStage3.id = 'finishViewTimeStage3'
  finishViewTimeStage3.className = 'finishViewTimeStage'
  finishViewTime.appendChild(finishViewTimeStage3)

  const finishViewTimeStage3Title = document.createElement('p')
  finishViewTimeStage3Title.id = 'finishViewTimeStage3Title'
  finishViewTimeStage3Title.className = 'finishViewTimeStageTitle'
  finishViewTimeStage3Title.innerHTML = 'STAGE3'
  finishViewTimeStage3.appendChild(finishViewTimeStage3Title)

  const finishViewTimeStage3Num = document.createElement('p')
  finishViewTimeStage3Num.id = 'finishViewTimeStage3Num'
  finishViewTimeStage3Num.className = 'finishViewTimeStageNum'
  finishViewTimeStage3.appendChild(finishViewTimeStage3Num)

  const finishViewTimeTitle = document.createElement('p')
  finishViewTimeTitle.id = 'finishViewTimeTitle'
  finishViewTimeTitle.innerHTML = 'TOTAL'
  finishViewTime.appendChild(finishViewTimeTitle)

  const finishViewTimeNum = document.createElement('p')
  finishViewTimeNum.id = 'finishViewTimeNum'
  finishViewTimeNum.innerHTML = '00:00'
  finishViewTime.appendChild(finishViewTimeNum)

  const finishViewCredit = document.createElement('div')
  finishViewCredit.id = 'finishViewCredit'
  finishViewMain.appendChild(finishViewCredit)

  const finishViewCreditTitle = document.createElement('p')
  finishViewCreditTitle.innerHTML = 'Thanks to'
  finishViewCredit.appendChild(finishViewCreditTitle)

  const finishViewCreditText = document.createElement('p')
  finishViewCreditText.innerHTML = 'SFX: Music generated by Mubert https://mubert.com/render, sci-fi-alien-ufo-warble-86812.Pixabay.https://pixabay.com/sound-effects/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=music&amp;utm_content=86812, 森田交一.2010.戦闘19.https://maou.audio/se_battle19/, 森田交一.2010.マジカル07.https://maou.audio/se_magical07/    Textures: Chrisser.2012.Space Texture 011.https://www.flickr.com/photos/chrisser/7061563019,Digital Hourglass.Europa texture map by Digital Hourglass.https://static.wikia.nocookie.net/planet-texture-maps/images/9/91/Dh_europa_texture.png/revision/latest?cb=20211212221016, Solar System Scope.2014.https://www.solarsystemscope.com/textures/download/2k_mercury.jpg, Venus.https://static.wikia.nocookie.net/planet-texture-maps/images/1/19/Mars_Map.png/revision/latest?cb=20190402042909, NASA.2016.Map of Ganymede by Björn Jónsson and centered by J N Squire.jpg.https://commons.wikimedia.org/wiki/File:Map_of_Ganymede_by_Bj%C3%B6rn_J%C3%B3nsson_and_centered_by_J_N_Squire.jpg, A map of Callisto.https://bjj.mmedia.is/data/callisto/index.html'
  finishViewCredit.appendChild(finishViewCreditText)

  const continueButton = document.createElement('div')
  finishViewMain.appendChild(continueButton)
  continueButton.id = 'continueButton'
  continueButton.innerHTML = 'CONTINUE NEXT STAGE'

  document.body.appendChild(finishView)

  // 任務失敗画面
  const failedView = document.createElement('div')
  failedView.id = 'failedView'

  const failedViewMain = document.createElement('div')
  failedViewMain.id = 'failedViewMain'
  failedView.appendChild(failedViewMain)

  const failedViewTitle = document.createElement('div')
  failedViewTitle.id = 'failedViewTitle'
  failedViewMain.appendChild(failedViewTitle)

  const failedViewVideo = document.createElement('video')
  failedViewVideo.id = 'failedViewVideo'
  failedViewVideo.muted = true
  failedViewVideo.autoplay = true
  failedViewVideo.setAttribute('playsinline', '')
  failedViewVideo.src = FAILED_VIDEO
  failedViewMain.appendChild(failedViewVideo)

  const restartButton = document.createElement('div')
  restartButton.id = 'restartButton'
  restartButton.innerHTML = 'RESTART'
  failedViewMain.appendChild(restartButton)

  document.body.appendChild(failedView)

  // リセンターボタンなど
  const recenterButton = document.createElement('div')
  document.body.appendChild(recenterButton)
  recenterButton.id = 'recenterButton'

  const recenterImage = document.createElement('div')
  recenterButton.appendChild(recenterImage)

  const recenterTxt = document.createElement('p')
  recenterButton.appendChild(recenterTxt)
  recenterTxt.innerHTML = 'Recenter<br>Scene'

  const handleRecenter = () => {
    XR8.LayersController.recenter()
  }
  recenterButton.addEventListener('touchstart', handleRecenter)

  if (skyDebugMode) {
    const invertMaskButton = document.createElement('div')
    document.body.appendChild(invertMaskButton)
    invertMaskButton.id = 'invertMaskButton'

    const invertMaskImage = document.createElement('div')
    invertMaskButton.appendChild(invertMaskImage)

    const invertMaskTxt = document.createElement('p')
    invertMaskButton.appendChild(invertMaskTxt)
    invertMaskTxt.innerHTML = 'Invert<br>Mask'

    const handleInvertMask = () => {
      invertMaskBoolean = !invertMaskBoolean
      XR8.LayersController.configure({layers: {sky: {invertLayerMask: invertMaskBoolean}}})
    }
    invertMaskButton.addEventListener('touchstart', handleInvertMask)
  }

  const statusBar = document.createElement('div')
  statusBar.id = 'statusBar'
  const statusBarInner = document.createElement('div')
  statusBarInner.id = 'statusBarInner'
  statusBar.appendChild(statusBarInner)
  const hpBar = document.createElement('div')
  hpBar.id = 'hpBar'
  hpBar.style.width = `${(hp / 20) * 100}%`
  statusBarInner.appendChild(hpBar)
  const hpGet = document.createElement('div')
  hpGet.id = 'hpGet'
  statusBarInner.appendChild(hpGet)
  const hpLost = document.createElement('div')
  hpLost.id = 'hpLost'
  statusBarInner.appendChild(hpLost)
  document.body.appendChild(statusBar)

  function createExplosion(scene, [rootX = 0, rootY = 0, rootZ = 0] = []) {
    const SIZE = 10
    const LENGTH = 100
    const vertices = []
    const directions = []

    for (let i = 0; i < LENGTH; i++) {
      const x = SIZE * (Math.random() - 0.5)
      const y = SIZE * (Math.random() - 0.5)
      const z = SIZE * (Math.random() - 0.5)

      vertices.push(x, y, z)
      directions.push(x * 0.1, y * 0.1, z * 0.1)
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position',
      new THREE.Float32BufferAttribute(vertices, 3))

    const material = new THREE.PointsMaterial({
      size: 1,
      color: 0xffffff,
    })

    // 物体を作成
    this.object = new THREE.Points(geometry, material)
    scene.add(this.object)
    this.object.position.set(rootX, rootY, rootZ)
    this.elapsed = 0

    this.explode = () => {
      if (this.elapsed > 100) {
        this.object.removeFromParent()
      } else {
        this.elapsed += 1
        for (let i = 0; i < vertices.length; i += 3) {
          this.object.geometry.attributes.position.array[i] += directions[i]
          this.object.geometry.attributes.position.array[i + 1] += directions[i + 1]
          this.object.geometry.attributes.position.array[i + 2] += directions[i + 2]
        }
        this.object.geometry.attributes.position.needsUpdate = true
      }
    }
  }

  function createGoal(addTo, [rootX = 0, rootY = 0, rootZ = 0] = []) {
    // 1辺あたりに配置するオブジェクトの個数
    const CELL_NUM = 5
    // 結合用のジオメトリを格納する配列
    const boxes = []
    for (let i = 0; i < CELL_NUM; i++) {
      for (let j = 0; j < CELL_NUM; j++) {
        for (let k = 0; k < CELL_NUM; k++) {
          // 立方体個別の要素を作成
          const geometryBox = new THREE.BoxGeometry(3, 3, 3)

          // 座標調整
          const geometryTranslated = geometryBox.translate(
            6 * (i - CELL_NUM / 2),
            6 * (j - CELL_NUM / 2),
            6 * (k - CELL_NUM / 2)
          )

          // ジオメトリを保存
          boxes.push(geometryTranslated)
        }
      }
    }
    // ジオメトリを生成
    const geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(boxes)
    // マテリアルを作成
    const material = new THREE.MeshNormalMaterial()
    material.transparent = true
    material.opacity = 0.7
    // メッシュを作成
    this.object = new THREE.Mesh(geometry, material)

    const fontLoader = new THREE.FontLoader()
    fontLoader.load(
      '//cdn.rawgit.com/mrdoob/three.js/r132/examples/fonts/droid/droid_sans_regular.typeface.json',
      (font) => {
        const textGeometry = new THREE.TextGeometry('GOAL', {
          font,       // フォントを指定 (FontLoaderで読み込んだjson形式のフォント)
          size: 10,   // 文字のサイズを指定
          height: 1,  // 文字の厚さを指定
        })
        textGeometry.center()
        const textMaterial = new THREE.MeshBasicMaterial({
          color: '#ccc',
        })
        const textMesh = new THREE.Mesh(textGeometry, textMaterial)
        textMesh.position.set(0, 20, 0)
        textMesh.scale.set(1, 1, 1)

        this.object.add(textMesh)
        addTo.add(this.object)
        this.object.position.set(rootX, rootY, rootZ)
        collisionList.push([this.object, 30, 'goal', false])
      }
    )

    this.heartbeat = () => {
      this.object.rotation.y -= 0.01
    }
  }

  const removeAll = (obj) => {
    if (obj.children.length > 0) {
      for (let i = 0; i < obj.children.length; i++) {
        removeAll(obj.children[i])
      }
    }
    if (obj.isMesh) {
      obj.geometry.dispose()
      obj.material.dispose()
    }
    if (obj.parent) {
      obj.parent.remove(obj)
    }
  }

  const removeAllChildren = (obj) => {
    for (let i = 0; i < obj.children.length; i++) {
      if (obj.children[i].children.length > 0) {
        removeAllChildren(obj.children[i])
      }
      if (obj.children[i].isMesh) {
        obj.children[i].geometry.dispose()
        obj.children[i].material.dispose()
      }
      if (obj.children[i].parent) {
        obj.remove(obj.children[i])
      }
    }
    if (obj.children.length > 0) {
      removeAllChildren(obj)
    }
  }

  const loadStage = async (SCENE, MODEL = STAGE1_POSITION_MODEL) => {
    loader.load(
      // Resource URL
      MODEL,
      // Called when the resource is loaded
      (positionGltf) => {
        const positionLoadedModel = positionGltf.scene
        SCENE.add(positionLoadedModel)
        positionLoadedModel.scale.set(1, 1, 1)
        for (let i = 0; i < positionLoadedModel.children.length; i++) {
          positionLoadedModel.children[i].visible = false
          const pos = positionLoadedModel.children[i].position
          switch (true) {
            case /goal.*/.test(positionLoadedModel.children[i].name): {
              goal.push(
                new createGoal(planetGroup, [pos.x, pos.y, pos.z])
              )
              break
            }
            case /point.*/.test(positionLoadedModel.children[i].name): {
              const clonedModel = cubeLoadedModel.clone()
              planetGroup.add(clonedModel)
              clonedModel.position.set(pos.x, pos.y, pos.z)
              // 障害物リスト。一応当たったかフラグを付けてみる（現状はメモリ容量を考えて削除する方向）

              collisionList.push([clonedModel, 8, 'point', false])
              break
            }
            case /asteroid.*/.test(positionLoadedModel.children[i].name): {
              const clonedModel = asteroidLoadedModel.clone()
              planetGroup.add(clonedModel)
              clonedModel.position.set(pos.x, pos.y, pos.z)
              collisionList.push([clonedModel, 15, 'obstacle', false])
              break
            }
            case /asteroid2.*/.test(positionLoadedModel.children[i].name): {
              const clonedModel = asteroidLoadedModel2.clone()
              planetGroup.add(clonedModel)
              clonedModel.position.set(pos.x, pos.y, pos.z)
              collisionList.push([clonedModel, 30, 'obstacle', false])
              break
            }
            case /calisto.*/.test(positionLoadedModel.children[i].name): {
              const clonedModel = calistoLoadedModel.clone()
              planetGroup.add(clonedModel)
              clonedModel.position.set(pos.x, pos.y, pos.z)
              collisionList.push([clonedModel, 12, 'obstacle', false])
              break
            }
            case /europe.*/.test(positionLoadedModel.children[i].name): {
              const clonedModel = europeLoadedModel.clone()
              planetGroup.add(clonedModel)
              clonedModel.position.set(pos.x, pos.y, pos.z)
              collisionList.push([clonedModel, 7.5, 'obstacle', false])
              break
            }
            case /ganymede.*/.test(positionLoadedModel.children[i].name): {
              const clonedModel = ganymedeLoadedModel.clone()
              planetGroup.add(clonedModel)
              clonedModel.position.set(pos.x, pos.y, pos.z)
              collisionList.push([clonedModel, 13, 'obstacle', false])
              break
            }
            case /io.*/.test(positionLoadedModel.children[i].name): {
              const clonedModel = ioLoadedModel.clone()
              planetGroup.add(clonedModel)
              clonedModel.position.set(pos.x, pos.y, pos.z)
              collisionList.push([clonedModel, 9, 'obstacle', false])
              break
            }
            case /jupiter.*/.test(positionLoadedModel.children[i].name): {
              const clonedModel = jupiterLoadedModel.clone()
              planetGroup.add(clonedModel)
              clonedModel.position.set(pos.x, pos.y, pos.z)
              collisionList.push([clonedModel, 349.5, 'obstacle', false])
              break
            }
            case /mars.*/.test(positionLoadedModel.children[i].name): {
              const clonedModel = marsLoadedModel.clone()
              planetGroup.add(clonedModel)
              clonedModel.position.set(pos.x, pos.y, pos.z)
              collisionList.push([clonedModel, 16.5, 'obstacle', false])
              break
            }
            case /mercury.*/.test(positionLoadedModel.children[i].name): {
              const clonedModel = mercuryLoadedModel.clone()
              planetGroup.add(clonedModel)
              clonedModel.position.set(pos.x, pos.y, pos.z)
              collisionList.push([clonedModel, 12, 'obstacle', false])
              break
            }
            case /moon.*/.test(positionLoadedModel.children[i].name): {
              const clonedModel = moonLoadedModel.clone()
              planetGroup.add(clonedModel)
              clonedModel.position.set(pos.x, pos.y, pos.z)
              collisionList.push([clonedModel, 8.5, 'obstacle', false])
              break
            }
            case /neptune.*/.test(positionLoadedModel.children[i].name): {
              const clonedModel = neptuneLoadedModel.clone()
              planetGroup.add(clonedModel)
              clonedModel.position.set(pos.x, pos.y, pos.z)
              collisionList.push([clonedModel, 123, 'obstacle', false])
              break
            }
            case /pluto.*/.test(positionLoadedModel.children[i].name): {
              const clonedModel = plutoLoadedModel.clone()
              planetGroup.add(clonedModel)
              clonedModel.position.set(pos.x, pos.y, pos.z)
              collisionList.push([clonedModel, 5.5, 'obstacle', false])
              break
            }
            case /saturn.*/.test(positionLoadedModel.children[i].name): {
              const clonedModel = saturnLoadedModel.clone()
              planetGroup.add(clonedModel)
              clonedModel.position.set(pos.x, pos.y, pos.z)
              collisionList.push([clonedModel, 284, 'obstacle', false])
              break
            }
            case /sun.*/.test(positionLoadedModel.children[i].name): {
              const clonedModel = sunLoadedModel.clone()
              planetGroup.add(clonedModel)
              clonedModel.position.set(pos.x, pos.y, pos.z)
              collisionList.push([clonedModel, 3480, 'obstacle', false])
              break
            }
            case /uranus.*/.test(positionLoadedModel.children[i].name): {
              const clonedModel = uranusLoadedModel.clone()
              planetGroup.add(clonedModel)
              clonedModel.position.set(pos.x, pos.y, pos.z)
              collisionList.push([clonedModel, 67, 'obstacle', false])
              break
            }
            case /venus.*/.test(positionLoadedModel.children[i].name): {
              const clonedModel = venusLoadedModel.clone()
              planetGroup.add(clonedModel)
              clonedModel.position.set(pos.x, pos.y, pos.z)
              collisionList.push([clonedModel, 30, 'obstacle', false])
              break
            }
            default:
              break
          }
        }
        removeAll(positionLoadedModel)
        initialized = true
      }
    )
  }

  const pointGet = async () => new Promise((resolve) => {
    currentStagePoint += 1
    if (hp < 20) {
      hpBar.style.opacity = 1
      hpGet.style.display = 'block'
      hpGet.style.left = `calc(${(hp / 20) * 100}% - 8px)`
      hpGet.style.animation = 'getSlide 0.3s ease'
      setTimeout(() => {
        hp += 1
        hpBar.style.width = `${(hp / 20) * 100}%`
        hpGet.style.display = 'none'
        hpGet.style.width = '0'
        hpGet.style.left = '0'
        hpBar.style.opacity = 0.5
        resolve()
      }, 300)
    }
  })

  const pointLost = async (shake = false, point = 1) => new Promise((resolve) => {
    hpBar.style.opacity = 1
    hp -= point
    hpLost.style.display = 'block'
    hpLost.style.left = `calc(${(hp / 20) * 100}% - 8px)`
    hpBar.style.width = `${(hp / 20) * 100}%`
    hpLost.style.animation = 'lostSlide 0.3s ease'
    if (shake) {
      statusBar.style.animation = 'lostShake 1s ease'
    }
    setTimeout(() => {
      hpLost.style.display = 'none'
      hpLost.style.width = '0'
      hpLost.style.left = '0'
      hpBar.style.opacity = 0.5
      statusBar.style.animation = null
    }, 300)
  })

  const finish = () => {
    music.stop()
    if (engineSound.isPlaying) {
      engineSound.stop()
    }
    finishMusic.play()
    initialized = false
    started = false
    finishView.style.display = 'block'
    let finishTime

    switch (clearedStage) {
      case 0:
        stage1Point = currentStagePoint
        currentStagePoint = 0
        finishViewTimeStage1Num.innerHTML = `${Math.round(lap1 * 100) / 100} (bonus:${-stage1Point})`
        finishViewTimeNum.innerHTML = Math.round((lap1 - stage1Point) * 100) / 100
        finishViewVideo.play()
        break
      case 1:
        stage2Point = currentStagePoint
        currentStagePoint = 0
        finishViewTimeStage2Num.innerHTML = `${Math.round(lap1 * 100) / 100} (bonus:${-stage2Point})`
        finishViewTimeNum.innerHTML = Math.round((lap1 + lap2 - stage1Point - stage2Point) * 100) / 100
        finishViewVideo.play()
        break
      case 2:
        stage3Point = currentStagePoint
        currentStagePoint = 0
        finishViewTimeStage3Num.innerHTML = `${Math.round(lap3 * 100) / 100} (bonus:${-stage3Point})`
        finishViewTimeNum.innerHTML = Math.round((lap1 + lap2 + lap3 - stage1Point - stage2Point - stage3Point) * 100) / 100
        continueButton.innerHTML = 'RESTART GAME'
        finishViewMain.classList.add('finishAll')
        finishViewVideo2.play()
        break
      case 3:
        stage1Point = currentStagePoint
        currentStagePoint = 0
        finishViewTimeStage1Num.innerHTML = `${Math.round(lap1 * 100) / 100} (bonus:${-stage1Point})`
        finishViewTimeStage2Num.innerHTML = ''
        finishViewTimeStage3Num.innerHTML = ''
        finishViewTimeNum.innerHTML = Math.round((lap1 - stage1Point) * 100) / 100
        continueButton.innerHTML = 'CONTINUE NEXT STAGE'
        finishViewMain.classList.remove('finishAll')
        finishViewVideo.play()
        break
      case 4:
        stage2Point = currentStagePoint
        currentStagePoint = 0
        finishViewTimeStage2Num.innerHTML = `${Math.round(lap2 * 100) / 100} (bonus:${-stage2Point})`
        finishViewTimeNum.innerHTML = Math.round((lap1 + lap2 - stage1Point - stage2Point) * 100) / 100
        finishViewVideo.play()
        break
      case 5:
        stage3Point = currentStagePoint
        currentStagePoint = 0
        finishViewTimeStage3Num.innerHTML = `${Math.round(lap3 * 100) / 100} (bonus:${-stage3Point})`
        finishViewTimeNum.innerHTML = Math.round((lap1 + lap2 + lap3 - stage1Point - stage2Point - stage3Point) * 100) / 100
        continueButton.innerHTML = 'RESTART GAME'
        finishViewMain.classList.add('finishAll')
        finishViewVideo2.play()
        break
      default:
        break
    }
    removeAllChildren(planetGroup)

    planetGroup.position.set(0, 0, 0)
    planetGroup.rotation.set(Math.PI / 4, 0, 0)
    planetCenter.rotation.set(0, 0, 0)
    clearedStage += 1
  }

  const continueGame = async () => {
    const {scene, camera, renderer} = XR8.Threejs.xrScene()
    switch (clearedStage) {
      case 1:
        await loadStage(scene, STAGE2_POSITION_MODEL)
        break
      case 2:
        meteorSpeed = 0.5
        await loadStage(scene, STAGE3_POSITION_MODEL)
        break
      case 3:
        meteorSpeed = 0.5
        await loadStage(scene, STAGE1_POSITION_MODEL)
        lap1 = 0
        lap2 = 0
        lap3 = 0
        break
      case 4:
        await loadStage(scene, STAGE2_POSITION_MODEL)
        break
      case 5:
        meteorSpeed = 1
        await loadStage(scene, STAGE3_POSITION_MODEL)
        break
      default:
        meteorSpeed = 0.1
        await loadStage(scene, STAGE1_POSITION_MODEL)
        break
    }
    handleRecenter()
    finishMusic.stop()
    music.play()
    started = true
    finishView.style.display = 'none'
    // ステータスをリセットするか？
  }
  continueButton.addEventListener('touchstart', continueGame)

  const failed = () => {
    music.stop()
    if (engineSound.isPlaying) {
      engineSound.stop()
    }
    finishMusic.play()
    initialized = false
    started = false
    failedView.style.display = 'block'
    failedViewVideo.play()
    removeAllChildren(planetGroup)
    planetGroup.position.set(0, 0, 0)
    planetGroup.rotation.set(Math.PI / 4, 0, 0)
    planetCenter.rotation.set(0, 0, 0)
  }

  const restartGame = async () => {
    const {scene, camera, renderer} = XR8.Threejs.xrScene()
    switch (clearedStage) {
      case 0:
        await loadStage(scene, STAGE1_POSITION_MODEL)
        break
      case 1:
        await loadStage(scene, STAGE2_POSITION_MODEL)
        break
      case 2:
        await loadStage(scene, STAGE3_POSITION_MODEL)
        break
      case 3:
        await loadStage(scene, STAGE1_POSITION_MODEL)
        break
      case 4:
        await loadStage(scene, STAGE2_POSITION_MODEL)
        break
      case 5:
        await loadStage(scene, STAGE3_POSITION_MODEL)
        break
      default:
        await loadStage(scene, STAGE1_POSITION_MODEL)
        break
    }
    handleRecenter()
    finishMusic.stop()
    music.play()
    hp = 9
    pointGet()
    started = true
    failedView.style.display = 'none'
  }
  restartButton.addEventListener('touchstart', restartGame)

  // Create a sky scene
  const initSkyScene = async ({scene, camera, renderer}) => {
    const loadSFX = async () => new Promise((resolve) => {
      const audioListener = new THREE.AudioListener()
      camera.add(audioListener)
      const audioLoader = new THREE.AudioLoader()

      music = new THREE.Audio(audioListener)
      audioLoader.load(MUSIC_MP3, (buffer) => {
        music.setBuffer(buffer)
        music.setLoop(true)
        music.setVolume(0.03)
        music.play()
      })

      finishMusic = new THREE.Audio(audioListener)
      audioLoader.load(FINISH_MUSIC_MP3, (buffer) => {
        finishMusic.setBuffer(buffer)
        finishMusic.setLoop(false)
        finishMusic.setVolume(0.03)
      })

      engineSound = new THREE.Audio(audioListener)
      audioLoader.load(ENGINE_MP3, (buffer) => {
        engineSound.setBuffer(buffer)
        engineSound.setLoop(true)
        engineSound.setVolume(0.04)
      })

      pointSound = new THREE.Audio(audioListener)
      audioLoader.load(POINTSOUND_MP3, (buffer) => {
        pointSound.setBuffer(buffer)
        pointSound.setLoop(false)
        pointSound.setVolume(0.2)
      })
      collisionSound = new THREE.Audio(audioListener)
      audioLoader.load(COLLISIONSOUND_MP3, (buffer) => {
        collisionSound.setBuffer(buffer)
        collisionSound.setLoop(false)
        collisionSound.setVolume(0.05)
      })
      resolve()
    })

    await loadSFX()

    renderer.outputEncoding = THREE.sRGBEncoding

    // Add soft white light to the scene.
    scene.add(new THREE.AmbientLight(0x404040, 7))

    // Add sky dome.
    const skyGeo = new THREE.SphereGeometry(1000, 16, 12)

    const textureLoader = new THREE.TextureLoader()
    const texture = textureLoader.load(TEXTURE)
    texture.encoding = THREE.sRGBEncoding
    texture.mapping = THREE.EquirectangularReflectionMapping
    const skyMaterial = new THREE.MeshBasicMaterial({
      map: texture,
    })

    skyBox = new THREE.Mesh(skyGeo, skyMaterial)
    skyBox.material.side = THREE.BackSide
    scene.add(skyBox)
    skyBox.visible = true

    setTimeout(() => {
      startViewFlash.style.display = 'none'
      startViewMain.style.display = 'block'
      setTimeout(() => {
        startButton.style.animation = 'attention 1s ease infinite'
      }, 2000)
    }, 4000)

    document.addEventListener('joystickmove', (e) => {
      inputX = e.detail.x / 35
      inputY = e.detail.y / 35
      inputVelocity = 1
    })

    document.addEventListener('joystickend', (e) => {
      inputX = 0
      inputY = 0
      inputVelocity = 0
    })

    const loadCube = async () => new Promise((resolve) => {
      loader.load(
        // Resource URL
        CUBE_MODEL,
        // Called when the resource is loaded
        (gltf) => {
          gltf.scene.traverse((o) => {
            if (o.isMesh) {
              o.material.envMap = cubeCamera.renderTarget.texture
            }
          })
          cubeLoadedModel = gltf.scene
          cubeLoadedModel.castShadow = true
          cubeLoadedModel.scale.set(0.5, 0.5, 0.5)
          resolve()
        }
      )
    })

    const loadAsteroid = async () => new Promise((resolve) => {
      loader.load(
      // Resource URL
        ASTEROID_MODEL,
        // Called when the resource is loaded
        (asteroidGltf) => {
          asteroidLoadedModel = asteroidGltf.scene
          asteroidLoadedModel.castShadow = true
          asteroidLoadedModel.scale.set(1, 1, 1)
          resolve()
        }
      )
    })

    const loadAsteroid2 = async () => new Promise((resolve) => {
      loader.load(
      // Resource URL
        ASTEROID2_MODEL,
        // Called when the resource is loaded
        (asteroid2Gltf) => {
          asteroidLoadedModel2 = asteroid2Gltf.scene
          asteroidLoadedModel2.castShadow = true
          asteroidLoadedModel2.scale.set(1, 1, 1)
          resolve()
        }
      )
    })

    const loadCalisto = async () => new Promise((resolve) => {
      loader.load(
      // Resource URL
        CALISTO_MODEL,
        // Called when the resource is loaded
        (saturnGltf) => {
          calistoLoadedModel = saturnGltf.scene
          calistoLoadedModel.castShadow = true
          calistoLoadedModel.scale.set(1, 1, 1)
          resolve()
        }
      )
    })

    const loadEurope = async () => new Promise((resolve) => {
      loader.load(
      // Resource URL
        EUROPE_MODEL,
        // Called when the resource is loaded
        (saturnGltf) => {
          europeLoadedModel = saturnGltf.scene
          europeLoadedModel.castShadow = true
          europeLoadedModel.scale.set(1, 1, 1)
          resolve()
        }
      )
    })

    const loadGanymede = async () => new Promise((resolve) => {
      loader.load(
      // Resource URL
        GANYMEDE_MODEL,
        // Called when the resource is loaded
        (saturnGltf) => {
          ganymedeLoadedModel = saturnGltf.scene
          ganymedeLoadedModel.castShadow = true
          ganymedeLoadedModel.scale.set(1, 1, 1)
          resolve()
        }
      )
    })

    const loadIo = async () => new Promise((resolve) => {
      loader.load(
      // Resource URL
        IO_MODEL,
        // Called when the resource is loaded
        (saturnGltf) => {
          ioLoadedModel = saturnGltf.scene
          ioLoadedModel.castShadow = true
          ioLoadedModel.scale.set(1, 1, 1)
          resolve()
        }
      )
    })

    const loadJupiter = async () => new Promise((resolve) => {
      loader.load(
      // Resource URL
        JUPITER_MODEL,
        // Called when the resource is loaded
        (jupiterGltf) => {
          jupiterLoadedModel = jupiterGltf.scene
          jupiterLoadedModel.castShadow = true
          jupiterLoadedModel.scale.set(1, 1, 1)
          resolve()
        }
      )
    })

    const loadMars = async () => new Promise((resolve) => {
      loader.load(
      // Resource URL
        MARS_MODEL,
        // Called when the resource is loaded
        (marsGltf) => {
          marsLoadedModel = marsGltf.scene
          marsLoadedModel.castShadow = true
          marsLoadedModel.scale.set(1, 1, 1)
          resolve()
        }
      )
    })

    const loadMercury = async () => new Promise((resolve) => {
      loader.load(
      // Resource URL
        MERCURY_MODEL,
        // Called when the resource is loaded
        (mercuryGltf) => {
          mercuryLoadedModel = mercuryGltf.scene
          mercuryLoadedModel.castShadow = true
          mercuryLoadedModel.scale.set(1, 1, 1)
          resolve()
        }
      )
    })

    const loadMoon = async () => new Promise((resolve) => {
      loader.load(
      // Resource URL
        MOON_MODEL,
        // Called when the resource is loaded
        (moonGltf) => {
          moonLoadedModel = moonGltf.scene
          moonLoadedModel.castShadow = true
          moonLoadedModel.scale.set(1, 1, 1)
          resolve()
        }
      )
    })

    const loadNeptune = async () => new Promise((resolve) => {
      loader.load(
      // Resource URL
        NEPTUNE_MODEL,
        // Called when the resource is loaded
        (neptuneGltf) => {
          neptuneLoadedModel = neptuneGltf.scene
          neptuneLoadedModel.castShadow = true
          neptuneLoadedModel.scale.set(1, 1, 1)
          resolve()
        }
      )
    })

    const loadPluto = async () => new Promise((resolve) => {
      loader.load(
      // Resource URL
        PLUTO_MODEL,
        // Called when the resource is loaded
        (plutoGltf) => {
          plutoLoadedModel = plutoGltf.scene
          plutoLoadedModel.castShadow = true
          plutoLoadedModel.scale.set(1, 1, 1)
          resolve()
        }
      )
    })

    const loadSaturn = async () => new Promise((resolve) => {
      loader.load(
      // Resource URL
        SATURN_MODEL,
        // Called when the resource is loaded
        (saturnGltf) => {
          saturnLoadedModel = saturnGltf.scene
          saturnLoadedModel.castShadow = true
          saturnLoadedModel.scale.set(1, 1, 1)
          resolve()
        }
      )
    })

    // const loadSun = async () => new Promise((resolve) => {
    //   loader.load(
    //   // Resource URL
    //     SUN_MODEL,
    //     // Called when the resource is loaded
    //     (sunGltf) => {
    //       sunLoadedModel = sunGltf.scene
    //       sunLoadedModel.castShadow = true
    //       sunLoadedModel.scale.set(1, 1, 1)
    //       resolve()
    //     }
    //   )
    // })

    const loadUranus = async () => new Promise((resolve) => {
      loader.load(
      // Resource URL
        URANUS_MODEL,
        // Called when the resource is loaded
        (uranusGltf) => {
          uranusLoadedModel = uranusGltf.scene
          uranusLoadedModel.castShadow = true
          uranusLoadedModel.scale.set(1, 1, 1)
          resolve()
        }
      )
    })

    const loadVenus = async () => new Promise((resolve) => {
      loader.load(
      // Resource URL
        VENUS_MODEL,
        // Called when the resource is loaded
        (venusGltf) => {
          venusLoadedModel = venusGltf.scene
          venusLoadedModel.castShadow = true
          venusLoadedModel.scale.set(1, 1, 1)
          resolve()
        }
      )
    })

    const addPuller = async () => new Promise((resolve) => {
      loader.load(
        PULLER_MODEL,
        (gltf) => {
          puller.add(gltf.scene)
          scene.add(puller)
          resolve()
        }
      )
    })

    const addPullerCharacter = async () => new Promise((resolve) => {
      loader.load(
        PULLER_CHARACTER_MODEL,
        (gltf) => {
          pullCharacter = gltf.scene
          const {animations} = gltf
          mixer = new THREE.AnimationMixer(pullCharacter)

          const anime = mixer.clipAction(animations[0])
          anime.play()
          // blenderで位置調整などした方が良いかもしれない。
          pullCharacter.scale.set(0.1, 0.1, 0.1)
          pullCharacter.rotation.set(Math.PI / 4, Math.PI, 0)
          pullCharacter.position.set(0, 0, -1)
          puller.add(pullCharacter)
          resolve()
        }
      )
    })

    const loadPlanetGltf = async () => new Promise((resolve) => {
      Promise.all([loadCube(), loadAsteroid(), loadAsteroid2(), loadCalisto(), loadEurope(),
        loadGanymede(), loadIo(), loadJupiter(), loadMars(), loadMercury(), loadMoon(),
        loadNeptune(), loadPluto(), loadSaturn(), loadUranus(), loadVenus(),
        addPuller(), addPullerCharacter()]).then(() => {
        resolve()
      })
    })
    await loadPlanetGltf()

    await loadStage(scene, STAGE1_POSITION_MODEL)
    scene.add(planetCenter)
  }
  // end initSkyScene

  const layerFound = ({detail}) => {
    if (detail?.name === 'sky') {
      XR8.LayersController.recenter()
    }
  }

  const animate = () => {
    if (!initialized) return
    const cameraQuaternion = camera_.quaternion
    _tmpQ2.copy(cameraQuaternion)

    const makeRotation = (force = 0.0005) => {
      // インプット回転軸に入力されたX軸Y軸を入れてVector3にする
      _tmpV1.set(inputY, inputX, 0)
      // カメラの角度をかけて見た目上のX軸Y軸に変換
      _tmpV1.applyQuaternion(cameraQuaternion)
      // X軸Y軸の強さの平均を回転ボリュームとする
      const inputRotationVolume = (Math.abs(inputX) + Math.abs(inputY) / 2)
      // XYZいずれかの軸のプラスマイナスが反転している場合
      if (Math.sign(inputAxis.x) !== Math.sign(_tmpV1.x) ||
         Math.sign(inputAxis.y) !== Math.sign(_tmpV1.y) ||
          Math.sign(inputAxis.z) !== Math.sign(_tmpV1.z)
      ) {
        // 回転ボリュームが0.05以上だったら0.01弱める
        if (rotationVelocity > 0.05) {
          rotationVelocity -= 0.01
        }
      } else if (rotationVelocity < 10) {
        // 回転の向きは順向きなので、回転力*0.0025分追加する
        rotationVelocity += inputRotationVolume * force * fpsRatio
      }
      // インプット回転軸を0.05倍して弱める
      _tmpV1.multiplyScalar(0.05)
      // 弱めたインプット回転軸を回転軸に追加
      inputAxis.add(_tmpV1)
      // 追加した上でノーマライズして軸として正規化
      inputAxis.normalize()
      _tmpQ1.setFromAxisAngle(inputAxis, -(Math.PI / 18) * rotationVelocity)
      _tmpQ2.multiply(_tmpQ1)
    }

    const makeVelocity = () => {
      // 移動
      // 進行方向のVector3を一旦半分に弱める。
      moveVelocity.multiplyScalar(0.5)
      // 入力値に向けても動かす。
      _tmpV1.set(-inputX * 0.3, inputY * 0.3, 0)
      moveVelocity.add(_tmpV1)
      // カメラの見ている方向の真逆を進行方向に追加
      camera_.getWorldDirection(_tmpV2).negate()
      moveVelocity.add(_tmpV2)
      // 星達の回転を逆にしてapplyすることで、見た目上の向きを再現。
      planetCenter.getWorldQuaternion(_tmpQ1).invert()
      moveVelocity.applyQuaternion(_tmpQ1)
    }

    const reduceRotation = (resistance = 0.01) => {
      // 回転ボリュームがresistance以上だったらresistance分減らす
      if (rotationVelocity > resistance) {
        rotationVelocity -= resistance
      } else {
        // 回転ボリュームが0.01以下だったら回転を止める。回転軸もリセット。
        rotationVelocity = 0
        inputAxis.set(0, 0, 0)
      }
    }

    const reduceVelocity = (resistance = 0.01) => {
      if (moveVelocity.length() > resistance) {
        moveVelocity.multiplyScalar(1 - resistance)
      } else {
        moveVelocity.set(0, 0, 0)
      }
    }

    // 押されている間
    if (inputVelocity !== 0 && camera_) {
      if (!engineSound.isPlaying) {
        engineSound.play()
      }
      // 最大回転
      if (Math.abs(inputY) > 0.9 || Math.abs(inputX) > 0.9) {
        makeRotation(0.001)
        makeVelocity()
      } else if (Math.abs(inputY) > 0.1 || Math.abs(inputX) > 0.1) {
        makeRotation(0.0005)
        makeVelocity()
      } else {
        // 押しているだけ→直進
        reduceRotation(0.01)
        makeVelocity()
      }
    } else {
      if (engineSound.isPlaying) {
        engineSound.stop()
      }
      reduceRotation(0.005)
      reduceVelocity(0.01)
    }

    // 常に
    // inputAxisに対して、rotationVelocity度分回転する（rotationVelocityは常に正の値。マイナス回転はinputAxisで作る）
    planetCenter.rotateOnWorldAxis(inputAxis, (Math.PI / 180) * rotationVelocity)
    puller.quaternion.slerp(_tmpQ2, 0.04)

    if (Math.abs(pullCharacter.rotation.z) < Math.abs(inputX)) {
      pullCharacter.rotation.z += inputX * 0.05
    } else if (Math.abs(pullCharacter.rotation.z) > Math.abs(inputX) + 0.1 ||
          (Math.sign(pullCharacter.rotation.z) !== Math.sign(inputX) && Math.abs(inputX) > 0.2)) {
      pullCharacter.rotation.z > 0
        ? pullCharacter.rotation.z -= 0.2
        : pullCharacter.rotation.z += 0.2
    } else if (Math.abs(inputX) < 0.1) {
      pullCharacter.rotation.z = 0
    }

    // Math.PI / 4 (0.785)がXのデフォルト
    const curerntX = pullCharacter.rotation.x
    // 入力値よりも現在の角度が小さい
    if (Math.abs(curerntX) < Math.abs(inputY)) {
      pullCharacter.rotation.x -= inputY * 0.1
      // 入力値よりも現在の角度が0.1以上大きい or 現在の角度がと入力値が反転していて、かつ入力値の絶対値が0.1以上
    } else if (Math.abs(curerntX) > Math.abs(inputY) + 0.1 ||
      (Math.sign(curerntX) === Math.sign(inputY) && Math.abs(inputY) > 0.1)) {
      // 現在の角度の絶対値を減らす
      curerntX > 0 ? pullCharacter.rotation.x -= 0.1 : pullCharacter.rotation.x += 0.1
      // それ以外で、入力値の絶対値が0.1以下
    } else if (Math.abs(curerntX) < 0.1) {
      pullCharacter.rotation.x = 0
    }

    // moveVelocityをクローンした上で1/10分移動する。
    planetGroup.position.add(moveVelocity.clone().multiplyScalar(0.2 * fpsRatio))

    if (initialized) {
      fpsRatio = deltaTime / defaultFps
      mixer.update(deltaTime)
    }
  }

  const updateSize = ({videoWidth, videoHeight, canvasWidth, canvasHeight, GLctx}) => {
    cameraFeedRenderer = XR8.GlTextureRenderer.create({
      GLctx,
      toTexture: {width: canvasWidth, height: canvasHeight},
      flipY: false,
    })
    canvasWidth_ = canvasWidth
    canvasHeight_ = canvasHeight
    videoWidth_ = videoWidth
    videoHeight_ = videoHeight
  }

  return {
    // Pipeline modules need a name. It can be whatever you want but must be unique within your app.
    name: 'sky-scene',
    onStart: ({canvas}) => {
      const {layerScenes, camera, renderer} = XR8.Threejs.xrScene()
      camera_ = camera

      initSkyScene({scene: layerScenes.sky.scene, camera, renderer})
      renderer.setAnimationLoop(animate)

      camera.position.set(0, 0, 0)

      XR8.LayersController.configure({
        coordinates: {
          origin: {
            position: camera.position,
            rotation: camera.quaternion,
          },
        },
      })
    },
    onDeviceOrientationChange: ({videoWidth, videoHeight, GLctx}) => {
      updateSize({videoWidth, videoHeight, canvasWidth_, canvasHeight_, GLctx})
    },
    onVideoSizeChange: ({videoWidth, videoHeight, canvasWidth, canvasHeight, GLctx}) => {
      updateSize({videoWidth, videoHeight, canvasWidth, canvasHeight, GLctx})
    },
    onCanvasSizeChange: ({
      GLctx, computeCtx, videoWidth, videoHeight, canvasWidth, canvasHeight,
    }) => {
      updateSize({videoWidth, videoHeight, canvasWidth, canvasHeight, GLctx})
    },
    onUpdate: ({processCpuResult}) => {
      const {scene, camera, renderer} = XR8.Threejs.xrScene()
      deltaTime = clock.getDelta()

      if (++_cubeCamFrame % 5 === 0) {
        cubeCamera.update(renderer, cubeMapScene)
      }
      const {reality} = processCpuResult
      if (reality) {
        texProps.__webglTexture = cameraFeedRenderer.render({
          renderTexture: reality.realityTexture,
          viewport: XR8.GlTextureRenderer.fillTextureViewport(
            videoWidth_, videoHeight_, canvasWidth_, canvasHeight_
          ),
        })
      }

      if (started && initialized) {
        switch (clearedStage) {
          case 0:
            lap1 += deltaTime
            break
          case 1:
            lap2 += deltaTime
            break
          case 2:
            lap3 += deltaTime
            break
          case 3:
            lap1 += deltaTime
            break
          case 4:
            lap2 += deltaTime
            break
          case 5:
            lap3 += deltaTime
            break
          default:
            break
        }

        // 1フレームの長さ
        hpInterval += deltaTime
        if (hpInterval >= 4) {
          pointLost()
          hpInterval = 0
        }

        if (hp <= 0) {
          failed()
        }
        _meteorVec.set(0, -meteorSpeed, meteorSpeed)
        planetGroup.position.add(_meteorVec)

        if (collisionList.length > 1) {
          for (let i = 0; i < collisionList.length; i++) {
            if (!collisionList[i][3]) {
              collisionList[i][0].getWorldPosition(_tmpV1)
              if (_tmpV1.distanceTo(_rootPos) < collisionList[i][1]) {
                if (collisionList[i][2] === 'point') {
                  if (fpsRatio < 1.2) {
                    camera_.getWorldDirection(_tmpV2).multiplyScalar(10)
                    exploded.push(
                      new createExplosion(scene, [_tmpV2.x, _tmpV2.y, _tmpV2.z])
                    )
                  }
                  collisionList[i][0].removeFromParent()
                  if (pointSound.isPlaying) {
                    pointSound.stop()
                  }
                  pointSound.play()
                  pointGet()
                } else if (collisionList[i][2] === 'obstacle') {
                  collisionSound.play()
                  pointLost({shake: true, point: 2})
                } else if (collisionList[i][2] === 'goal') {
                  if (pointSound.isPlaying) {
                    pointSound.stop()
                  }
                  pointSound.play()
                  finish()
                }
                collisionList[i][3] = true
              }
            }
          }
        }

        for (let i = 0; i < exploded.length; i++) {
          if (exploded[i].elapsed > 101) {
            exploded.splice(i, 1)
          } else {
            exploded[i].explode()
          }
        }

        for (let i = 0; i < goal.length; i++) {
          goal[i].heartbeat()
        }
      }
    },
    onProcessCpu: ({frameStartResult}) => {
      const {cameraTexture} = frameStartResult
      // force initialization
      const {scene, camera, renderer} = XR8.Threejs.xrScene()  // Get the 3js scene from XR8.Threejs
      texProps = renderer.properties.get(camTexture_)
      texProps.__webglTexture = cameraTexture
    },

    listeners: [
      {event: 'layerscontroller.layerfound', process: layerFound},
    ],
  }
}
