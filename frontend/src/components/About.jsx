import React from 'react';

const About = () => {
    return (
        <div style={{ padding: '4rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>About EduAI Master</h1>
            <div className="glass-card">
                <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                    EduAI Master was born from a simple mission: to empower students with the same level of intelligence used by top-tier researchers and data scientists.
                </p>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                    By integrating state-of-the-art NLP models like T5 and implementing time-tested cognitive science principles like Spaced Repetition, we've created a platform that doesn't just store information—it ensures you master it.
                </p>
                <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Our Core Principles:</h3>
                <ul>
                    <li style={{ marginBottom: '1rem' }}><strong>Efficiency:</strong> Stop wasting time on what you already know.</li>
                    <li style={{ marginBottom: '1rem' }}><strong>Personalization:</strong> Your brain is unique; your study plan should be too.</li>
                    <li style={{ marginBottom: '1rem' }}><strong>Visual Logic:</strong> Understanding progress through data, not guesswork.</li>
                </ul>
            </div>
        </div>
    );
};

export default About;
