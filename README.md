# 440i18n

> *A₄ = 440 Hz. The reference pitch. The anchor. Everything else is deviation.*

**The standard for vocal authority.**

---

## The problem

Public speaking anxiety affects 73% of the population. Most tools focus on *what* you say. None of them measure the acoustic signature of how you say it.

Filler words are symptoms. The root cause is pitch instability, incoherent structure, and language that doesn't connect with its audience. Those are measurable. We measure them.

---

## The solution

440i18n is an open-source speech analysis engine that combines real-time frequency calibration with LLM-powered coaching.

- **Frequency calibration** — pitch detection using raw FFT via Web Audio API, referenced against A₄ = 440 Hz
- **Prosody analysis** — jitter detection, monotony scoring, pitch variance over time
- **Transcript analysis** — 6 metrics scored by an LLM with brutal, evidence-based feedback
- **Non-native speaker support** — detects language patterns that undermine credibility in a second language
- **i18n by design** — EN, ES, FR, DE, PT out of the box. PRs welcome for more.

---

## Open core model

| Layer | License | What it is |
|-------|---------|-----------|
| `src/engine` | MIT | Pitch detector, speech recognition hooks, LLM analyzer, provider adapters |
| `src/pages` + Supabase | MIT | Reference UI and schema |
| 440i18n SaaS *(coming)* | Commercial | Historical dashboard, longitudinal pattern detection, team analytics, white-label for coaches |

The engine is yours. The training suite is the product.

---

## Architecture

```
src/
├── engine/
│   ├── PitchDetector.js      ← Web Audio API, raw autocorrelation FFT, A₄ reference
│   ├── SpeechRecognizer.js   ← Web Speech API wrapper, continuous + interim results
│   └── analyze.js            ← LLM prompt engine, provider-agnostic adapter
├── lib/
│   ├── providers/
│   │   ├── anthropic.js
│   │   ├── openai.js
│   │   ├── gemini.js
│   │   └── ollama.js         ← local inference, no API key needed
│   └── supabase.js
└── pages/
    ├── Recorder.jsx
    └── Results.jsx
```

The pitch detector implements autocorrelation on a 2048-sample Float32Array buffer. No external DSP libraries. If you want to understand how it works, read `src/engine/PitchDetector.js` — it's ~80 lines.

---

## Stack

```
React + Vite          → UI
Web Audio API         → Real-time pitch (raw FFT, no libs)
Web Speech API        → Transcription, 5 languages
Supabase              → Auth + Postgres + RLS + pgvector (ready)
Any LLM provider      → Anthropic, OpenAI, Gemini, Ollama
Vercel                → Deploy
```

---

## Self-hosted in 3 commands

```bash
git clone https://github.com/kmexnx/440i18n
cd 440i18n
cp .env.example .env
```

Fill `.env`, then:

```bash
npm install && npm run dev
```

Your data stays yours. Supabase handles auth and storage — create a free project at supabase.com and paste the URL and anon key into `.env`.

---

## Supported LLM providers

| Provider | Models | Cost per session |
|----------|--------|-----------------|
| Anthropic | claude-sonnet-4-*, claude-opus-4-* | ~$0.01 |
| OpenAI | gpt-4o, gpt-4o-mini | ~$0.01 |
| Gemini | gemini-2.0-flash, gemini-1.5-pro | ~$0.001 |
| Ollama | llama3.2, mistral, qwen2.5, any local | $0.00 |

---

## What gets measured

| Metric | Method |
|--------|--------|
| Fluency | Interruption density in transcript |
| Clarity | Semantic compression ratio |
| Coherence | Logical transition detection |
| Conciseness | Token-to-meaning analysis |
| Language use | Register and grammar evaluation |
| Empathy | Audience-aware language markers |
| Pitch variance | Hz deviation from personal baseline |
| Filler words | Counted, named, timestamped |
| Pronunciation | Non-native phoneme pattern flags |

---

## Database

```bash
psql your_supabase_db < supabase/schema.sql
```

Full transcripts stored from day one. Row-level security enforced. When you're ready for semantic search:

```sql
CREATE EXTENSION vector;
ALTER TABLE sessions ADD COLUMN embedding vector(1536);
```

No migration hell. The schema anticipated it.

---

## Roadmap

- [x] Real-time pitch detection (FFT, A₄ reference)
- [x] Multi-language speech recognition
- [x] LLM analysis — 6 metrics, evidence-based
- [x] Multi-provider adapter (Anthropic, OpenAI, Gemini, Ollama)
- [x] Supabase schema with RLS + pgvector-ready
- [ ] Session history + progress charts
- [ ] Longitudinal pattern detection
- [ ] pgvector semantic search across sessions
- [ ] PWA manifest — installable on mobile
- [ ] Pronunciation audio comparison
- [ ] SaaS dashboard for coaches and teams

---

## Contributing

The prompt is the product. If you have a better model for measuring empathy from text, prove it in a PR.

New provider: add a file to `src/lib/providers/` and a case to `src/lib/analyze.js`.

New language: add a `{ code, label }` entry to `LANGS` in `Recorder.jsx` and open a PR.

---

## License

MIT. Take it, ship it, sell it. Just don't make it worse.

---

*The concert pitch standard — A₄ = 440 Hz — was adopted internationally in 1939. Before that, orchestras couldn't play together. ISO 16:1975 made it law. Your voice needs a reference too. This is it.*
