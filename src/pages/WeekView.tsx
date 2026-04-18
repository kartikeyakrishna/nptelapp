import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function WeekView() {
    const { weekId } = useParams<{ weekId: string }>();
    const week = parseInt(weekId || '1');
    const { getWeekQuestions, getAttempts, isBookmarked, getWeekStats } = useApp();
    const navigate = useNavigate();

    const questions = getWeekQuestions(week);
    const stats = getWeekStats(week);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'attempted' | 'unattempted' | 'bookmarked' | 'incorrect'>('all');

    const filtered = questions.filter((q) => {
        if (search && !q.questionText.toLowerCase().includes(search.toLowerCase())) return false;
        const attempts = getAttempts(q.id);
        const lastAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;

        switch (filter) {
            case 'attempted': return attempts.length > 0;
            case 'unattempted': return attempts.length === 0;
            case 'bookmarked': return isBookmarked(q.id);
            case 'incorrect': return lastAttempt ? !lastAttempt.isCorrect : false;
            default: return true;
        }
    });

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>📖 Week {week}</h1>
                <p>{stats.total} questions · {stats.attempted} attempted · {stats.accuracy}% accuracy</p>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <button className="btn btn-primary" onClick={() => navigate(`/study/${week}`)}>
                    📖 Study Mode
                </button>
                <button className="btn btn-secondary" onClick={() => navigate(`/test?weeks=${week}`)}>
                    📝 Quick Test
                </button>
            </div>

            <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                    className="search-input"
                    placeholder="Search questions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="filters-bar">
                {(['all', 'attempted', 'unattempted', 'bookmarked', 'incorrect'] as const).map((f) => (
                    <button
                        key={f}
                        className={`filter-btn ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">📭</div>
                    <h3>No questions found</h3>
                    <p>Try changing your filter or search term</p>
                </div>
            ) : (
                <div className="question-list">
                    {filtered.map((q) => {
                        const attempts = getAttempts(q.id);
                        const lastAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;
                        const bookmarked = isBookmarked(q.id);

                        return (
                            <Link
                                to={`/study/${week}?q=${q.questionNumber}`}
                                className="question-list-item"
                                key={q.id}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div className="question-list-num">{q.questionNumber}</div>
                                <div className="question-list-text">{q.questionText}</div>
                                <div className="question-list-badges">
                                    {bookmarked && <span className="badge badge-primary">⭐</span>}
                                    {q.needsReview && <span className="review-badge">Needs Review</span>}
                                    {lastAttempt && (
                                        <span className={`badge ${lastAttempt.isCorrect ? 'badge-success' : 'badge-danger'}`}>
                                            {lastAttempt.isCorrect ? '✓' : '✗'}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
