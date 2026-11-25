import * as THREE from 'three';
import './styles.css';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .78;
renderer.localClippingEnabled = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xf7f5fb, 0.025);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .035).texture;
const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, .1, 100);
camera.position.set(9, 4.1, 10.5);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 7;
controls.maxDistance = 19;
controls.autoRotate = true;
controls.autoRotateSpeed = .42;
controls.target.set(1.4, .1, 0);
let isDragging = false;
controls.addEventListener('start', () => { isDragging = true; });
controls.addEventListener('end', () => { isDragging = false; });

const hemi = new THREE.HemisphereLight(0xf7f1ff, 0x17062e, 1.6);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(3, 7, 6);
key.castShadow = true;
scene.add(key);
const fill = new THREE.DirectionalLight(0xbda4ff, 1.15);
fill.position.set(-5, 3, -5);
scene.add(fill);
const rim = new THREE.PointLight(0x7d4dff, 1.35, 18, 1.8);
rim.position.set(-3, 2.2, -3.5);
scene.add(rim);
const hotLight = new THREE.PointLight(0xff6a27, .7, 7, 2);
hotLight.position.set(1.2, .2, 0);
scene.add(hotLight);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .16, .42, 1.05);
composer.addPass(bloom);

const turbine = new THREE.Group();
turbine.rotation.set(0, -.14, -.035);
turbine.scale.setScalar(.86);
scene.add(turbine);

function createBrushedRoughness() {
  const surface=document.createElement('canvas');
  surface.width=surface.height=256;
  const ctx=surface.getContext('2d');
  const image=ctx.createImageData(256,256);
  let seed=73129;
  const random=()=>((seed=(seed*16807)%2147483647)-1)/2147483646;
  for(let y=0;y<256;y++) for(let x=0;x<256;x++) {
    const grain=Math.floor(118+random()*54+(x%7===0?18:0));
    const i=(y*256+x)*4;
    image.data[i]=image.data[i+1]=image.data[i+2]=grain;
    image.data[i+3]=255;
  }
  ctx.putImageData(image,0,0);
  const texture=new THREE.CanvasTexture(surface);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(6,2);
  return texture;
}
const brushedRoughness=createBrushedRoughness();
const metal = new THREE.MeshPhysicalMaterial({ color: 0x9b9da1, metalness: .92, roughness: .27, roughnessMap:brushedRoughness, anisotropy:.72, anisotropyRotation:Math.PI/2 });
const darkMetal = new THREE.MeshPhysicalMaterial({ color: 0x2d2b33, metalness: .9, roughness: .34, roughnessMap:brushedRoughness, anisotropy:.45 });
const edgeMetal = new THREE.MeshPhysicalMaterial({ color: 0xc9cbd0, metalness: .98, roughness: .13, clearcoat:.18, clearcoatRoughness:.15 });
const flangeFaceMat = edgeMetal.clone();
flangeFaceMat.side = THREE.DoubleSide;
flangeFaceMat.roughness = .22;
const cutPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.08);
const shellMat = new THREE.MeshPhysicalMaterial({ color: 0x8d9098, metalness: .96, roughness: .3, roughnessMap:brushedRoughness, anisotropy:.8, anisotropyRotation:Math.PI/2, clearcoat:.08, clearcoatRoughness:.28, transparent: false, opacity: 1, transmission:0, side: THREE.DoubleSide, clippingPlanes:[] });
const darkShellMat = shellMat.clone();
darkShellMat.color.set(0x242329);
darkShellMat.roughness=.4;
const hotMat = new THREE.MeshPhysicalMaterial({ color: 0x6e382d, emissive: 0x8b1707, emissiveIntensity: .14, metalness: .74, roughness: .38, roughnessMap:brushedRoughness, iridescence:.18, iridescenceIOR:1.35 });
const tealMat = new THREE.MeshPhysicalMaterial({ color: 0x5227a8, emissive: 0x28105f, emissiveIntensity: .08, metalness: .82, roughness: .22, clearcoat:.22, clearcoatRoughness:.18 });

