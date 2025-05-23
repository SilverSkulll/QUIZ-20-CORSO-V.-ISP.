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
  const [quizStarted, setQuizStarted] = useState(false)
  const [numQuestions, setNumQuestions] = useState(10)
  const [timeLimit, setTimeLimit] = useState(10)
  const [timer, setTimer] = useState(0)

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

  useEffect(() => {
    if (quizStarted && timer > 0) {
      const countdown = setInterval(() => setTimer(t => t - 1), 1000)
      return () => clearInterval(countdown)
    }
    if (timer === 0 && quizStarted) {
      calculateResult()
    }
  }, [timer, quizStarted])

  const startQuiz = () => {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, numQuestions)
    setSelectedQuestions(shuffled)
    setAnswers(Array(shuffled.length).fill(null))
    setStep(0)
    setShowResult(false)
    setMistakes([])
    setTimer(timeLimit * 60)
    setQuizStarted(true)
  }

  const handleAnswer = (letter) => {
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

  if (!quizStarted) {
    return (
      <div className="container">
        <h1>QUIZ 20^ CORSO V. ISP.</h1>
        <label>Numero domande:
          <select value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))}>
            {[...Array(10)].map((_, i) => (
              <option key={i} value={(i + 1) * 10}>{(i + 1) * 10}</option>
            ))}
          </select>
        </label>
        <br />
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
    )
  }

  if (showResult) {
    const score = selectedQuestions.length - mistakes.length
    const percent = ((score / selectedQuestions.length) * 100).toFixed(2)
    return (
      <div className="container">
        <h1>Hai totalizzato {score} su {selectedQuestions.length} ({percent}%)</h1>
        <button onClick={() => setQuizStarted(false)}>Ricomincia</button>
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
  const userAnswer = answers[step]
  const isLast = step === selectedQuestions.length - 1

  return (
    <div className="container">
      <div className="card">
        <div className="question">Domanda {step + 1}: {q.Domanda}</div>
        <div style={{ marginBottom: '1rem', fontWeight: 'bold' }}>⏱️ Tempo rimasto: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</div>
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
                  fontSize: '1.2rem',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  marginBottom: '0.5rem',
                  cursor: 'pointer'
                }}
                onClick={() => handleAnswer(letter)}
              >
                {letter}) {q["Risposta_" + letter]}
              </button>
            </div>
          )
        })}
        <div>
          <button onClick={() => setStep(prev => prev - 1)} disabled={step === 0}>⬅ Indietro</button>
          {isLast ? (
            <button onClick={calculateResult}>✅ RISULTATI</button>
          ) : (
            <button onClick={() => setStep(prev => prev + 1)} disabled={answers[step] === null}>Avanti ➡</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
