# LP Suely Soares Advocacia — Direito de Trânsito (PB)

Landing page estática (HTML/CSS/JS) — ADS BR.

- `index.html` — LP (site `suely-soares`)
- `redirect.html` — obrigado → WhatsApp com contagem regressiva (conversão de lead)
- `dashboard.html` — painel de leads (login Supabase: usuário `Admin`)
- `config.js` — URL e chave pública do Supabase (projeto ADS BR CLIENTES)
- `app.js` — visitas/leads no Supabase, UTMs, eventos de rastreamento, menu e FAQ

Meta Pixel: colar o código-base no `<head>` de `index.html` e `redirect.html` (marcado com comentário); o evento `Lead` vai só no `redirect.html`.

Deploy: Vercel (time ADS BR), sem build.
