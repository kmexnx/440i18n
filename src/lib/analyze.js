import { callAnthropic } from './providers/anthropic.js'
import { callOpenAI } from './providers/openai.js'
import { callGemini } from './providers/gemini.js'
import { callOllama } from './providers/ollama.js'

const PROVIDERS = { anthropic: callAnthropic, openai: callOpenAI, gemini: callGemini, ollama: callOllama }

const SYSTEM_PROMPT = `You are a brutally honest speech coach. No sugarcoating, no generic advice, no consolation prizes.

Analyze the transcript and return ONLY valid JSON — no markdown, no backticks, no preamble.

{
  "metrics": {
    "fluency": { "score": 0, "evidence": "direct quote", "fix": "actionable fix, max 2 sentences" },
    "clarity": { "score": 0, "evidence": "", "fix": "" },
    "coherence": { "score": 0, "evidence": "", "fix": "" },
    "conciseness": { "score": 0, "evidence": "", "fix": "" },
    "language_use": { "score": 0, "evidence": "", "fix": "" },
    "empathy": { "score": 0, "evidence": "", "fix": "" }
  },
  "filler_words": { "detected": [], "counts": {}, "worst_offender": "" },
  "pronunciation_flags": [],
  "native_language_detected": "",
  "non_native_patterns": [],
  "pitch_assessment": "",
  "biggest_issue": "one sentence, brutal and specific",
  "whats_working": "one sentence, genuine"
}

Rules: evidence = direct quote. fixes = actionable in 5 minutes. never say consider or try to. if under 30 words return { "error": "too_short" }.`

export async function analyzeSession({ transcript, pitchData, language = 'en' }) {
  if (!transcript || transcript.trim().split(' ').length < 15) throw new Error('too_short')

  const provider = import.meta.env.VITE_LLM_PROVIDER || 'anthropic'
  const call = PROVIDERS[provider]
  if (!call) throw new Error(`Unknown provider: ${provider}`)

  const prompt = `Language: ${language}\nTranscript: "${transcript}"\nPitch data: ${JSON.stringify(pitchData)}`

  const raw = await call({
    prompt, system: SYSTEM_PROMPT,
    model: import.meta.env.VITE_LLM_MODEL,
    apiKey: import.meta.env.VITE_LLM_API_KEY,
  })

  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    throw new Error('parse_error')
  }
}
