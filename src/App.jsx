import React, { useState, useEffect } from 'react'
import Papa from 'papaparse'

export default function App() {
  const [quizData, setQuizData] = useState([])

  useEffect(() => {
    fetch('/quiz_domande_320.csv')
      .then(res => res.text())
      .then(csv => {
        const parsed = Papa.parse(csv, { header: true })
        setQuizData(parsed.data)
      })
  }, [])

  return (
    <div className="app-container" style={{ textAlign: 'center', margin: '2rem' }}>
      <h1>Quiz 320 Domande</h1>
      <p>{quizData.length > 0 ? `Domande caricate: ${quizData.length}` : 'Caricamento domande...'}</p>
    </div>
  )
}