const components = [];
const rotors = [];
function cylinder(r1, r2, len, material, x, segments = 64, open = false) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, len, segments, 1, open), material);
  mesh.rotation.z = Math.PI / 2;
  mesh.position.x = x;
  mesh.castShadow = mesh.receiveShadow = true;
  turbine.add(mesh);
  return mesh;
}

// Keep the power shaft recessed inside the end housings in the assembled view.
// The previous extra-long shaft read as an exposed aircraft-engine spindle.
const shaft = cylinder(.15, .15, 7.6, darkMetal, .05, 32);
components.push(shaft);

// Concentric bearing housings make the shaft and service modules legible.
[-3.05, -.2, 2.75].forEach((x,index) => {
  const bearing = new THREE.Mesh(new THREE.TorusGeometry(.35 + index*.06, .1, 12, 48), index===1 ? tealMat : edgeMetal);
  bearing.rotation.y = Math.PI/2;
  bearing.position.x = x;
  turbine.add(bearing);
  components.push(bearing);
});

// Compressor cone + stator shells
const intake = cylinder(1.12, 1.02, 1.35, darkShellMat, -3.72, 64, true);
const compressorShell = cylinder(.74, .86, 3.15, shellMat, -1.42, 64, true);
const combustorShell = cylinder(.9, 1.02, 1.45, shellMat, .92, 64, true);
const exhaustShell = cylinder(1.03, 1.31, 2.25, shellMat, 2.78, 64, true);
components.push(intake, compressorShell, combustorShell, exhaustShell);

// External casing flanges and fasteners visible on the official core-engine views.
[-3.05,.22,1.7,3.75].forEach((x,ringIndex)=>{
  const radius=[1.07,.9,1.06,1.28][ringIndex];
  const flange=new THREE.Mesh(new THREE.TorusGeometry(radius,.07,12,72),ringIndex===0?darkMetal:edgeMetal);
  flange.rotation.y=Math.PI/2;
  flange.position.x=x;
  turbine.add(flange);
  components.push(flange);
  for(let b=0;b<12;b++){
    const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.08,8),darkMetal);
    const a=b/12*Math.PI*2;
    bolt.rotation.z=Math.PI/2;
    bolt.position.set(x,Math.cos(a)*(radius+.02),Math.sin(a)*(radius+.02));
    turbine.add(bolt);
    components.push(bolt);
  }
});

// Top service flange and accessory drive housing.
const serviceNeck=new THREE.Mesh(new THREE.CylinderGeometry(.3,.34,.42,32),darkMetal);
serviceNeck.position.set(-3.25,1.12,0);
turbine.add(serviceNeck);
components.push(serviceNeck);
const serviceFlange=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.16,40),darkShellMat);
serviceFlange.position.set(-3.25,1.38,0);
turbine.add(serviceFlange);
components.push(serviceFlange);
const accessoryHousing=new THREE.Mesh(new THREE.BoxGeometry(1.05,.55,.85),darkShellMat);
accessoryHousing.position.set(-.35,-1.05,0);
accessoryHousing.rotation.z=.08;
turbine.add(accessoryHousing);
components.push(accessoryHousing);

// Large boost-compressor rotor visible inside the dark inlet casing.
const boostRotor=new THREE.Group();
boostRotor.position.x=-3.72;
for(let b=0;b<12;b++){
  const blade=new THREE.Mesh(new THREE.BoxGeometry(.075,.72,.22),metal);
  blade.position.y=.58;
  blade.rotation.x=b*Math.PI*2/12;
  blade.rotation.z=-.34;
  boostRotor.add(blade);
}
turbine.add(boostRotor);
rotors.push(boostRotor);
components.push(boostRotor);

// Compressor casing seams and clamp bands.
[-2.65,-2.2,-1.75,-1.3,-.85,-.4,.05].forEach((x,index)=>{
  const radius=.78+(index/6)*.08;
  const band=new THREE.Mesh(new THREE.TorusGeometry(radius,.026,8,64),index%2?darkMetal:edgeMetal);
  band.rotation.y=Math.PI/2;
  band.position.x=x;
  turbine.add(band);
  components.push(band);
});

