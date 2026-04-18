import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Question, UserProgress, QuestionAttempt, TestResult } from '../types';
import questionsData from '../data/questions.json';

const STORAGE_KEY = 'nptel-study-progress';

const defaultProgress: UserProgress = {
    attempts: {},
    bookmarks: [],
    testResults: [],
    darkMode: false,
};

function loadProgress(): UserProgress {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return { ...defaultProgress, ...JSON.parse(data) };
        }
    } catch (e) {
        console.error('Failed to load progress:', e);
    }
    return defaultProgress;
}

function saveProgress(progress: UserProgress) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
        console.error('Failed to save progress:', e);
    }
}

type Action =
    | { type: 'RECORD_ATTEMPT'; attempt: QuestionAttempt }
    | { type: 'TOGGLE_BOOKMARK'; questionId: string }
    | { type: 'ADD_TEST_RESULT'; result: TestResult }
    | { type: 'TOGGLE_DARK_MODE' }
    | { type: 'IMPORT_PROGRESS'; progress: UserProgress }
    | { type: 'RESET_PROGRESS' };

function reducer(state: UserProgress, action: Action): UserProgress {
    switch (action.type) {
        case 'RECORD_ATTEMPT': {
            const { questionId } = action.attempt;
            const prev = state.attempts[questionId] || [];
            return {
                ...state,
                attempts: {
                    ...state.attempts,
                    [questionId]: [...prev, action.attempt],
                },
            };
        }
        case 'TOGGLE_BOOKMARK': {
            const bookmarks = state.bookmarks.includes(action.questionId)
                ? state.bookmarks.filter((id) => id !== action.questionId)
                : [...state.bookmarks, action.questionId];
            return { ...state, bookmarks };
        }
        case 'ADD_TEST_RESULT':
            return { ...state, testResults: [...state.testResults, action.result] };
        case 'TOGGLE_DARK_MODE':
            return { ...state, darkMode: !state.darkMode };
        case 'IMPORT_PROGRESS':
            return { ...defaultProgress, ...action.progress };
        case 'RESET_PROGRESS':
            return defaultProgress;
        default:
            return state;
    }
}

interface AppContextType {
    questions: Question[];
    progress: UserProgress;
    dispatch: React.Dispatch<Action>;
    getWeekQuestions: (week: number) => Question[];
    getQuestionById: (id: string) => Question | undefined;
    getAttempts: (questionId: string) => QuestionAttempt[];
    isBookmarked: (questionId: string) => boolean;
    getWeekStats: (week: number) => { total: number; attempted: number; correct: number; accuracy: number };
    exportProgress: () => string;
    importProgress: (data: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    const questions = questionsData as Question[];
    const [progress, dispatch] = useReducer(reducer, undefined, loadProgress);

    useEffect(() => {
        saveProgress(progress);
    }, [progress]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', progress.darkMode);
    }, [progress.darkMode]);

    const getWeekQuestions = useCallback(
        (week: number) => questions.filter((q) => q.week === week),
        [questions]
    );

    const getQuestionById = useCallback(
        (id: string) => questions.find((q) => q.id === id),
        [questions]
    );

    const getAttempts = useCallback(
        (questionId: string) => progress.attempts[questionId] || [],
        [progress.attempts]
    );

    const isBookmarked = useCallback(
        (questionId: string) => progress.bookmarks.includes(questionId),
        [progress.bookmarks]
    );

    const getWeekStats = useCallback(
        (week: number) => {
            const weekQs = questions.filter((q) => q.week === week);
            const total = weekQs.length;
            let attempted = 0;
            let correct = 0;
            for (const q of weekQs) {
                const attempts = progress.attempts[q.id];
                if (attempts && attempts.length > 0) {
                    attempted++;
                    if (attempts[attempts.length - 1].isCorrect) correct++;
                }
            }
            return { total, attempted, correct, accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0 };
        },
        [questions, progress.attempts]
    );

    const exportProgress = useCallback(() => JSON.stringify(progress, null, 2), [progress]);

    const importProgress = useCallback(
        (data: string) => {
            try {
                const parsed = JSON.parse(data);
                dispatch({ type: 'IMPORT_PROGRESS', progress: parsed });
            } catch (e) {
                alert('Invalid progress file');
            }
        },
        [dispatch]
    );

    return (
        <AppContext.Provider
            value={{
                questions,
                progress,
                dispatch,
                getWeekQuestions,
                getQuestionById,
                getAttempts,
                isBookmarked,
                getWeekStats,
                exportProgress,
                importProgress,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
