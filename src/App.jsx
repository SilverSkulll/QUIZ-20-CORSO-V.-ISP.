
import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import './style.css';

function App() {
  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [step, setStep] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [numQuestions, setNumQuestions] = useState(10);
  const [timeLimit, setTimeLimit] = useState(10);
  const [timer, setTimer] = useState(0);
  const [started, setStarted] = useState(false);
  const [orderMode, setOrderMode] = useState("random");
  const [startIndex, setStartIndex] = useState(1);
  const [endIndex, setEndIndex] = useState(10);
  const [repeatOnly, setRepeatOnly] = useState(false);

  useEffect(() => {
    fetch('/quiz_domande_200.csv')
      .then(res => res.text())
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          complete: results => {
            const clean = results.data.filter(q => q.Numero && q.Domanda && q.A && q.B && q.C && q.Corretta);
            setAllQuestions(clean);
          }
        });
      });
  }, []);

  useEffect(() => {
    if (started && timer > 0 && !showResult) {
      const countdown = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(countdown);
    }
    if (timer === 0 && started && !showResult) {
      handleFinish();
    }
  }, [timer, started, showResult]);

  const getRepeatQuestions = () => {
    const stored = localStorage.getItem("toRepeat");
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return allQuestions.filter(q => parsed.includes(q.Numero));
  };

  const startQuiz = () => {
    let questions = [];
    if (repeatOnly) {
      const repeats = getRepeatQuestions();
      questions = repeats.sort(() => 0.5 - Math.random()).slice(0, numQuestions);
    } else if (orderMode === "random") {
      questions = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, numQuestions);
    } else {
      questions = allQuestions.filter(q => {
        const n = parseInt(q.Numero);
        return n >= startIndex && n <= endIndex;
      });
    }

    setSelectedQuestions(questions);
    setAnswers(Array(questions.length).fill(null));
    setStep(0);
    setTimer(timeLimit * 60);
    setStarted(true);
    setShowResult(false);
    setReviewMode(false);
  };

  const handleAnswer = (letter) => {
    const updated = [...answers];
    updated[step] = letter;
    setAnswers(updated);
  };

  const handleFinish = () => {
    setShowResult(true);
  };

  const handleRepeatFlag = (numero) => {
    const current = JSON.parse(localStorage.getItem("toRepeat") || "[]");
    if (!current.includes(numero)) {
      current.push(numero);
      localStorage.setItem("toRepeat", JSON.stringify(current));
    }
  };

  const resetQuiz = () => {
    setStarted(false);
    setRepeatOnly(false);
    setStep(0);
    setAnswers([]);
    setSelectedQuestions([]);
    setShowResult(false);
    setReviewMode(false);
  };

  if (!started) {
    const hasRepeat = getRepeatQuestions().length > 0;

    return (
      <div className="container">
        <div className="card">
          <h1>QUIZ 20^ CORSO V. ISP.</h1>
          <label>Numero domande:
            <select value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))}>
              {[...Array(30)].map((_, i) => (
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
          <label>Ordine domande:
            <select value={orderMode} onChange={(e) => setOrderMode(e.target.value)}>
              <option value="random">Casuale</option>
              <option value="range">Intervallo</option>
            </select>
          </label>
          {orderMode === "range" && (
            <div>
              <input type="number" placeholder="Da..." value={startIndex} onChange={(e) => setStartIndex(Number(e.target.value))} />
              <input type="number" placeholder="A..." value={endIndex} onChange={(e) => setEndIndex(Number(e.target.value))} />
            </div>
          )}
          {hasRepeat && (
            <div>
              <label>
                <input type="checkbox" checked={repeatOnly} onChange={(e) => setRepeatOnly(e.target.checked)} />
                Solo domande da ripassare
              </label>
            </div>
          )}
          <br />
          <button onClick={startQuiz}>Inizia il test</button>
        </div>
      </div>
    );
  }

  if (showResult && reviewMode) {
    return (
      <div className="container">
        <h2>📘 RIVEDI IL TEST</h2>
        {selectedQuestions.map((q, i) => {
          const userAnswer = answers[i];
          const correct = q.Corretta.trim().toUpperCase();
          return (
            <div key={i} className="card">
              <p><strong>{q.Numero}. {q.Domanda}</strong></p>
              {['A', 'B', 'C'].map((opt) => (
                <p
                  key={opt}
                  className={
                    userAnswer === opt && opt !== correct ? 'wrong' :
                    opt === correct ? 'correct' : ''
                  }
                >
                  {opt}) {q[opt]}
                </p>
              ))}
              <label>
                <input type="checkbox"
                       checked={JSON.parse(localStorage.getItem("toRepeat") || "[]").includes(q.Numero)}
                       onChange={(e) => {
                         const current = JSON.parse(localStorage.getItem("toRepeat") || "[]");
                         const updated = e.target.checked
                           ? [...new Set([...current, q.Numero])]
                           : current.filter(n => n !== q.Numero);
                         localStorage.setItem("toRepeat", JSON.stringify(updated));
                       }} />
                🔖 Domanda da ripassare
              </label>
            </div>
          );
        })}
        <br />
        <button onClick={resetQuiz}>🔁 Ricomincia il test</button>
      </div>
    );
  }

  if (showResult && !reviewMode) {
    const correctCount = selectedQuestions.filter((q, i) => q.Corretta.trim().toUpperCase() === answers[i]).length;
    return (
      <div className="container">
        <h2>Test completato!</h2>
        <p>Hai risposto correttamente a {correctCount} su {selectedQuestions.length} domande.</p>
        <p>Percentuale: {Math.round((correctCount / selectedQuestions.length) * 100)}%</p>
        <button onClick={() => setReviewMode(true)}>📘 RIVEDI IL TEST</button>
      </div>
    );
  }

  const current = selectedQuestions[step];
  const userAnswer = answers[step];

  return (
    <div className="container">
      <div className="card">
        <p><strong>{current.Numero}. {current.Domanda}</strong></p>
        {['A', 'B', 'C'].map((opt) => (
          <div
            key={opt}
            className={userAnswer === opt ? 'answer selected card' : 'answer card'}
            onClick={() => {
              if (!showResult) handleAnswer(opt)
          }}
            style={{ cursor: 'pointer' }}
          >
            {opt}) {current[opt]}
          </div>
        ))}
        <div className="navigation">
          <button disabled={step === 0} onClick={() => setStep(step - 1)}>⬅️ Indietro</button>
          {step < selectedQuestions.length - 1 ? (
            <button onClick={() => setStep(step + 1)}>➡️ Avanti</button>
          ) : (
            <button onClick={handleFinish}>✅ RISULTATI</button>
          )}
        </div>
        <p>⏱️ Tempo rimasto: {Math.floor(timer / 60)}:{('0' + (timer % 60)).slice(-2)}</p>
      </div>
    </div>
  );
}

export default App;
