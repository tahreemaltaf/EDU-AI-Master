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
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';
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

    useEffect(() => {
        const fetchWeakAreas = async () => {
            try {
                const resp = await axios.get('http://localhost:5000/api/weak-areas');
                setWeakAreas(resp.data.weak_areas || []);
            } catch (e) {
                console.error("Failed to load weak areas:", e);
            }
        };
        fetchWeakAreas();
    }, []);

    const topics = weakAreas.map(a => a.topic);
    const scores = weakAreas.map(a => a.score);
    const weakCount = weakAreas.filter(a => a.is_weak).length;
    const strongCount = weakAreas.length - weakCount;

    // ── Per-topic bar chart ─────────────────────────────────────────────
    const barData = {
        labels: topics,
        datasets: [{
            label: 'Score (%)',
            data: scores,
            backgroundColor: scores.map(s => s < 60 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)'),
            borderColor: scores.map(s => s < 60 ? '#ef4444' : '#10b981'),
            borderWidth: 1,
            borderRadius: 6
        }]
    };

    // ── Weak vs Strong doughnut ─────────────────────────────────────────
    const doughnutData = {
        labels: ['Weak Areas', 'Strong Areas'],
        datasets: [{
            data: [weakCount, strongCount],
            backgroundColor: ['rgba(239,68,68,0.7)', 'rgba(16,185,129,0.7)'],
            borderColor: ['#ef4444', '#10b981'],
            borderWidth: 1
        }]
    };

    // ── Study hours line (sample data) ──────────────────────────────────
    const lineData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Study Hours',
            data: [4, 6, 3, 8, 5, 2, 7],
            borderColor: '#6366f1',
            tension: 0.4,
            fill: true,
            backgroundColor: 'rgba(99, 102, 241, 0.1)'
        }]
    };

    // ── Skill radar ─────────────────────────────────────────────────────
    const radarData = {
        labels: topics.length > 0 ? topics : ['Memory', 'Logic', 'Consistency', 'Speed', 'Accuracy'],
        datasets: [{
            label: 'Topic Mastery',
            data: scores.length > 0 ? scores : [85, 70, 90, 65, 80],
            backgroundColor: 'rgba(236, 72, 153, 0.2)',
            borderColor: '#ec4899',
            pointBackgroundColor: '#ec4899'
        }]
    };

    const chartOptions = {
        responsive: true,
        scales: {
            y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        },
        plugins: { legend: { labels: { color: 'white' } } }
    };

    const radarOptions = {
        responsive: true,
        scales: {
            r: {
                grid: { color: 'rgba(255,255,255,0.1)' },
                angleLines: { color: 'rgba(255,255,255,0.1)' },
                pointLabels: { color: '#94a3b8' },
                suggestedMin: 0,
                suggestedMax: 100
            }
        },
        plugins: { legend: { labels: { color: 'white' } } }
    };

    const doughnutOptions = {
        responsive: true,
        plugins: { legend: { labels: { color: 'white' } } }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Performance Analytics</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                {weakAreas.length > 0
                    ? `${weakCount} weak area${weakCount !== 1 ? 's' : ''} detected across ${weakAreas.length} topics`
                    : 'Take the diagnostic quiz to see your topic-level performance breakdown'}
            </p>

            <div className="dashboard-grid">
                {/* Topic Scores */}
                {weakAreas.length > 0 && (
                    <div className="glass-card" style={{ gridColumn: 'span 2' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Topic Score Breakdown</h3>
                        <Bar data={barData} options={chartOptions} />
                    </div>
                )}

                {/* Weak vs Strong */}
                {weakAreas.length > 0 && (
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Weak vs Strong</h3>
                        <div style={{ maxWidth: '250px' }}>
                            <Doughnut data={doughnutData} options={doughnutOptions} />
                        </div>
                    </div>
                )}

                {/* Topic Radar */}
                <div className="glass-card">
                    <h3 style={{ marginBottom: '1rem' }}>Topic Mastery Radar</h3>
                    <Radar data={radarData} options={radarOptions} />
                </div>

                {/* Study Hours */}
                <div className="glass-card">
                    <h3 style={{ marginBottom: '1rem' }}>Weekly Study Hours</h3>
                    <Line data={lineData} options={chartOptions} />
                </div>
            </div>
        </div>
    );
};

export default Analytics;
