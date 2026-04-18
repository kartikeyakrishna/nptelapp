import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Question, QuestionAttempt } from '../types';

function shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

type Phase = 'config' | 'test' | 'results';

export default function TestMode() {
    const { questions, dispatch } = useApp();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const presetWeeks = searchParams.get('weeks')?.split(',').map(Number) || [];

    const [phase, setPhase] = useState<Phase>(presetWeeks.length > 0 ? 'config' : 'config');
    const [selectedWeeks, setSelectedWeeks] = useState<number[]>(presetWeeks);
    const [numQuestions, setNumQuestions] = useState(10);
    const [timerEnabled, setTimerEnabled] = useState(false);
    const [timerMinutes, setTimerMinutes] = useState(15);

    // Test state
    const [testQuestions, setTestQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string[]>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const timerRef = useRef<number | null>(null);

    // Timer
    useEffect(() => {
        if (phase !== 'test' || !timerEnabled) return;
        timerRef.current = window.setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    handleFinishTest();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [phase, timerEnabled]);

    const handleStartTest = () => {
        if (selectedWeeks.length === 0) return;

        let pool = questions.filter((q) => selectedWeeks.includes(q.week));
        pool = shuffleArray(pool);
        const count = Math.min(numQuestions, pool.length);
        const selected = pool.slice(0, count);

        // Shuffle options for each question
        const shuffled = selected.map((q) => ({
            ...q,
            options: shuffleArray(q.options),
        }));

        setTestQuestions(shuffled);
        setCurrentIndex(0);
        setAnswers({});
        setStartTime(Date.now());
        if (timerEnabled) setTimeLeft(timerMinutes * 60);
        setPhase('test');
    };

    const handleFinishTest = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);

        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        const attempts: QuestionAttempt[] = [];
        let correctCount = 0;
        let wrongCount = 0;
        let skippedCount = 0;

        for (const q of testQuestions) {
            const selected = answers[q.id] || [];
            if (selected.length === 0) {
                skippedCount++;
                attempts.push({ questionId: q.id, selectedAnswers: [], isCorrect: false, timestamp: Date.now() });
                continue;
            }

            const isCorrect = q.correctAnswer.length > 0 &&
                selected.length === q.correctAnswer.length &&
                selected.every((a) => q.correctAnswer.includes(a));

            if (isCorrect) correctCount++;
            else wrongCount++;

            const attempt: QuestionAttempt = { questionId: q.id, selectedAnswers: selected, isCorrect, timestamp: Date.now() };
            attempts.push(attempt);
            dispatch({ type: 'RECORD_ATTEMPT', attempt });
        }

        dispatch({
            type: 'ADD_TEST_RESULT',
            result: {
                id: `test_${Date.now()}`,
                date: Date.now(),
                weeks: selectedWeeks,
                totalQuestions: testQuestions.length,
                correctCount,
                wrongCount,
                skippedCount,
                timeSpent,
                attempts,
            },
        });

        setPhase('results');
    }, [testQuestions, answers, startTime, selectedWeeks, dispatch]);

    const toggleWeek = (week: number) => {
        setSelectedWeeks((prev) =>
            prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week]
        );
    };

    const selectAllWeeks = () => {
        setSelectedWeeks((prev) =>
            prev.length === 12 ? [] : Array.from({ length: 12 }, (_, i) => i + 1)
        );
    };

    const toggleAnswer = (questionId: string, label: string, isMulti: boolean) => {
        setAnswers((prev) => {
            const current = prev[questionId] || [];
            if (isMulti) {
                return {
                    ...prev,
                    [questionId]: current.includes(label)
                        ? current.filter((l) => l !== label)
                        : [...current, label],
                };
            }
            return { ...prev, [questionId]: [label] };
        });
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const availableQuestions = questions.filter((q) => selectedWeeks.includes(q.week)).length;

    // CONFIG PHASE
    if (phase === 'config') {
        return (
            <div className="fade-in">
                <div className="page-header">
                    <h1>📝 Test Mode</h1>
                    <p>Configure your test and start when ready</p>
                </div>

                <div className="test-config">
                    <div className="config-section">
                        <label className="config-label">Select Weeks</label>
                        <div className="week-select-grid">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => (
                                <button
                                    key={week}
                                    className={`week-select-btn ${selectedWeeks.includes(week) ? 'selected' : ''}`}
                                    onClick={() => toggleWeek(week)}
                                >
                                    Week {week}
                                </button>
                            ))}
                        </div>
                        <button className="select-all-btn" onClick={selectAllWeeks}>
                            {selectedWeeks.length === 12 ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>

                    <div className="config-section">
                        <label className="config-label">Number of Questions ({availableQuestions} available)</label>
                        <input
                            className="config-input"
                            type="number"
                            min={1}
                            max={availableQuestions}
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                    </div>

                    <div className="config-section">
                        <div className="config-row">
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={timerEnabled}
                                    onChange={() => setTimerEnabled(!timerEnabled)}
                                />
                                <span className="toggle-slider" />
                            </label>
                            <span style={{ fontWeight: 500 }}>Enable Timer</span>
                        </div>
                        {timerEnabled && (
                            <div style={{ marginTop: 12 }}>
                                <label className="config-label">Time Limit (minutes)</label>
                                <input
                                    className="config-input"
                                    type="number"
                                    min={1}
                                    max={120}
                                    value={timerMinutes}
                                    onChange={(e) => setTimerMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                                />
                            </div>
                        )}
                    </div>

                    <button
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                        onClick={handleStartTest}
                        disabled={selectedWeeks.length === 0}
                    >
                        🚀 Start Test ({Math.min(numQuestions, availableQuestions)} questions)
                    </button>
                </div>
            </div>
        );
    }

    // TEST PHASE
    if (phase === 'test') {
        const question = testQuestions[currentIndex];
        const selected = answers[question.id] || [];
        const isMulti = question.correctAnswer.length > 1;

        return (
            <div className="question-container fade-in">
                <div className="question-progress">
                    <span>Q {currentIndex + 1}/{testQuestions.length}</span>
                    <div className="question-progress-bar">
                        <div
                            className="question-progress-fill"
                            style={{ width: `${((currentIndex + 1) / testQuestions.length) * 100}%` }}
                        />
                    </div>
                    {timerEnabled && (
                        <span className={`timer-display ${timeLeft < 60 ? 'warning' : ''}`}>
                            ⏱️ {formatTime(timeLeft)}
                        </span>
                    )}
                </div>

                <div className="question-card scale-in" key={question.id}>
                    <div className="question-meta">
                        <span className="question-badge">Week {question.week} · Q{question.questionNumber}</span>
                    </div>
                    <div className="question-text">{question.questionText}</div>

                    {isMulti && (
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                            Select all that apply
                        </p>
                    )}

                    <div className="options-list">
                        {question.options.map((opt) => (
                            <button
                                key={opt.label}
                                className={`option-btn ${selected.includes(opt.label) ? 'selected' : ''}`}
                                onClick={() => toggleAnswer(question.id, opt.label, isMulti)}
                            >
                                <span className="option-label">{opt.label}</span>
                                <span>{opt.text}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="question-nav">
                    <button
                        className="btn btn-secondary"
                        onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                        disabled={currentIndex === 0}
                    >
                        ← Previous
                    </button>

                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {Object.keys(answers).length}/{testQuestions.length} answered
                    </span>

                    {currentIndex < testQuestions.length - 1 ? (
                        <button
                            className="btn btn-primary"
                            onClick={() => setCurrentIndex((i) => i + 1)}
                        >
                            Next →
                        </button>
                    ) : (
                        <button className="btn btn-success" onClick={handleFinishTest}>
                            ✅ Submit Test
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // RESULTS PHASE
    const lastResult = {
        ...(() => {
            let correctCount = 0, wrongCount = 0, skippedCount = 0;
            for (const q of testQuestions) {
                const sel = answers[q.id] || [];
                if (sel.length === 0) { skippedCount++; continue; }
                const isCorrect = q.correctAnswer.length > 0 &&
                    sel.length === q.correctAnswer.length &&
                    sel.every((a) => q.correctAnswer.includes(a));
                if (isCorrect) correctCount++; else wrongCount++;
            }
            return { correctCount, wrongCount, skippedCount };
        })()
    };

    const scorePct = Math.round((lastResult.correctCount / testQuestions.length) * 100);

    return (
        <div className="results-container fade-in">
            <div className="page-header" style={{ textAlign: 'center' }}>
                <h1>🎉 Test Complete!</h1>
            </div>

            <div className="results-score">
                <div className="score-circle">
                    {scorePct}%
                </div>
                <div className="score-details">
                    <div className="score-detail">
                        <div className="score-detail-value correct-text">{lastResult.correctCount}</div>
                        <div className="score-detail-label">Correct</div>
                    </div>
                    <div className="score-detail">
                        <div className="score-detail-value incorrect-text">{lastResult.wrongCount}</div>
                        <div className="score-detail-label">Wrong</div>
                    </div>
                    <div className="score-detail">
                        <div className="score-detail-value skipped-text">{lastResult.skippedCount}</div>
                        <div className="score-detail-label">Skipped</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
                <button className="btn btn-primary" onClick={() => setPhase('config')}>
                    🔄 New Test
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/')}>
                    📊 Dashboard
                </button>
            </div>

            <div className="page-header">
                <h2 style={{ fontSize: '18px' }}>Review Answers</h2>
            </div>

            <div className="question-list">
                {testQuestions.map((q, idx) => {
                    const sel = answers[q.id] || [];
                    const isCorrect = q.correctAnswer.length > 0 &&
                        sel.length === q.correctAnswer.length &&
                        sel.every((a) => q.correctAnswer.includes(a));
                    const skipped = sel.length === 0;

                    return (
                        <div className="question-list-item" key={q.id} style={{ flexDirection: 'column', cursor: 'default', gap: 8 }}>
                            <div style={{ display: 'flex', width: '100%', gap: 12, alignItems: 'flex-start' }}>
                                <div
                                    className="question-list-num"
                                    style={{
                                        background: skipped ? 'var(--warning-light)' : isCorrect ? 'var(--success-light)' : 'var(--danger-light)',
                                        color: skipped ? 'var(--warning)' : isCorrect ? 'var(--success)' : 'var(--danger)',
                                    }}
                                >
                                    {idx + 1}
                                </div>
                                <div className="question-list-text">
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{q.questionText}</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                        {skipped ? '⏭️ Skipped' : (
                                            <>
                                                Your answer: <strong>{sel.join(', ')}</strong>
                                                {' · '}
                                                Correct: <strong style={{ color: 'var(--success)' }}>{q.correctAnswer.join(', ') || 'Not verified'}</strong>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <span className={`badge ${skipped ? 'badge-warning' : isCorrect ? 'badge-success' : 'badge-danger'}`}>
                                    {skipped ? 'Skipped' : isCorrect ? '✓' : '✗'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
