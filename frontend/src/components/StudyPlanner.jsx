import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, BookOpen, Brain, RotateCcw, CheckCircle2, LayoutGrid, List } from 'lucide-react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const StudyPlanner = () => {
    const [plan, setPlan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState({});
    const [viewMode, setViewMode] = useState('calendar'); // calendar | timeline

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const resp = await axios.get('http://localhost:5000/api/study-plan');
                const data = resp.data?.study_plan || [];
                setPlan(data);

                // Set initial completed map from DB values
                const initialCompleted = {};
                data.forEach((item, idx) => {
                    if (item.completed || item.status === "completed") {
                        initialCompleted[idx] = true;
                    }
                });
                setCompleted(initialCompleted);
            } catch (e) {
                console.error(e);
                setPlan([
                    { day: 1, topic: "Revise Basics", activity: "Study", type: "study", date: new Date().toISOString().split('T')[0] },
                    { day: 2, topic: "Practice MCQs", activity: "Quiz", type: "quiz", date: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
                    { day: 3, topic: "Weak Areas", activity: "Review", type: "review", date: new Date(Date.now() + 172800000).toISOString().split('T')[0] }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, []);

    const toggleDone = async (index) => {
        try {
            await axios.post('http://localhost:5000/api/toggle-task', { index });
            setCompleted(prev => ({
                ...prev,
                [index]: !prev[index]
            }));
        } catch (e) {
            console.error("Failed to toggle completion:", e);
        }
    };


    const typeColor = (type) => {
        if (type === 'quiz') return '#fbbf24'; // Yellow
        if (type === 'review') return '#a78bfa'; // Purple
        return '#10b981'; // Cyan/Green
    };

    const handleEventDrop = async (info) => {
        const newDate = info.event.startStr.split('T')[0];
        const taskIndex = parseInt(info.event.id, 10);
        try {
            await axios.post('http://localhost:5000/api/update-task-date', {
                index: taskIndex,
                date: newDate
            });
            // Update plan state
            setPlan(prev => prev.map((item, idx) => idx === taskIndex ? { ...item, date: newDate } : item));
        } catch (e) {
            console.error("Reschedule failed:", e);
            alert("Could not update task date. Is the backend server running?");
            info.revert();
        }
    };

    if (loading) {
        return <p style={{ padding: 40, color: 'var(--text-muted)' }}>Loading study plan...</p>;
    }

    // Convert plan array to FullCalendar event objects
    const calendarEvents = plan.map((item, idx) => ({
        id: String(idx),
        title: `${item.activity || 'Study'}: ${item.topic}`,
        start: item.date,
        backgroundColor: completed[idx] ? 'rgba(16, 185, 129, 0.2)' : typeColor(item.type),
        borderColor: completed[idx] ? '#10b981' : typeColor(item.type),
        textColor: '#ffffff',
        extendedProps: { ...item, idx }
    }));

    return (
        <div style={{ padding: '3rem 2rem', maxWidth: '1100px', margin: '0 auto' }} className="animate-fade-in">
            
            {/* Header section with view toggles */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                        Study Planner
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Drag & drop tasks on the calendar grid to reschedule. Mark them done below.
                    </p>
                </div>

                <div style={{ 
                    display: 'inline-flex', 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid var(--glass-border)', 
                    borderRadius: '12px',
                    padding: '4px' 
                }}>
                    <button 
                        onClick={() => setViewMode('calendar')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            background: viewMode === 'calendar' ? 'var(--primary)' : 'transparent',
                            color: 'white',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <LayoutGrid size={16} /> Calendar
                    </button>
                    <button 
                        onClick={() => setViewMode('timeline')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            background: viewMode === 'timeline' ? 'var(--primary)' : 'transparent',
                            color: 'white',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <List size={16} /> Tasks
                    </button>
                </div>
            </div>

            {/* Calendar Grid View */}
            {viewMode === 'calendar' && (
                <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '3rem' }}>
                    <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        editable={true}
                        events={calendarEvents}
                        eventDrop={handleEventDrop}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,dayGridWeek'
                        }}
                        eventTimeFormat={{
                            hour: 'numeric',
                            minute: '2-digit',
                            meridiem: false
                        }}
                        height="auto"
                    />
                </div>
            )}

            {/* Timeline Checklist View */}
            <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: '700' }}>
                    Interactive Task Checklist
                </h3>
                
                {plan.map((item, idx) => {
                    const isDone = completed[idx];

                    return (
                        <div
                            key={idx}
                            onClick={() => toggleDone(idx)}
                            style={{
                                padding: '20px 24px',
                                marginBottom: '1rem',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                background: isDone
                                    ? 'rgba(16,185,129,0.08)'
                                    : 'rgba(255,255,255,0.02)',
                                border: isDone
                                    ? '1px solid rgba(16,185,129,0.3)'
                                    : '1px solid var(--glass-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'all 0.25s ease'
                            }}
                            className="checklist-item"
                        >
                            <div>
                                <div style={{ 
                                    fontWeight: 600, 
                                    fontSize: '1.1rem',
                                    textDecoration: isDone ? 'line-through' : 'none',
                                    opacity: isDone ? 0.6 : 1 
                                }}>
                                    {item.topic}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Day {item.day || idx + 1} • {item.activity || 'Study'} • Due: {item.date}
                                </div>
                            </div>

                            {isDone ? (
                                <CheckCircle2 color="#10b981" size={24} />
                            ) : (
                                <CalendarIcon color="var(--text-muted)" size={24} />
                            )}
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

export default StudyPlanner;