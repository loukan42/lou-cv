import {press} from './data.js';

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const archiveIcon='<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 2.5h7l3 3v12H5zM12 2.5v4h3M8 10h4M8 13h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const closeIcon='<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

export function pressTemplate(){
  return `<div class="press-heading"><div><div class="section-index">06 / PRESSE</div><h1 class="press-title">Dans la presse<span>.</span></h1><p>Des articles sur mes projets, parus entre 2014 et 2016.</p></div><span class="press-count"><strong>${String(press.length).padStart(2,'0')}</strong> articles</span></div>
    <div class="press-grid">${press.map((item,index)=>`<article class="press-card${index===0?' press-featured':''}">
      <figure class="press-figure"><a class="press-photo" href="${escape(item.url)}" target="_blank" rel="noopener" aria-label="Lire dans ${escape(item.source)} : ${escape(item.title)}"><img src="${escape(item.image)}" alt="${escape(item.imageAlt)}" width="${index===0?960:885}" height="${index===0?728:500}" loading="${index===0?'eager':'lazy'}"></a><figcaption>${escape(item.photoCredit)}</figcaption></figure>
      <div class="press-card-body"><div class="press-meta"><span class="press-publication" data-publication="${item.source==='Midi Libre'?'midilibre':'maddyness'}">${escape(item.source)}</span><time datetime="${escape(item.isoDate)}">${escape(item.date)}</time></div><h2><a href="${escape(item.url)}" target="_blank" rel="noopener">${escape(item.title)}</a></h2><p>${escape(item.description)}</p><div class="press-actions"><a class="press-read" href="${escape(item.url)}" target="_blank" rel="noopener">Lire l’article <span class="icon-external" aria-hidden="true"></span></a><button class="press-archive" type="button" data-press-archive="${escape(item.id)}">${archiveIcon} Voir la capture</button></div></div>
    </article>`).join('')}</div>
    <dialog class="press-viewer" aria-labelledby="press-viewer-title"><div class="press-viewer-heading"><div><span class="press-viewer-source"></span><h2 id="press-viewer-title"></h2></div><button class="press-viewer-close" type="button" aria-label="Fermer la capture" autofocus>${closeIcon}</button></div><div class="press-viewer-toolbar"><span>Capture du 22 octobre 2026</span><div><button class="press-viewer-zoom" type="button" aria-pressed="false">Agrandir</button><a class="press-viewer-download" download>Télécharger</a><a class="press-viewer-original" target="_blank" rel="noopener">Article original <span class="icon-external" aria-hidden="true"></span></a></div></div><div class="press-viewer-body" tabindex="0" aria-label="Capture de l’article"><img class="press-viewer-image" alt=""></div></dialog>`;
}

export function mountPress(root){
  const dialog=root.querySelector('.press-viewer');
  const image=dialog.querySelector('.press-viewer-image');
  const body=dialog.querySelector('.press-viewer-body');
  const zoom=dialog.querySelector('.press-viewer-zoom');
  let trigger;
  const setZoom=expanded=>{
    const oldWidth=image.clientWidth;
    const top=body.scrollTop,left=body.scrollLeft;
    body.classList.toggle('is-zoomed',expanded);
    zoom.setAttribute('aria-pressed',String(expanded));
    zoom.textContent=expanded?'Réduire':'Agrandir';
    if(oldWidth){const scale=image.clientWidth/oldWidth;body.scrollTo(left*scale,top*scale);}
  };
  const onClick=event=>{
    const archive=event.target.closest('[data-press-archive]');
    if(archive){
      const item=press.find(entry=>entry.id===archive.dataset.pressArchive);
      if(!item)return;
      trigger=archive;
      dialog.querySelector('.press-viewer-source').textContent=`${item.source} · ${item.date}`;
      dialog.querySelector('#press-viewer-title').textContent=item.title;
      dialog.querySelector('.press-viewer-download').href=item.screenshot;
      dialog.querySelector('.press-viewer-original').href=item.url;
      image.alt=`Capture de l’article « ${item.title} », publié dans ${item.source}.`;
      image.onload=()=>{
        body.style.setProperty('--archive-width',`${image.naturalWidth}px`);
        body.scrollTo(0,Math.max(0,(item.captureTop-24)*image.clientWidth/image.naturalWidth));
      };
      image.src=item.screenshot;
      setZoom(false);
      dialog.showModal();
      body.scrollTo(0,0);
    }else if(event.target.closest('.press-viewer-close'))dialog.close();
    else if(event.target.closest('.press-viewer-zoom'))setZoom(zoom.getAttribute('aria-pressed')!=='true');
    else if(event.target===dialog){
      const box=dialog.getBoundingClientRect();
      if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();
    }
  };
  const onClose=()=>{setZoom(false);trigger?.focus({preventScroll:true});};
  root.addEventListener('click',onClick);
  dialog.addEventListener('close',onClose);
  return ()=>{root.removeEventListener('click',onClick);dialog.removeEventListener('close',onClose);if(dialog.open)dialog.close();image.onload=null;};
}
