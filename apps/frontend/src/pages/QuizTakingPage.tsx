import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../services/quizService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AuthContext } from '../contexts/AuthContext';

const QuizTakingPage = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [quiz, setQuiz] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [answers, setAnswers] = useState<{ [key: string]: any }>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const fetchQuizInfo = async () => {
      if (quizId) {
        const data = await quizService.getQuizById(+quizId);
        setQuiz(data);
      }
    };
    fetchQuizInfo();
  }, [quizId]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleFinish();
    }
    if (!timeLeft) return;
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const handleStart = async () => {
    if (quizId) {
      const attemptData = await quizService.startAttempt(+quizId);
      setAttempt(attemptData);
      setQuiz(attemptData.quiz); // Обновляем quiz с вопросами
      if (attemptData.quiz.duration) {
        setTimeLeft(attemptData.quiz.duration * 60);
      }
    }
  };

  const handleAnswerChange = (questionId: number, value: any, type: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (attempt) {
      const payload = {
        quizAttemptId: attempt.id,
        questionId,
        ...(type === 'TEXT' ? { textAnswer: value } : { answerId: value }),
      };
      quizService.answerQuestion(payload);
    }
  };

  const handleFinish = async () => {
    if (attempt) {
      try {
        const result = await quizService.finishAttempt(attempt.id);
        console.log('Quiz completed with result:', result);
        
        // Перенаправляем студента на страницу с результатами
        navigate(`/quiz/attempt/${attempt.id}/result`);
      } catch (error) {
        console.error('Error finishing quiz:', error);
        // В случае ошибки все равно перенаправляем на главную
        navigate('/');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!quiz) {
    return <div>Загрузка...</div>;
  }

  if (!attempt) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-full max-w-md p-4 border rounded-lg">
          <h2 className="text-xl font-bold">{quiz.name}</h2>
          <p>Длительность: {quiz.duration ? `${quiz.duration} минут` : 'Неограничено'}</p>
          <Button onClick={handleStart} className="mt-4 w-full">
            Начать тест
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{quiz.name}</h1>
        {timeLeft !== null && <div className="text-xl font-mono">Осталось времени: {formatTime(timeLeft)}</div>}
      </div>

      {quiz.questions.map((q: any, index: number) => (
        <div key={q.id} className="p-4 border rounded-lg mb-4">
          <h3 className="font-bold">
            Вопрос {index + 1}: {q.name}
          </h3>
          <div className="mt-2">
            {q.type === 'SINGLE_CHOICE' &&
              q.answers.map((a: any) => (
                <div key={a.id} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    value={a.id}
                    id={`q${q.id}-a${a.id}`}
                    onChange={(e) => handleAnswerChange(q.id, parseInt(e.target.value), q.type)}
                  />
                  <label htmlFor={`q${q.id}-a${a.id}`}>{a.name}</label>
                </div>
              ))}
            {q.type === 'MULTIPLE_CHOICE' &&
              q.answers.map((a: any) => (
                <div key={a.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`q${q.id}-a${a.id}`}
                    onChange={(e) => {
                      const currentAnswers = answers[q.id] || [];
                      const newAnswers = e.target.checked
                        ? [...currentAnswers, a.id]
                        : currentAnswers.filter((id: number) => id !== a.id);
                      handleAnswerChange(q.id, newAnswers, q.type);
                    }}
                  />
                  <label htmlFor={`q${q.id}-a${a.id}`}>{a.name}</label>
                </div>
              ))}
            {q.type === 'TEXT' && (
              <Input
                onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)}
                placeholder="Введите ваш ответ"
              />
            )}
          </div>
        </div>
      ))}

      <Button onClick={handleFinish} className="w-full">
        Завершить тест
      </Button>
    </div>
  );
};

export default QuizTakingPage;
