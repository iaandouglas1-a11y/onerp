/* On ERP: comunicação de indisponibilidade sem armazenar respostas com dados do usuário. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', evento => evento.waitUntil(self.clients.claim()));
self.addEventListener('fetch', evento => {
  if (evento.request.mode !== 'navigate') return;
  evento.respondWith(fetch(evento.request).catch(() => new Response(
    '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>On ERP • Sem conexão</title><body style="font-family:system-ui;background:#F4F6F8;color:#0A111C;display:grid;place-items:center;min-height:90vh"><main style="max-width:420px;padding:26px"><h1>Sem conexão</h1><p>O On ERP precisa de conexão para consultar ou atualizar informações do escritório. Nenhum dado operacional foi armazenado offline.</p><button onclick="location.reload()" style="background:#7CB93C;border:0;padding:12px 18px;border-radius:8px">Tentar novamente</button></main></body></html>',
    {status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}}
  )));
});
