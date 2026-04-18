import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function StudyMode() {
    const { weekId } = useParams<{ weekId: string }>();
    const [searchParams] = useSearchParams();
    const week = parseInt(weekId || '1');
    const startQ = parseInt(searchParams.get('q') || '1') - 1;
    const navigate = useNavigate();

    const { getWeekQuestions, dispatch, isBookmarked } = useApp();
    const questions = getWeekQuestions(week);

    const [currentIndex, setCurrentIndex] = useState(Math.max(0, Math.min(startQ, questions.length - 1)));
    const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
    const [revealed, setRevealed] = useState(false);

    const question = questions[currentIndex];
    if (!question) {
        return (
            <div className="empty-state fade-in">
                <div className="icon">📭</div>
                <h3>No questions for Week {week}</h3>
                <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Dashboard</button>
            </div>
        );
    }

    const hasCorrectAnswer = question.correctAnswer.length > 0;
    const bookmarked = isBookmarked(question.id);
    const isMultiSelect = question.correctAnswer.length > 1;

    const toggleOption = (label: string) => {
        if (revealed) return;
        if (isMultiSelect) {
            setSelectedAnswers((prev) =>
                prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
            );
        } else {
            setSelectedAnswers([label]);
        }
    };

    const handleSubmit = () => {
        if (selectedAnswers.length === 0) return;

        const isCorrect = hasCorrectAnswer &&
            selectedAnswers.length === question.correctAnswer.length &&
            selectedAnswers.every((a) => question.correctAnswer.includes(a));

        dispatch({
            type: 'RECORD_ATTEMPT',
            attempt: {
                questionId: question.id,
                selectedAnswers,
                isCorrect,
                timestamp: Date.now(),
            },
        });
        setRevealed(true);
    };

    const handleSaveAsCorrect = () => {
        if (selectedAnswers.length === 0) return;
        
        dispatch({
            type: 'SAVE_USER_ANSWER',
            questionId: question.id,
            answer: selectedAnswers,
        });
        
        dispatch({
            type: 'RECORD_ATTEMPT',
            attempt: {
                questionId: question.id,
                selectedAnswers,
                isCorrect: true,
                timestamp: Date.now(),
            },
        });
        setRevealed(true);
    };

    const handleReveal = () => {
        setRevealed(true);
    };

    const goTo = (index: number) => {
        setCurrentIndex(index);
        setSelectedAnswers([]);
        setRevealed(false);
    };

    const getOptionClass = (label: string) => {
        const classes = ['option-btn'];
        if (revealed) {
            classes.push('disabled');
            if (question.correctAnswer.includes(label)) classes.push('correct');
            else if (selectedAnswers.includes(label)) classes.push('incorrect');
        } else if (selectedAnswers.includes(label)) {
            classes.push('selected');
        }
        return classes.join(' ');
    };

    return (
        <div className="question-container fade-in">
            <div className="question-progress">
                <span>Q {currentIndex + 1} / {questions.length}</span>
                <div className="question-progress-bar">
                    <div
                        className="question-progress-fill"
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
                <span>Week {week}</span>
            </div>

            <div className="question-card scale-in" key={question.id}>
                <div className="question-meta">
                    <span className="question-badge">
                        Question {question.questionNumber}
                        {question.needsReview && <span className="review-badge" style={{ marginLeft: 8 }}>⚠️ Needs Review</span>}
                    </span>
                    <button
                        className="bookmark-btn"
                        onClick={() => dispatch({ type: 'TOGGLE_BOOKMARK', questionId: question.id })}
                        title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                    >
                        {bookmarked ? '⭐' : '☆'}
                    </button>
                </div>

                <div className="question-text">{question.questionText}</div>

                {isMultiSelect && !revealed && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        Select all that apply
                    </p>
                )}

                <div className="options-list">
                    {question.options.map((opt) => (
                        <button
                            key={opt.label}
                            className={getOptionClass(opt.label)}
                            onClick={() => toggleOption(opt.label)}
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
                    onClick={() => goTo(currentIndex - 1)}
                    disabled={currentIndex === 0}
                >
                    ← Previous
                </button>

                <div style={{ display: 'flex', gap: 8 }}>
                    {!revealed && hasCorrectAnswer && selectedAnswers.length > 0 && (
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            Submit Answer
                        </button>
                    )}
                    {!revealed && !hasCorrectAnswer && selectedAnswers.length > 0 && (
                        <button className="btn btn-success" onClick={handleSaveAsCorrect}>
                            Save as Correct Answer
                        </button>
                    )}
                    {!revealed && hasCorrectAnswer && (
                        <button className="btn btn-ghost" onClick={handleReveal}>
                            Reveal Answer
                        </button>
                    )}
                    {!hasCorrectAnswer && !revealed && selectedAnswers.length === 0 && (
                        <span style={{ fontSize: 13, color: 'var(--warning)', alignSelf: 'center' }}>
                            ⚠️ Select option(s) to save as correct
                        </span>
                    )}
                </div>

                <button
                    className="btn btn-secondary"
                    onClick={() => goTo(currentIndex + 1)}
                    disabled={currentIndex === questions.length - 1}
                >
                    Next →
                </button>
            </div>

            {revealed && (
                <div style={{ marginTop: 16, padding: 16, borderRadius: 'var(--radius-sm)', background: 'var(--bg-accent)', border: '1px solid var(--border)' }}>
                    <strong>Correct Answer{question.correctAnswer.length > 1 ? 's' : ''}:</strong>{' '}
                    {hasCorrectAnswer
                        ? question.correctAnswer.join(', ')
                        : 'Not verified — this question needs manual review'}
                </div>
            )}
        </div>
    );
}
