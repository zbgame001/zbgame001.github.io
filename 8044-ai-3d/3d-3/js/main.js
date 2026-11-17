/* ------------------------------------------------------------------
   Corridor — a 256 m tiled hallway
   Three.js scene, fixed viewpoint look-around, baked probe GI + GTAO + bloom
------------------------------------------------------------------ */

import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const _origRenderBufferDirect = THREE.WebGLRenderer.prototype.renderBufferDirect;
THREE.WebGLRenderer.prototype.renderBufferDirect = function (scene, camera, geometry, material, object, group) {
  try {
    return _origRenderBufferDirect.call(this, scene, camera, geometry, material, object, group);
  } catch (error) {
    console.error('RBD_FAIL', {
      material: material?.type,
      name: material?.name,
      fog: material?.fog,
      hasUniforms: !!material?.uniforms,
      keys: material?.uniforms ? Object.keys(material.uniforms) : null,
      object: object?.type,
    });
    throw error;
  }
};

const CORRIDOR = {
  length: 256,
  width: 2.4,
  height: 3.6,
  tileWorld: 3.6, // one 2K texture spans 3.6 m (12 × 12 tiles of 30 cm)
};

// The camera is fixed at the exact middle of the corridor. Only the view
// direction changes; position never moves.
const VIEW = {
  x: 0,
  y: 1.62,
  z: CORRIDOR.length / 2,
  minPitch: -1.15,
  maxPitch: 1.15,
};
// Water surface height in metres. "高度 ×1" is taken literally: one metre
// of water above the tiled floor. Change this single value to re-grade it.
const WATER = {
  level: 1.0,
  flowSpeed: 1.0,
  normalStrength: 0.9,
  distortion: 0.045,
  reflectionStrength: 0.95,
};

const PARAMS = new URLSearchParams(window.location.search);
const IS_COARSE = window.matchMedia('(pointer: coarse)').matches;
const MIN_VIEWPORT = Math.min(window.innerWidth, window.innerHeight);
const LOW_POWER =
  PARAMS.has('low') ||
  IS_COARSE ||
  MIN_VIEWPORT < 700 ||
  (navigator.hardwareConcurrency || 8) <= 4;

const BASE_DPR_CAP = LOW_POWER ? 1.5 : 2;
const ADAPTIVE = !PARAMS.has('fixed');
const MAX_RENDER_PIXELS = LOW_POWER ? 3.0e6 : 8.4e6;

function resolveDpr(width, height, cap) {
  let dpr = Math.min(window.devicePixelRatio || 1, cap);
  const pixels = width * height * dpr * dpr;
  if (pixels > MAX_RENDER_PIXELS) {
    dpr = Math.max(0.5, Math.sqrt(MAX_RENDER_PIXELS / (width * height)));
  }
  return dpr;
}

// Final look. These values are the result of the calibration passes.
const TUNE = {
  exposure: 0.92,
  environment: 1.0,
  hemi: 0.48,
  ceiling: 0.38,
  background: 1.0,
  bloom: 0.2,
  bgRotation: 0.55,
};

const QUALITY = {
  dpr: resolveDpr(window.innerWidth, window.innerHeight, BASE_DPR_CAP),
  gtao: !LOW_POWER,
  fxaa: true,
  bloom: true,
  dust: LOW_POWER ? 520 : 1100,
};

const ASSETS = [
  {
    key: 'color',
    url: './assets/textures/tiles_color.jpg',
    name: 'Tiles133A_2K-JPG_Color.jpg',
    bytes: 1464653,
    srgb: true,
  },
  {
    key: 'normal',
    url: './assets/textures/tiles_normal.jpg',
    name: 'Tiles133A_2K-JPG_NormalGL.jpg',
    bytes: 3600024,
    srgb: false,
  },
  {
    key: 'roughness',
    url: './assets/textures/tiles_roughness.jpg',
    name: 'Tiles133A_2K-JPG_Roughness.jpg',
    bytes: 1891031,
    srgb: false,
  },
  {
    key: 'ao',
    url: './assets/textures/tiles_ao.jpg',
    name: 'Tiles133A_2K-JPG_AmbientOcclusion.jpg',
    bytes: 594122,
    srgb: false,
  },
  {
    key: 'hdr',
    url: './assets/hdri/day_sky_2k.hdr',
    name: 'DaySkyHDRI071B_2K_HDR.hdr',
    bytes: 3131558,
    srgb: false,
    type: 'hdr',
  },
  {
    key: 'waterColor',
    url: './assets/water/pool_water_2k.png',
    name: 'pool_water_2k.png (generated: tools/gen_water_textures.py)',
    bytes: 1862296,
    srgb: true,
  },
  {
    key: 'waterNormal',
    url: './assets/water/pool_water_normal.jpg',
    name: 'pool_water_normal.jpg (generated: tools/gen_water_textures.py)',
    bytes: 880596,
    srgb: false,
  },
];

const TOTAL_BYTES = ASSETS.reduce((sum, asset) => sum + asset.bytes, 0);

