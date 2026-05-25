import React, { useState } from 'react';
import { Upload, CheckCircle, TrendingUp, Clock } from 'lucide-react';

const Dashboard = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleUpload = () => {
        if (!file) return;
        setUploading(true);
        // Mock upload delay
        setTimeout(() => {
            setUploading(false);
            alert("PDF Processed! Concepts extracted.");
        }, 2000);
    };

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Welcome Back! 🚀</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={20} color="#10b981" /> 7 Day Streak
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="glass-card" style={{ gridColumn: 'span 2', textAlign: 'center' }}>
                    <Upload size={48} style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
                    <h3>Upload New Study Material</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Drop your PDF slides or lecture notes here</p>
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setFile(e.target.files[0])}
                        style={{ marginBottom: '1rem' }}
                    />
                    <br />
                    <button className="btn-primary" onClick={handleUpload} disabled={uploading}>
                        {uploading ? "Processing AI Analysis..." : "Start Learning"}
                    </button>
                </div>

                <div className="glass-card">
                    <h3>Recent Topics</h3>
                    <ul style={{ listStyle: 'none', marginTop: '1rem' }}>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Neural Networks</span>
                            <span style={{ color: '#10b981' }}>85% Done</span>
                        </li>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Backpropagation</span>
                            <span style={{ color: '#f59e0b' }}>40% Done</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
