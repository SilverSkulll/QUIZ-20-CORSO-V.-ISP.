import React, { useEffect, useState } from 'react'
import Papa from 'papaparse'
import './style.css'

function App() {
  const [allQuestions, setAllQuestions] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [step, setStep] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [mistakes, setMistakes] = useState([])

  useEffect(() => {
    fetch('/quiz_domande_200.csv')
      .then(res => res.text())
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          complete: results => {
            setAllQuestions(results.data.filter(q => q.Domanda))
          }
        })
      })
  }, [])

  const startQuiz = () => {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 10)
    setSelectedQuestions(shuffled)
    setAnswers(Array(shuffled.length).fill(null))
    setStep(0)
    setShowResult(false)
    setMistakes([])
  }

  const selectAnswer = (letter) => {
    const updated = [...answers]
    updated[step] = letter
    setAnswers(updated)
  }

  const calculateResult = () => {
    let score = 0
    let errors = []
    selectedQuestions.forEach((q, idx) => {
      if (answers[idx] === q.Corretta) {
        score++
      } else {
        errors.push({
          index: idx + 1,
          domanda: q.Domanda,
          tua: q["Risposta_" + answers[idx]],
          corretta: q["Risposta_" + q.Corretta]
        })
      }
    })
    setMistakes(errors)
    setShowResult(true)
  }

  if (!selectedQuestions.length) {
    return (
      <div className="container">
        <h1>QUIZ 20^ CORSO V. ISP.</h1>
        <button onClick={startQuiz}>Inizia Test</button>
      </div>
    )
  }

  if (showResult) {
    const score = selectedQuestions.length - mistakes.length
    const percent = ((score / selectedQuestions.length) * 100).toFixed(2)
    return (
      <div className="container">
        <h1>Hai totalizzato {score} su {selectedQuestions.length} ({percent}%)</h1>
        <button onClick={startQuiz}>Ricomincia</button>
        <div className="scroll-container">
          {mistakes.map((m, i) => (
            <div key={i} className="card">
              <p><strong>❌ Domanda {m.index}</strong></p>
              <p>{m.domanda}</p>
              <p><strong>Tua risposta:</strong> {m.tua || 'Nessuna risposta'}</p>
              <p><strong>Corretta:</strong> {m.corretta}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const q = selectedQuestions[step]

  return (
    <div className="container">
      <div className="card">
        <div className="question">Domanda {step + 1}: {q.Domanda}</div>
        {["A", "B", "C"].map(letter => (
          <div key={letter} className="answer">
            <button
              onClick={() => selectAnswer(letter)}
              style={{
                backgroundColor: answers[step] === letter ? '#cce5ff' : 'white',
                width: '100%',
                textAlign: 'left',
                padding: '10px',
                fontSize: '1.1rem',
                border: '1px solid #ccc',
                borderRadius: '5px',
                marginBottom: '0.5rem'
              }}
            >
              {letter}) {q["Risposta_" + letter]}
            </button>
          </div>
        ))}
        <div>
          <button onClick={() => setStep(prev => prev - 1)} disabled={step === 0}>⬅ Indietro</button>
          {step < selectedQuestions.length - 1 ? (
            <button onClick={() => setStep(prev => prev + 1)}>Avanti ➡</button>
          ) : (
            <button onClick={calculateResult}>Concludi Test</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
