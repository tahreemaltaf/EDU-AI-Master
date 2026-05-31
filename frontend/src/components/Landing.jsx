import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Calendar, Zap, ArrowRight, Star } from 'lucide-react';
import FloatingSupportChat from './FloatingSupportChat';

const Landing = () => {
    const navigate = useNavigate();

    const cardStyle = {
        cursor: 'pointer',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease'
    };

    const hoverEnter = (e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.25)';
    };

    const hoverLeave = (e) => {
        e.currentTarget.style.transform = 'translateY(0px)';
        e.currentTarget.style.boxShadow = 'none';
    };

    return (
        <>
            <div
                className="animate-fade-in"
                style={{
                    padding: '6rem 2rem',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}
            >
                {/* HERO SECTION */}
                <div
                    style={{
                        textAlign: 'center',
                        marginBottom: '8rem'
                    }}
                >
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '8px 16px',
                            borderRadius: '99px',
                            marginBottom: '2rem',
                            border: '1px solid var(--glass-border)'
                        }}
                    >
                        <Star
                            size={16}
                            color="var(--primary)"
                            fill="var(--primary)"
                        />
                        <span
                            style={{
                                fontSize: '0.85rem',
                                fontWeight: '600'
                            }}
                        >
                            Trusted by 10,000+ Students
                        </span>
                    </div>

                    <h1
                        style={{
                            fontSize: '5rem',
                            marginBottom: '1.5rem',
                            fontWeight: '900',
                            lineHeight: 1.1
                        }}
                    >
                        Study <span className="text-gradient">Smarter</span>,
                        <br />
                        Not Harder.
                    </h1>

                    <p
                        style={{
                            fontSize: '1.25rem',
                            color: 'var(--text-muted)',
                            marginBottom: '3.5rem',
                            maxWidth: '700px',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            lineHeight: '1.8'
                        }}
                    >
                        AI-powered learning system that turns your PDFs into
                        quizzes, study plans, and flashcards.
                    </p>

                    <div
                        style={{
                            display: 'flex',
                            gap: '1.5rem',
                            justifyContent: 'center'
                        }}
                    >
                        <button
                            className="btn-primary"
                            onClick={() => navigate('/dashboard')}
                        >
                            Start Learning <ArrowRight size={18} />
                        </button>
                    </div>
                </div>

                {/* FEATURE CARDS */}
                <div className="dashboard-grid">

                    {/* AI QUIZ GENERATOR */}
                    <div
                        className="glass-card"
                        style={cardStyle}
                        onClick={() => navigate('/quiz')}
                        onMouseEnter={hoverEnter}
                        onMouseLeave={hoverLeave}
                    >
                        <div
                            style={{
                                width: 60,
                                height: 60,
                                background: 'rgba(6, 182, 212, 0.1)',
                                borderRadius: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 20
                            }}
                        >
                            <Brain
                                size={32}
                                color="var(--primary)"
                            />
                        </div>

                        <h3
                            style={{
                                fontSize: '1.5rem',
                                marginBottom: '1rem'
                            }}
                        >
                            AI Quiz Generator
                        </h3>

                        <p
                            style={{
                                color: 'var(--text-muted)'
                            }}
                        >
                            Generate smart MCQs from your study material with AI
                            explanations.
                        </p>
                    </div>

                    {/* ADAPTIVE SCHEDULER */}
                    <div
                        className="glass-card"
                        style={cardStyle}
                        onClick={() => navigate('/planner')}
                        onMouseEnter={hoverEnter}
                        onMouseLeave={hoverLeave}
                    >
                        <div
                            style={{
                                width: 60,
                                height: 60,
                                background: 'rgba(99, 102, 241, 0.1)',
                                borderRadius: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 20
                            }}
                        >
                            <Calendar
                                size={32}
                                color="var(--secondary)"
                            />
                        </div>

                        <h3
                            style={{
                                fontSize: '1.5rem',
                                marginBottom: '1rem'
                            }}
                        >
                            Adaptive Scheduler
                        </h3>

                        <p
                            style={{
                                color: 'var(--text-muted)'
                            }}
                        >
                            AI builds your study plan based on weak areas and
                            exam urgency.
                        </p>
                    </div>

                    {/* SPACED REPETITION */}
                    <div
                        className="glass-card"
                        style={cardStyle}
                        onClick={() => navigate('/flashcards')}
                        onMouseEnter={hoverEnter}
                        onMouseLeave={hoverLeave}
                    >
                        <div
                            style={{
                                width: 60,
                                height: 60,
                                background: 'rgba(244, 63, 94, 0.1)',
                                borderRadius: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 20
                            }}
                        >
                            <Zap
                                size={32}
                                color="var(--accent)"
                            />
                        </div>

                        <h3
                            style={{
                                fontSize: '1.5rem',
                                marginBottom: '1rem'
                            }}
                        >
                            Spaced Repetition
                        </h3>

                        <p
                            style={{
                                color: 'var(--text-muted)'
                            }}
                        >
                            Smart flashcards that maximize long-term memory
                            retention.
                        </p>
                    </div>
                </div>

                {/* FOOTER */}
                <div
                    style={{
                        marginTop: '10rem',
                        textAlign: 'center',
                        padding: '40px',
                        borderTop: '1px solid var(--glass-border)'
                    }}
                >
                    <p
                        style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.85rem'
                        }}
                    >
                        Built with AI • EduAI System © 2026
                    </p>
                </div>
            </div>

            {/* FLOATING AI SUPPORT CHAT */}
            <FloatingSupportChat />
        </>
    );
};

export default Landing;