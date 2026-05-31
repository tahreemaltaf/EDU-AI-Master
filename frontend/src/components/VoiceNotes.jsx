import React, { useState, useEffect, useRef } from 'react';
import { 
    Mic, 
    MicOff, 
    Sparkles, 
    Layers, 
    Trash2, 
    Loader2, 
    CheckCircle2, 
    AlertCircle,
    Volume2,
    BookOpen,
    HelpCircle,
    Award,
    TrendingUp,
    RotateCcw
} from 'lucide-react';
import axios from 'axios';

const VoiceNotes = () => {
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState('');
    const [activeQuestion, setActiveQuestion] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [loadingQuestion, setLoadingQuestion] = useState(false);
    const [loadingEvaluation, setLoadingEvaluation] = useState(false);
    
    // Evaluation Results
    const [evaluationResult, setEvaluationResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const recognitionRef = useRef(null);

    // Fetch topics from study planner
    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const resp = await axios.get('http://localhost:5000/api/study-plan');
                const plan = resp.data?.study_plan || [];
                const planTopics = plan.map(item => item.topic);
                // Remove duplicates
                const uniqueTopics = [...new Set(planTopics)];
                setTopics(uniqueTopics);
                if (uniqueTopics.length > 0) {
                    setSelectedTopic(uniqueTopics[0]);
                } else {
                    // Fallback topics
                    const fallbacks = ["Linear Regression", "Spaced Repetition", "Machine Learning", "Neural Networks", "NLP Engine"];
                    setTopics(fallbacks);
                    setSelectedTopic(fallbacks[0]);
                }
            } catch (e) {
                console.error("Failed to fetch topics:", e);
                const fallbacks = ["Linear Regression", "Spaced Repetition", "Machine Learning", "Neural Networks", "NLP Engine"];
                setTopics(fallbacks);
                setSelectedTopic(fallbacks[0]);
            }
        };
        fetchTopics();
    }, []);

    // Speech recognition setup
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setErrorMsg("Speech Recognition is not supported by your browser. Try using Google Chrome, MS Edge, or Apple Safari.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                }
            }
            if (finalTranscript) {
                setTranscript(prev => prev + finalTranscript);
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            if (event.error === 'not-allowed') {
                setErrorMsg("Microphone permission denied. Please allow microphone access in your browser settings.");
                setIsRecording(false);
            }
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognitionRef.current = recognition;
    }, []);

    const fetchQuestion = async () => {
        if (!selectedTopic) return;
        setLoadingQuestion(true);
        setErrorMsg('');
        setSuccessMsg('');
        setTranscript('');
        setEvaluationResult(null);
        setActiveQuestion('');

        try {
            const resp = await axios.post('http://localhost:5000/api/oral-question', {
                topic: selectedTopic
            });
            setActiveQuestion(resp.data.question || 'Explain what you know about this topic.');
        } catch (e) {
            console.error(e);
            setErrorMsg("Failed to generate question from backend. Using default.");
            setActiveQuestion(`Explain the key features, principles, and applications of ${selectedTopic}.`);
        } finally {
            setLoadingQuestion(false);
        }
    };

    // Text-to-Speech: Read question out loud
    const speakQuestion = () => {
        if (!activeQuestion) return;
        if ('speechSynthesis' in window) {
            // Cancel active speakers
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(activeQuestion);
            utterance.rate = 0.95; // Slightly slower for clarity
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Text-to-speech is not supported in your browser.");
        }
    };

    const toggleRecording = () => {
        if (errorMsg && !recognitionRef.current) return;
        setErrorMsg('');

        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Start recording failed:", err);
                setErrorMsg("Could not access microphone. Check permissions.");
            }
        }
    };

    const submitViva = async () => {
        if (!transcript.trim()) {
            setErrorMsg("Please record your spoken answer first before submitting!");
            return;
        }

        setLoadingEvaluation(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            const resp = await axios.post('http://localhost:5000/api/oral-evaluate', {
                topic: selectedTopic,
                question: activeQuestion,
                user_answer: transcript
            });
            setEvaluationResult(resp.data);
            setSuccessMsg("Oral Viva evaluated! Check your score and feedback below.");
        } catch (e) {
            console.error(e);
            setErrorMsg("Failed to grade the answer. Make sure the backend server is running.");
        } finally {
            setLoadingEvaluation(false);
        }
    };

    const handleReset = () => {
        setTranscript('');
        setEvaluationResult(null);
        setErrorMsg('');
        setSuccessMsg('');
        fetchQuestion();
    };

    // Determine colors based on evaluation grade
    const getGradeStyles = (grade) => {
        if (grade === "Mastered") {
            return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' };
        }
        if (grade === "Partial Match") {
            return { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.3)' };
        }
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' };
    };

    return (
        <div style={{ padding: '3rem 2rem', maxWidth: '1000px', margin: '0 auto' }} className="animate-fade-in">
            
            {/* Header section */}
            <header style={{ marginBottom: '3rem' }}>
                <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Oral Exam Practice</span>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginTop: '0.25rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                    AI Oral Viva Practice
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Practice for your oral exams. Select a study topic, listen to the AI's question, speak your answer, and receive dynamic grading and keyword corrections.
                </p>
            </header>

            {/* Error and Success Banners */}
            {errorMsg && (
                <div style={{
                    padding: '12px 18px',
                    borderRadius: '12px',
                    marginBottom: '2rem',
                    fontSize: '0.9rem',
                    fontWeight: '550',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#ef4444'
                }}>
                    <AlertCircle size={18} />
                    <span>{errorMsg}</span>
                </div>
            )}

            {successMsg && (
                <div style={{
                    padding: '12px 18px',
                    borderRadius: '12px',
                    marginBottom: '2rem',
                    fontSize: '0.9rem',
                    fontWeight: '550',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    color: '#10b981'
                }}>
                    <CheckCircle2 size={18} />
                    <span>{successMsg}</span>
                </div>
            )}

            {/* Main Interactive Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px', alignItems: 'start' }}>
                
                {/* LEFT SIDE: TOPIC SELECT & VIVA QUESTION */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Topic Selector Card */}
                    <div className="glass-card" style={{ padding: '2rem', border: '1px solid var(--glass-border)' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BookOpen size={18} color="var(--primary)" /> Select Viva Concept
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <select
                                value={selectedTopic}
                                onChange={(e) => setSelectedTopic(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--glass-border)',
                                    color: '#fff',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {topics.map((t, idx) => (
                                    <option key={idx} value={t} style={{ background: '#0f172a', color: '#fff' }}>
                                        {t}
                                    </option>
                                ))}
                            </select>

                            <button
                                id="get-question-btn"
                                onClick={fetchQuestion}
                                disabled={loadingQuestion}
                                className="btn-primary"
                                style={{ padding: '12px 20px', width: '100%', justifyContent: 'center' }}
                            >
                                {loadingQuestion ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> Generating...
                                    </>
                                ) : (
                                    <>
                                        <HelpCircle size={16} /> Start Oral Exam
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Question Card */}
                    {activeQuestion && (
                        <div className="glass-card animate-fade-in" style={{ padding: '2rem', border: '1px solid rgba(99,102,241,0.25)', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Active Question
                                </span>
                                <button
                                    onClick={speakQuestion}
                                    style={{
                                        background: 'rgba(99,102,241,0.1)',
                                        border: '1px solid rgba(99,102,241,0.2)',
                                        color: '#a5b4fc',
                                        borderRadius: '8px',
                                        padding: '6px 12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: '600'
                                    }}
                                    title="Listen to question"
                                >
                                    <Volume2 size={14} /> Speak
                                </button>
                            </div>
                            <blockquote style={{ fontSize: '1.2rem', fontWeight: '600', color: '#fff', margin: 0, lineHeight: '1.5' }}>
                                "{activeQuestion}"
                            </blockquote>
                        </div>
                    )}
                </section>

                {/* RIGHT SIDE: RESPONSE RECORDER & EVALUATION RESULTS */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Speech Dictation Answering Panel */}
                    {activeQuestion && (
                        <div className="glass-card animate-fade-in" style={{ padding: '2rem', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>Record Your Spoken Answer</h3>
                                {transcript && (
                                    <button 
                                        onClick={() => setTranscript('')}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--accent)',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <Trash2 size={13} /> Reset Answer
                                    </button>
                                )}
                            </div>

                            {/* Transcription text box */}
                            <textarea
                                value={transcript}
                                onChange={(e) => setTranscript(e.target.value)}
                                placeholder="Click the microphone to record your spoken answer. Your voice transcription will appear here in real-time..."
                                style={{
                                    width: '100%',
                                    minHeight: '140px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    padding: '14px',
                                    fontSize: '0.95rem',
                                    lineHeight: '1.6',
                                    outline: 'none',
                                    resize: 'none',
                                    fontFamily: 'inherit',
                                    marginBottom: '1.5rem'
                                }}
                            />

                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                {/* Mic record button */}
                                <button
                                    id="mic-record-btn"
                                    onClick={toggleRecording}
                                    style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: isRecording ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        boxShadow: isRecording ? '0 5px 15px rgba(239,68,68,0.3)' : '0 5px 15px rgba(99,102,241,0.3)',
                                        transition: 'all 0.2s',
                                        position: 'relative'
                                    }}
                                >
                                    {isRecording ? (
                                        <>
                                            <MicOff size={22} />
                                            {/* Micro animated waves */}
                                            <span style={{
                                                position: 'absolute',
                                                top: '-6px', left: '-6px', right: '-6px', bottom: '-6px',
                                                borderRadius: '50%',
                                                border: '2px solid rgba(239, 68, 68, 0.4)',
                                                animation: 'pulse 1.2s infinite'
                                            }}></span>
                                        </>
                                    ) : <Mic size={22} />}
                                </button>

                                <div style={{ flex: 1 }}>
                                    {isRecording ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1s infinite' }}></span>
                                            <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '600' }}>AI is listening... Speak clearly</span>
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {transcript ? "Speak more or click submit below." : "Tap microphone to dictation."}
                                        </span>
                                    )}
                                </div>

                                <button
                                    id="submit-viva-btn"
                                    onClick={submitViva}
                                    disabled={loadingEvaluation || !transcript.trim()}
                                    className="btn-primary"
                                    style={{
                                        padding: '12px 24px',
                                        background: '#10b981',
                                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)',
                                        opacity: (!transcript.trim() || loadingEvaluation) ? 0.5 : 1,
                                        cursor: (!transcript.trim() || loadingEvaluation) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {loadingEvaluation ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    Submit Viva
                                </button>
                            </div>
                        </div>
                    )}

                    {/* VIVA EVALUATION REPORT DASHBOARD */}
                    {evaluationResult && (
                        <div className="glass-card animate-fade-in" style={{ padding: '2rem', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                    <Award size={20} color="var(--primary)" /> Evaluation Report
                                </h3>
                                <button
                                    onClick={handleReset}
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        padding: '6px 12px',
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <RotateCcw size={12} /> Next Question
                                </button>
                            </div>

                            {/* Score circular indicators & Grade */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '2rem', flexWrap: 'wrap' }}>
                                
                                <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {/* Progress Ring visual background */}
                                    <div style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '6px solid var(--glass-border)',
                                        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
                                    }}></div>
                                    {/* Score Text */}
                                    <div style={{
                                        fontSize: '1.6rem',
                                        fontWeight: '900',
                                        zIndex: 1,
                                        color: getGradeStyles(evaluationResult.grade).color
                                    }}>
                                        {evaluationResult.score}%
                                    </div>
                                </div>

                                <div>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '4px 12px',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        color: getGradeStyles(evaluationResult.grade).color,
                                        background: getGradeStyles(evaluationResult.grade).bg,
                                        border: `1px solid ${getGradeStyles(evaluationResult.grade).border}`,
                                        marginBottom: '6px'
                                    }}>
                                        {evaluationResult.grade}
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                                        Answer analysis saved in Analytics tracker.
                                    </p>
                                </div>
                            </div>

                            {/* Semantic Highlights - Keywords Chips */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '2rem' }}>
                                
                                <div>
                                    <h4 style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                                        Keywords Mentioned
                                    </h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {evaluationResult.mentioned_keywords.length > 0 ? (
                                            evaluationResult.mentioned_keywords.map((kw, idx) => (
                                                <span key={idx} style={{
                                                    fontSize: '0.8rem',
                                                    background: 'rgba(16, 185, 129, 0.08)',
                                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                                    color: '#34d399',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    fontWeight: '600'
                                                }}>
                                                    ✓ {kw}
                                                </span>
                                            ))
                                        ) : (
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                                        Key Details Missed
                                    </h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {evaluationResult.missing_keywords.length > 0 ? (
                                            evaluationResult.missing_keywords.map((kw, idx) => (
                                                <span key={idx} style={{
                                                    fontSize: '0.8rem',
                                                    background: 'rgba(245, 158, 11, 0.08)',
                                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                                    color: '#fbbf24',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    fontWeight: '600'
                                                }}>
                                                    ✗ {kw}
                                                </span>
                                            ))
                                        ) : (
                                            <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>✓ None! Covered all reference concepts!</span>
                                        )}
                                    </div>
                                </div>

                            </div>

                            {/* Examiner feedback block */}
                            <div style={{
                                padding: '18px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px dashed var(--glass-border)',
                                borderRadius: '12px',
                                fontSize: '0.95rem',
                                lineHeight: '1.6',
                                color: 'var(--text-muted)'
                            }}>
                                <strong style={{ color: '#fff', display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>
                                    Examiner Feedback:
                                </strong>
                                "{evaluationResult.feedback}"
                            </div>
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
};

export default VoiceNotes;
