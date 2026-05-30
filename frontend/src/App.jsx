import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    BarChart3,
    Info,
    Layers,
    User,
    LogOut,
    Flame,
    MessageSquare
} from 'lucide-react';
import axios from 'axios';

import Dashboard from './components/Dashboard';
import Landing from './components/Landing';
import Quiz from './components/Quiz';
import Analytics from './components/Analytics';
import StudyPlanner from './components/StudyPlanner';
import Flashcards from './components/Flashcards';
import About from './components/About';

// AI STUDY TOOLS
import McqGenerator from './components/McqGenerator';
import StudyChat from './components/StudyChat';
import TopicSummary from './components/TopicSummary';

// Configure Axios Global Interceptor for user database profiles
axios.interceptors.request.use((config) => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        config.headers['X-User-Id'] = user.id;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

function App() {
    const [user, setUser] = useState(null);
    const [loginName, setLoginName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('currentUser');
        if (saved) {
            setUser(JSON.parse(saved));
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!loginName || loginName.trim() === '') {
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
            setError('');
            setLoginName('');
            window.location.reload(); // Reload to refresh contexts and schedules
        } catch (err) {
            console.error(err);
            setError('Login failed. Make sure the backend server is running.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('studyContext');
        setUser(null);
        window.location.href = "/";
    };

    // RENDER LOGIN SCREEN IF NO USER SET
    if (!user) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                padding: '2rem'
            }}>
                <div className="glass-card animate-fade-in" style={{
                    width: '100%',
                    maxWidth: '440px',
                    padding: '3rem',
                    textAlign: 'center',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
                }}>
                    <div style={{
                        width: '70px',
                        height: '70px',
                        background: 'var(--primary-glow)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 2rem'
                    }}>
                        <User size={36} color="white" />
                    </div>

                    <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                        EduAI Master
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
                        Access your persistent study plans, flashcards, and progress track records.
                    </p>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <input
                            type="text"
                            placeholder="Enter Username or Student ID..."
                            value={loginName}
                            onChange={(e) => setLoginName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                textAlign: 'center',
                                transition: 'all 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                        />

                        {error && (
                            <p style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: '600' }}>
                                {error}
                            </p>
                        )}

                        <button type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: '16px' }}>
                            Join Learning Board
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <div className="app-container">

                {/* NAVBAR */}
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

                    {/* Profile & Logout Indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '12px',
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                        }}>
                            <User size={14} color="var(--primary)" />
                            <span style={{ color: 'white' }}>{user.username}</span>
                            <div style={{ borderLeft: '1px solid var(--glass-border)', height: '14px', margin: '0 4px' }}></div>
                            <Flame size={14} color="#f59e0b" fill="#f59e0b" />
                            <span style={{ color: '#fbbf24' }}>{user.streak}d</span>
                        </div>

                        <button 
                            onClick={handleLogout}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '8px',
                                color: 'var(--text-muted)',
                                transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                            title="Log out profile"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </nav>

                {/* ROUTES */}
                <main>
                    <Routes>
                        {/* CORE */}
                        <Route path="/" element={<Landing />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/quiz" element={<Quiz />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/planner" element={<StudyPlanner />} />
                        <Route path="/flashcards" element={<Flashcards />} />
                        <Route path="/about" element={<About />} />

                        {/* AI STUDY TOOLS ROUTES */}
                        <Route path="/mcq" element={<McqGenerator />} />
                        <Route path="/study-chat" element={<StudyChat />} />
                        <Route path="/summary" element={<TopicSummary />} />
                    </Routes>
                </main>

            </div>
        </Router>
    );
}

export default App;