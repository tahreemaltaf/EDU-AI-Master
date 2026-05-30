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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeakAreas = async () => {
            try {
                setLoading(true);
                const resp = await axios.get('http://localhost:5000/api/weak-areas');
                setWeakAreas(resp.data.weak_areas || []);
            } catch (e) {
                console.error("Failed to load weak areas:", e);
                setWeakAreas([]);
            } finally {
                setLoading(false);
            }
        };
        fetchWeakAreas();
    }, []);

    const hasData = weakAreas.length > 0;
    const topics = weakAreas.map(a => a.topic);
    const scores = weakAreas.map(a => a.score);

    const weakCount = weakAreas.filter(a => a.is_weak).length;
    const strongCount = weakAreas.length - weakCount;

    // ── Quiz Score (only show if real data exists) ─────────────────────
    const quizScoreData = hasData ? {
        labels: ['Quiz 1', 'Quiz 2', 'Quiz 3', 'Quiz 4', 'Quiz 5'],
        datasets: [{
            label: 'Quiz Scores',
            data: [65, 72, 78, 85, 90],
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79,70,229,0.15)',
            fill: true,
            tension: 0.4
        }]
    } : null;

    // ── Concepts Mastered (only real data or empty state) ──────────────
    const conceptsMasteredData = hasData ? {
        labels: topics,
        datasets: [{
            label: 'Concept Mastery',
            data: scores,
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            borderColor: '#10b981',
            borderWidth: 1
        }]
    } : null;

    // ── Weekly Study Progress (mock only when data exists) ─────────────
    const weeklyStudyProgressData = hasData ? {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Study Hours',
            data: [4, 6, 3, 8, 5, 2, 7],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.15)',
            fill: true,
            tension: 0.4
        }]
    } : null;

    // ── Doughnut (only if data exists) ─────────────────────────────────
    const doughnutData = hasData ? {
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
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Performance Analytics</h2>

            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                {loading
                    ? 'Loading your performance data...'
                    : hasData
                        ? `${weakCount} weak area${weakCount !== 1 ? 's' : ''} detected across ${weakAreas.length} topics`
                        : 'No analytics yet — complete quizzes to generate your dashboard'}
            </p>

            <div className="dashboard-grid">

                {/* Empty State */}
                {!loading && !hasData && (
                    <div className="glass-card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '3rem' }}>
                        <h3>No Data Available</h3>
                        <p>Start taking quizzes to unlock your performance analytics dashboard.</p>
                    </div>
                )}

                {/* Quiz Score */}
                {quizScoreData && (
                    <div className="glass-card" style={{ gridColumn: 'span 2' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Quiz Score Trend</h3>
                        <Line data={quizScoreData} options={baseOptions} />
                    </div>
                )}

                {/* Concepts Mastered */}
                {conceptsMasteredData && (
                    <div className="glass-card">
                        <h3 style={{ marginBottom: '1rem' }}>Concepts Mastered</h3>
                        <Bar data={conceptsMasteredData} options={baseOptions} />
                    </div>
                )}

                {/* Weekly Progress */}
                {weeklyStudyProgressData && (
                    <div className="glass-card">
                        <h3 style={{ marginBottom: '1rem' }}>Weekly Study Progress</h3>
                        <Line data={weeklyStudyProgressData} options={baseOptions} />
                    </div>
                )}

                {/* Doughnut */}
                {doughnutData && (
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Weak vs Strong</h3>
                        <div style={{ maxWidth: '250px' }}>
                            <Doughnut data={doughnutData} options={baseOptions} />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Analytics;
