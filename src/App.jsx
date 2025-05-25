
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
  const [answered, setAnswered] = useState({});

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
  }, [started, timer, showResult]);

  const startTest = () => {
    let questions = [...allQuestions];
    if (orderMode === "random") {
      questions = questions.sort(() => 0.5 - Math.random());
    } else {
      questions = questions.slice(startIndex - 1, endIndex);
    }
    setSelectedQuestions(questions.slice(0, numQuestions));
    setAnswers([]);
    setStep(0);
    setShowResult(false);
    setStarted(true);
    setTimer(timeLimit * 60);
    setAnswered({});
  };

  const handleAnswer = (answer) => {
    if (answered[step]) return;
    const correct = selectedQuestions[step].Corretta;
    setAnswers([...answers, answer]);
    setAnswered({ ...answered, [step]: answer });
  };

  const handleFinish = () => {
    setShowResult(true);
  };

  const current = selectedQuestions[step];
  const correct = current?.Corretta;
  const userAnswer = answered[step];

  return (
    <div className="container">
      {!started ? (
        <div className="start-screen">
          <h2>QUIZ 20<sup>a</sup> CORSO V. ISP.</h2>
          <label>Numero Domande: <input type="number" value={numQuestions} onChange={e => setNumQuestions(parseInt(e.target.value))} /></label>
          <label>Tempo (minuti): <input type="number" value={timeLimit} onChange={e => setTimeLimit(parseInt(e.target.value))} /></label>
          <label>Ordine: 
            <select value={orderMode} onChange={e => setOrderMode(e.target.value)}>
              <option value="random">Casuale</option>
              <option value="original">Originale</option>
            </select>
          </label>
          {orderMode === "original" && (
            <>
              <label>Da: <input type="number" value={startIndex} onChange={e => setStartIndex(parseInt(e.target.value))} /></label>
              <label>A: <input type="number" value={endIndex} onChange={e => setEndIndex(parseInt(e.target.value))} /></label>
            </>
          )}
          <button onClick={startTest}>Inizia</button>
        </div>
      ) : showResult ? (
        <div className="result-screen">
          <h2>Risultati</h2>
          <p>Corrette: {answers.filter((a, i) => a === selectedQuestions[i].Corretta).length} su {selectedQuestions.length}</p>
        </div>
      ) : (
        <div className="quiz-screen">
          <h3>Domanda {step + 1}/{selectedQuestions.length}</h3>
          <p><strong>{current?.Domanda}</strong></p>
          
{['A', 'B', 'C'].map(opt => {
            const value = current?.[opt];
           
    let className = "option";
    if (userAnswer) {
      if (opt === userAnswer && userAnswer === correct) className += " correct";
      else if (opt === userAnswer && userAnswer !== correct) className += " wrong";
      if (opt === correct && userAnswer !== correct) className += " correct";
    }
 let className = "option";
            if (userAnswer) {
              if (opt === userAnswer && userAnswer === correct) className += " correct";
              else if (opt === userAnswer && userAnswer !== correct) className += " wrong";
              if (opt === correct && userAnswer !== correct) className += " correct";
            }
            
            
            if (userAnswer) {
              if (opt === userAnswer && userAnswer === correct) className += " correct";
              else if (opt === userAnswer && userAnswer !== correct) className += " wrong";
              if (opt === correct && userAnswer !== correct) className += " correct";
            }
            return (
              <div key={opt} className={className} onClick={() => handleAnswer(opt)}>
                <strong>{opt}.</strong> {value}
              </div>
            );
          })}
          <div className="nav-buttons">
            {step > 0 && <button onClick={() => setStep(step - 1)}>Indietro</button>}
            {step < selectedQuestions.length - 1 && <button onClick={() => setStep(step + 1)}>Avanti</button>}
            {step === selectedQuestions.length - 1 && <button onClick={handleFinish}>RISULTATI</button>}
          </div>
          <p>Tempo rimasto: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</p>
        </div>
      )}
    </div>
  );
}

export default App;
