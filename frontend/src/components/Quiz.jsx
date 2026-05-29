import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle2, XCircle, Loader2, AlertTriangle, ArrowRight, RotateCcw, PieChart } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Quiz = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [showScore, setShowScore] = useState(false);
    const [score, setScore] = useState(0);
    const [results, setResults] = useState([]);
    const [weakAreas, setWeakAreas] = useState([]);
    const [studyPlan, setStudyPlan] = useState([]);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await axios.post('http://localhost:5000/api/generate-quiz', {
                    context: localStorage.getItem('studyContext') || ""
                });
                setQuestions(response.data.questions || []);
            } catch (error) {
                console.error("Failed to fetch questions:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    const handleAnswer = async (option) => {
        const q = questions[currentQuestion];
        const isCorrect = option === q.correct_answer;
        setSelectedAnswer(option);
        setShowFeedback(true);

        if (isCorrect) setScore(s => s + 1);
        const newResults = [...results, { topic: q.topic, correct: isCorrect }];
        setResults(newResults);

        setTimeout(async () => {
            setSelectedAnswer(null);
            setShowFeedback(false);

            const next = currentQuestion + 1;
            if (next < questions.length) {
                setCurrentQuestion(next);
            } else {
                setShowScore(true);
                try {
                    const resp = await axios.post('http://localhost:5000/api/analyse-weak-areas', {
                        results: newResults
                    });
                    setWeakAreas(resp.data.weak_areas || []);
                    setStudyPlan(resp.data.study_plan || []);
                } catch (e) {
                    console.error("Weak-area analysis failed:", e);
                }
            }
        }, 1200);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
                <div className="pulse">
                    <Loader2 className="animate-spin" size={64} color="var(--primary)" />
                </div>
                <h2 style={{ marginTop: '2rem', fontWeight: '700' }}>Crafting your diagnostic...</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>AI is analyzing your PDF topics</p>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="glass-card animate-fade-in" style={{ maxWidth: '600px', margin: '6rem auto', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                    <HelpCircle size={40} color="var(--accent)" />
                </div>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>No study material found</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: '1.6' }}>Please upload a PDF on the dashboard first so our AI can generate a personalized assessment for you.</p>
                <button className="btn-primary" onClick={() => navigate('/dashboard')}>
                    Return to Dashboard
                </button>
            </div>
        );
    }

    if (showScore) {
        return (
            <div className="animate-fade-in" style={{ padding: '4rem 2rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="glass-card" style={{ textAlign: 'center', marginBottom: '3rem', padding: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800' }}>Diagnostic Complete</h2>
                    <div style={{ position: 'relative', display: 'inline-block', margin: '2rem 0' }}>
                        <div style={{ fontSize: '5rem', fontWeight: '900', position: 'relative', zIndex: 1 }} className="text-gradient">
                            {Math.round((score / questions.length) * 100)}%
                        </div>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120px', height: '120px', background: 'var(--primary-glow)', filter: 'blur(40px)', opacity: 0.5 }}></div>
                    </div>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
                        {score / questions.length >= 0.7
                            ? "Excellent mastery! Your foundation is strong."
                            : "Good effort! Your study plan has been optimized to focus on your gaps."}
                    </p>
                </div>

                {weakAreas.length > 0 && (
                    <div className="glass-card" style={{ marginBottom: '3rem' }}>
                        <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem' }}>
                            <PieChart size={24} color="var(--primary)" /> Topic Breakdown
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {weakAreas.map((area, idx) => (
                                <div key={idx} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid var(--glass-border)', borderLeft: `6px solid ${area.is_weak ? 'var(--accent)' : 'var(--primary)'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{area.topic}</span>
                                        <span style={{ fontWeight: '800', color: area.is_weak ? 'var(--accent)' : 'var(--primary)' }}>{area.score}%</span>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '99px', overflow: 'hidden' }}>
                                        <div style={{ width: `${area.score}%`, height: '100%', background: area.is_weak ? 'var(--accent)' : 'var(--primary)' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                    <button className="btn-primary" onClick={() => navigate('/planner')} style={{ padding: '16px 32px' }}>
                        View Personal Plan <ArrowRight size={20} />
                    </button>
                    <button className="btn-primary" onClick={() => window.location.reload()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', boxShadow: 'none' }}>
                        <RotateCcw size={20} /> Retake Quiz
                    </button>
                </div>
            </div>
        );
    }

    const q = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
        <div className="animate-fade-in" style={{ padding: '4rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Diagnostic Mode</span>
                    <h2 style={{ fontSize: '2rem', marginTop: '0.25rem' }}>Question {currentQuestion + 1}</h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Progress: {Math.round(progress)}%</span>
                </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '99px', height: '10px', marginBottom: '4rem', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}></div>
            </div>

            <div className="glass-card" style={{ padding: '4rem' }}>
                <div style={{ display: 'inline-block', padding: '6px 12px', background: 'var(--primary-glow)', borderRadius: '8px', color: 'white', fontSize: '0.8rem', fontWeight: '600', marginBottom: '2rem' }}>
                    {q.topic}
                </div>
                <h3 style={{ fontSize: '1.75rem', marginBottom: '3rem', lineHeight: '1.4', fontWeight: '600' }}>{q.question}</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    {q.options.map((opt, idx) => {
                        let state = 'default';
                        if (showFeedback) {
                            if (opt === q.correct_answer) state = 'correct';
                            else if (opt === selectedAnswer) state = 'incorrect';
                        }

                        const colors = {
                            default: { bg: 'rgba(255,255,255,0.03)', border: 'var(--glass-border)', color: 'white' },
                            correct: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', color: 'white' },
                            incorrect: { bg: 'rgba(244, 63, 94, 0.15)', border: 'var(--accent)', color: 'white' }
                        };

                        return (
                            <button
                                key={idx}
                                onClick={() => !showFeedback && handleAnswer(opt)}
                                disabled={showFeedback}
                                style={{
                                    padding: '24px 32px',
                                    background: colors[state].bg,
                                    border: `1px solid ${colors[state].border}`,
                                    color: colors[state].color,
                                    borderRadius: '20px',
                                    cursor: showFeedback ? 'default' : 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    fontSize: '1.1rem',
                                    fontWeight: '500',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                {opt}
                                {state === 'correct' && <CheckCircle2 size={24} color="#10b981" />}
                                {state === 'incorrect' && <XCircle size={24} color="var(--accent)" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Quiz;
