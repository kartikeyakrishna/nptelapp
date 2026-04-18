import { useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import WeekView from './pages/WeekView';
import StudyMode from './pages/StudyMode';
import TestMode from './pages/TestMode';
import './index.css';

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { progress, dispatch, questions, exportProgress, importProgress } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportProgress();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nptel-study-progress.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) importProgress(ev.target.result as string);
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">NPTEL Study Hub</div>
          <div className="sidebar-subtitle">Innovation in Marketing</div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose} end>
            <span className="icon">📊</span>
            Dashboard
          </NavLink>

          <NavLink to="/test" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}>
            <span className="icon">📝</span>
            Test Mode
          </NavLink>

          <div className="sidebar-section">Weekly Assignments</div>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => {
            const weekQs = questions.filter((q) => q.week === week);
            const attempted = weekQs.filter((q) => (progress.attempts[q.id] || []).length > 0).length;
            return (
              <NavLink
                key={week}
                to={`/week/${week}`}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="icon">📖</span>
                Week {week}
                <span className="sidebar-week-badge">{attempted}/{weekQs.length}</span>
              </NavLink>
            );
          })}

          <div className="sidebar-section">Tools</div>
          <button className="sidebar-link" onClick={handleExport}>
            <span className="icon">💾</span>
            Export Progress
          </button>
          <button className="sidebar-link" onClick={() => fileInputRef.current?.click()}>
            <span className="icon">📥</span>
            Import Progress
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </nav>

        <div className="sidebar-footer">
          <button className="dark-toggle" onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}>
            <span className="icon">{progress.darkMode ? '☀️' : '🌙'}</span>
            {progress.darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>
    </>
  );
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        <span className="logo">NPTEL Study Hub</span>
      </div>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/week/:weekId" element={<WeekView />} />
          <Route path="/study/:weekId" element={<StudyMode />} />
          <Route path="/test" element={<TestMode />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}