// External service lines break up the cylindrical silhouette.
for(let p=0;p<5;p++){
  const z=-.58+p*.29;
  const path=new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.8,1.0,z),
    new THREE.Vector3(-1.8,1.28,z*.9),
    new THREE.Vector3(-.55,1.08,z*.7),
    new THREE.Vector3(.55,.96,z*.55)
  ]);
  const pipe=new THREE.Mesh(new THREE.TubeGeometry(path,48,.025,8,false),edgeMetal);
  turbine.add(pipe);
  components.push(pipe);
}

// Segmented turbine-exhaust shroud, inspired by the official cutaway poster.
for(let petal=0;petal<8;petal++){
  const thetaStart=petal*Math.PI*2/8+.06;
  const petalMesh=new THREE.Mesh(
    new THREE.CylinderGeometry(1.38,1.2,.72,18,1,true,thetaStart,.66),
    edgeMetal
  );
  petalMesh.rotation.z=Math.PI/2;
  petalMesh.position.x=3.82;
  turbine.add(petalMesh);
  components.push(petalMesh);
}

// Complete KB7HE-style exhaust-end casing. The segmented shroud remains inside
// for cutaway/exploded chapters, while the assembled model presents a continuous
// silver diffuser body, recessed dark liner and bolted annular service flange.
const exhaustOuterCasing = cylinder(1.42,1.34,1.18,shellMat,3.76,96,true);
const exhaustInnerLiner = cylinder(1.1,1.02,.92,darkMetal,3.83,72,true);
const exhaustHubCap = cylinder(.32,.42,.46,darkMetal,3.98,48);
components.push(exhaustOuterCasing,exhaustInnerLiner,exhaustHubCap);

[[3.38,1.35],[3.68,1.38],[3.98,1.4],[4.25,1.41]].forEach(([x,radius])=>{
  const band=new THREE.Mesh(new THREE.TorusGeometry(radius,.038,10,88),edgeMetal);
  band.rotation.y=Math.PI/2;
  band.position.x=x;
  turbine.add(band);
  components.push(band);
});

const exhaustFaceFlange = new THREE.Mesh(
  new THREE.RingGeometry(.9,1.39,96,1),
  flangeFaceMat
);
exhaustFaceFlange.rotation.y=Math.PI/2;
exhaustFaceFlange.position.x=4.36;
exhaustFaceFlange.castShadow=exhaustFaceFlange.receiveShadow=true;
turbine.add(exhaustFaceFlange);
components.push(exhaustFaceFlange);

for(let b=0;b<20;b++){
  const a=b/20*Math.PI*2;
  const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.035,10),edgeMetal);
  bolt.rotation.z=Math.PI/2;
  bolt.position.set(4.385,Math.cos(a)*1.3,Math.sin(a)*1.3);
  turbine.add(bolt);
  components.push(bolt);
}

// Rings, ribs, and compressor stages
for (let i = 0; i < 13; i++) {
  const x = -2.55 + i * .25;
  const radius = .72 + i * .045;
  const hub = cylinder(.26 + i*.006, .26 + i*.006, .09, i % 3 === 0 ? edgeMetal : darkMetal, x, 32);
  const stageRing = new THREE.Mesh(new THREE.TorusGeometry(radius*.94, .025, 8, 64), i % 3 === 0 ? edgeMetal : darkMetal);
  stageRing.rotation.y = Math.PI/2;
  stageRing.position.x = x;
  turbine.add(stageRing);
  components.push(hub, stageRing);
  const rotor = new THREE.Group();
  rotor.position.x = x;
  for (let b = 0; b < 16; b++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(.035, radius * .58, .1), i % 2 ? edgeMetal : metal);
    blade.position.y = radius * .56;
    blade.rotation.x = b * Math.PI * 2 / 16;
    blade.rotation.z = -.24;
    rotor.add(blade);
  }
  turbine.add(rotor);
  rotors.push(rotor);
  components.push(rotor);
}

