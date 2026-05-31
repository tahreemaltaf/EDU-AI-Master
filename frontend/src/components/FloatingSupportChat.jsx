import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

const FloatingSupportChat = () => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            sender: 'bot',
            text: '👋 Hi! Welcome to EduAI Master. How can I help you today?'
        }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;

        const userMessage = {
            sender: 'user',
            text: input
        };

        setMessages(prev => [...prev, userMessage]);

        let reply =
            "I'm EduAI Support. Ask me about quizzes, flashcards, study plans, or PDF uploads.";

        if (input.toLowerCase().includes('quiz')) {
            reply = 'Navigate to Dashboard and upload a PDF to generate AI quizzes.';
        }

        if (input.toLowerCase().includes('flashcard')) {
            reply = 'Open Flashcards from the navbar to review your study material.';
        }

        if (input.toLowerCase().includes('planner')) {
            reply = 'The Study Planner creates personalized schedules based on your learning progress.';
        }

        if (input.toLowerCase().includes('upload')) {
            reply = 'Go to Dashboard and upload your PDF notes to get started.';
        }

        setTimeout(() => {
            setMessages(prev => [
                ...prev,
                {
                    sender: 'bot',
                    text: reply
                }
            ]);
        }, 500);

        setInput('');
    };

    return (
        <>
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    style={{
                        position: 'fixed',
                        right: '25px',
                        bottom: '25px',
                
                        width: '65px',
                        height: '65px',
                        borderRadius: '50%',
                        border: 'none',
                        background:
                            'linear-gradient(135deg,#06b6d4,#3b82f6)',
                        color: 'white',
                        cursor: 'pointer',
                        zIndex: 9999,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                    }}
                >
                    <MessageCircle size={28} />
                </button>
            )}

            {open && (
                <div
                    style={{
                        position: 'fixed',
                        right: '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '360px',
                        height: '520px',
                        background: '#0f172a',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        overflow: 'hidden',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            background:
                                'linear-gradient(135deg,#06b6d4,#3b82f6)',
                            padding: '15px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <span
                            style={{
                                fontWeight: '700',
                                color: 'white'
                            }}
                        >
                            EduAI Support
                        </span>

                        <button
                            onClick={() => setOpen(false)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '15px'
                        }}
                    >
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                style={{
                                    textAlign:
                                        msg.sender === 'user'
                                            ? 'right'
                                            : 'left',
                                    marginBottom: '12px'
                                }}
                            >
                                <span
                                    style={{
                                        display: 'inline-block',
                                        padding: '10px 14px',
                                        borderRadius: '12px',
                                        background:
                                            msg.sender === 'user'
                                                ? '#2563eb'
                                                : '#1e293b',
                                        color: 'white',
                                        maxWidth: '80%'
                                    }}
                                >
                                    {msg.text}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div
                        style={{
                            display: 'flex',
                            padding: '12px',
                            borderTop:
                                '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <input
                            value={input}
                            onChange={(e) =>
                                setInput(e.target.value)
                            }
                            onKeyDown={(e) =>
                                e.key === 'Enter' && handleSend()
                            }
                            placeholder="Ask for help..."
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '10px',
                                border: 'none',
                                outline: 'none'
                            }}
                        />

                        <button
                            onClick={handleSend}
                            style={{
                                marginLeft: '8px',
                                border: 'none',
                                padding: '10px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                background:
                                    'linear-gradient(135deg,#06b6d4,#3b82f6)',
                                color: 'white'
                            }}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default FloatingSupportChat;