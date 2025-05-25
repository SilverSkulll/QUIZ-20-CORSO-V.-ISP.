import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

function shuffleArray(array) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

export default function App() {
  const [quizData, setQuizData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [reviewList, setReviewList] = useState(() => {
    const saved = localStorage.getItem('reviewList');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetch('/quiz_domande_320.csv')
      .then((res) => res.text())
      .then((csv) => {
        const parsed = Papa.parse(csv, { header: true }).data;
        const clean = parsed
          .filter((row) => row.Numero && row.Domanda && row.A && row.B && row.C)
          .map((row) => ({
            ...row,
            Numero: Number(row.Numero),
          }));
        setQuizData(shuffleArray(clean).slice(0, 10)); // default 10 domande random
      });
  }, []);

  const handleAnswer = (choice) => {
    setSelectedAnswers({ ...selectedAnswers, [currentIndex]: choice });
  };

  const handleNext = () => {
    if (currentIndex < quizData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinish = () => {
    setShowResults(true);
  };

  const toggleReview = (num) => {
    let updated = [...reviewList];
    if (updated.includes(num)) {
      updated = updated.filter((n) => n !== num);
    } else {
      updated.push(num);
    }
    setReviewList(updated);
    localStorage.setItem('reviewList', JSON.stringify(updated));
  };

  if (quizData.length === 0) {
    return <div className="p-6 text-center">Caricamento domande...</div>;
  }

  if (showResults) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">📘 Riepilogo Risposte</h2>
        {quizData.map((q, i) => {
          const correct = q.Corretta;
          const user = selectedAnswers[i];
          const isCorrect = correct === user;
          return (
            <div key={i} className="border rounded p-4 mb-2 bg-white shadow">
              <p className="font-semibold">
                {q.Numero}. {q.Domanda}
              </p>
              <p>✅ Corretta: {q[correct]}</p>
              <p className={!isCorrect ? 'text-red-600' : 'text-green-600'}>
                {isCorrect ? 'Risposta corretta' : `❌ Hai risposto: ${q[user] || '-'}`}
              </p>
              <label className="block mt-2">
                <input
                  type="checkbox"
                  checked={reviewList.includes(q.Numero)}
                  onChange={() => toggleReview(q.Numero)}
                />{' '}
                Segna come da ripassare
              </label>
            </div>
          );
        })}
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => window.location.reload()}>
          🔁 Ricomincia il test
        </button>
      </div>
    );
  }

  const question = quizData[currentIndex];
  const selected = selectedAnswers[currentIndex];
  const correct = question.Corretta;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">
        Domanda {currentIndex + 1} di {quizData.length}
      </h2>
      <div className="bg-white p-4 rounded shadow mb-4">
        <p className="font-semibold mb-3">
          {question.Numero}. {question.Domanda}
        </p>
        {['A', 'B', 'C'].map((opt) => (
          <div
            key={opt}
            onClick={() => handleAnswer(opt)}
            className={`cursor-pointer border p-2 rounded mb-2 ${
              selected === opt
                ? opt === correct
                  ? 'bg-green-300'
                  : 'bg-red-300'
                : selected && opt === correct
                ? 'bg-green-200'
                : 'bg-gray-100'
            }`}
          >
            {opt}) {question[opt]}
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <button onClick={handlePrev} disabled={currentIndex === 0} className="px-4 py-2 bg-gray-400 text-white rounded">
          ◀️ Indietro
        </button>
        {currentIndex < quizData.length - 1 ? (
          <button onClick={handleNext} className="px-4 py-2 bg-blue-600 text-white rounded">
            Avanti ▶️
          </button>
        ) : (
          <button onClick={handleFinish} className="px-4 py-2 bg-green-600 text-white rounded">
            ✅ Risultati
          </button>
        )}
      </div>
    </div>
  );
}
