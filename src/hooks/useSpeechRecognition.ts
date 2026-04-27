import { useRef, useState, useCallback } from 'react'

interface UseSpeechRecognitionOptions {
  language?: string
}

export function useSpeechRecognition({ language = 'en-US' }: UseSpeechRecognitionOptions = {}) {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const ref = useRef<SpeechRecognition | null>(null)
  const final = useRef('')

  const start = useCallback(() => {
    const SR = (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
      ?? window.SpeechRecognition
    if (!SR) throw new Error('Speech recognition not supported in this browser')

    const r = new SR()
    r.lang = language
    r.continuous = true
    r.interimResults = true

    r.onstart = () => setIsListening(true)
    r.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '', f = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) f += e.results[i][0].transcript + ' '
        else interim += e.results[i][0].transcript
      }
      final.current += f
      setTranscript(final.current + interim)
    }
    r.onend = () => setIsListening(false)
    ref.current = r
    r.start()
  }, [language])

  const stop = useCallback(() => {
    ref.current?.stop()
    setIsListening(false)
  }, [])

  const reset = useCallback(() => {
    final.current = ''
    setTranscript('')
  }, [])

  return { transcript, isListening, start, stop, reset }
}