/* ------------------------------------------------------------------ */
/* DOM                                                                 */
/* ------------------------------------------------------------------ */

const canvas = document.getElementById('scene');
const loaderEl = document.getElementById('loader');
const percentEl = document.getElementById('percent');
const filenameEl = document.getElementById('filename');
const ringProgressEl = document.getElementById('ring-progress');

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

let renderer = null;
let scene = null;
let camera = null;
let composer = null;
let pmrem = null;
let gtaoPass = null;
let bloomPass = null;
let fxaaPass = null;
let finalPass = null;
let areaLight = null;
let dust = null;

let water = null;
let waterMaterial = null;
let reflectionTarget = null;
let reflectionCamera = null;
let underwaterTarget = null;
const underwaterClipPlane = new THREE.Plane(
  new THREE.Vector3(0, -1, 0),
  WATER.level
);
const reflectionTextureMatrix = new THREE.Matrix4();
const reflectionBias = new THREE.Matrix4().set(
  0.5, 0, 0, 0.5,
  0, 0.5, 0, 0.5,
  0, 0, 0.5, 0.5,
  0, 0, 0, 1
);
const waterClipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WATER.level);
let reflectionDirty = true;

let hdrTexture = null;
let skyEnvironment = null;
let corridorEnvironment = null;
let textures = null;

let viewYaw = 0;
let viewPitch = 0;
let targetYaw = 0;
let targetPitch = 0;
let dragPointerId = null;
let dragLastX = 0;
let dragLastY = 0;

let targetProgress = 0;
let shownProgress = 0;
let bytesDone = 0;
let ready = false;
let revealStarted = false;
let revealPendingAt = 0;
let failed = false;

let perfStartedAt = 0;
let perfFrames = 0;
let perfChecked = false;
let dprCap = BASE_DPR_CAP;

const clockStart = performance.now();
let lastFrameAt = clockStart;

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function damp(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function setProgressTarget(value) {
  targetProgress = clamp(value, 0, 100);
}

function nextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function showError(message) {
  if (failed) return;
  failed = true;
  console.error(message);
  filenameEl.textContent = message;
  percentEl.textContent = '!';
  ringProgressEl.style.strokeDashoffset = '100';
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

boot();

async function boot() {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(QUALITY.dpr);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = TUNE.exposure;
    renderer.setClearColor(0x07080a, 1);
  } catch (error) {
    showError('WebGL 无法初始化');
    return;
  }

  try {
  scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.Fog(0xdde7ec, 24, 210);

  camera = new THREE.PerspectiveCamera(60, 1, 0.05, 500);
  camera.position.set(VIEW.x, VIEW.y, VIEW.z);
  camera.lookAt(VIEW.x, VIEW.y, VIEW.z + 1);

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });
  canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
  canvas.addEventListener('pointermove', onPointerMove, { passive: false });
  canvas.addEventListener('pointerup', onPointerEnd, { passive: true });
  canvas.addEventListener('pointercancel', onPointerEnd, { passive: true });
  canvas.addEventListener('lostpointercapture', onPointerEnd, { passive: true });

  await loadAssets();
  if (failed) return;

  setProgressTarget(90.5);
  await nextPaint();

  buildWorld();
  setProgressTarget(93);
  await nextPaint();

  bakeEnvironment();
  setProgressTarget(96);
  await nextPaint();

  buildPostProcessing();
  onResize();
  setProgressTarget(97.5);
  await nextPaint();

  try {
    await renderer.compileAsync(scene, camera);
  } catch (error) {
    console.warn('compileAsync skipped:', error);
  }

  setProgressTarget(98.8);

  try {
    updateWater(performance.now());
    refreshWaterPasses();
    composer.render();
  } catch (error) {
    showError('渲染初始化失败');
    console.error(error);
    return;
  }

  setProgressTarget(100);
  ready = true;
  lastFrameAt = performance.now();
  requestAnimationFrame(animate);
  } catch (error) {
    console.error(error);
    showError('场景初始化失败');
  }
}

/* ------------------------------------------------------------------ */
/* Asset loading                                                       */
/* ------------------------------------------------------------------ */

