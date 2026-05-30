import React from 'react';

const About = () => {
    return (
        <div style={{ padding: '4rem 2rem', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>About EduAI Master</h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                    Intelligent learning powered by AI, cognitive science, and adaptive analytics
                </p>
            </div>

            {/* Main Card */}
            <div className="glass-card" style={{ padding: '2rem' }}>

                {/* Intro */}
                <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                    EduAI Master was designed to redefine how students learn by combining artificial intelligence with proven cognitive science techniques.
                    Instead of passive studying, we focus on active mastery through adaptive learning paths.
                </p>

                <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '2rem' }}>
                    Using advanced NLP models like T5 and principles such as spaced repetition and recall optimization,
                    the platform ensures that knowledge is not just consumed—but retained and applied effectively.
                </p>

                {/* Divider */}
                <hr style={{ margin: '2rem 0', opacity: 0.2 }} />

                {/* Core Principles */}
                <h3 style={{ marginBottom: '1rem' }}>Our Core Principles</h3>

                <div style={{ display: 'grid', gap: '1.2rem' }}>
                    <div>
                        <strong>⚡ Efficiency</strong>
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                            Focus only on what you haven't mastered yet, eliminating wasted study time.
                        </p>
                    </div>

                    <div>
                        <strong>🎯 Personalization</strong>
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                            Adaptive learning paths tailored to your strengths, weaknesses, and pace.
                        </p>
                    </div>

                    <div>
                        <strong>📊 Data-Driven Learning</strong>
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                            Visualize progress with analytics instead of guessing your performance.
                        </p>
                    </div>
                </div>

                {/* Footer CTA */}
                <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                        Built for students, researchers, and lifelong learners.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default About;
