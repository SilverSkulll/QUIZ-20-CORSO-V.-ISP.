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

  const current = selectedQuestions[step];
  const userAnswer = answers[step];

  return (
    <div className="container">
      <div className="card">
        <p><strong>{current.Numero}. {current.Domanda}</strong></p>
        {['A', 'B', 'C'].map((opt) => {
          const correct = current.Corretta.trim().toUpperCase();
          const isSelected = userAnswer === opt;
          const isCorrect = opt === correct;

          let className = 'answer card';

          if (userAnswer) {
            if (isSelected && isCorrect) {
              className += ' correct';
            } else if (isSelected && !isCorrect) {
              className += ' wrong';
            } else if (!isSelected && isCorrect) {
              className += ' correct';
            }
          } else if (isSelected) {
            className += ' selected';
          }

          return (
            <div
              key={opt}
              className={className}
              onClick={() => {
                if (!showResult && !userAnswer) handleAnswer(opt);
              }}
              style={{ cursor: 'pointer' }}
            >
              {opt}) {current[opt]}
            </div>
          );
        })}
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