async function loadAssets() {
  const loaded = {};

  for (const asset of ASSETS) {
    filenameEl.textContent = asset.name;

    try {
      const blob = await fetchAsset(asset);
      bytesDone += blob.size;
      setProgressTarget((bytesDone / TOTAL_BYTES) * 90);

      if (asset.type === 'hdr') {
        const buffer = await blob.arrayBuffer();
        const loader = new HDRLoader();
        hdrTexture = loader.createDataTexture(buffer);
        hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
        hdrTexture.minFilter = THREE.LinearFilter;
        hdrTexture.magFilter = THREE.LinearFilter;
        hdrTexture.generateMipmaps = false;
        hdrTexture.needsUpdate = true;
        loaded.hdr = hdrTexture;
      } else {
        const { img, url } = await decodeImage(blob);
        const texture = new THREE.Texture(img);
        texture.colorSpace = asset.srgb
          ? THREE.SRGBColorSpace
          : THREE.NoColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = Math.min(
          16,
          renderer.capabilities.getMaxAnisotropy()
        );
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        loaded[asset.key] = texture;
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error(error);
      showError(`加载失败 · ${asset.name}`);
      return;
    }

    await nextPaint();
  }

  textures = loaded;
  setProgressTarget(90);
}

async function fetchAsset(asset) {
  const response = await fetch(asset.url, { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} — ${asset.url}`);
  }

  if (!response.body) {
    const blob = await response.blob();
    setProgressTarget(((bytesDone + blob.size) / TOTAL_BYTES) * 90);
    return blob;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    setProgressTarget(((bytesDone + received) / TOTAL_BYTES) * 90);
  }

  return new Blob(chunks);
}

function decodeImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片解码失败'));
    };
    img.src = url;
  });
}

/* ------------------------------------------------------------------ */
/* World                                                               */
/* ------------------------------------------------------------------ */

function buildWorld() {
  const { length: L, width: W, height: H, tileWorld } = CORRIDOR;
  const maxAnisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());

  for (const key of ['color', 'normal', 'roughness', 'ao']) {
    const texture = textures[key];
    texture.anisotropy = maxAnisotropy;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
  }

  RectAreaLightUniformsLib.init();

  const floorMaterial = new THREE.MeshPhysicalMaterial({
    map: textures.color,
    normalMap: textures.normal,
    roughnessMap: textures.roughness,
    aoMap: textures.ao,
    aoMapIntensity: 0.62,
    color: 0xffffff,
    roughness: 0.76,
    metalness: 0,
    clearcoat: 0.06,
    clearcoatRoughness: 0.7,
    envMapIntensity: 0.28,
    normalScale: new THREE.Vector2(0.55, 0.55),
  });

  const wallMaterial = new THREE.MeshPhysicalMaterial({
    map: textures.color,
    normalMap: textures.normal,
    roughnessMap: textures.roughness,
    aoMap: textures.ao,
    aoMapIntensity: 0.55,
    color: 0xffffff,
    roughness: 0.7,
    metalness: 0,
    clearcoat: 0.55,
    clearcoatRoughness: 0.16,
    envMapIntensity: 0.95,
    normalScale: new THREE.Vector2(0.62, 0.62),
  });

  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: TUNE.ceiling,
    roughness: 0.94,
    metalness: 0,
    envMapIntensity: 0.8,
  });

  const fixtureMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.62,
    metalness: 0,
    envMapIntensity: 0.6,
  });

  const emissiveMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color().setRGB(2.7, 2.45, 2.0),
    toneMapped: true,
    fog: true,
  });

  /* floor ---------------------------------------------------------- */

  const floorGeometry = planeWithUv(W, L, W / tileWorld, L / tileWorld);
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, L / 2);
  scene.add(floor);

  /* walls ---------------------------------------------------------- */

  const wallGeometry = planeWithUv(L, H, L / tileWorld, H / tileWorld);

  const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-W / 2, H / 2, L / 2);
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(W / 2, H / 2, L / 2);
  scene.add(rightWall);

  /* ceiling -------------------------------------------------------- */

  const ceilingGeometry = new THREE.PlaneGeometry(W, L);
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, H, L / 2);
  scene.add(ceiling);

  /* open end at z = 256: the corridor ends in daylight ------------- */

  /* start wall (behind the camera) --------------------------------- */

  const startWallGeometry = planeWithUv(W, H, W / tileWorld, H / tileWorld);
  const startWall = new THREE.Mesh(startWallGeometry, wallMaterial);
  startWall.position.set(0, H / 2, 0);
  scene.add(startWall);

  /* ceiling light coves -------------------------------------------- */

  for (const x of [-0.9, 0.9]) {
    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.05, L),
      fixtureMaterial
    );
    housing.position.set(x, H - 0.025, L / 2);
    scene.add(housing);

    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(0.072, L),
      emissiveMaterial
    );
    strip.rotation.x = Math.PI / 2;
    strip.position.set(x, H - 0.053, L / 2);
    scene.add(strip);
  }

  /* environment / background --------------------------------------- */

  pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  skyEnvironment = pmrem.fromEquirectangular(hdrTexture).texture;

  scene.background = hdrTexture;
  scene.backgroundIntensity = TUNE.background;
  scene.environment = skyEnvironment;
  scene.environmentIntensity = 0.46;

  scene.backgroundRotation = new THREE.Euler(0, Math.PI * TUNE.bgRotation, 0);

  /* lights --------------------------------------------------------- */

  areaLight = new THREE.RectAreaLight(0xfff1de, 4.0, 2.05, 0.12);
  areaLight.position.set(0, H - 0.09, VIEW.z + 2.4);
  areaLight.lookAt(0, 0, VIEW.z + 2.4);
  scene.add(areaLight);

  const hemi = new THREE.HemisphereLight(0xf7fbfe, 0xe3ebef, TUNE.hemi);
  scene.add(hemi);

  /* dust ----------------------------------------------------------- */

  dust = makeDust(QUALITY.dust);
  scene.add(dust);

  createWater();
}

function planeWithUv(width, height, uRepeat, vRepeat) {
  const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, uv.getX(i) * uRepeat, uv.getY(i) * vRepeat);
  }
  uv.needsUpdate = true;
  geometry.setAttribute('uv1', uv.clone());
  return geometry;
}

/* ------------------------------------------------------------------ */
/* Baked reflection / bounce probe                                     */
/* ------------------------------------------------------------------ */

function bakeEnvironment() {
  const { length: L } = CORRIDOR;
  const previousFog = scene.fog;
  const previousIntensity = scene.environmentIntensity;
  const previousAreaZ = areaLight.position.z;

  scene.fog = null;
  scene.environment = skyEnvironment;
  scene.environmentIntensity = 0.42;

  areaLight.position.z = L / 2;
  areaLight.lookAt(0, 0, L / 2);

  const cubeTarget = new THREE.WebGLCubeRenderTarget(256, {
    type: THREE.HalfFloatType,
    generateMipmaps: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });
  const cubeCamera = new THREE.CubeCamera(0.08, 340, cubeTarget);
  cubeCamera.position.set(0, 1.72, L / 2);
  cubeCamera.update(renderer, scene);

  corridorEnvironment = pmrem.fromCubemap(cubeTarget.texture).texture;

  scene.environment = corridorEnvironment;
  scene.environmentIntensity = TUNE.environment;
  scene.fog = previousFog;
  areaLight.position.z = previousAreaZ;
  scene.environmentIntensity = Math.max(previousIntensity, TUNE.environment);

  cubeTarget.dispose();
}

/* ------------------------------------------------------------------ */
/* Dust                                                                */
/* ------------------------------------------------------------------ */

function makeDust(count) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * (CORRIDOR.width - 0.18);
    positions[i * 3 + 1] = 0.12 + Math.random() * (CORRIDOR.height - 0.2);
    positions[i * 3 + 2] = Math.random() * CORRIDOR.length;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    map: makeDustTexture(),
    color: 0xfff5e8,
    size: 0.026,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: true,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

function makeDustTexture() {
  const size = 64;
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext('2d');
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* ------------------------------------------------------------------ */
/* Water                                                               */
/* ------------------------------------------------------------------ */

function createWater() {
  const { length: L, width: W } = CORRIDOR;

  // `fog: true` on a raw ShaderMaterial makes the renderer push the scene fog
  // uniforms on every frame. Those uniforms only exist if they are declared
  // here, so the fog set from UniformsLib has to be merged in explicitly —
  // otherwise the first render throws on `uniforms.fogColor.value`.
  waterMaterial = new THREE.ShaderMaterial({
    uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), {
      uColorMap: { value: textures.waterColor },
      uNormalMap: { value: textures.waterNormal },
      uReflection: { value: null },
      uUnderwater: { value: null },
      uTextureMatrix: { value: new THREE.Matrix4() },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uDeepColor: { value: new THREE.Color(0x042f35) },
      uShallowColor: { value: new THREE.Color(0x63c9b6) },
      uSunColor: { value: new THREE.Color(0xfff2d8) },
      uSunDir: { value: new THREE.Vector3(0.18, 0.82, 0.55).normalize() },
      uNormalStrength: { value: WATER.normalStrength },
      uDistortion: { value: 0.085 },
      uReflectionStrength: { value: WATER.reflectionStrength },
      uRefraction: { value: 0.075 },
      uCausticStrength: { value: 0.24 },
    }),
    vertexShader: /* glsl */ `
      uniform mat4 uTextureMatrix;
      varying vec3 vWorldPosition;
      varying vec4 vReflectCoord;

      #include <fog_pars_vertex>

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vReflectCoord = uTextureMatrix * worldPosition;

        vec4 mvPosition = viewMatrix * worldPosition;
        gl_Position = projectionMatrix * mvPosition;

        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uColorMap;
      uniform sampler2D uNormalMap;
      uniform sampler2D uReflection;
      uniform sampler2D uUnderwater;
      uniform vec2 uResolution;
      uniform float uTime;
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uSunColor;
      uniform vec3 uSunDir;
      uniform float uNormalStrength;
      uniform float uDistortion;
      uniform float uReflectionStrength;
      uniform float uRefraction;
      uniform float uCausticStrength;

      varying vec3 vWorldPosition;
      varying vec4 vReflectCoord;

      #include <fog_pars_fragment>

      void main() {
        vec2 p = vWorldPosition.xz;

        // Three slow, uncorrelated drifts. A pool surface moves as a whole
        // instead of flowing in one direction like a river.
        vec2 flowA = uTime * vec2(0.013, 0.022);
        vec2 flowB = uTime * vec2(-0.019, 0.010);
        vec2 uvA = p * 0.100 + flowA;
        vec2 uvB = p * 0.158 + flowB;
        vec2 uvC = p * 0.055 - flowA * 0.6;

        vec3 nA = texture2D(uNormalMap, uvA).xyz * 2.0 - 1.0;
        vec3 nB = texture2D(uNormalMap, uvB).xyz * 2.0 - 1.0;
        vec3 nC = texture2D(uNormalMap, uvC).xyz * 2.0 - 1.0;

        vec2 slope = (nA.xy + nB.xy * 0.65 + nC.xy * 0.35) * uNormalStrength;
        vec3 N = normalize(vec3(slope.x, 1.0, slope.y));

        vec3 V = normalize(cameraPosition - vWorldPosition);
        float NdotV = clamp(dot(N, V), 0.0, 1.0);
        float fresnel = 0.02 + 0.98 * pow(1.0 - NdotV, 5.0);

        // Planar reflection of the ceiling and far end. Three small taps
        // soften it into a pool reflection instead of a hard mirror.
        vec2 refUv = vReflectCoord.xy / max(vReflectCoord.w, 0.0001);
        refUv = clamp(refUv + N.xz * uDistortion, vec2(0.001), vec2(0.999));

        vec3 reflection = texture2D(uReflection, refUv).rgb;
        reflection += texture2D(
          uReflection,
          clamp(refUv + vec2(0.0016, 0.0), vec2(0.001), vec2(0.999))
        ).rgb;
        reflection += texture2D(
          uReflection,
          clamp(refUv + vec2(0.0, 0.0016), vec2(0.001), vec2(0.999))
        ).rgb;
        reflection *= 0.3333333;

        // Fake refraction: the floor and lower walls were rendered once from
        // this same fixed camera into uUnderwater, then sampled with the ripple
        // normal. That is what bends the tile grid and removes the "painted
        // turquoise film" look. A tiny chromatic offset sells the water.
        vec2 screenUv = gl_FragCoord.xy / uResolution;
        vec2 refr = N.xz * uRefraction;

        vec3 floorColor;
        floorColor.r = texture2D(
          uUnderwater,
          clamp(screenUv + refr * 1.04, vec2(0.001), vec2(0.999))
        ).r;
        floorColor.g = texture2D(
          uUnderwater,
          clamp(screenUv + refr, vec2(0.001), vec2(0.999))
        ).g;
        floorColor.b = texture2D(
          uUnderwater,
          clamp(screenUv + refr * 0.96, vec2(0.001), vec2(0.999))
        ).b;

        // One metre of water absorbs red first. The caustic net is the same
        // water texture read at a much higher frequency than the ripples: read
        // at ripple scale its bright areas are metres wide, and adding them
        // straight onto the floor paints flat turquoise patches instead of
        // light. So the net multiplies the tiles (light, not paint) and only
        // tints them slightly.
        vec3 texA = texture2D(uColorMap, uvA * 14.0).rgb;
        vec3 texB = texture2D(uColorMap, uvB * 9.0).rgb;
        float texLum = dot(max(texA, texB), vec3(0.299, 0.587, 0.114));
        float caustic = smoothstep(0.56, 0.92, texLum);

        floorColor *= vec3(0.48, 0.80, 0.78);
        floorColor += uDeepColor * 0.16;
        // The tiles are already near white, so multiplying them by the net
        // clipped to flat white patches — they read as foam floating on the
        // water rather than as light. Fade the gain as the tile gets bright.
        float tileLum = dot(floorColor, vec3(0.2126, 0.7152, 0.0722));
        float gain = 1.0 - 0.55 * clamp(tileLum, 0.0, 1.0);
        floorColor *= 1.0 + caustic * uCausticStrength * 0.85 * gain;
        floorColor += uShallowColor * caustic * 0.05;

        vec3 L = normalize(uSunDir);
        vec3 H = normalize(L + V);
        // The ripple normals are sampled from a mip-blurred texture, so away
        // from the camera the surface flattens out and N.H sits near 1 over
        // whole patches. With amplitude 1.2 that painted big white sheets on
        // the water (and pushed them over the bloom threshold, which smeared
        // them wider). Keep it a sheen: narrow lobe, low gain, no clipping.
        float spec = pow(max(dot(N, H), 0.0), 320.0) * 0.24;
        float glint = pow(max(dot(N, H), 0.0), 40.0) * 0.035;

        vec3 color = mix(
          floorColor,
          reflection,
          clamp(fresnel * uReflectionStrength, 0.0, 0.90)
        );
        color += uSunColor * (spec + glint);

        gl_FragColor = vec4(color, 1.0);

        #include <fog_fragment>
      }
    `,
    transparent: false,
    depthWrite: true,
    fog: true,
    side: THREE.FrontSide,
  });

  const waterGeometry = new THREE.PlaneGeometry(W + 0.01, L);
  water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, WATER.level, L / 2);
  water.frustumCulled = false;
  scene.add(water);

  reflectionCamera = new THREE.PerspectiveCamera(
    camera.fov,
    camera.aspect,
    0.05,
    500
  );

  createReflectionTarget();
  createUnderwaterTarget();

  // `floorMaterial` lives in buildCorridor()'s scope; referencing it from here
  // throws a ReferenceError on the first frame and kills the whole scene.
  window.__waterDebug = {
    waterMaterial,
    water,
    scene,
    renderer,
    camera,
    refreshWaterPasses,
  };
}

function reflectionTargetSize() {
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  const aspect = width / height;
  const scale = LOW_POWER ? 0.34 : 0.5;

  let w = Math.round(width * scale);
  let h = Math.round(w / aspect);

  const maxW = LOW_POWER ? 384 : 768;
  const maxH = LOW_POWER ? 512 : 512;

  if (w > maxW) {
    w = maxW;
    h = Math.round(w / aspect);
  }
  if (h > maxH) {
    h = maxH;
    w = Math.round(h * aspect);
  }

  return { w: Math.max(2, w), h: Math.max(2, h) };
}

function createReflectionTarget() {
  if (reflectionTarget) {
    reflectionTarget.dispose();
    reflectionTarget = null;
  }

  const { w, h } = reflectionTargetSize();
  reflectionTarget = new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
    stencilBuffer: false,
  });
  reflectionTarget.texture.generateMipmaps = false;
  reflectionTarget.texture.colorSpace = THREE.NoColorSpace;

  if (waterMaterial) {
    waterMaterial.uniforms.uReflection.value = reflectionTarget.texture;
  }
  reflectionDirty = true;
}

function resizeReflectionTarget() {
  if (!reflectionTarget) return;
  const { w, h } = reflectionTargetSize();
  reflectionTarget.setSize(w, h);
  reflectionDirty = true;
}

function underwaterTargetSize() {
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  const aspect = width / height;
  const scale = LOW_POWER ? 0.44 : 0.62;

  let w = Math.round(width * scale);
  let h = Math.round(w / aspect);

  const maxW = LOW_POWER ? 512 : 1024;
  const maxH = LOW_POWER ? 512 : 768;

  if (w > maxW) {
    w = maxW;
    h = Math.round(w / aspect);
  }
  if (h > maxH) {
    h = maxH;
    w = Math.round(h * aspect);
  }

  return { w: Math.max(2, w), h: Math.max(2, h) };
}

function createUnderwaterTarget() {
  if (underwaterTarget) {
    underwaterTarget.dispose();
    underwaterTarget = null;
  }

  const { w, h } = underwaterTargetSize();
  underwaterTarget = new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
    stencilBuffer: false,
  });
  underwaterTarget.texture.generateMipmaps = false;
  underwaterTarget.texture.colorSpace = THREE.NoColorSpace;

  if (waterMaterial) {
    waterMaterial.uniforms.uUnderwater.value = underwaterTarget.texture;
  }
  reflectionDirty = true;
}

function resizeUnderwaterTarget() {
  if (!underwaterTarget) return;
  const { w, h } = underwaterTargetSize();
  underwaterTarget.setSize(w, h);
  reflectionDirty = true;
}

function updateReflectionCamera() {
  if (!reflectionCamera || !camera) return;

  const normal = _waterNormal;
  const planePoint = _waterPlanePoint.set(0, WATER.level, 0);
  const cameraPos = _waterCameraPos;
  camera.getWorldPosition(cameraPos);

  // Standard planar-mirror construction: mirror the eye, the look target and
  // the up vector across the water plane.
  const view = _waterView.subVectors(planePoint, cameraPos);
  if (view.dot(normal) > 0) return; // eye below the surface

  const virtualPosition = view.reflect(normal).negate().add(planePoint);

  const lookAt = _waterLookAt
    .set(0, 0, -1)
    .applyQuaternion(camera.quaternion)
    .add(cameraPos);
  const target = _waterTarget.subVectors(planePoint, lookAt);
  target.reflect(normal).negate().add(planePoint);

  reflectionCamera.position.copy(virtualPosition);
  reflectionCamera.up.set(0, 1, 0).applyQuaternion(camera.quaternion).reflect(normal);
  reflectionCamera.lookAt(target);

  reflectionCamera.near = camera.near;
  reflectionCamera.far = camera.far;
  reflectionCamera.fov = camera.fov;
  reflectionCamera.aspect = camera.aspect;
  reflectionCamera.updateProjectionMatrix();
  reflectionCamera.updateMatrixWorld();
}

function renderWaterReflection() {
  if (!water || !waterMaterial || !reflectionTarget || !reflectionCamera) return;

  updateReflectionCamera();

  const previousTarget = renderer.getRenderTarget();
  const previousPlanes = renderer.clippingPlanes;
  const waterVisible = water.visible;

  water.visible = false;
  renderer.clippingPlanes = [waterClipPlane];

  renderer.setRenderTarget(reflectionTarget);
  renderer.clear();
  renderer.render(scene, reflectionCamera);
  renderer.setRenderTarget(previousTarget);

  renderer.clippingPlanes = previousPlanes;
  water.visible = waterVisible;

  reflectionTextureMatrix
    .copy(reflectionBias)
    .multiply(reflectionCamera.projectionMatrix)
    .multiply(reflectionCamera.matrixWorldInverse);
  waterMaterial.uniforms.uTextureMatrix.value.copy(reflectionTextureMatrix);
}

function renderUnderwater() {
  if (!underwaterTarget || !water) return;

  const previousTarget = renderer.getRenderTarget();
  const previousPlanes = renderer.clippingPlanes;
  const previousBackground = scene.background;
  const previousClearColor = renderer.getClearColor(new THREE.Color()).clone();
  const previousClearAlpha = renderer.getClearAlpha();
  const waterVisible = water.visible;

  water.visible = false;
  scene.background = null;
  renderer.setClearColor(0x062f33, 1);
  renderer.clippingPlanes = [underwaterClipPlane];

  renderer.setRenderTarget(underwaterTarget);
  renderer.clear();
  renderer.render(scene, camera);
  renderer.setRenderTarget(previousTarget);

  renderer.clippingPlanes = previousPlanes;
  scene.background = previousBackground;
  renderer.setClearColor(previousClearColor, previousClearAlpha);
  water.visible = waterVisible;
}

function refreshWaterPasses() {
  if (!water) return;
  renderUnderwater();
  renderWaterReflection();
  reflectionDirty = false;
}

function updateWater(now) {
  if (!waterMaterial) return;
  waterMaterial.uniforms.uTime.value =
    ((now - clockStart) / 1000) * WATER.flowSpeed;
}

const _waterNormal = new THREE.Vector3(0, 1, 0);
const _waterPlanePoint = new THREE.Vector3();
const _waterCameraPos = new THREE.Vector3();
const _waterView = new THREE.Vector3();
const _waterLookAt = new THREE.Vector3();
const _waterTarget = new THREE.Vector3();

/* ------------------------------------------------------------------ */
/* Post-processing                                                     */
/* ------------------------------------------------------------------ */

const FinalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      vec3 color = texture2D(tDiffuse, vUv).rgb;

      // gentle filmic contrast: deepen the lower mid-tones, keep highlights open
      color = (color - 0.5) * 1.045 + 0.5;
      float luma = dot(clamp(color, 0.0, 1.0), vec3(0.299, 0.587, 0.114));
      color *= mix(vec3(0.965, 0.99, 1.02), vec3(1.025, 1.005, 0.975), smoothstep(0.25, 0.85, luma));

      vec2 q = vUv - 0.5;
      float radius = length(q * vec2(1.0, 0.82));
      float vignette = smoothstep(0.92, 0.24, radius);
      color *= mix(0.7, 1.0, vignette);

      float grain = hash(vUv * uResolution + fract(uTime) * 91.7) - 0.5;
      color += grain * (1.0 / 255.0) * 1.5;

      gl_FragColor = vec4(max(color, 0.0), 1.0);
    }
  `,
};

function buildPostProcessing() {
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);

  composer = new EffectComposer(renderer);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(width, height);

  composer.addPass(new RenderPass(scene, camera));

  if (QUALITY.gtao) {
    gtaoPass = new GTAOPass(scene, camera, width, height);
    gtaoPass.output = GTAOPass.OUTPUT.Default;
    gtaoPass.blendIntensity = 0.92;
    gtaoPass.updateGtaoMaterial({
      radius: 0.42,
      distanceExponent: 1.15,
      thickness: 0.85,
      scale: 1.0,
      samples: 12,
      distanceFallOff: 1.0,
    });
    gtaoPass.updatePdMaterial({
      lumaPhi: 10,
      depthPhi: 2,
      normalPhi: 3,
      radius: 4,
      rings: 2,
      samples: 8,
    });
    composer.addPass(gtaoPass);
  }

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    LOW_POWER ? TUNE.bloom * 0.75 : TUNE.bloom,
    0.58,
    1.12
  );
  composer.addPass(bloomPass);

  composer.addPass(new OutputPass());

  fxaaPass = new ShaderPass(FXAAShader);
  composer.addPass(fxaaPass);

  finalPass = new ShaderPass(FinalShader);
  composer.addPass(finalPass);
}

