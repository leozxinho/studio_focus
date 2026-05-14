# Configuração do Cron Externo para Push Notifications

O Vercel no plano Hobby (gratuito) executa crons apenas **1x por dia**.
Para que os alarmes de suplementos funcionem com precisão de **1 minuto**,
é necessário configurar um serviço de cron externo gratuito.

## Pré-requisitos

1. **Variáveis de ambiente configuradas na Vercel:**
   - `VAPID_PUBLIC_KEY` — chave pública VAPID
   - `VAPID_PRIVATE_KEY` — chave privada VAPID
   - `REDIS_URL` — URL de conexão Redis (ex: Upstash)
   - `CRON_SECRET` — string secreta para autenticar chamadas ao endpoint

2. **Redis ativo** — Recomendado: [Upstash](https://upstash.com/) (plano gratuito)

3. **Gerar chaves VAPID** (se ainda não tiver):
   ```bash
   npx web-push generate-vapid-keys
   ```

## Verificar se tudo está funcionando

Acesse no navegador:
```
https://seu-dominio.vercel.app/api/push-debug
```

Deve retornar:
```json
{
  "hasRedisUrl": true,
  "redisOk": true,
  "hasVapidPub": true,
  "hasVapidPriv": true
}
```

## Opção 1: cron-job.org (Recomendado — 1 minuto grátis)

1. Acesse [cron-job.org](https://cron-job.org) e crie uma conta gratuita
2. Clique em **"Create Cronjob"**
3. Configure:
   - **Title:** `Studio Focus - Alarm Check`
   - **URL:** `https://seu-dominio.vercel.app/api/push-check?secret=SUA_CRON_SECRET`
   - **Schedule:** Every 1 minute (`* * * * *`)
   - **Request Method:** GET
   - **Timeout:** 30 seconds
4. Salve e ative

## Opção 2: UptimeRobot (5 minutos grátis)

1. Acesse [uptimerobot.com](https://uptimerobot.com) e crie uma conta
2. Adicione um novo monitor:
   - **Type:** HTTP(s)
   - **URL:** `https://seu-dominio.vercel.app/api/push-check?secret=SUA_CRON_SECRET`
   - **Monitoring Interval:** 5 minutes
3. Salve

> ⚠️ Com intervalo de 5 min, o alarme pode atrasar até 5 minutos.
> O `push-check.js` tem tolerância de ±1 minuto, então o atraso máximo real é ~4 minutos.

## Opção 3: Usando o header Authorization

Se o serviço de cron suportar headers customizados (como o cron-job.org), 
prefira enviar o secret via header:

- **URL:** `https://seu-dominio.vercel.app/api/push-check`
- **Header:** `Authorization: Bearer SUA_CRON_SECRET`

Isso é mais seguro pois o secret não aparece na URL.

## Testando manualmente

Para testar se o push está funcionando, abra no navegador:
```
https://seu-dominio.vercel.app/api/push-check?secret=SUA_CRON_SECRET
```

A resposta deve ser algo como:
```json
{
  "ok": true,
  "time": "15:30",
  "sent": 1,
  "errors": 0,
  "subscriptions": 1
}
```

## Troubleshooting

| Problema | Solução |
|----------|---------|
| `sent: 0` | Verifique se há alarmes ativos para o horário atual (±1 min) |
| `subscriptions: 0` | Abra o app, ative um alarme, e verifique se a sincronização push aparece como ✅ |
| `error 401` | O `CRON_SECRET` está incorreto |
| `redisOk: false` | Verifique a `REDIS_URL` nas variáveis da Vercel |