// Combustion core
const core = cylinder(.88, .9, 1.15, hotMat, 1.25, 48);
components.push(core);
for (let i = 0; i < 10; i++) {
  const can = new THREE.Mesh(new THREE.CapsuleGeometry(.12, .68, 6, 12), darkMetal);
  const a = i / 10 * Math.PI * 2;
  can.rotation.z = Math.PI / 2;
  can.position.set(1.25, Math.cos(a) * 1.08, Math.sin(a) * 1.08);
  turbine.add(can);
  components.push(can);
}

// Fuel manifolds and injector points around the combustion section.
for (let ringIndex = 0; ringIndex < 2; ringIndex++) {
  const manifold = new THREE.Mesh(new THREE.TorusGeometry(1.14 + ringIndex*.18, .035, 10, 72), tealMat);
  manifold.rotation.y = Math.PI/2;
  manifold.position.x = .96 + ringIndex*.5;
  turbine.add(manifold);
  components.push(manifold);
}
for (let i=0;i<10;i++) {
  const injector = new THREE.Mesh(new THREE.CylinderGeometry(.035,.055,.38,10),edgeMetal);
  const a=i/10*Math.PI*2;
  injector.position.set(.92,Math.cos(a)*1.1,Math.sin(a)*1.1);
  injector.rotation.x=a;
  turbine.add(injector);
  components.push(injector);
}

// Turbine stages and exhaust
for (let i = 0; i < 7; i++) {
  const x = 2.02 + i * .26;
  const radius = 1.22 - i * .065;
  const hub = cylinder(.34, .34, .1, i < 2 ? hotMat : darkMetal, x, 32);
  const stageRing = new THREE.Mesh(new THREE.TorusGeometry(radius*.93, .03, 8, 64), i < 2 ? hotMat : edgeMetal);
  stageRing.rotation.y = Math.PI/2;
  stageRing.position.x = x;
  turbine.add(stageRing);
  components.push(hub, stageRing);
  const rotor = new THREE.Group();
  rotor.position.x = x;
  for (let b = 0; b < 14; b++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(.045, radius * .62, .16), i < 2 ? hotMat : metal);
    blade.position.y = radius * .56;
    blade.rotation.x = b * Math.PI * 2 / 14;
    blade.rotation.z = .3;
    rotor.add(blade);
  }
  turbine.add(rotor);
  rotors.push(rotor);
  components.push(rotor);
}

// Front spinner, exhaust lip, sensor lines
const spinner = cylinder(.16, .52, .76, darkMetal, -4.58, 48);
const exhaustLip = cylinder(1.4, 1.4, .13, edgeMetal, 4.35, 72, true);
components.push(spinner, exhaustLip);
const accentLip = cylinder(1.42,1.42,.035,tealMat,4.43,72,true);
components.push(accentLip);
for (let i = 0; i < 4; i++) {
  const torus = new THREE.Mesh(new THREE.TorusGeometry(1.46 + i * .025, .018, 8, 80), i === 2 ? tealMat : darkMetal);
  torus.rotation.y = Math.PI / 2;
  torus.position.x = .82 + i * .34;
  turbine.add(torus);
  components.push(torus);
}

// Section-specific visualizers: a moving compressor scan and a combustion halo.
const scanRing = new THREE.Mesh(
  new THREE.TorusGeometry(1.28,.038,10,80),
  new THREE.MeshBasicMaterial({color:0x9e72ff,transparent:true,opacity:0})
);
scanRing.rotation.y=Math.PI/2;
scanRing.position.x=-2.5;
turbine.add(scanRing);
const heatAura = new THREE.Mesh(
  new THREE.TorusGeometry(1.58,.055,12,96),
  new THREE.MeshBasicMaterial({color:0xff6b4a,transparent:true,opacity:0})
);
heatAura.rotation.y=Math.PI/2;
heatAura.position.x=1.25;
turbine.add(heatAura);
const energyBeam = new THREE.Mesh(
  new THREE.CylinderGeometry(.035,.035,8.8,16),
  new THREE.MeshBasicMaterial({color:0xa988ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false})
);
energyBeam.rotation.z=Math.PI/2;
energyBeam.position.x=.15;
turbine.add(energyBeam);
components.forEach(part => {
  part.userData.baseX = part.position.x;
  part.userData.baseY = part.position.y;
  part.userData.baseZ = part.position.z;
  const order = components.indexOf(part);
  const sign = part.position.x < 0 ? -1 : 1;
  const micro = ((order % 5) - 2) * .075;
  part.userData.explodeX = part.position.x * 1.62 + sign * .48 + micro;
  part.userData.explodeY = part.position.y * 1.72 + Math.sin(order * 1.91) * .12;
  part.userData.explodeZ = part.position.z * 1.72 + Math.cos(order * 1.47) * .16;
  const x=part.position.x;
  part.userData.moduleIndex=x < -3.05 ? 0 : x < -.35 ? 1 : x < 1.7 ? 2 : x < 3.35 ? 3 : 4;
  part.userData.moduleOffset=[-1.35,-.62,0,.72,1.42][part.userData.moduleIndex];
});