/* ------------------------------------------------------------------ */
/* Resize                                                              */
/* ------------------------------------------------------------------ */

function onResize() {
  if (!renderer || !camera || !composer) return;

  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  const aspect = width / height;

  QUALITY.dpr = resolveDpr(width, height, dprCap);

  renderer.setPixelRatio(QUALITY.dpr);
  renderer.setSize(width, height, false);

  camera.aspect = aspect;
  camera.fov = 58 + Math.max(0, 1 - aspect) * 30;
  camera.updateProjectionMatrix();

  composer.setPixelRatio(QUALITY.dpr);
  composer.setSize(width, height);

  if (fxaaPass) {
    fxaaPass.material.uniforms.resolution.value.set(
      1 / (width * QUALITY.dpr),
      1 / (height * QUALITY.dpr)
    );
  }
  if (finalPass) {
    finalPass.material.uniforms.uResolution.value.set(
      width * QUALITY.dpr,
      height * QUALITY.dpr
    );
  }

  if (waterMaterial) {
    waterMaterial.uniforms.uResolution.value.set(
      width * QUALITY.dpr,
      height * QUALITY.dpr
    );
  }

  resizeReflectionTarget();
  resizeUnderwaterTarget();
}

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

function onPointerDown(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  if (dragPointerId !== null) return;

  dragPointerId = event.pointerId;
  dragLastX = event.clientX;
  dragLastY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
  canvas.classList.add('is-dragging');
  event.preventDefault();
}

