import * as T from './assets/three.module.js';
import {projects} from './data.js';

// MNI coordinates are visual anchors, not boundaries of segmented regions.
export const regions=[
  {name:'Okodukai',logo:'assets/project-logos/okodukai-original.png',detailLogo:'assets/project-logos/okodukai-full.png',brand:'illustrated',zone:'Cortex préfrontal',theme:'Choisir & anticiper',meaning:"Apprendre à décider, dépenser et économiser.",color:'#a4e6e2',mni:[-32,52,12]},
  {name:'Héros de la classe',logo:'assets/project-logos/heros-original.png',brand:'heroes',zone:'Hippocampe',theme:'Apprendre & mémoriser',meaning:"Réviser le programme scolaire en avançant dans une histoire.",color:'#d5c3fa',mni:[-28,-20,-16],internal:true},
  {name:'Politiquizz',logo:'assets/project-logos/politiquizz.webp',zone:'Jonction temporo-pariétale',theme:'Comprendre les autres',meaning:"Confronter ses opinions aux positions politiques et aux votes publics.",color:'#a6cffa',mni:[-58,-48,24]},
  {name:'Not My Fault',logo:'assets/project-logos/not-my-fault-original.webp',brand:'illustrated',zone:'Cortex cingulaire antérieur',theme:'Coopérer & arbitrer',meaning:"Recouper les indices et décider ensemble sous la pression du temps.",color:'#f0bf9c',mni:[-6,28,28],internal:true},
  {name:'Sandbox Podcast',logo:'assets/project-logos/sandbox.svg',zone:'Aire de Broca',theme:'Échanger & transmettre',meaning:"Mettre des mots sur l'actualité de l'IA, les outils et nos expériences.",color:'#bde7bc',mni:[-49,22,8]}
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function brainTemplate(){return `<div class="brain-heading"><div><div class="section-index">03 / PROJETS</div><h2>Dans ma tête<span>.</span></h2><p>Cinq projets, cinq façons de réfléchir.</p></div><span class="brain-heading-note">Sélectionne un projet<br>pour explorer sa zone.</span></div><div class="brain-workspace"><div class="brain-project-list" role="group" aria-label="Choisir un projet">${regions.map((r,i)=>`<button class="brain-project-choice" data-project="${i}" aria-pressed="${i===0}" style="--region:${r.color}"><img class="brain-choice-logo" data-brand="${r.brand||'default'}" src="${r.logo}" alt="" width="44" height="44"><span><strong>${esc(r.name)}</strong><small>${esc(r.zone)}</small></span><span class="brain-choice-arrow" aria-hidden="true">↗</span></button>`).join('')}</div><div class="brain-stage"><div class="brain-ambient" aria-hidden="true"></div><canvas class="brain-canvas" aria-label="Cerveau 3D interactif. Utilise les projets ou les boutons de rotation pour l’explorer."></canvas><div class="brain-hotspots" role="group" aria-label="Zones du cerveau">${regions.map((r,i)=>`<button class="brain-hotspot" data-brand="${r.brand||'default'}" data-project="${i}" aria-label="${esc(r.name+' : '+r.zone)}" aria-pressed="${i===0}" style="--region:${r.color}" hidden><span><img src="${r.logo}" alt="" width="36" height="36"></span></button>`).join('')}</div><span class="brain-loading" role="status">Préparation du cerveau 3D…</span><div class="brain-orientation" aria-hidden="true"><span>05 PROJETS</span><i></i><span>ROTATION LIBRE</span></div><div class="brain-tools"><button data-turn="-1" aria-label="Tourner le cerveau à gauche">↶</button><span>Glisse pour explorer</span><button data-turn="1" aria-label="Tourner le cerveau à droite">↷</button></div></div><div class="brain-detail" aria-live="polite" aria-atomic="true"></div></div><p class="brain-footnote">Une carte de mes projets, inspirée des fonctions du cerveau. Les repères sont schématiques.</p>`;}

export function mountBrain(root,{reducedMotion,paused}){
  const stage=root.querySelector('.brain-stage');if(!stage)return()=>{};
  const canvas=stage.querySelector('canvas');const detail=root.querySelector('.brain-detail');
  const choices=[...root.querySelectorAll('[data-project]')];const hotspots=[...root.querySelectorAll('.brain-hotspot')];
  const loading=stage.querySelector('.brain-loading');let active=0,disposed=false,renderer,frame,observer,geometry,scene;
  let yaw=2.15,targetYaw=yaw,pitch=.13,targetPitch=pitch,drag=null,interacted=false;
  const listeners=new AbortController();const {signal}=listeners;
  const selectedUniform={value:new T.Vector3()},colorUniform={value:new T.Color(regions[0].color)};
  function select(index){
    active=index;interacted=true;const region=regions[index];const project=projects.find(p=>p[0]===region.name);
    choices.forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.project)===index)));
    detail.style.setProperty('--region',region.color);
    detail.innerHTML=`<div class="brain-detail-index"><span>PROJET 0${index+1}</span><span>0${index+1} / 05</span></div><img class="brain-detail-logo" data-brand="${region.brand||'default'}" src="${region.detailLogo||region.logo}" alt="" width="64" height="64"><span class="brain-detail-theme">${esc(region.theme)}</span><h3>${esc(region.name)}</h3><div class="brain-zone"><span class="brain-zone-dot"></span>${esc(region.zone)}${region.internal?'<small>Structure interne</small>':''}</div><p class="brain-meaning">${esc(region.meaning)}</p><p class="brain-description">${esc(project[2])}</p><a class="brain-visit" href="${esc(project[3])}" target="_blank" rel="noopener">Découvrir ${esc(region.name)} <span class="icon-external" aria-hidden="true"></span></a>`;
    colorUniform.value.set(region.color);if(region.point)selectedUniform.value.copy(region.point);
    targetYaw=index===2?1.0:index===3?2.65:index===1?1.8:2.15;targetPitch=index===1?-.12:.13;
  }
  choices.forEach(button=>button.addEventListener('click',()=>select(Number(button.dataset.project)),{signal}));
  select(0);interacted=false;
  root.querySelectorAll('[data-turn]').forEach(button=>button.addEventListener('click',()=>{targetYaw+=Number(button.dataset.turn)*.45;interacted=true;},{signal}));
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');interacted=true;},{signal});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;targetYaw+=(e.clientX-drag.x)*.006;targetPitch=T.MathUtils.clamp(targetPitch+(e.clientY-drag.y)*.004,-.65,.65);drag={x:e.clientX,y:e.clientY};},{signal});
  const endDrag=()=>{drag=null;canvas.classList.remove('dragging');};
  canvas.addEventListener('pointerup',endDrag,{signal});canvas.addEventListener('pointercancel',endDrag,{signal});canvas.addEventListener('lostpointercapture',endDrag,{signal});
  async function init(){
    try{
      renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
      renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x080c10,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
      const [buffer,meta]=await Promise.all([fetch('assets/brain-surface.bin',{signal}).then(r=>{if(!r.ok)throw Error('Brain mesh');return r.arrayBuffer();}),fetch('assets/brain-model.json',{signal}).then(r=>r.json())]);if(disposed)return;
      const [vertexCount,indexCount]=new Uint32Array(buffer,0,2);
      geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,8,vertexCount*3),3));geometry.setIndex(new T.BufferAttribute(new Uint32Array(buffer,8+vertexCount*12,indexCount),1));geometry.computeVertexNormals();geometry.computeBoundingSphere();
      scene=new T.Scene();const camera=new T.PerspectiveCamera(35,1,.1,50);camera.position.set(0,.1,6.7);camera.lookAt(0,0,0);
      const brain=new T.Group();scene.add(brain);
      regions.forEach(r=>{r.point=new T.Vector3((r.mni[0]-meta.center[0])/55,(r.mni[2]-meta.center[2])/55,-(r.mni[1]-meta.center[1])/55);});selectedUniform.value.copy(regions[active].point);
      const material=new T.MeshPhysicalMaterial({color:0x2e666e,metalness:.38,roughness:.43,clearcoat:.55,clearcoatRoughness:.3,side:T.DoubleSide});
      material.onBeforeCompile=shader=>{
        shader.uniforms.uSelected=selectedUniform;shader.uniforms.uRegionColor=colorUniform;
        shader.vertexShader='varying vec3 vBrainPosition;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBrainPosition=position;');
        shader.fragmentShader='varying vec3 vBrainPosition; uniform vec3 uSelected; uniform vec3 uRegionColor;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat regionGlow=exp(-dot(vBrainPosition-uSelected,vBrainPosition-uSelected)*5.0); totalEmissiveRadiance+=uRegionColor*regionGlow*.55;');
      };
      brain.add(new T.Mesh(geometry,material));
      const points=[];for(let i=0;i<vertexCount;i+=7)points.push(...geometry.attributes.position.array.slice(i*3,i*3+3));
      const pointsGeometry=new T.BufferGeometry();pointsGeometry.setAttribute('position',new T.Float32BufferAttribute(points,3));
      brain.add(new T.Points(pointsGeometry,new T.PointsMaterial({color:0x9dece4,size:.012,transparent:true,opacity:.36,blending:T.AdditiveBlending,depthWrite:false})));
      scene.add(new T.HemisphereLight(0xc3f9f4,0x07151f,2));const key=new T.DirectionalLight(0xa4f8eb,4);key.position.set(-3,4,5);scene.add(key);const rim=new T.DirectionalLight(0x5f85da,5);rim.position.set(4,1,-3);scene.add(rim);const fill=new T.PointLight(0xb2edff,14,12);fill.position.set(-3,-2,2);scene.add(fill);
      const nodes=regions.map((region,i)=>{const group=new T.Group();group.position.copy(region.point);brain.add(group);const core=new T.Mesh(new T.SphereGeometry(.033,16,12),new T.MeshBasicMaterial({color:region.color,depthTest:false,transparent:true}));core.renderOrder=5;group.add(core);const halo=new T.Mesh(new T.SphereGeometry(.095,16,12),new T.MeshBasicMaterial({color:region.color,transparent:true,opacity:.12,depthWrite:false,depthTest:false,blending:T.AdditiveBlending}));halo.renderOrder=4;group.add(halo);return {group,halo,core};});
      // Fine dotted orbital guides keep the volume readable against the dark page.
      for(let j=0;j<2;j++){const orbit=[];for(let i=0;i<=180;i++){const a=i/180*Math.PI*2;orbit.push(new T.Vector3(Math.cos(a)*2.02,-1.65+j*.05,Math.sin(a)*1.65));}const orbitGeometry=new T.BufferGeometry().setFromPoints(orbit);const ring=new T.Line(orbitGeometry,new T.LineDashedMaterial({color:0x397178,transparent:true,opacity:j?.16:.4,dashSize:.025,gapSize:.055}));ring.computeLineDistances();scene.add(ring);}
      let w=0,h=0;function resize(){w=stage.clientWidth;h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=w/h<1.1?8.3:6.7;camera.updateProjectionMatrix();}
      observer=new ResizeObserver(resize);observer.observe(stage);resize();loading.hidden=true;stage.classList.add('brain-ready');
      const projected=new T.Vector3();let last=0;
      const draw=now=>{if(disposed)return;frame=requestAnimationFrame(draw);if(document.hidden||now-last<32)return;last=now;
        const still=reducedMotion()||paused();const amount=still?1:.075;yaw+=(targetYaw-yaw)*amount;pitch+=(targetPitch-pitch)*amount;
        brain.rotation.set(pitch,yaw+(!interacted&&!still?Math.sin(now*.00016)*.12:0),-.08);brain.position.y=!still?Math.sin(now*.00065)*.025:0;
        brain.updateMatrixWorld(true);camera.updateMatrixWorld(true);
        nodes.forEach((node,i)=>{const isActive=i===active;node.halo.scale.setScalar(isActive&&!still?1.25+Math.sin(now*.002)*.2:1);node.halo.material.opacity=isActive?.24:.08;node.core.scale.setScalar(isActive?1.4:1);
          node.group.getWorldPosition(projected);projected.project(camera);const button=hotspots[i];button.hidden=false;button.style.left=`${(projected.x*.5+.5)*w}px`;button.style.top=`${(-projected.y*.5+.5)*h}px`;button.style.zIndex=String(Math.round((1-projected.z)*100));});
        renderer.render(scene,camera);
      };frame=requestAnimationFrame(draw);
    }catch(error){if(disposed)return;loading.textContent='La vue 3D est indisponible. Les cinq projets restent accessibles.';stage.classList.add('brain-unavailable');console.warn('Vue cerveau indisponible',error);}
  }
  init();
  return()=>{disposed=true;listeners.abort();cancelAnimationFrame(frame);observer?.disconnect();if(scene){const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}geometry?.dispose();renderer?.dispose();};
}
