import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Brain, Calendar, Zap, ArrowRight, Star } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();
    return (
        <div className="animate-fade-in" style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Hero Section */}
            <div style={{ textAlign: 'center', marginBottom: '8rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '99px', marginBottom: '2rem', border: '1px solid var(--glass-border)' }}>
                    <Star size={16} color="var(--primary)" fill="var(--primary)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>Trusted by 10,000+ Students</span>
                </div>

                <h1 style={{ fontSize: '5rem', marginBottom: '1.5rem', fontWeight: '900', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
                    Study <span className="text-gradient">Smarter</span>,<br />
                    Not <span style={{ textDecoration: 'underline wavy var(--accent)' }}>Harder</span>.
                </h1>

                <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 3.5rem', lineHeight: '1.8' }}>
                    The ultimate AI-powered companion that transforms your course notes into adaptive flashcards, smart schedules, and diagnostic quizzes.
                </p>

                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                    <button className="btn-primary" onClick={() => navigate('/dashboard')} style={{ fontSize: '1.1rem', padding: '16px 40px' }}>
                        Transform Your PDF <ArrowRight size={20} />
                    </button>
                    <button className="btn-secondary" onClick={() => navigate('/about')} style={{ fontSize: '1.1rem', padding: '16px 40px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '14px', color: 'white', cursor: 'pointer' }}>
                        How it works
                    </button>
                </div>
            </div>

            {/* Features Grid */}
            <div className="dashboard-grid">
                <div className="glass-card" style={{ animationDelay: '0.1s' }}>
                    <div style={{ width: '60px', height: '60px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <Brain size={32} color="var(--primary)" />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>AI Quiz Generator</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Our T5-powered AI extracts key concepts and generates natural MCQs directly from your lecture slides.</p>
                </div>

                <div className="glass-card" style={{ animationDelay: '0.2s' }}>
                    <div style={{ width: '60px', height: '60px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <Calendar size={32} color="var(--secondary)" />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Adaptive Scheduler</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Dynamic study plans that evolve based on your quiz performance, focusing automatically on your weak areas.</p>
                </div>

                <div className="glass-card" style={{ animationDelay: '0.3s' }}>
                    <div style={{ width: '60px', height: '60px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <Zap size={32} color="var(--accent)" />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Spaced Repetition</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Optimized review cycles using scientific algorithms to ensure maximum long-term memory retention.</p>
                </div>
            </div>

            {/* Subtle Footer */}
            <div style={{ marginTop: '10rem', textAlign: 'center', padding: '40px', borderTop: '1px solid var(--glass-border)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Built with AI. Designed for Excellence. © 2026 EduAI Master.</p>
            </div>
        </div>
    );
};

export default Landing;
