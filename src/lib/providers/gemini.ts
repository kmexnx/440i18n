import type { LLMCallParams } from '../types'

export async function callGemini({ prompt, system, model, apiKey }: LLMCallParams): Promise<string> {
  const m = model ?? 'gemini-2.0-flash'
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey ?? ''}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 1500,
          temperature: 0.3,
        },
      }),
    }
  )

  const data = await res.json()

  if (!res.ok) {
    throw new Error(`Gemini API error ${res.status}: ${data.error?.message ?? JSON.stringify(data)}`)
  }

  const candidate = data.candidates?.[0]
  if (!candidate) {
    throw new Error(`Gemini returned no candidates. Full response: ${JSON.stringify(data)}`)
  }

  if (candidate.finishReason === 'SAFETY') {
    throw new Error('Gemini blocked the request for safety reasons')
  }

  const text = candidate.content?.parts?.[0]?.text
  if (!text) {
    throw new Error(`Gemini returned empty content. Finish reason: ${candidate.finishReason}`)
  }

  return text as string
}
