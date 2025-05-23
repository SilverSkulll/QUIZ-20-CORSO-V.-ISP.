import React, { useEffect, useState } from 'react'
import Papa from 'papaparse'
import './style.css'

function App() {
  const [allQuestions, setAllQuestions] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [step, setStep] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [reviewMode, setReviewMode] = useState(false)
  const [numQuestions, setNumQuestions] = useState(10)
  const [timeLimit, setTimeLimit] = useState(10)
  const [timer, setTimer] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    fetch('/quiz_domande_200.csv')
      .then(res => res.text())
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          complete: results => {
            const filtered = results.data.filter(q => q.Domanda && q.Risposta_A && q.Risposta_B && q.Risposta_C && q.Corretta)
            setAllQuestions(filtered)
          }
        })
      })
  }, [])

  useEffect(() => {
    if (started && timer > 0 && !showResult) {
      const countdown = setInterval(() => setTimer(t => t - 1), 1000)
      return () => clearInterval(countdown)
    }
    if (timer === 0 && started && !showResult) {
      handleFinish()
    }
  }, [timer, started, showResult])

  const startQuiz = () => {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, numQuestions)
    setSelectedQuestions(shuffled)
    setAnswers(Array(shuffled.length).fill(null))
    setStep(0)
    setTimer(timeLimit * 60)
    setStarted(true)
  }

  const handleAnswer = (letter) => {
    const updated = [...answers]
    updated[step] = letter
    setAnswers(updated)
  }

  const handleFinish = () => {
    setShowResult(true)
  }

  if (!started) {
    return (
      <div className="container">
        <div className="card">
          <h1>QUIZ 20^ CORSO V. ISP.</h1>
          <label>Numero domande:
            <select value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))}>
              {[...Array(20)].map((_, i) => (
                <option key={i} value={(i + 1) * 10}>{(i + 1) * 10}</option>
              ))}
            </select>
          </label>
          <br /><br />
          <label>Timer (minuti):
            <select value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))}>
              {[...Array(10)].map((_, i) => (
                <option key={i} value={(i + 1) * 10}>{(i + 1) * 10}</option>
              ))}
            </select>
          </label>
          <br /><br />
          <button onClick={startQuiz}>Inizia Test</button>
        </div>
      </div>
    )
  }

  if (showResult && reviewMode) {
    return (
      <div className="container">
        <h2>📘 Rivedi il Test</h2>
        <div className="scroll-container">
          {selectedQuestions.map((q, idx) => (
            <div key={idx} className="card">
              <div className="question">Domanda {idx + 1}: {q.Domanda}</div>
              {["A", "B", "C"].map(letter => {
                const isCorrect = letter === q.Corretta
                const isGiven = answers[idx] === letter
                return (
                  <div key={letter} className="answer">
                    <span style={{
                      fontWeight: 'bold',
                      color: isCorrect ? 'green' : (isGiven ? 'red' : 'black')
                    }}>
                      {letter}) {q["Risposta_" + letter]}
                      {isCorrect ? ' ✅' : ''}{isGiven && !isCorrect ? ' ❌' : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (showResult) {
    const score = selectedQuestions.reduce((acc, q, i) => acc + (answers[i] === q.Corretta ? 1 : 0), 0)
    const percent = ((score / selectedQuestions.length) * 100).toFixed(2)
    return (
      <div className="container">
        <div className="card">
          <h2>✅ Hai totalizzato {score} su {selectedQuestions.length} ({percent}%)</h2>
          <button onClick={() => window.location.reload()}>Ricomincia</button>
          <button onClick={() => setReviewMode(true)}>📘 RIVEDI IL TEST</button>
        </div>
      </div>
    )
  }

  const q = selectedQuestions[step]
  const userAnswer = answers[step]

  return (
    <div className="container">
      <div className="card">
        <div className="question">Domanda {step + 1}: {q.Domanda}</div>
        <div style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
          ⏱️ Tempo: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
        </div>
        {["A", "B", "C"].map(letter => {
          const isCorrect = letter === q.Corretta
          const isSelected = userAnswer === letter
          const baseColor = isSelected ? (isCorrect ? '#28a745' : '#dc3545') : (userAnswer && isCorrect ? '#28a745' : 'white')
          return (
            <div key={letter} className="answer">
              <button
                style={{
                  backgroundColor: baseColor,
                  color: baseColor !== 'white' ? 'white' : 'black',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px',
                  fontSize: '1.1rem',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  marginBottom: '0.5rem'
                }}
                onClick={() => handleAnswer(letter)}
              >
                {letter}) {q["Risposta_" + letter]}
              </button>
            </div>
          )
        })}
        <div>
          <button onClick={() => setStep(step - 1)} disabled={step === 0}>⬅ Indietro</button>
          {step === selectedQuestions.length - 1 ? (
            <button onClick={handleFinish}>✅ RISULTATI</button>
          ) : (
            <button onClick={() => setStep(step + 1)} disabled={answers[step] === null}>Avanti ➡</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
