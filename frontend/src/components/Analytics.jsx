import React from 'react';
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
    RadialLinearScale
} from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';

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
    RadialLinearScale
);

const Analytics = () => {
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

    const radarData = {
        labels: ['Memory', 'Logic', 'Consistency', 'Speed', 'Accuracy'],
        datasets: [{
            label: 'Skill Proficiency',
            data: [85, 70, 90, 65, 80],
            backgroundColor: 'rgba(236, 72, 153, 0.2)',
            borderColor: '#ec4899',
            pointBackgroundColor: '#ec4899'
        }]
    };

    const options = {
        scales: {
            y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
            r: {
                grid: { color: 'rgba(255,255,255,0.1)' },
                angleLines: { color: 'rgba(255,255,255,0.1)' },
                pointLabels: { color: '#94a3b8' }
            }
        },
        plugins: {
            legend: { labels: { color: 'white' } }
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '2rem' }}>Performance Analytics 📊</h2>

            <div className="dashboard-grid">
                <div className="glass-card">
                    <h3>Learning Curve</h3>
                    <Line data={lineData} options={options} />
                </div>
                <div className="glass-card">
                    <h3>Capability Radar</h3>
                    <Radar data={radarData} options={options} />
                </div>
            </div>
        </div>
    );
};

export default Analytics;
