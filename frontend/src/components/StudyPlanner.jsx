import React, { useState, useEffect } from 'react';
import { Calendar, BookOpen, Brain, RotateCcw, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const StudyPlanner = () => {
    const [plan, setPlan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('timeline'); // timeline | list

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const resp = await axios.get('http://localhost:5000/api/study-plan');
                setPlan(resp.data.study_plan || []);
            } catch (e) {
                console.error("Failed to load study plan:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, []);

    const typeIcon = (type) => {
        if (type === 'quiz') return <Brain size={18} color="#fbbf24" />;
        if (type === 'review') return <RotateCcw size={18} color="#a78bfa" />;
        return <BookOpen size={18} color="#10b981" />;
    };

    const typeColor = (type) => {
        if (type === 'quiz') return '#fbbf24';
        if (type === 'review') return '#a78bfa';
        return '#10b981';
    };

    const activityBg = (type) => {
        if (type === 'quiz') return 'rgba(251, 191, 36, 0.1)';
        if (type === 'review') return 'rgba(167, 139, 250, 0.1)';
        return 'rgba(16, 185, 129, 0.1)';
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <p style={{ color: 'var(--text-muted)' }}>Loading your personalised study plan...</p>
            </div>
        );
    }

    if (plan.length === 0) {
        return (
            <div className="glass-card" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
                <Calendar size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                <h2>No Study Plan Yet</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Upload a PDF and take the diagnostic quiz to generate a personalised day-by-day study plan.
                </p>
                <a href="/dashboard" className="btn-primary" style={{ textDecoration: 'none' }}>Go to Dashboard</a>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ marginBottom: '0.25rem' }}>Your Personalised Study Plan</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {plan.length} sessions planned -- weak areas get extra focus
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setViewMode('timeline')} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: viewMode === 'timeline' ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.8rem' }}>Timeline</button>
                    <button onClick={() => setViewMode('list')} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: viewMode === 'list' ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.8rem' }}>List</button>
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Study Session
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} /> Practice Quiz
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }} /> Spaced Review
                </span>
            </div>

            {viewMode === 'timeline' ? (
                /* ── Timeline View ─────────────────────────────────── */
                <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                    {/* Vertical line */}
                    <div style={{ position: 'absolute', left: '14px', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.1)' }} />

                    {plan.map((item, idx) => (
                        <div key={idx} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                            {/* Dot */}
                            <div style={{ position: 'absolute', left: '-22px', top: '8px', width: '12px', height: '12px', borderRadius: '50%', background: typeColor(item.type || 'study'), border: '2px solid var(--bg-dark)' }} />

                            <div className="glass-card" style={{ padding: '1rem 1.25rem', background: activityBg(item.type || 'study') }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {typeIcon(item.type || 'study')}
                                        <h4 style={{ margin: 0, fontSize: '1rem' }}>{item.topic}</h4>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {item.day ? `Day ${item.day}` : ''} - {item.date}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', color: typeColor(item.type || 'study'), fontWeight: '600' }}>
                                        {item.activity || 'Study'}
                                    </span>
                                    {item.score !== null && item.score !== undefined && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Quiz Score: {item.score}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* ── List View ─────────────────────────────────────── */
                <div className="glass-card" style={{ overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Day</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Topic</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Activity</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plan.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{item.day || idx + 1}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{item.date}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: '600' }}>{item.topic}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', background: activityBg(item.type || 'study'), color: typeColor(item.type || 'study'), fontWeight: '600' }}>
                                            {item.activity || 'Study'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>
                                        {item.score !== null && item.score !== undefined ? `${item.score}%` : '--'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StudyPlanner;