function onPointerMove(event) {
  if (event.pointerId !== dragPointerId) return;

  const dx = event.clientX - dragLastX;
  const dy = event.clientY - dragLastY;
  dragLastX = event.clientX;
  dragLastY = event.clientY;

  // A drag across the short side of the viewport turns roughly 110–120°.
  const sensitivity = 2.0 / Math.max(320, Math.min(window.innerWidth, window.innerHeight));
  targetYaw -= dx * sensitivity;
  targetPitch = clamp(
    targetPitch - dy * sensitivity,
    VIEW.minPitch,
    VIEW.maxPitch
  );

  event.preventDefault();
}

function onPointerEnd(event) {
  if (event.pointerId !== dragPointerId) return;
  dragPointerId = null;
  canvas.classList.remove('is-dragging');
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

/* ------------------------------------------------------------------ */
/* Frame loop                                                          */
/* ------------------------------------------------------------------ */

function animate(now) {
  if (!ready) return;

  const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameAt) / 1000));
  lastFrameAt = now;

  updateCamera(dt);
  updateAreaLight();
  updateWater(now);
  if (reflectionDirty) refreshWaterPasses();
  updatePostUniforms(now);
  composer.render();
  checkPerformance(now);

  requestAnimationFrame(animate);
}

function dampAngle(current, target, lambda, dt) {
  const delta = Math.atan2(
    Math.sin(target - current),
    Math.cos(target - current)
  );
  return current + delta * (1 - Math.exp(-lambda * dt));
}

