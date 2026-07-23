/* Service worker do app "Apuração Variável".
   Estratégia: guarda uma cópia do app (HTML, manifest, ícones) no cache do
   dispositivo na primeira visita, e depois disso o app abre normalmente
   mesmo sem internet. Quando há conexão, sempre tenta buscar a versão mais
   nova primeiro (assim, quando você publicar uma atualização do arquivo,
   quem tiver internet já vê a versão nova). */

var CACHE_NAME = 'apuracao-variavel-v1';
var ARQUIVOS_DO_APP = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ARQUIVOS_DO_APP);
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(nomes){
      return Promise.all(nomes.filter(function(n){ return n !== CACHE_NAME; }).map(function(n){ return caches.delete(n); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  // Só cuida de requisições do próprio app (mesma origem). Tudo o mais
  // (ex.: fontes do Google) segue direto pela rede, sem passar pelo cache.
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin){
    return;
  }

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then(function(resposta){
        var copia = resposta.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copia); });
        return resposta;
      })
      .catch(function(){
        return caches.match(event.request).then(function(cached){
          return cached || caches.match('./index.html');
        });
      })
  );
});
