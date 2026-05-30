import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Send, User, Bot, Sparkles, BookOpen, Flame, AlertCircle } from "lucide-react";

const StudyChat = () => {
    const [message, setMessage] = useState("");
    const [chatHistory, setChatHistory] = useState([
        {
            sender: "bot",
            text: "Hello! I am your AI Study Buddy. Ask me anything about your uploaded slide deck, key concepts, planner checklist tasks, or your daily streak!"
        }
    ]);
    const [activeDoc, setActiveDoc] = useState(null);
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Fetch initial user document text filename context
    useEffect(() => {
        const fetchContext = async () => {
            try {
                // Trigger a dummy hello request to check if a document is cached in DB
                const greetingResp = await axios.post("http://localhost:5000/api/chat", { message: "hello" });
                if (greetingResp.data.filename) {
                    setActiveDoc(greetingResp.data.filename);
                }
            } catch (e) {
                console.error("Failed to load active slide context:", e);
            }
        };
        fetchContext();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory, loading]);

    const handleSendMessage = async (textToSend) => {
        const query = textToSend || message;
        if (!query.trim()) return;

        // Add user message to chat
        setChatHistory(prev => [...prev, { sender: "user", text: query }]);
        if (!textToSend) setMessage(""); // Clear input

        try {
            setLoading(true);
            const resp = await axios.post("http://localhost:5000/api/chat", {
                message: query
            });

            const botReply = resp.data.response;
            if (resp.data.filename) {
                setActiveDoc(resp.data.filename);
            }

            setChatHistory(prev => [...prev, { sender: "bot", text: botReply }]);
        } catch (e) {
            console.error("Failed to generate chat response:", e);
            setChatHistory(prev => [...prev, { 
                sender: "bot", 
                text: "Sorry, I ran into an error connecting to the AI tutor. Make sure the backend server is running." 
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSendMessage();
        }
    };

    const quickChips = [
        { label: "⚠️ Show my weak areas", query: "Show my weak areas" },
        { label: "🔥 Check my streak", query: "Check my streak" },
        { label: "📚 List my study topics", query: "List my study plan topics" },
        { label: "💡 Explain slide content", query: "What does my uploaded slides document cover?" }
    ];

    return (
        <div style={{ padding: "3rem 4rem", maxWidth: "1000px", margin: "0 auto" }} className="animate-fade-in">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h2 style={{ fontSize: "2.25rem", fontWeight: "800", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
                        AI Study Buddy
                    </h2>
                    <p style={{ color: "var(--text-muted)" }}>
                        Get explanations of your course material, study recommendations, and streak reviews.
                    </p>
                </div>
                {activeDoc && (
                    <div style={{ 
                        background: "rgba(16,185,129,0.1)", 
                        border: "1px solid rgba(16,185,129,0.2)",
                        borderRadius: "12px", 
                        padding: "8px 16px",
                        fontSize: "0.85rem",
                        color: "#34d399",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                    }}>
                        <BookOpen size={14} /> Active slides: <strong>{activeDoc}</strong>
                    </div>
                )}
            </div>

            {/* Chat Bubble Container */}
            <div className="glass-card" style={{ 
                height: "500px", 
                display: "flex", 
                flexDirection: "column",
                padding: "2rem",
                marginBottom: "1.5rem",
                border: "1px solid var(--glass-border)"
            }}>
                <div style={{ 
                    flex: 1, 
                    overflowY: "auto", 
                    paddingRight: "10px", 
                    marginBottom: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem"
                }}>
                    {chatHistory.map((msg, index) => {
                        const isBot = msg.sender === "bot";
                        return (
                            <div 
                                key={index} 
                                style={{ 
                                    display: "flex", 
                                    gap: "12px", 
                                    maxWidth: "75%",
                                    alignSelf: isBot ? "flex-start" : "flex-end",
                                    flexDirection: isBot ? "row" : "row-reverse"
                                }}
                            >
                                {/* Avatar */}
                                <div style={{ 
                                    width: "36px", 
                                    height: "36px", 
                                    borderRadius: "50%", 
                                    background: isBot ? "rgba(99,102,241,0.15)" : "var(--primary-glow)",
                                    border: isBot ? "1px solid rgba(99,102,241,0.3)" : "none",
                                    color: isBot ? "#818cf8" : "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0
                                }}>
                                    {isBot ? <Bot size={18} /> : <User size={18} />}
                                </div>

                                {/* Message bubble */}
                                <div style={{ 
                                    background: isBot ? "rgba(255,255,255,0.03)" : "rgba(99,102,241,0.15)",
                                    border: isBot ? "1px solid var(--glass-border)" : "1px solid rgba(99,102,241,0.3)",
                                    padding: "12px 18px",
                                    borderRadius: isBot ? "0px 16px 16px 16px" : "16px 0px 16px 16px",
                                    fontSize: "0.95rem",
                                    color: "#fff",
                                    lineHeight: "1.5",
                                    whiteSpace: "pre-line"
                                }}>
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}

                    {loading && (
                        <div style={{ display: "flex", gap: "12px", alignSelf: "flex-start" }}>
                            <div style={{ 
                                width: "36px", 
                                height: "36px", 
                                borderRadius: "50%", 
                                background: "rgba(99,102,241,0.15)",
                                border: "1px solid rgba(99,102,241,0.3)",
                                color: "#818cf8",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                                <Bot size={18} className="animate-spin" />
                            </div>
                            <div style={{ 
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid var(--glass-border)",
                                padding: "12px 18px",
                                borderRadius: "0px 16px 16px 16px",
                                color: "var(--text-muted)",
                                fontSize: "0.9rem"
                            }}>
                                Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Quick Action Chips */}
                <div style={{ 
                    display: "flex", 
                    gap: "8px", 
                    flexWrap: "wrap", 
                    marginBottom: "1rem",
                    borderTop: "1px solid rgba(255,255,255,0.03)",
                    paddingTop: "1rem"
                }}>
                    {quickChips.map((chip, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSendMessage(chip.query)}
                            disabled={loading}
                            style={{
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid var(--glass-border)",
                                borderRadius: "20px",
                                padding: "6px 14px",
                                fontSize: "0.8rem",
                                fontWeight: "600",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(99,102,241,0.1)";
                                e.currentTarget.style.color = "#a5b4fc";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                                e.currentTarget.style.color = "var(--text-muted)";
                            }}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>

                {/* Input Area */}
                <div style={{ display: "flex", gap: "10px" }}>
                    <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a concept keyword to explain, ask about your streak, or details of slides..."
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: "14px 20px",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid var(--glass-border)",
                            borderRadius: "12px",
                            color: "white",
                            fontSize: "0.95rem",
                            outline: "none",
                            transition: "all 0.3s"
                        }}
                        onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                        onBlur={(e) => e.target.style.borderColor = "var(--glass-border)"}
                    />
                    <button 
                        onClick={() => handleSendMessage()}
                        disabled={loading}
                        style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "12px",
                            background: "var(--primary)",
                            border: "none",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 4px 15px rgba(99,102,241,0.3)",
                            transition: "all 0.2s"
                        }}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudyChat;