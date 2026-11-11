// Spielzeit: Tagesbudget für alle Spiele zusammen, sanftes Ende, Eltern-Ecke
(function(){
  const isHub=/start\.html$/.test(location.pathname)||document.body.dataset.hub==='1';
  const today=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
  const get=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}};
  const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  function state(){let s=get('sz_tag',null);if(!s||s.d!==today())s={d:today(),used:0,extra:0,warned:false};return s}
  const limit=()=>get('sz_limit',15);                               // Minuten pro Tag
  const file=(location.pathname.split('/').pop()||'index.html');
  const freeList=()=>get('sz_free',[]);
  const isFree=f=>freeList().includes(f);
  const setFree=(f,on)=>{const l=freeList().filter(x=>x!==f);if(on)l.push(f);put('sz_free',l)};
  window.SZ={isFree,openParent:()=>openParent()};
  const left=()=>{const s=state();return (limit()+s.extra)*60-s.used};  // Sekunden übrig

  // ---------- Oberfläche ----------
  const css=document.createElement('style');css.textContent=`
  #szBanner{position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 60px);transform:translateX(-50%) translateY(-20px);opacity:0;z-index:9998;
    background:#FFE7A8;color:#3B2F2A;border-radius:18px;padding:10px 18px;font:800 18px -apple-system,system-ui,sans-serif;box-shadow:0 4px 0 #D9B860;transition:all .4s;pointer-events:none;white-space:nowrap}
  #szBanner.on{opacity:1;transform:translateX(-50%) translateY(0)}
  #szSleep{position:fixed;inset:0;z-index:9999;display:none;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;
    background:linear-gradient(#2B3A6B,#4A5A9A);color:#fff;font-family:-apple-system,"SF Pro Rounded",system-ui,sans-serif;padding:24px}
  #szSleep.on{display:flex}
  #szLock{position:fixed;inset:0;z-index:9999;display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;background:#8C96A1;color:#fff;font-family:-apple-system,system-ui,sans-serif;padding:24px}
  #szLock.on{display:flex} #szLock h2{margin:0;font-size:28px} #szLock p{margin:0;font-size:19px}
  #szParent .gl{max-height:42vh;overflow:auto;display:flex;flex-direction:column;gap:6px}
  #szParent .gl label{display:flex;align-items:center;gap:10px;font-size:16px;background:#F4F6F8;border-radius:10px;padding:8px 10px}
  #szParent .gl input{width:22px;height:22px;flex:none}
  #szSleep .moon{font-size:90px;animation:szF 3s ease-in-out infinite}
  #szSleep .zzz{font-size:44px;font-weight:900;opacity:.8;animation:szF 2s ease-in-out infinite}
  #szSleep h2{margin:0;font-size:30px} #szSleep p{margin:0;font-size:19px;opacity:.85}
  @keyframes szF{50%{transform:translateY(-8px)}}
  #szParent{position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.45);font-family:-apple-system,system-ui,sans-serif}
  #szParent.on{display:flex}
  #szParent .box{background:#fff;color:#2F3B4A;border-radius:22px;padding:20px;width:min(90vw,360px);display:flex;flex-direction:column;gap:12px}
  #szParent h3{margin:0;font-size:20px}
  #szParent input{font-size:22px;padding:8px 10px;border-radius:12px;border:2px solid #CCD;width:100%}
  #szParent button{font:700 17px -apple-system,system-ui,sans-serif;border:0;border-radius:12px;padding:11px;background:#EEF1F5;color:#2F3B4A}
  #szParent button.p{background:#3F9560;color:#fff}
  #szParent .row{display:flex;gap:8px;flex-wrap:wrap} #szParent .row button{flex:1}
  #szParent .row button.sel{background:#2E7CC4;color:#fff}
  #szParent .info{font-size:14px;opacity:.7}
  #szClock{display:inline-flex;align-items:center;gap:6px;background:#fff;border-radius:16px;padding:6px 12px;font:800 16px -apple-system,system-ui,sans-serif;box-shadow:0 2px 0 #E3D3B8}`;
  document.head.appendChild(css);
  const add=h=>{const d=document.createElement('div');d.innerHTML=h;document.body.appendChild(d.firstElementChild)};
  add('<div id="szBanner">⏳ Gleich ist die Spielzeit vorbei</div>');
  add('<div id="szSleep"><div class="moon">🌙</div><div style="font-size:70px">🐴<span class="zzz">z z z</span></div><h2>Max schläft jetzt.</h2><p>Morgen spielen wir weiter!</p></div>');
  add('<div id="szLock"><div style="font-size:90px">🔒</div><h2>Dieses Spiel ist noch zu.</h2><p>Frag Mama oder Papa!</p><a href="start.html" style="margin-top:10px;font:800 20px system-ui;color:#fff;background:#3F9560;padding:14px 26px;border-radius:18px;text-decoration:none">🏠 Zur Übersicht</a></div>');
  add('<div id="szParent"><div class="box" id="szBox"></div></div>');

  function say(t){if(!('speechSynthesis' in window))return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='de-DE';u.rate=.9;u.pitch=1.1;
    const v=speechSynthesis.getVoices().filter(x=>x.lang&&x.lang.toLowerCase().startsWith('de'));u.voice=v.find(x=>/Anna/i.test(x.name))||v[0]||null;window._szU=u;setTimeout(()=>speechSynthesis.speak(u),300)}catch(e){}}

  // ---------- Zeit zählen (nur in Spielen, nur wenn sichtbar) ----------
  let over=false,overAt=0,slept=false;
  function sleep(){if(slept)return;slept=true;document.getElementById('szSleep').classList.add('on');document.getElementById('szBanner').classList.remove('on');
    say('Die Spielzeit ist vorbei. Max schläft jetzt. Morgen spielen wir weiter!')}
  function wake(){slept=false;over=false;document.getElementById('szSleep').classList.remove('on')}
  // Spiel ist gerade zu Ende oder im Startbildschirm? Dann sanft beenden.
  const atBreak=()=>{const s=document.getElementById('start'),e=document.getElementById('end');return (s&&s.classList.contains('on'))||(e&&e.classList.contains('on'))};
  function tick(){
    if(document.visibilityState!=='visible'||slept)return;
    const s=state();
    if(!isHub){s.used+=5;
      if(left()<=120&&!s.warned){s.warned=true;const b=document.getElementById('szBanner');b.classList.add('on');setTimeout(()=>b.classList.remove('on'),6000);say('Gleich ist die Spielzeit vorbei.')}}
    put('sz_tag',s);
    if(left()<=0){if(!over){over=true;overAt=Date.now()}
      if(isHub||atBreak()||Date.now()-overAt>180000)sleep()}            // Spiel darf noch fertig werden, höchstens 3 Minuten
    clock();
  }
  function lockCheck(){const l=document.getElementById('szLock');if(!isHub&&!isFree(file)){l.classList.add('on');return true}l.classList.remove('on');return false}
  lockCheck();
  setInterval(()=>{if(!(!isHub&&!isFree(file)))tick()},5000);
  if(left()<=0){over=true;overAt=0;setTimeout(sleep,400)}

  // Restzeit-Anzeige auf der Übersicht
  function clock(){const c=document.getElementById('szClock');if(!c)return;const m=Math.max(0,Math.ceil(left()/60));
    c.innerHTML=`${m>5?'☀️':m>0?'🌅':'🌙'} Noch ${m} Min. Spielzeit`}
  if(isHub){const h=document.querySelector('h1');if(h){h.insertAdjacentHTML('afterend','<div style="text-align:center;margin:6px 0 4px"><span id="szClock"></span></div>')}clock()}

  // ---------- Eltern-Ecke: 2 Sekunden lang drücken ----------
  function longPress(el){if(!el)return;let t=null;
    el.addEventListener('pointerdown',()=>{t=setTimeout(openParent,2000)});['pointerup','pointerleave','pointercancel'].forEach(e=>el.addEventListener(e,()=>clearTimeout(t)))}
  longPress(document.getElementById('szSleep'));longPress(document.getElementById('szLock'));longPress(document.querySelector('h1'));longPress(document.getElementById('szClock'));
  function openParent(){
    const a=6+Math.floor(Math.random()*7),b=6+Math.floor(Math.random()*7),box=document.getElementById('szBox');
    box.innerHTML=`<h3>👨‍👩‍👧 Eltern-Ecke</h3><div class="info">Bitte lösen: ${a} × ${b} = ?</div>
      <input id="szAns" inputmode="numeric" autocomplete="off"><div class="row"><button id="szNo">Abbrechen</button><button class="p" id="szOk">Weiter</button></div>`;
    document.getElementById('szParent').classList.add('on');setTimeout(()=>document.getElementById('szAns').focus(),100);
    document.getElementById('szNo').onclick=closeParent;
    document.getElementById('szOk').onclick=()=>{if(+document.getElementById('szAns').value===a*b)settings();else{document.getElementById('szAns').value='';document.getElementById('szAns').placeholder='Leider falsch'}};
  }
  function settings(){
    const box=document.getElementById('szBox'),s=state(),used=Math.round(s.used/60);
    box.innerHTML=`<h3>⏳ Spielzeit</h3><div class="info">Heute gespielt: ${used} Min. · übrig: ${Math.max(0,Math.ceil(left()/60))} Min.</div>
      <div class="info">Minuten pro Tag:</div><div class="row">${[10,15,20,30,45,60].map(m=>`<button data-m="${m}" class="${m===limit()?'sel':''}">${m}</button>`).join('')}</div>
      <div class="row"><button id="szPlus">+10 Min. heute</button><button id="szReset">Heute neu starten</button></div>
      <div class="info">Spiele freigeben:</div><div class="gl">${(window.SZ_GAMES||[[file,'','Dieses Spiel']]).map(([f,e,n])=>`<label><input type="checkbox" data-f="${f}" ${isFree(f)?'checked':''}>${e} ${n}</label>`).join('')}</div>
      <button class="p" id="szClose">Fertig</button>`;
    box.querySelectorAll('[data-f]').forEach(c=>c.onchange=()=>{setFree(c.dataset.f,c.checked);if(window.renderTiles)window.renderTiles()});
    box.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{put('sz_limit',+b.dataset.m);settings()});
    document.getElementById('szPlus').onclick=()=>{const s=state();s.extra+=10;s.warned=false;put('sz_tag',s);settings()};
    document.getElementById('szReset').onclick=()=>{put('sz_tag',{d:today(),used:0,extra:0,warned:false});settings()};
    document.getElementById('szClose').onclick=()=>{closeParent();if(left()>0)wake();clock();lockCheck();if(window.renderTiles)window.renderTiles()};
  }
  function closeParent(){document.getElementById('szParent').classList.remove('on')}
})();
