# Friday environment variables

Set these in Netlify... Site settings > Environment variables. Nothing here should ever be committed to git.

## Core brain (required)

- `ANTHROPIC_API_KEY` ... your Claude API key. The primary brain.
- `PRIMARY_LLM` ... set to `anthropic` (default) or `openai`.
- `BRAIN_MODE` ... `single` (default, fast) or `dual` (Claude + OpenAI critic pass for sharper replies).

## Supabase memory (required for persistence)

- `NEXT_PUBLIC_SUPABASE_URL` ... your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ... client-safe Supabase key.
- `SUPABASE_SERVICE_ROLE_KEY`