const moduleHalos=[
  [-3.72,1.3,-1.35],[-1.45,1.12,-.62],[.95,1.28,0],[2.55,1.48,.72],[3.9,1.58,1.42]
].map(([x,radius,offset],index)=>{
  const halo=new THREE.Mesh(
    new THREE.TorusGeometry(radius,.025,8,80),
    new THREE.MeshBasicMaterial({color:index===2?0xff7955:0x8f68ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false})
  );
  halo.rotation.y=Math.PI/2;
  halo.position.x=x;
  halo.userData.baseX=x;
  halo.userData.offset=offset;
  halo.userData.index=index;
  turbine.add(halo);
  return halo;
});

const grid = new THREE.GridHelper(34, 34, 0x7950b8, 0xc7b9dd);
grid.position.y = -2.25;
grid.material.transparent = true;
grid.material.opacity = .22;
scene.add(grid);

// Particle flow through the core
const particleCount = 420;
const positions = new Float32Array(particleCount * 3);
const particleOffset = new Float32Array(particleCount);
for (let i = 0; i < particleCount; i++) {
  const x = Math.random() * 9 - 4.5;
  const r = .18 + Math.random() * .74;
  const a = Math.random() * Math.PI * 2;
  positions[i*3] = x; positions[i*3+1] = Math.cos(a)*r; positions[i*3+2] = Math.sin(a)*r;
  particleOffset[i] = Math.random();
}
const particlesGeo = new THREE.BufferGeometry();
particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particles = new THREE.Points(particlesGeo, new THREE.PointsMaterial({color:0x9b72ff,size:.025,transparent:true,opacity:.7,blending:THREE.AdditiveBlending}));
turbine.add(particles);

const sections = [...document.querySelectorAll('.panel')];
const dots = [...document.querySelectorAll('.rail-dot')];
const mobileSection = document.querySelector('.usecase-mobile');
const mobileVideo = document.querySelector('#mobileDeploymentVideo');
const replayDeployment = document.querySelector('#replayDeployment');
const videoSound = document.querySelector('#videoSound');
let currentSection = 0;
let exploded = false;
let cutaway = false;
let deploymentSoundOn = false;
let scrollProgress = 0;
let sectionStartedAt = performance.now();
const palette = [
  { fog: 0xf7f5fb, pos:[9.4,4.3,11.2], target:[1.8,.1,0], turbine:[2.5,.35,0], rot:[0,-.18,-.035], scale:.82 },
  { fog: 0x1d083f, pos:[9.2,3.8,12.2], target:[.15,0,0], turbine:[1.15,.15,0], rot:[.04,.03,0], scale:.76 },
  { fog: 0xf3effa, pos:[4.6,2.2,7.3], target:[-1.45,0,0], turbine:[1.75,.12,0], rot:[0,-.34,.025], scale:1.02 },
  { fog: 0x24104a, pos:[4.5,1.7,6.8], target:[1.15,0,0], turbine:[-1.15,.08,0], rot:[.02,.18,-.02], scale:1.04 },
  { fog: 0xf7f5fb, pos:[9.2,5.3,10.4], target:[.8,-.1,0], turbine:[-.1,.3,0], rot:[-.07,-.2,-.06], scale:.86 },
  { fog: 0xece8f7, pos:[8.6,3.7,10.2], target:[.9,0,0], turbine:[2.0,.35,0], rot:[-.02,-.28,-.03], scale:.8 },
  { fog: 0x1a0639, pos:[7.2,2.8,8.6], target:[.5,0,0], turbine:[-1.5,.15,0], rot:[.02,.08,0], scale:.9 },
  { fog: 0xeeeaf7, pos:[9.6,4.2,11.4], target:[1.3,0,0], turbine:[2.25,.4,0], rot:[-.04,-.35,-.05], scale:.76 },
  { fog: 0xf1edf8, pos:[10.8,4.6,13.2], target:[.25,0,0], turbine:[.15,.2,0], rot:[-.03,-.1,-.025], scale:.72 }
];
document.body.classList.add('scene-0');

