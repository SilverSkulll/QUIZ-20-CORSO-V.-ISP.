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
  const [selectedAnswer, setSelectedAnswer] = useState({});
  const [reviewFlags, setReviewFlags] = useState({});

  useEffect(() => {
    fetch('/quiz_domande_200.csv')
      .then(res => res.text())
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          complete: (results) => setAllQuestions(results.data)
        });
      });
  }, []);

  const handleAnswer = (questionIndex, option) => {
    if (selectedAnswer[questionIndex]) return;
    const correct = selectedQuestions[questionIndex].Corretta.trim();
    setAnswers(prev => [...prev, { questionIndex, selected: option, correct }]);
    setSelectedAnswer(prev => ({ ...prev, [questionIndex]: option }));
  };

  const toggleReview = (index) => {
    setReviewFlags(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const startQuiz = () => {
    let questionsToUse = [...allQuestions];
    if (orderMode === "random") {
      questionsToUse = questionsToUse.sort(() => 0.5 - Math.random());
    } else {
      questionsToUse = questionsToUse.slice(startIndex - 1, endIndex);
    }
    if (repeatOnly) {
      questionsToUse = questionsToUse.filter((_, idx) => reviewFlags[idx]);
    }
    setSelectedQuestions(questionsToUse.slice(0, numQuestions));
    setStarted(true);
    setStep(0);
    setTimer(timeLimit * 60);
    setAnswers([]);
    setSelectedAnswer({});
  };

  return (
    <div className="app">
      {!started ? (
        <div className="start-screen">
          <button onClick={startQuiz}>Inizia Test</button>
        </div>
      ) : showResult ? (
        <div className="result-screen">
          <h2>Risultato</h2>
          <p>Corrette: {answers.filter(a => a.selected === a.correct).length} / {answers.length}</p>
        </div>
      ) : (
        <div className="question-card">
          <h3>Domanda {step + 1}</h3>
          <p>{selectedQuestions[step]?.Domanda}</p>
          {["A", "B", "C"].map(opt => {
            const isCorrect = selectedQuestions[step]?.Corretta.trim() === opt;
            const userChoice = selectedAnswer[step];
            let className = "option";
            if (userChoice) {
              if (opt === userChoice) {
                className += isCorrect ? " correct" : " incorrect";
              } else if (isCorrect) {
                className += " correct";
              }
            }
            return (
              <div key={opt} className={className} onClick={() => handleAnswer(step, opt)}>
                {opt}) {selectedQuestions[step][opt]}
              </div>
            );
          })}
          <div className="review-flag">
            <label>
              <input
                type="checkbox"
                checked={!!reviewFlags[step]}
                onChange={() => toggleReview(step)}
              /> Segna da ripassare
            </label>
          </div>
          <button onClick={() => setStep(prev => prev + 1)} disabled={step + 1 >= selectedQuestions.length}>Avanti</button>
          <button onClick={() => setShowResult(true)} disabled={step + 1 < selectedQuestions.length}>Risultati</button>
        </div>
      )}
    </div>
  );
}

export default App;