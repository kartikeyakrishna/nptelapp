import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { questions, progress, getWeekStats } = useApp();

    const totalAttempted = Object.keys(progress.attempts).length;
    const totalCorrect = Object.values(progress.attempts).filter(
        (a) => a.length > 0 && a[a.length - 1].isCorrect
    ).length;
    const totalTests = progress.testResults.length;
    const avgScore = totalTests > 0
        ? Math.round(progress.testResults.reduce((sum, t) => sum + (t.correctCount / t.totalQuestions) * 100, 0) / totalTests)
        : 0;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>📚 Dashboard</h1>
                <p>Innovation in Marketing — NPTEL Study Hub</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-value">{questions.length}</div>
                    <div className="stat-label">Total Questions</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-value">{totalAttempted}</div>
                    <div className="stat-label">Questions Attempted</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-value">{totalCorrect}</div>
                    <div className="stat-label">Correct Answers</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-value">{totalTests > 0 ? `${avgScore}%` : '—'}</div>
                    <div className="stat-label">Avg Test Score</div>
                </div>
            </div>

            <div className="page-header">
                <h2 style={{ fontSize: '20px' }}>Weekly Progress</h2>
            </div>

            <div className="weeks-grid">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => {
                    const stats = getWeekStats(week);
                    const progressPct = stats.total > 0 ? (stats.attempted / stats.total) * 100 : 0;

                    return (
                        <Link to={`/week/${week}`} className="week-card" key={week}>
                            <div className="week-card-header">
                                <span className="week-number">Week {week}</span>
                                <span className="week-questions-count">{stats.total} questions</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                            </div>
                            <div className="week-stats">
                                <span className="week-stat-item">
                                    ✅ {stats.attempted} attempted
                                </span>
                                <span className="week-stat-item">
                                    🎯 {stats.accuracy}% accuracy
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {progress.testResults.length > 0 && (
                <>
                    <div className="page-header" style={{ marginTop: '32px' }}>
                        <h2 style={{ fontSize: '20px' }}>Recent Tests</h2>
                    </div>
                    <div className="question-list">
                        {progress.testResults.slice(-5).reverse().map((test) => (
                            <div className="question-list-item" key={test.id} style={{ cursor: 'default' }}>
                                <div className="question-list-num" style={{ minWidth: 40, height: 40, fontSize: 16 }}>
                                    {Math.round((test.correctCount / test.totalQuestions) * 100)}%
                                </div>
                                <div className="question-list-text">
                                    <div style={{ fontWeight: 600 }}>
                                        {test.correctCount}/{test.totalQuestions} correct
                                        {' · '}Weeks {test.weeks.join(', ')}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                                        {new Date(test.date).toLocaleDateString()} · {Math.round(test.timeSpent / 60)}min
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
