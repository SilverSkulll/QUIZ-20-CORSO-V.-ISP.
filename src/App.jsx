import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import StartScreen from './components/StartScreen';

function shuffle(array) {
  return array.map(a => [Math.random(), a]).sort().map(a => a[1]);
}

export default function App() {
  const [quizData, setQuizData] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [reviewList, setReviewList] = useState(() => {
    const saved = localStorage.getItem('reviewList');
    return saved ? JSON.parse(saved) : [];
  });
  const [settings, setSettings] = useState(null);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            clearInterval(countdown);
            setShowResults(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [timer]);

  const startQuiz = (config) => {
    fetch('/quiz_domande_320.csv')
      .then(res => res.text())
      .then(csv => {
        const all = Papa.parse(csv, { header: true }).data.filter(r => r.Numero && r.Domanda && r.A && r.B && r.C);
        let selected = [];

        if (config.mode === 'random') {
          selected = shuffle(all).slice(0, config.count);
        } else if (config.mode === 'interval') {
          selected = all.filter(q => {
            const n = parseInt(q.Numero, 10);
            return n >= config.start && n <= config.end;
          }).slice(0, config.count);
        } else if (config.mode === 'review') {
          selected = all.filter(q => reviewList.includes(parseInt(q.Numero, 10)));
        }

        setQuizData(selected);
        setSelectedAnswers({});
        setCurrentIndex(0);
        setShowResults(false);
        setSettings(config);
        setTimer(config.timer * 60);
      });
  };

  const handleAnswer = (letter) => {
    setSelectedAnswers({ ...selectedAnswers, [currentIndex]: letter });
  };

  const toggleReview = (num) => {
    let updated = [...reviewList];
    if (updated.includes(num)) {
      updated = updated.filter(n => n !== num);
    } else {
      updated.push(num);
    }
    setReviewList(updated);
    localStorage.setItem('reviewList', JSON.stringify(updated));
  };

  if (!settings) {
    return <StartScreen onStart={startQuiz} />;
  }

  if (showResults || currentIndex >= quizData.length) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">📘 Riepilogo del test</h2>
        {quizData.map((q, i) => {
          const corr = q.Corretta;
          const user = selectedAnswers[i];
          const isCorrect = user === corr;
          return (
            <div key={i} className="mb-4 p-4 rounded border bg-white shadow">
              <p className="font-semibold mb-2">{q.Numero}. {q.Domanda}</p>
              <p>✅ Corretta: {q[corr]}</p>
              <p className={!isCorrect ? 'text-red-600' : 'text-green-600'}>
                {isCorrect ? 'Risposta esatta' : `❌ Hai risposto: ${q[user] || '-'}`}
              </p>
              <label className="block mt-2">
                <input type="checkbox" checked={reviewList.includes(parseInt(q.Numero, 10))} onChange={() => toggleReview(parseInt(q.Numero, 10))} />
                {' '}Segna come da ripassare
              </label>
            </div>
          );
        })}
        <button onClick={() => setSettings(null)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">🔁 Torna alla schermata iniziale</button>
      </div>
    );
  }

  const q = quizData[currentIndex];
  const sel = selectedAnswers[currentIndex];
  const correct = q.Corretta;

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col items-center justify-center min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Domanda {currentIndex + 1} / {quizData.length}</h2>
        <div className="text-red-600 font-semibold">⏱ {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</div>
      </div>
      <div className="bg-white p-4 rounded shadow mb-4">
        <p className="font-semibold mb-4">{q.Numero}. {q.Domanda}</p>
        {['A', 'B', 'C'].map(opt => (
          <div key={opt} onClick={() => handleAnswer(opt)} role='button' tabIndex='0' onKeyDown={(e) => e.key === 'Enter' && handleAnswer(opt)} className={`cursor-pointer border p-4 rounded-xl shadow-md text-center text-lg font-medium mb-4 ${sel === opt ? (opt === correct ? 'bg-green-300' : 'bg-red-300') : sel && opt === correct ? 'bg-green-200' : 'bg-gray-100'}`}>
            {opt}) {q[opt]}
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <button onClick={() => setCurrentIndex(currentIndex - 1)} disabled={currentIndex === 0} className="px-4 py-2 bg-gray-400 text-white rounded">◀ Indietro</button>
        {currentIndex < quizData.length - 1 ? (
          <button onClick={() => setCurrentIndex(currentIndex + 1)} className="px-4 py-2 bg-blue-600 text-white rounded">Avanti ▶</button>
        ) : (
          <button onClick={() => setShowResults(true)} className="px-4 py-2 bg-green-600 text-white rounded">✅ Concludi</button>
        )}
      </div>
    </div>
  );
}
