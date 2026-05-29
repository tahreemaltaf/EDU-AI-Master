import React, { useState, useEffect } from 'react';
import { Layers, ChevronLeft, ChevronRight, RotateCcw, Brain, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const Flashcards = () => {
    const [flashcards, setFlashcards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

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

    const next = () => { setIsFlipped(false); setCurrentIndex(i => Math.min(i + 1, filtered.length - 1)); };
    const prev = () => { setIsFlipped(false); setCurrentIndex(i => Math.max(i - 1, 0)); };

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
                    onClick={() => { setFilter('all'); setCurrentIndex(0); }}
                    style={{ padding: '10px 24px', borderRadius: '99px', border: 'none', cursor: 'pointer', background: filter === 'all' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: 'white', fontWeight: '600', transition: 'all 0.3s ease' }}
                >
                    All Topics
                </button>
                {topics.map(t => (
                    <button
                        key={t}
                        onClick={() => { setFilter(t); setCurrentIndex(0); }}
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
                            height: '420px',
                            width: '100%',
                            maxWidth: '640px',
                            margin: '0 auto'
                        }}
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                cursor: 'pointer',
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
                                    padding: '4rem',
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
                                    padding: '4rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: 0,
                                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(99, 102, 241, 0.1))',
                                    border: '1px solid var(--primary)',
                                    textAlign: 'center'
                                }}>
                                <div style={{ overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <CheckCircle2 size={40} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
                                    <p style={{ fontSize: '1.4rem', lineHeight: '1.6', color: 'white', fontWeight: '500' }}>{card.back}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
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
                </>
            )}
        </div>
    );
};

export default Flashcards;
