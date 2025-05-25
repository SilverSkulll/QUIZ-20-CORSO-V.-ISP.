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
        <h2 className="text-2xl font-bold mb-4 text-center">📘 Riepilogo del test</h2>
        {quizData.map((q, i) => {
          const corr = q.Corretta;
          const user = selectedAnswers[i];
          const isCorrect = user === corr;
          return (
            <div key={i} className="mb-4 p-6 rounded-xl border bg-white shadow-md">
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
        <div className="text-center">
          <button onClick={() => setSettings(null)} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl shadow">🔁 Torna alla schermata iniziale</button>
        </div>
      </div>
    );
  }

  const q = quizData[currentIndex];
  const sel = selectedAnswers[currentIndex];
  const correct = q.Corretta;

  return (
    <div className="p-6 max-w-3xl mx-auto min-h-screen flex flex-col items-center justify-center">
      <div className="w-full mb-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Domanda {currentIndex + 1} / {quizData.length}</h2>
        <div className="text-red-600 font-semibold text-lg">⏱ {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</div>
      </div>
      <div className="bg-white w-full p-6 rounded-xl shadow-lg mb-6 text-center">
        <p className="text-lg font-semibold mb-6">{q.Numero}. {q.Domanda}</p>
        {['A', 'B', 'C'].map(opt => {
          const base = "w-full mb-3 px-6 py-4 rounded-xl text-left border text-lg font-medium cursor-pointer ";
          const isSelected = sel === opt;
          const isCorrect = opt === correct;
          const className =
            isSelected && isCorrect ? base + "bg-green-400 text-white" :
            isSelected && !isCorrect ? base + "bg-red-400 text-white" :
            sel && isCorrect ? base + "bg-green-100" :
            base + "bg-gray-100 hover:bg-gray-200";

          return (
            <div
              key={opt}
              role="button"
              tabIndex={0}
              onClick={() => handleAnswer(opt)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnswer(opt)}
              className={className}
            >
              {opt}) {q[opt]}
            </div>
          );
        })}
      </div>
      <div className="w-full flex justify-between">
        <button onClick={() => setCurrentIndex(currentIndex - 1)} disabled={currentIndex === 0} className="px-6 py-3 bg-gray-400 text-white rounded-xl shadow disabled:opacity-50">
          ◀ Indietro
        </button>
        {currentIndex < quizData.length - 1 ? (
          <button onClick={() => setCurrentIndex(currentIndex + 1)} className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow">
            Avanti ▶
          </button>
        ) : (
          <button onClick={() => setShowResults(true)} className="px-6 py-3 bg-green-600 text-white rounded-xl shadow">
            ✅ Concludi
          </button>
        )}
      </div>
    </div>
  );
}
