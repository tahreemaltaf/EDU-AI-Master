import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Brain, Calendar, Zap } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();
    return (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', fontWeight: '900' }}>
                Study <span style={{ color: 'var(--secondary)' }}>Smarter</span>, Not Harder.
            </h1>
            <p style={{ fontSize: '1.5rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '800px', margin: '0 auto 3rem' }}>
                Transform your course notes into personalized study plans, interactive quizzes, and visual progress tracking using AI.
            </p>

            <button className="btn-primary" onClick={() => navigate('/dashboard')} style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}>
                Get Started for Free
            </button>

            <div className="dashboard-grid" style={{ marginTop: '5rem' }}>
                <div className="glass-card">
                    <Brain size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                    <h3>AI Quiz Generator</h3>
                    <p>Automatically generate MCQs and flashcards from your PDF slides.</p>
                </div>
                <div className="glass-card">
                    <Calendar size={48} color="var(--secondary)" style={{ marginBottom: '1rem' }} />
                    <h3>Smart Scheduler</h3>
                    <p>Personalized study plans based on your weak areas and exam dates.</p>
                </div>
                <div className="glass-card">
                    <Zap size={48} color="#fbbf24" style={{ marginBottom: '1rem' }} />
                    <h3>Spaced Repetition</h3>
                    <p>Optimized review cycles to ensure long-term memory retention.</p>
                </div>
            </div>
        </div>
    );
};

export default Landing;