function updateDeploymentSound(){
  if (!mobileVideo || !videoSound) return;
  mobileVideo.muted = !deploymentSoundOn;
  videoSound.setAttribute('aria-pressed',String(deploymentSoundOn));
  videoSound.lastChild.textContent = deploymentSoundOn ? ' 关闭声音' : ' 开启声音';
}

function playDeploymentScene(preserveSound=false){
  if (!mobileVideo || !mobileSection) return;
  mobileVideo.pause();
  mobileVideo.currentTime = 0;
  if (!preserveSound) deploymentSoundOn = false;
  updateDeploymentSound();
  mobileSection.classList.add('video-active');
  mobileSection.classList.remove('video-handoff');
  document.body.classList.add('deployment-video');
  document.body.classList.remove('deployment-handoff');
  const playback = mobileVideo.play();
  if (playback) playback.catch(()=>{
    mobileSection.classList.remove('video-active');
    document.body.classList.remove('deployment-video');
  });
}

function stopDeploymentScene(){
  if (!mobileVideo || !mobileSection) return;
  mobileVideo.pause();
  mobileSection.classList.remove('video-active','video-handoff');
  document.body.classList.remove('deployment-video','deployment-handoff');
}

mobileVideo?.addEventListener('timeupdate',()=>{
  if (currentSection !== 7) return;
  if (mobileVideo.currentTime >= 8.15 && !mobileSection.classList.contains('video-handoff')) {
    mobileSection.classList.add('video-handoff');
    document.body.classList.remove('deployment-video');
    document.body.classList.add('deployment-handoff');
    mobileVideo.pause();
  }
});
mobileVideo?.addEventListener('ended',()=>{
  mobileSection.classList.add('video-handoff');
  document.body.classList.remove('deployment-video');
  document.body.classList.add('deployment-handoff');
});
replayDeployment?.addEventListener('click',()=>playDeploymentScene(deploymentSoundOn));
videoSound?.addEventListener('click',()=>{
  deploymentSoundOn = !deploymentSoundOn;
  updateDeploymentSound();
});

function setSection(index) {
  if (index === currentSection) return;
  currentSection = index;
  sectionStartedAt = performance.now();
  dots.forEach((d,i)=>d.classList.toggle('active',i===index));
  document.body.classList.toggle('dark', index === 1 || index === 3 || index === 6);
  for(let i=0;i<9;i++) document.body.classList.remove(`scene-${i}`);
  document.body.classList.add(`scene-${index}`);
  exploded = index === 1;
  cutaway = index > 0 && index < 4;
  const explodeControl=document.querySelector('#explode');
  const cutawayControl=document.querySelector('#cutaway');
  explodeControl.classList.toggle('active',exploded);
  explodeControl.setAttribute('aria-pressed',String(exploded));
  cutawayControl.classList.toggle('active',cutaway);
  cutawayControl.setAttribute('aria-pressed',String(cutaway));
  shellMat.clippingPlanes=cutaway?[cutPlane]:[];
  shellMat.transparent=cutaway;
  shellMat.depthWrite=!cutaway;
  shellMat.opacity=cutaway?.46:1;
  shellMat.needsUpdate=true;
  darkShellMat.clippingPlanes=cutaway?[cutPlane]:[];
  darkShellMat.transparent=cutaway;
  darkShellMat.depthWrite=!cutaway;
  darkShellMat.opacity=cutaway?.46:1;
  darkShellMat.needsUpdate=true;
  const flash=document.querySelector('.scene-flash');
  flash.classList.remove('active');
  void flash.offsetWidth;
  flash.classList.add('active');
  if (index === 4) animateCounters();
  if (index === 7) playDeploymentScene();
  else stopDeploymentScene();
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting && entry.intersectionRatio > .55) setSection(sections.indexOf(entry.target)); });
}, { threshold:[.55] });
sections.forEach(section => observer.observe(section));
dots.forEach(dot => dot.addEventListener('click', () => sections[+dot.dataset.section].scrollIntoView({behavior:'smooth'})));
document.querySelector('[data-jump]').addEventListener('click',()=>sections[1].scrollIntoView({behavior:'smooth'}));

