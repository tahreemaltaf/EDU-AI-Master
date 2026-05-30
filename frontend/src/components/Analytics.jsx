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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                setLoading(true);
                const [weakAreasResp, historyResp, progressResp] = await Promise.all([
                    axios.get('http://localhost:5000/api/weak-areas'),
                    axios.get('http://localhost:5000/api/quiz-history'),
                    axios.get('http://localhost:5000/api/study-progress')
                ]);
                setWeakAreas(weakAreasResp.data.weak_areas || []);
                setQuizHistory(historyResp.data || { labels: [], scores: [] });
                setStudyProgress(progressResp.data.progress || [0, 0, 0, 0, 0, 0, 0]);
            } catch (e) {
                console.error("Failed to load analytics data:", e);
                setWeakAreas([]);
                setQuizHistory({ labels: [], scores: [] });
                setStudyProgress([0, 0, 0, 0, 0, 0, 0]);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalyticsData();
    }, []);

    const hasQuizData = quizHistory.scores && quizHistory.scores.length > 0;
    const hasWeakAreasData = weakAreas.length > 0;
    const hasStudyData = studyProgress.some(h => h > 0);
    const hasAnyData = hasQuizData || hasWeakAreasData || hasStudyData;

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

            </div>
        </div>
    );
};

export default Analytics;
