import { useState } from 'react'
import Recorder from './pages/Recorder'
import Results from './pages/Results'

export default function App() {
  const [result, setResult] = useState(null)
  return result
    ? <Results result={result} onBack={() => setResult(null)} />
    : <Recorder onResult={setResult} />
}