document.querySelector('#autoRotate').addEventListener('click', e => {
  controls.autoRotate = !controls.autoRotate;
  e.currentTarget.setAttribute('aria-pressed', String(controls.autoRotate));
});
document.querySelector('#cutaway').addEventListener('click', e => {
  cutaway = !cutaway;
  e.currentTarget.classList.toggle('active',cutaway);
  e.currentTarget.setAttribute('aria-pressed',String(cutaway));
  shellMat.clippingPlanes = cutaway ? [cutPlane] : [];
  shellMat.transparent = cutaway;
  shellMat.depthWrite = !cutaway;
  shellMat.opacity = cutaway ? .46 : 1;
  shellMat.needsUpdate = true;
  darkShellMat.clippingPlanes = cutaway ? [cutPlane] : [];
  darkShellMat.transparent = cutaway;
  darkShellMat.depthWrite = !cutaway;
  darkShellMat.opacity = cutaway ? .46 : 1;
  darkShellMat.needsUpdate = true;
});
document.querySelector('#explode').addEventListener('click', e => {
  exploded = !exploded;
  e.currentTarget.classList.toggle('active',exploded);
  e.currentTarget.setAttribute('aria-pressed',String(exploded));
});

let countersPlayed = false;
function animateCounters(){
  if (countersPlayed) return;
  countersPlayed = true;
  document.querySelectorAll('[data-count]').forEach(el=>{
    const target=+el.dataset.count, start=performance.now(), decimals=target%1?1:0;
    const tick=now=>{ const p=Math.min(1,(now-start)/1100); el.textContent=(target*(1-Math.pow(1-p,3))).toFixed(decimals); if(p<1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
}

addEventListener('scroll',()=>{ scrollProgress=scrollY/(document.documentElement.scrollHeight-innerHeight); },{passive:true});
addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight);
});

const clock = new THREE.Clock();
const desiredCam = new THREE.Vector3();
const desiredTarget = new THREE.Vector3();
const desiredTurbine = new THREE.Vector3();
const desiredRotation = new THREE.Vector3();
function animate(){
  requestAnimationFrame(animate);
  const t=clock.getElapsedTime();
  const p=palette[currentSection];
  desiredCam.fromArray(p.pos); desiredTarget.fromArray(p.target); desiredTurbine.fromArray(p.turbine);
  desiredRotation.fromArray(p.rot);
  if (!isDragging) camera.position.lerp(desiredCam,.035);
  controls.target.lerp(desiredTarget,.04);
  turbine.position.lerp(desiredTurbine,.045);
  turbine.rotation.x+=(desiredRotation.x-turbine.rotation.x)*.035;
  turbine.rotation.y+=(desiredRotation.y-turbine.rotation.y)*.035;
  turbine.rotation.z+=(desiredRotation.z-turbine.rotation.z)*.035;
  const nextScale=turbine.scale.x+(p.scale-turbine.scale.x)*.04;
  turbine.scale.setScalar(nextScale);
  scene.fog.color.lerp(new THREE.Color(p.fog),.035);
  if(cutaway){
    shellMat.opacity += (.46-shellMat.opacity)*.06;
    darkShellMat.opacity += (.46-darkShellMat.opacity)*.06;
  }
  particles.material.opacity += ((currentSection===1 || currentSection===2 || currentSection===3 ? .92 : .22)-particles.material.opacity)*.04;
  const sectionAge=(performance.now()-sectionStartedAt)/1000;
  components.forEach((part,i)=>{
    if (part===shaft) return;
    let targetX=exploded?part.userData.explodeX:part.userData.baseX;
    const targetY=exploded?part.userData.explodeY:part.userData.baseY;
    const targetZ=exploded?part.userData.explodeZ:part.userData.baseZ;
    if(currentSection===8){
      const moduleProgress=Math.max(0,Math.min(1,(sectionAge-part.userData.moduleIndex*.22)/1.05));
      const eased=1-Math.pow(1-moduleProgress,3);
      targetX=part.userData.baseX+part.userData.moduleOffset*eased;
    }
    part.position.x += (targetX-part.position.x)*.06;
    part.position.y += (targetY-part.position.y)*.06;
    part.position.z += (targetZ-part.position.z)*.06;
  });
  moduleHalos.forEach(halo=>{
    const reveal=currentSection===8?Math.max(0,Math.min(1,(sectionAge-halo.userData.index*.22)/.8)):0;
    halo.position.x+=(halo.userData.baseX+halo.userData.offset*reveal-halo.position.x)*.08;
    halo.material.opacity+=((currentSection===8?.3+.45*Math.sin(Math.PI*reveal):0)-halo.material.opacity)*.09;
    const haloScale=1+(currentSection===8?Math.sin(t*2.2+halo.userData.index)*.035:0);
    halo.scale.setScalar(haloScale);
  });
  const emergencyRamp=currentSection===6?Math.min(1,sectionAge/3.5):0;
  const rotorSpeed=currentSection===2?.085:currentSection===3?.052:currentSection===6?.018+emergencyRamp*.13:.024;
  rotors.forEach((r,i)=>r.rotation.x += rotorSpeed + i*.0008);
  scanRing.visible=currentSection===2;
  scanRing.position.x=-2.55+((t*.72)%1)*3.25;
  scanRing.material.opacity+=((currentSection===2?.9:0)-scanRing.material.opacity)*.09;
  heatAura.visible=currentSection===3||currentSection===5||currentSection===6;
  const auraTarget=currentSection===3?.78:currentSection===5?.5:currentSection===6?.9:0;
  heatAura.material.opacity+=(auraTarget-heatAura.material.opacity)*.08;
  heatAura.material.color.lerp(new THREE.Color(currentSection===5?0x8b6cff:0xff5b35),.08);
  const pulse=1+Math.sin(t*(currentSection===6?7.5:3.2))*(currentSection===6?.12:.055);
  heatAura.scale.setScalar(pulse);
  const beamOn=currentSection===2||currentSection===3||currentSection===6;
  energyBeam.visible=beamOn;
  energyBeam.material.opacity+=((beamOn?.88:0)-energyBeam.material.opacity)*.1;
  energyBeam.scale.set(1,1+Math.sin(t*4.5)*.035,1);
  const flowSpeed=currentSection===2?.052:currentSection===3?.078:currentSection===6?.035+emergencyRamp*.09:.018;
  particles.material.color.lerp(new THREE.Color(currentSection===3||currentSection===6?0xff7048:0x9b72ff),.06);
  particles.material.size+=(((currentSection===3||currentSection===6) ? .045 : .025)-particles.material.size)*.06;
  const arr=particlesGeo.attributes.position.array;
  for(let i=0;i<particleCount;i++){ arr[i*3]+=flowSpeed; if(arr[i*3]>4.5) arr[i*3]=-4.5; }
  particlesGeo.attributes.position.needsUpdate=true;
  hotLight.intensity=(currentSection===6?1.8+emergencyRamp*4.5:.7)+Math.sin(t*(currentSection===6?8:3))*(currentSection===6?.6:.1);
  if(currentSection===7) turbine.position.y+=Math.sin(t*1.35)*.0035;
  controls.update();
  renderer.render(scene,camera);
}
scene.background = null;
animate();
