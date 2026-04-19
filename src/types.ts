export interface QuestionOption {
    label: string;
    text: string;
}

export interface Question {
    id: string;
    week: number;
    questionNumber: number;
    questionText: string;
    options: QuestionOption[];
    correctAnswer: string[];
    sourcePdf: string;
    sourcePage: number;
    confidence: string;
    needsReview: boolean;
    explanation?: string;
}

export interface QuestionAttempt {
    questionId: string;
    selectedAnswers: string[];
    isCorrect: boolean;
    timestamp: number;
}

export interface TestResult {
    id: string;
    date: number;
    weeks: number[];
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    skippedCount: number;
    timeSpent: number;
    attempts: QuestionAttempt[];
}

export interface UserProgress {
    attempts: Record<string, QuestionAttempt[]>;
    bookmarks: string[];
    testResults: TestResult[];
    darkMode: boolean;
    userProvidedAnswers: Record<string, string[]>;
}
