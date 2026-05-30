import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    BarChart3,
    Info,
    Layers
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import Landing from './components/Landing';
import Quiz from './components/Quiz';
import Analytics from './components/Analytics';
import StudyPlanner from './components/StudyPlanner';
import Flashcards from './components/Flashcards';
import About from './components/About';

// ✅ NEW (AI FEATURES YOU ARE BUILDING)
import McqGenerator from './components/McqGenerator';
import StudyChat from './components/StudyChat';
import TopicSummary from './components/TopicSummary';

function App() {
    return (
        <Router>
            <div className="app-container">

                {/* NAVBAR */}
                <nav className="nav">
                    <Link to="/" className="logo">EduAI Master</Link>

                    <div className="nav-links">
                        <Link to="/dashboard" className="nav-item">
                            <LayoutDashboard size={18} /> Dashboard
                        </Link>

                        <Link to="/planner" className="nav-item">
                            <BookOpen size={18} /> Planner
                        </Link>

                        <Link to="/flashcards" className="nav-item">
                            <Layers size={18} /> Flashcards
                        </Link>

                        <Link to="/analytics" className="nav-item">
                            <BarChart3 size={18} /> Performance
                        </Link>

                        <Link to="/about" className="nav-item">
                            <Info size={18} /> About
                        </Link>
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

                        {/* 🚀 NEW AI FEATURES ROUTES */}

                        {/* MCQ Generator */}
                        <Route path="/mcq" element={<McqGenerator />} />

                        {/* AI Study Chat Planner */}
                        <Route path="/study-chat" element={<StudyChat />} />

                        {/* Smart Topic Summary */}
                        <Route path="/summary" element={<TopicSummary />} />

                    </Routes>
                </main>

            </div>
        </Router>
    );
}

export default App;