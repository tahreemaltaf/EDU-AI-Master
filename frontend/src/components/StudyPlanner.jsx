import React, { useState, useEffect } from 'react';
import { Calendar, BookOpen, Brain, RotateCcw, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const StudyPlanner = () => {
    const [plan, setPlan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState({}); // 🔥 NEW STATE

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const resp = await axios.get('http://localhost:5000/api/study-plan');

                const data = resp.data?.study_plan || [];

                setPlan(data);
            } catch (e) {
                console.error(e);

                setPlan([
                    { day: 1, topic: "Revise Basics", activity: "Study", type: "study" },
                    { day: 2, topic: "Practice MCQs", activity: "Quiz", type: "quiz" },
                    { day: 3, topic: "Weak Areas", activity: "Review", type: "review" }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, []);

    // 🔥 TOGGLE COMPLETE TASK
    const toggleDone = (index) => {
        setCompleted(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    if (loading) {
        return <p style={{ padding: 40 }}>Loading study plan...</p>;
    }

    return (
        <div style={{ padding: 30, maxWidth: 900, margin: '0 auto' }}>

            <h2>Your Interactive Study Plan</h2>

            {plan.map((item, idx) => {
                const isDone = completed[idx];

                return (
                    <div
                        key={idx}
                        onClick={() => toggleDone(idx)}
                        style={{
                            padding: 16,
                            marginBottom: 12,
                            borderRadius: 10,
                            cursor: 'pointer',
                            background: isDone
                                ? 'rgba(16,185,129,0.15)'
                                : 'rgba(255,255,255,0.05)',
                            border: isDone
                                ? '1px solid #10b981'
                                : '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >

                        <div>
                            <div style={{ fontWeight: 600 }}>
                                {item.topic}
                            </div>

                            <div style={{ fontSize: 12, opacity: 0.7 }}>
                                Day {item.day} • {item.activity}
                            </div>
                        </div>

                        {isDone ? (
                            <CheckCircle2 color="#10b981" />
                        ) : (
                            <Calendar color="gray" />
                        )}

                    </div>
                );
            })}

        </div>
    );
};

export default StudyPlanner;