import React, { useState, useEffect } from 'react';
import { Layers, ChevronLeft, ChevronRight, RotateCcw, Brain, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const Flashcards = () => {
    const [flashcards, setFlashcards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        const fetchFlashcards = async () => {
            try {
                const resp = await axios.get('http://localhost:5000/api/flashcards');
                setFlashcards(resp.data.flashcards || []);
            } catch (e) {
                console.error("Failed to load flashcards:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchFlashcards();
    }, []);

    const topics = [...new Set(flashcards.map(f => f.topic))];
    const filtered = filter === 'all' ? flashcards : flashcards.filter(f => f.topic === filter);
    const card = filtered[currentIndex];

    const next = () => { 
        setIsFlipped(false); 
        setFeedback(null);
        setCurrentIndex(i => Math.min(i + 1, filtered.length - 1)); 
    };
    
    const prev = () => { 
        setIsFlipped(false); 
        setFeedback(null);
        setCurrentIndex(i => Math.max(i - 1, 0)); 
    };

    const handleRateCard = async (e, quality) => {
        e.stopPropagation(); // prevent flipping the card back immediately
        if (feedback) return; // avoid multiple clicks during transition
        
        try {
            const resp = await axios.post('http://localhost:5000/api/review-flashcard', {
                topic: card.topic,
                quality: quality
            });
            
            setFeedback(`Rescheduled: Next review on ${resp.data.next_review}`);
            
            // Auto flip back and transition after 1.6 seconds
            setTimeout(() => {
                setFeedback(null);
                setIsFlipped(false);
                setTimeout(() => {
                    if (currentIndex < filtered.length - 1) {
                        setCurrentIndex(i => i + 1);
                    } else {
                        alert("Session complete! You rated all cards in this list.");
                    }
                }, 300);
            }, 1600);
            
        } catch (error) {
            console.error("Failed to update spaced repetition:", error);
            alert("Could not save card review. Make sure the backend server is running.");
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className="pulse">
                    <Layers size={64} color="var(--primary)" />
                </div>
                <p style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>Loading flashcards...</p>
            </div>
        );
    }

    if (flashcards.length === 0) {
        return (
            <div className="glass-card animate-fade-in" style={{ maxWidth: '600px', margin: '6rem auto', textAlign: 'center', padding: '4rem' }}>
                <div style={{ width: '80px', height: '80px', background: 'var(--primary-glow)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                    <Layers size={40} color="white" />
                </div>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>No flashcards found</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: '1.6' }}>Upload a PDF to auto-generate adaptive flashcards from your study material.</p>
                <button className="btn-primary" onClick={() => window.location.href = '/dashboard'}>
                    Go to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ padding: '4rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Active Recall</h2>
                <p style={{ color: 'var(--text-muted)' }}>
                    {filtered.length} active cards in your study bin
                </p>
            </div>

            {/* Topic Filter */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '4rem' }}>
                <button
                    onClick={() => { setFilter('all'); setCurrentIndex(0); setIsFlipped(false); setFeedback(null); }}
                    style={{ padding: '10px 24px', borderRadius: '99px', border: 'none', cursor: 'pointer', background: filter === 'all' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: 'white', fontWeight: '600', transition: 'all 0.3s ease' }}
                >
                    All Topics
                </button>
                {topics.map(t => (
                    <button
                        key={t}
                        onClick={() => { setFilter(t); setCurrentIndex(0); setIsFlipped(false); setFeedback(null); }}
                        style={{ padding: '10px 24px', borderRadius: '99px', border: 'none', cursor: 'pointer', background: filter === t ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: 'white', fontWeight: '600', transition: 'all 0.3s ease' }}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Card */}
            {card && (
                <>
                    <div
                        style={{
                            perspective: '1200px',
                            height: '450px',
                            width: '100%',
                            maxWidth: '640px',
                            margin: '0 auto'
                        }}
                        onClick={() => !feedback && setIsFlipped(!isFlipped)}
                    >
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                cursor: feedback ? 'default' : 'pointer',
                                transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                transformStyle: 'preserve-3d',
                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
                                position: 'relative'
                            }}
                        >
                            {/* Front */}
                            <div
                                className="glass-card"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    position: 'absolute',
                                    inset: 0,
                                    padding: '3rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: 0,
                                    boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                                    textAlign: 'center'
                                }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '2rem', border: '1px solid var(--glass-border)' }}>
                                        {card.topic}
                                    </div>
                                    <h3 style={{ fontSize: '1.85rem', lineHeight: '1.4', fontWeight: '600' }}>{card.front}</h3>
                                    <div style={{ marginTop: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <RotateCcw size={16} /> Tap to flip card
                                    </div>
                                </div>
                            </div>

                            {/* Back */}
                            <div
                                className="glass-card"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    position: 'absolute',
                                    inset: 0,
                                    transform: 'rotateY(180deg)',
                                    padding: '3rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: 0,
                                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(99, 102, 241, 0.1))',
                                    border: '1px solid var(--primary)',
                                    textAlign: 'center'
                                }}>
                                <div style={{ overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <CheckCircle2 size={36} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                                    <p style={{ fontSize: '1.25rem', lineHeight: '1.6', color: 'white', fontWeight: '500' }}>{card.back}</p>
                                </div>

                                {/* Spaced Repetition Rating UI */}
                                <div style={{ width: '100%' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: '600' }}>
                                        How well did you recall this concept?
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
                                        <button 
                                            onClick={(e) => handleRateCard(e, 0)}
                                            style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => e.target.style.background = '#ef4444'}
                                            onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.15)'}
                                        >
                                            Forgot (0)
                                        </button>
                                        <button 
                                            onClick={(e) => handleRateCard(e, 1)}
                                            style={{ padding: '8px 12px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#fbbf24', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => e.target.style.background = '#f59e0b'}
                                            onMouseLeave={(e) => e.target.style.background = 'rgba(245, 158, 11, 0.15)'}
                                        >
                                            Hard (1)
                                        </button>
                                        <button 
                                            onClick={(e) => handleRateCard(e, 2)}
                                            style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f6', color: '#60a5fa', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => e.target.style.background = '#3b82f6'}
                                            onMouseLeave={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.15)'}
                                        >
                                            Good (2)
                                        </button>
                                        <button 
                                            onClick={(e) => handleRateCard(e, 3)}
                                            style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => e.target.style.background = '#10b981'}
                                            onMouseLeave={(e) => e.target.style.background = 'rgba(16, 185, 129, 0.15)'}
                                        >
                                            Easy (3)
                                        </button>
                                    </div>
                                    
                                    {/* Feedback Message */}
                                    {feedback && (
                                        <div style={{
                                            marginTop: '1rem',
                                            padding: '8px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '8px',
                                            fontSize: '0.8rem',
                                            color: '#67e8f9',
                                            fontWeight: '600'
                                        }}>
                                            {feedback}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    {!feedback && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3rem', marginTop: '3rem' }}>
                            <button onClick={(e) => { e.stopPropagation(); prev(); }} disabled={currentIndex === 0} className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', boxShadow: 'none', padding: '12px' }}>
                                <ChevronLeft size={24} />
                            </button>
                            <span style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>
                                {currentIndex + 1} <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>/ {filtered.length}</span>
                            </span>
                            <button onClick={(e) => { e.stopPropagation(); next(); }} disabled={currentIndex >= filtered.length - 1} className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', boxShadow: 'none', padding: '12px' }}>
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Flashcards;
