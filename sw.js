// Gemmer spillet på telefonen, så det virker uden net efter første besøg.
const V='ncm-v5';
const FILES=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  if(e.request.mode==='navigate'){
    // Prøv nettet først (max 3 sek), så nye versioner kommer med det samme. Ellers den gemte udgave.
    e.respondWith(caches.open(V).then(async c=>{
      const net=fetch(e.request).then(r=>{if(r&&r.ok)c.put('./index.html',r.clone());return r;});
      const timeout=new Promise(res=>setTimeout(()=>res(null),3000));
      try{const r=await Promise.race([net,timeout]);if(r)return r;}catch(err){}
      return (await c.match('./index.html'))||net;
    }));
    return;
  }
  e.respondWith(caches.open(V).then(async c=>{
    const hit=await c.match(e.request,{ignoreSearch:true});
    const net=fetch(e.request).then(r=>{if(r&&r.ok)c.put(e.request,r.clone());return r;}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit;}
    return (await net)||c.match('./index.html');
  }));
});
