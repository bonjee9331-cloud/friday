# Deploying Friday

Step by step. Under 20 minutes start to finish if you already have Netlify and Supabase accounts.

## Prereqs

- Node 18 or later
- A Netlify account (free)
- A Supabase account (free)
- An Anthropic API key
- (optional) OpenAI API key for dual brain mode
- (optional) ElevenLabs API key for premium voice
- (optional) Telegram bot token from BotFather

## 1. Supabase

1. supabase.com > New project. Pick any name. Melbourne region is closest.
2. When the project is ready, go to Project Settings > API and copy the Project URL, anon key, and service_role key.
3. SQL Editor > New query > paste the entire contents of `docs/schema.sql` > Run. You should see every table created.

## 2. Local test (optional)

```bash
cd friday
npm install
cp docs/ENV_VARS.md .env.local  # then edit it into real KEY=VALUE lines
npm run dev
```

Open http://localhost:3000 and say hi to Friday.

## 3. Netlify

### Option A: drag and drop

```bash
npm run build
```

Then drag the `.next` folder onto app.netlify.com/drop.

### Option B: Git

Push this folder to a GitHub repo. In Netlify, New site from Git, point at the repo. Netlify will auto detect Next.js via `netlify.toml`.

## 4. Environment variables

Netlify > Site settings > Environment variables. Paste every key you need from `docs/ENV_VARS.md`. Minimum for a working brain:

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Trigger a redeploy after adding keys.

## 5. Telegram webhook (optional)

1. Message @BotFather on Telegram, run `/newbot`, follow the prompts, copy the token.
2. Add `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` (any random string), and `TELEGRAM_ALLOWED_CHAT_ID` (message your bot then check https://api.telegram.org/bot<TOKEN>/getUpdates to find your chat ID).
3. Set the webhook:

```
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-netlify-site>/api/friday/telegram?token=<TELEGRAM_WEBHOOK_SECRET>"
```

4. Message the bot. It should reply.

## 6. Wake word / desktop voice loop (optional, local only)

The original `bob.py` desktop voice loop is not deployed with Friday because Netlify can not run Whisper or sounddevice. If you want always on wake word voice:

1. Keep `bob.py` on your PC.
2. Replace the Claude call inside it with a `POST` to `https://<your-netlify-site>/api/friday/chat` so the local voice loop uses the cloud brain.
3. You now have local microphone + cloud brain + persistent memory across web and local sessions.

## 7. Daily briefing cron (optional)

Netlify Scheduled Functions or a Supabase cron job can hit `/api/bob/brief` every morning and post the result to Telegram. Add this after the basics are working.

## Troubleshooting

- `Friday brain is offline` ... `ANTHROPIC_API_KEY` is not set in Netlify env vars. Add it and redeploy.
- `supabase not configured` ... Supabase env vars are missing. Friday still chats without them but tasks and memory will not persist.
- Browser mic not working ... Web Speech API needs Chrome or Edge. Safari support is spotty. Mobile Chrome works.
- Telegram silent ... double check the webhook URL is exactly right and the secret matches `TELEGRAM_WEBHOOK_SECRET`.
