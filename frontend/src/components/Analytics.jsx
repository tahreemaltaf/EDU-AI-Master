import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    RadialLinearScale,
    ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import axios from 'axios';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    RadialLinearScale,
    ArcElement
);

const Analytics = () => {
    const [weakAreas, setWeakAreas] = useState([]);
    const [quizHistory, setQuizHistory] = useState({ labels: [], scores: [] });
    const [studyProgress, setStudyProgress] = useState([0, 0, 0, 0, 0, 0, 0]);
    const [studyLogs, setStudyLogs] = useState([]);
    const [oralHistory, setOralHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                setLoading(true);
                const [weakAreasResp, historyResp, progressResp, oralResp] = await Promise.all([
                    axios.get('http://localhost:5000/api/weak-areas'),
                    axios.get('http://localhost:5000/api/quiz-history'),
                    axios.get('http://localhost:5000/api/study-progress'),
                    axios.get('http://localhost:5000/api/oral-history')
                ]);
                setWeakAreas(weakAreasResp.data.weak_areas || []);
                setQuizHistory(historyResp.data || { labels: [], scores: [] });
                setStudyProgress(progressResp.data.progress || [0, 0, 0, 0, 0, 0, 0]);
                setStudyLogs(progressResp.data.logs || []);
                setOralHistory(oralResp.data.history || []);
            } catch (e) {
                console.error("Failed to load analytics data:", e);
                setWeakAreas([]);
                setQuizHistory({ labels: [], scores: [] });
                setStudyProgress([0, 0, 0, 0, 0, 0, 0]);
                setStudyLogs([]);
                setOralHistory([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalyticsData();
    }, []);

    const hasQuizData = quizHistory.scores && quizHistory.scores.length > 0;
    const hasWeakAreasData = weakAreas.length > 0;
    const hasStudyData = studyProgress.some(h => h > 0) || studyLogs.length > 0;
    const hasOralData = oralHistory.length > 0;
    const hasAnyData = hasQuizData || hasWeakAreasData || hasStudyData || hasOralData;

    const topics = weakAreas.map(a => a.topic);
    const scores = weakAreas.map(a => a.score);

    const weakCount = weakAreas.filter(a => a.is_weak).length;
    const strongCount = weakAreas.length - weakCount;

    // ── Quiz Score History (Real Database Data) ─────────────────────
    const quizScoreData = hasQuizData ? {
        labels: quizHistory.labels,
        datasets: [{
            label: 'Quiz Scores (%)',
            data: quizHistory.scores,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79,70,229,0.15)',
            fill: true,
            tension: 0.4
        }]
    } : null;

    // ── Concepts Mastered (Real Database Data) ──────────────────────
    const conceptsMasteredData = hasWeakAreasData ? {
        labels: topics,
        datasets: [{
            label: 'Concept Mastery (%)',
            data: scores,
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            borderColor: '#10b981',
            borderWidth: 1
        }]
    } : null;

    // ── Weekly Study Progress (Real Database Data based on Planner) ─────
    const weeklyStudyProgressData = hasStudyData ? {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Study Hours',
            data: studyProgress,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.15)',
            fill: true,
            tension: 0.4
        }]
    } : null;

    // ── Weak vs Strong Doughnut (Real Database Data) ───────────────────
    const doughnutData = hasWeakAreasData ? {
        labels: ['Weak Areas', 'Strong Areas'],
        datasets: [{
            data: [weakCount, strongCount],
            backgroundColor: ['rgba(239,68,68,0.7)', 'rgba(16,185,129,0.7)'],
            borderColor: ['#ef4444', '#10b981'],
            borderWidth: 1
        }]
    } : null;

    const baseOptions = {
        responsive: true,
        plugins: {
            legend: { labels: { color: 'white' } }
        },
        scales: {
            y: {
                ticks: { color: 'rgba(255,255,255,0.7)' },
                grid: { color: 'rgba(255,255,255,0.05)' }
            },
            x: {
                ticks: { color: 'rgba(255,255,255,0.7)' },
                grid: { color: 'rgba(255,255,255,0.05)' }
            }
        }
    };

    return (
        <div style={{ padding: '3rem 4rem', maxWidth: '1400px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                Performance Analytics
            </h2>

            <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>
                {loading
                    ? 'Loading your performance data...'
                    : hasWeakAreasData
                        ? `${weakCount} weak area${weakCount !== 1 ? 's' : ''} detected across ${weakAreas.length} topics`
                        : 'Submit quizzes and complete planner tasks to visualize your learning trajectory.'}
            </p>

            <div className="dashboard-grid">

                {/* Empty State if absolutely no data exists */}
                {!loading && !hasAnyData && (
                    <div className="glass-card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '5rem 3rem' }}>
                        <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>No Analytics Records Yet</h3>
                        <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
                            Upload your course slides on the dashboard, complete the diagnostic assessment, and mark items off your checklist to view your progress analytics.
                        </p>
                    </div>
                )}

                {/* Quiz Score History Card */}
                {!loading && hasAnyData && (
                    <div className="glass-card" style={{ gridColumn: 'span 2' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontWeight: '700' }}>Overall Quiz Score Trend</h3>
                        {quizScoreData ? (
                            <Line data={quizScoreData} options={baseOptions} />
                        ) : (
                            <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
                                <p style={{ color: 'var(--text-muted)' }}>No quiz records yet. Complete assessments to track score progression.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Concepts Mastered Card */}
                {!loading && hasAnyData && (
                    <div className="glass-card">
                        <h3 style={{ marginBottom: '1.5rem', fontWeight: '700' }}>Concepts Mastered</h3>
                        {conceptsMasteredData ? (
                            <Bar data={conceptsMasteredData} options={baseOptions} />
                        ) : (
                            <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
                                <p style={{ color: 'var(--text-muted)' }}>Concepts list will appear once your PDF is analyzed and quizzes are scored.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Weekly Progress Card */}
                {!loading && hasAnyData && (
                    <div className="glass-card" style={{ gridColumn: 'span 2' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontWeight: '700' }}>Weekly Study Hours</h3>
                        {weeklyStudyProgressData ? (
                            <Line data={weeklyStudyProgressData} options={baseOptions} />
                        ) : (
                            <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
                                <p style={{ color: 'var(--text-muted)' }}>No study hours logged. Check off planner tasks in your calendar checklist to register study time.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Doughnut Card */}
                {!loading && hasAnyData && (
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h3 style={{ marginBottom: '2rem', fontWeight: '700', alignSelf: 'flex-start' }}>Weak vs Strong Areas</h3>
                        {doughnutData ? (
                            <div style={{ maxWidth: '240px', width: '100%', margin: '0 auto' }}>
                                <Doughnut data={doughnutData} options={baseOptions} />
                            </div>
                        ) : (
                            <div style={{ width: '100%', padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
                                <p style={{ color: 'var(--text-muted)' }}>Requires diagnostic quiz completion to classify weak/strong topics.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Detailed Study Duration Logs Card */}
                {!loading && hasAnyData && (
                    <div className="glass-card" style={{ gridColumn: 'span 3', marginTop: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontWeight: '700' }}>Detailed Study Logs</h3>
                        {studyLogs.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            <th style={{ padding: '12px 16px' }}>Topic / Activity</th>
                                            <th style={{ padding: '12px 16px' }}>Category</th>
                                            <th style={{ padding: '12px 16px' }}>Date</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Time Spent</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studyLogs.map((log, idx) => {
                                            const totalMinutes = Math.round(log.hours * 60);
                                            let durationStr = '';
                                            if (totalMinutes < 60) {
                                                durationStr = `${totalMinutes} min${totalMinutes !== 1 ? 's' : ''}`;
                                            } else {
                                                const hrs = Math.floor(totalMinutes / 60);
                                                const mins = totalMinutes % 60;
                                                durationStr = mins > 0 ? `${hrs}h ${mins}m` : `${hrs} hr${hrs !== 1 ? 's' : ''}`;
                                            }

                                            return (
                                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)', fontSize: '0.95rem' }}>
                                                    <td style={{ padding: '16px', fontWeight: '600', color: '#fff' }}>{log.topic}</td>
                                                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                                                        <span style={{ 
                                                            fontSize: '0.75rem', 
                                                            background: log.type === 'task' ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)', 
                                                            color: log.type === 'task' ? '#a5b4fc' : '#34d399', 
                                                            padding: '2px 8px', 
                                                            borderRadius: '8px',
                                                            fontWeight: '600',
                                                            border: log.type === 'task' ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(16,185,129,0.2)'
                                                        }}>
                                                            {log.type === 'task' ? 'Plan Checklist' : 'Stopwatch Log'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{log.date}</td>
                                                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: '#818cf8' }}>{durationStr}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
                                <p style={{ color: 'var(--text-muted)' }}>No study logs recorded yet. Start a study session timer on your Planner to register study logs.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* AI Oral Viva Performance History Card */}
                {!loading && hasAnyData && (
                    <div className="glass-card" style={{ gridColumn: 'span 3', marginTop: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🎤 AI Oral Viva History
                        </h3>
                        {oralHistory.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            <th style={{ padding: '12px 16px' }}>Topic Concept</th>
                                            <th style={{ padding: '12px 16px' }}>Oral Score</th>
                                            <th style={{ padding: '12px 16px' }}>Mastery Grade</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Date Practiced</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {oralHistory.map((viva, idx) => {
                                            let badgeColor = '#ef4444';
                                            let badgeBg = 'rgba(239,68,68,0.12)';
                                            let badgeBorder = '1px solid rgba(239,68,68,0.2)';
                                            
                                            if (viva.grade === "Mastered") {
                                                badgeColor = '#10b981';
                                                badgeBg = 'rgba(16,185,129,0.12)';
                                                badgeBorder = '1px solid rgba(16,185,129,0.2)';
                                            } else if (viva.grade === "Partial Match") {
                                                badgeColor = '#fbbf24';
                                                badgeBg = 'rgba(251,191,36,0.12)';
                                                badgeBorder = '1px solid rgba(251,191,36,0.2)';
                                            }

                                            return (
                                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)', fontSize: '0.95rem' }}>
                                                    <td style={{ padding: '16px', fontWeight: '600', color: '#fff' }}>{viva.topic}</td>
                                                    <td style={{ padding: '16px', color: '#818cf8', fontWeight: '700' }}>{viva.score}%</td>
                                                    <td style={{ padding: '16px' }}>
                                                        <span style={{ 
                                                            fontSize: '0.75rem', 
                                                            background: badgeBg, 
                                                            color: badgeColor, 
                                                            padding: '2px 8px', 
                                                            borderRadius: '8px',
                                                            fontWeight: '700',
                                                            border: badgeBorder
                                                        }}>
                                                            {viva.grade}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)' }}>{viva.date}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
                                <p style={{ color: 'var(--text-muted)' }}>No oral viva tests recorded yet. Go to the Oral Test page to practice conceptual speaking tests!</p>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default Analytics;
