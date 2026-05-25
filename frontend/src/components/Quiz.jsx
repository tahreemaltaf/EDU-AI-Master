import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Quiz = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [showScore, setShowScore] = useState(false);
    const [score, setScore] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const questions = [
        {
            question: "What is the primary purpose of a Loss Function in Machine Learning?",
            answer: "To measure how well the model's predictions match the target values.",
            options: ["To increase speed", "To measure accuracy gap", "To delete data", "To visualize neurons"]
        },
        {
            question: "Which optimizer is commonly used in Deep Learning?",
            answer: "Adam",
            options: ["SGD", "Adam", "RMSProp", "All of the above"]
        }
    ];

    const handleAnswer = (option) => {
        if (option === questions[currentQuestion].answer) {
            setScore(score + 1);
        }
        const next = currentQuestion + 1;
        if (next < questions.length) {
            setCurrentQuestion(next);
        } else {
            setShowScore(true);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Knowledge Check 🧠</h2>

            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                {/* Flashcard Section */}
                <div
                    className="glass-card"
                    onClick={() => setIsFlipped(!isFlipped)}
                    style={{
                        flex: 1,
                        height: '300px',
                        cursor: 'pointer',
                        perspective: '1000px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        transition: 'transform 0.6s',
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)'
                    }}
                >
                    <div style={{ backfaceVisibility: 'hidden', position: 'absolute' }}>
                        <h3>Question</h3>
                        <p>{questions[currentQuestion].question}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>(Click to reveal answer)</p>
                    </div>
                    <div style={{ backfaceVisibility: 'hidden', position: 'absolute', transform: 'rotateY(180deg)', padding: '20px' }}>
                        <h3>Answer</h3>
                        <p>{questions[currentQuestion].answer}</p>
                    </div>
                </div>

                {/* MCQ Section */}
                <div className="glass-card" style={{ flex: 1 }}>
                    <h3>Multiple Choice</h3>
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {questions[currentQuestion].options.map(opt => (
                            <button
                                key={opt}
                                onClick={() => handleAnswer(opt)}
                                style={{
                                    padding: '10px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                }}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {showScore && (
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <h2>Final Score: {score}/{questions.length}</h2>
                    <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => window.location.reload()}>Retry</button>
                </div>
            )}
        </div>
    );
};

export default Quiz;
