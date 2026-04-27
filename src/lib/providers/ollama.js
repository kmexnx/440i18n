export async function callOllama({ prompt, system, model }) {
  const base = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'llama3.2',
      stream: false,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error('Ollama error')
  return data.message.content
}