function updateCamera(dt) {
  const previousYaw = viewYaw;
  const previousPitch = viewPitch;

  viewYaw = dampAngle(viewYaw, targetYaw, 11, dt);
  viewPitch = damp(viewPitch, targetPitch, 11, dt);

  if (
    Math.abs(viewYaw - previousYaw) + Math.abs(viewPitch - previousPitch) >
    0.00004
  ) {
    reflectionDirty = true;
  }

  const cosPitch = Math.cos(viewPitch);
  const dirX = Math.sin(viewYaw) * cosPitch;
  const dirY = Math.sin(viewPitch);
  const dirZ = Math.cos(viewYaw) * cosPitch;

  camera.position.set(VIEW.x, VIEW.y, VIEW.z);
  camera.lookAt(
    VIEW.x + dirX,
    VIEW.y + dirY,
    VIEW.z + dirZ
  );
}

function updateAreaLight() {
  if (!areaLight) return;
  const lightZ = camera.position.z + 2.4;
  areaLight.position.z = lightZ;
  areaLight.lookAt(0, 0, lightZ);
}

function updatePostUniforms(now) {
  if (finalPass) {
    finalPass.material.uniforms.uTime.value = (now - clockStart) / 1000;
  }
}

function checkPerformance(now) {
  if (perfChecked || !ADAPTIVE) return;
  if (!perfStartedAt) perfStartedAt = now;
  perfFrames += 1;

  const elapsed = now - perfStartedAt;
  if (elapsed < 2600) return;

  const fps = (perfFrames / elapsed) * 1000;
  perfChecked = true;

  if (fps < 38) {
    if (gtaoPass) gtaoPass.enabled = false;
    if (dprCap > 1.25) {
      dprCap = Math.max(1.25, dprCap * 0.75);
      onResize();
    }
    if (fps < 24 && bloomPass) bloomPass.enabled = false;
    console.info(`Adaptive quality: ${fps.toFixed(1)} fps`);
  }
}

