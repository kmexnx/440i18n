import { useState } from 'react'
import Recorder from './pages/Recorder'
import Results from './pages/Results'
import type { AnalysisResult } from './lib/types'

export default function App() {
  const [result, setResult] = useState<AnalysisResult | null>(null)

  return result
    ? <Results result={result} onBack={() => setResult(null)} />
    : <Recorder onResult={setResult} />
}
