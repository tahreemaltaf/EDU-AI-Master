import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, BookOpen, BarChart3, Info, Upload } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Landing from './components/Landing';
import Quiz from './components/Quiz';
import Analytics from './components/Analytics';
import StudyPlanner from './components/StudyPlanner';
import About from './components/About';

function App() {
    return (
        <Router>
            <div className="app-container">
                <nav className="nav">
                    <Link to="/" className="logo">EduAI Master</Link>
                    <div className="nav-links" style={{ display: 'flex', gap: '2rem' }}>
                        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', textDecoration: 'none' }}>
                            <LayoutDashboard size={20} /> Dashboard
                        </Link>
                        <Link to="/planner" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', textDecoration: 'none' }}>
                            <BookOpen size={20} /> Planner
                        </Link>
                        <Link to="/analytics" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', textDecoration: 'none' }}>
                            <BarChart3 size={20} /> Performance
                        </Link>
                        <Link to="/about" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', textDecoration: 'none' }}>
                            <Info size={20} /> About
                        </Link>
                    </div>
                </nav>

                <main>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/quiz" element={<Quiz />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/planner" element={<StudyPlanner />} />
                        <Route path="/about" element={<About />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