/* ------------------------------------------------------------------ */
/* Loading screen                                                      */
/* ------------------------------------------------------------------ */

function updateLoadingScreen(now) {
  if (failed) return;

  const target = ready ? 100 : targetProgress;
  shownProgress = damp(shownProgress, target, 8.5, 1 / 60);

  if (ready) shownProgress = 100;
  if (target - shownProgress < 0.05) shownProgress = target;

  const display = ready ? 100 : Math.min(99, Math.floor(shownProgress));
  percentEl.textContent = String(display);
  ringProgressEl.style.strokeDashoffset = String(100 - shownProgress);
  loaderEl.setAttribute('aria-valuenow', String(display));

  if (ready && !loaderEl.classList.contains('is-complete')) {
    loaderEl.classList.add('is-complete');
  }
  if (ready && revealPendingAt === 0) revealPendingAt = now;

  if (revealPendingAt && now - revealPendingAt > 650) {
    reveal();
  }
}

function reveal() {
  if (revealStarted) return;
  revealStarted = true;

  loaderEl.classList.add('is-hidden');
  document.documentElement.classList.remove('is-loading');

  window.setTimeout(() => {
    loaderEl.style.display = 'none';
  }, 1300);
}

function loadingLoop(now) {
  updateLoadingScreen(now);
  if (!revealStarted) {
    requestAnimationFrame(loadingLoop);
  }
}

requestAnimationFrame(loadingLoop);
