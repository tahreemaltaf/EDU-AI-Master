import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    BarChart3,
    Info,
    Layers,
    MessageSquare
} from 'lucide-react';
import axios from 'axios';

// Pages
import Dashboard from './components/Dashboard';
import Landing from './components/Landing';
import Quiz from './components/Quiz';
import Analytics from './components/Analytics';
import StudyPlanner from './components/StudyPlanner';
import Flashcards from './components/Flashcards';
import About from './components/About';

// AI Tools
import McqGenerator from './components/McqGenerator';
import StudyChat from './components/StudyChat';
import TopicSummary from './components/TopicSummary';

// Profile Pages
import ProfilePage from "./components/ProfilePage";
import SettingsPage from "./components/SettingsPage";
import PrivacyPolicy from "./components/PrivacyPolicy";

// Profile Menu
import ProfileMenu from "./components/ProfileMenu";

// Axios interceptor
axios.interceptors.request.use((config) => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        config.headers['X-User-Id'] = user.id;
    }
    return config;
}, (error) => Promise.reject(error));

function App() {

    const [user, setUser] = useState(null);
    const [loginName, setLoginName] = useState('');
    const [error, setError] = useState('');

    const [scheduledQuiz, setScheduledQuiz] = useState(null);
    const [showRecallModal, setShowRecallModal] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('currentUser');
        if (saved) setUser(JSON.parse(saved));
    }, []);

    useEffect(() => {
        const checkSchedule = () => {
            const stored = localStorage.getItem('scheduledQuiz');

            if (!stored) {
                setScheduledQuiz(null);
                return;
            }

            try {
                const parsed = JSON.parse(stored);

                const timeLeft = Math.max(
                    0,
                    Math.ceil((parsed.scheduledTime - Date.now()) / 1000)
                );

                setScheduledQuiz({
                    topic: parsed.topic,
                    timeLeft
                });

                if (timeLeft === 0) {
                    setShowRecallModal(true);
                }

            } catch (e) {
                console.error(e);
            }
        };

        checkSchedule();
        const interval = setInterval(checkSchedule, 1000);
        window.addEventListener('storage', checkSchedule);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', checkSchedule);
        };
    }, []);

    const formatTimerSecs = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;

        return `${mins.toString().padStart(2, '0')}:${secs
            .toString()
            .padStart(2, '0')}`;
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!loginName.trim()) {
            setError('Please enter a username');
            return;
        }

        try {
            const resp = await axios.post('http://localhost:5000/api/login', {
                username: loginName
            });

            const userData = resp.data;

            localStorage.setItem('currentUser', JSON.stringify(userData));
            setUser(userData);
            setLoginName('');
            setError('');

        } catch (err) {
            setError('Login failed. Backend not running.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('studyContext');

        delete axios.defaults.headers.common['X-User-Id'];

        setUser(null);
        window.location.href = "/";
    };

    const handleCancelQuiz = () => {
        localStorage.removeItem('scheduledQuiz');
        setScheduledQuiz(null);
        setShowRecallModal(false);
    };

    const handleConfirmQuiz = () => {
        if (!scheduledQuiz) return;

        const topic = scheduledQuiz.topic;

        localStorage.removeItem('scheduledQuiz');
        setScheduledQuiz(null);
        setShowRecallModal(false);

        window.location.href = `/quiz?topic=${encodeURIComponent(topic)}`;
    };

    const triggerQuizModalEarly = () => setShowRecallModal(true);

    // LOGIN SCREEN
    if (!user) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh'
            }}>
                <div className="glass-card" style={{ padding: 40, width: 420 }}>
                    <h2>EduAI Master</h2>

                    <form onSubmit={handleLogin}>
                        <input
                            value={loginName}
                            onChange={(e) => setLoginName(e.target.value)}
                            placeholder="Enter username"
                            style={{
                                width: '100%',
                                padding: 12,
                                marginTop: 20
                            }}
                        />

                        {error && <p style={{ color: 'red' }}>{error}</p>}

                        <button className="btn-primary" style={{ width: '100%', marginTop: 20 }}>
                            Login
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <div className="app-container">

                {/* NAVBAR (ONLY CHANGE: ADD STREAK AFTER PROFILE) */}
                <nav className="nav" style={{ padding: '16px 40px' }}>

                    <Link to="/" className="logo">EduAI Master</Link>

                    <div className="nav-links">
                        <Link to="/dashboard" className="nav-item">
                            <LayoutDashboard size={16} /> Dashboard
                        </Link>
                        <Link to="/planner" className="nav-item">
                            <BookOpen size={16} /> Planner
                        </Link>
                        <Link to="/flashcards" className="nav-item">
                            <Layers size={16} /> Flashcards
                        </Link>
                        <Link to="/study-chat" className="nav-item">
                            <MessageSquare size={16} /> AI Chat
                        </Link>
                        <Link to="/analytics" className="nav-item">
                            <BarChart3 size={16} /> Performance
                        </Link>
                        <Link to="/about" className="nav-item">
                            <Info size={16} /> About
                        </Link>
                    </div>

                    {/* PROFILE + STREAK (ADDED AFTER PROFILE MENU) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                        {/* PROFILE MENU (UNCHANGED) */}
                        <ProfileMenu
                            user={user}
                            onLogout={handleLogout}
                        />

                        {/* 🔥 STREAK ADDED HERE (NEW ONLY CHANGE) */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '999px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#fbbf24',
                             whiteSpace: 'nowrap'   // ✅ THIS FIXES IT
                        }}>
                            🔥 {user.streak ?? 0}-D
                        </div>

                    </div>

                </nav>

                {/* ROUTES */}
                <main>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/quiz" element={<Quiz />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/planner" element={<StudyPlanner />} />
                        <Route path="/flashcards" element={<Flashcards />} />
                        <Route path="/about" element={<About />} />

                        <Route path="/mcq" element={<McqGenerator />} />
                        <Route path="/study-chat" element={<StudyChat />} />
                        <Route path="/summary" element={<TopicSummary />} />

                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    </Routes>
                </main>

                {/* FLOATING QUIZ */}
                {scheduledQuiz?.timeLeft > 0 && (
                    <div
                        onClick={triggerQuizModalEarly}
                        style={{
                            position: 'fixed',
                            bottom: 24,
                            right: 24,
                            padding: '12px 18px',
                            borderRadius: 50,
                            background: 'rgba(99,102,241,0.2)',
                            color: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        🔥 {scheduledQuiz.topic} in {formatTimerSecs(scheduledQuiz.timeLeft)}
                    </div>
                )}

                {/* MODAL */}
                {showRecallModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div className="glass-card" style={{ padding: 30 }}>
                            <h3>Recall Quiz</h3>
                            <p>Ready for {scheduledQuiz?.topic}?</p>

                            <button onClick={handleCancelQuiz}>Cancel</button>
                            <button onClick={handleConfirmQuiz}>Start</button>
                        </div>
                    </div>
                )}

            </div>
        </Router>
    );
}

export default App;