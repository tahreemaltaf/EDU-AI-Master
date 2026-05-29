import React, { useState } from 'react';
import { Upload, TrendingUp, Calendar, BrainCircuit, BookOpen, Layers, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [concepts, setConcepts] = useState([]);
    const [studyPlan, setStudyPlan] = useState([]);
    const [stats, setStats] = useState(null);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:5000/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setConcepts(response.data.concepts);
            setStudyPlan(response.data.study_plan);
            setStats({
                flashcards: response.data.num_flashcards,
                questions: response.data.num_quiz_questions
            });
            localStorage.setItem('studyContext', response.data.text_preview || "");
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed. Make sure the backend server is running.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ padding: '3rem 4rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                        Welcome back, <span className="text-gradient">Student</span>
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Your AI-powered study pipeline is ready.</p>
                </div>
                <div style={{ padding: '12px 24px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <TrendingUp size={20} color="#10b981" />
                    <span style={{ fontWeight: '600', color: '#10b981' }}>7 Day Streak</span>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Upload Section */}
                <div className="glass-card" style={{ gridColumn: 'span 2', padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '80px', background: 'var(--primary-glow)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                        <Upload size={40} color="white" />
                    </div>
                    <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Transform your course material</h3>
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: '500px', marginBottom: '3rem', fontSize: '1rem' }}>
                        Upload your PDF notes or slides. AI will extract concepts, generate quizzes, and build your adaptive study plan instantly.
                    </p>

                    <div style={{ width: '100%', maxWidth: '400px', padding: '32px', border: '2px dashed var(--glass-border)', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', textAlign: 'center', marginBottom: '2rem' }}>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setFile(e.target.files[0])}
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                            <FileText size={48} color={file ? "var(--primary)" : "var(--text-muted)"} style={{ marginBottom: '1rem' }} />
                            <p style={{ color: file ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: '500' }}>
                                {file ? file.name : "Drag & drop or browse PDF"}
                            </p>
                        </label>
                    </div>

                    <button
                        className="btn-primary"
                        onClick={handleUpload}
                        disabled={uploading || !file}
                        style={{ padding: '16px 48px', fontSize: '1.1rem' }}
                    >
                        {uploading ? (
                            <>Analysing with AI...</>
                        ) : (
                            <>Start AI Analysis <ChevronRight size={20} /></>
                        )}
                    </button>
                </div>

                {/* Pipeline Stats */}
                {stats && (
                    <div className="glass-card" style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-around', padding: '2rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <BrainCircuit size={32} color="var(--primary)" />
                            <h3 style={{ fontSize: '1.5rem', marginTop: '0.75rem' }}>{concepts.length}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Concepts</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <BookOpen size={32} color="#10b981" />
                            <h3 style={{ fontSize: '1.5rem', marginTop: '0.75rem' }}>{stats.questions}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Questions</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <Layers size={32} color="var(--accent)" />
                            <h3 style={{ fontSize: '1.5rem', marginTop: '0.75rem' }}>{stats.flashcards}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Flashcards</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <Calendar size={32} color="var(--secondary)" />
                            <h3 style={{ fontSize: '1.5rem', marginTop: '0.75rem' }}>{studyPlan.length}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Days Planned</p>
                        </div>
                    </div>
                )}

                {/* Concepts List */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '10px', background: 'var(--primary-glow)', borderRadius: '12px' }}>
                            <BrainCircuit size={24} color="white" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem' }}>Key Insights</h3>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                        {concepts.length > 0 ? concepts.map((concept, idx) => (
                            <div key={idx} style={{ padding: '1.25rem', borderBottom: idx === concepts.length - 1 ? 'none' : '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '500' }}>{concept}</span>
                                <CheckCircle2 size={18} color="var(--primary)" />
                            </div>
                        )) : (
                            <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>AI extraction list will appear here after upload.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '10px', background: 'var(--primary-glow)', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)' }}>
                            <Zap size={24} color="var(--accent)" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem' }}>Action Center</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {concepts.length > 0 ? (
                            <>
                                <Link to="/quiz" className="btn-primary" style={{ justifyContent: 'center' }}>
                                    Launch Diagnostic Quiz
                                </Link>
                                <Link to="/flashcards" className="btn-primary" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', boxShadow: 'none' }}>
                                    Review Flashcards
                                </Link>
                                <Link to="/planner" className="btn-primary" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', boxShadow: 'none' }}>
                                    Open Study Planner
                                </Link>
                            </>
                        ) : (
                            <div style={{ padding: '3rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Unlock interactive tools by uploading your PDF first.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
