import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, BookOpen, Brain, RotateCcw, CheckCircle2, LayoutGrid, List, Play, Pause, Clock, Sparkles } from 'lucide-react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const StudyPlanner = () => {
    const [plan, setPlan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState({});
    const [viewMode, setViewMode] = useState('calendar'); // calendar | timeline

    // Stopwatch / Manual Timer States
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0); // in seconds
    const [manualHours, setManualHours] = useState('');
    const [manualMinutes, setManualMinutes] = useState('');
    const [timerMode, setTimerMode] = useState('stopwatch'); // stopwatch | manual
    const [logStatus, setLogStatus] = useState(null);
    const [activeTaskIndex, setActiveTaskIndex] = useState(null);

    useEffect(() => {
        let interval = null;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

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

    const formatTime = (totalSeconds) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return [
            hrs.toString().padStart(2, '0'),
            mins.toString().padStart(2, '0'),
            secs.toString().padStart(2, '0')
        ].join(':');
    };

    const handleLogSession = async () => {
        let hoursToLog = 0;
        if (timerMode === 'stopwatch') {
            if (timeElapsed === 0) {
                setLogStatus({ type: 'error', message: 'Timer is at 0! Start the timer to log hours.' });
                return;
            }
            hoursToLog = timeElapsed / 3600;
        } else {
            const h = parseFloat(manualHours) || 0;
            const m = parseFloat(manualMinutes) || 0;
            hoursToLog = h + (m / 60);
            if (hoursToLog <= 0) {
                setLogStatus({ type: 'error', message: 'Please enter a valid study duration.' });
                return;
            }
        }

        try {
            const todayStr = new Date().toISOString().split('T')[0];
            let url = 'http://localhost:5000/api/log-study-hours';
            let payload = { hours: hoursToLog, date: todayStr };

            if (activeTaskIndex !== null) {
                url = 'http://localhost:5000/api/log-task-hours';
                payload = { task_index: activeTaskIndex, hours: hoursToLog };
            }

            const resp = await axios.post(url, payload);
            if (resp.data.success) {
                setLogStatus({
                    type: 'success',
                    message: activeTaskIndex !== null
                        ? `Logged ${hoursToLog.toFixed(2)} hours to task "${plan[activeTaskIndex].topic}" successfully!`
                        : `Logged ${hoursToLog.toFixed(2)} hours successfully! View in Analytics.`
                });

                if (activeTaskIndex !== null) {
                    // Schedule Recall Quiz 5 minutes from now
                    const topicName = plan[activeTaskIndex].topic;
                    const scheduledTime = Date.now() + 5 * 60 * 1000;
                    localStorage.setItem('scheduledQuiz', JSON.stringify({
                        topic: topicName,
                        scheduledTime: scheduledTime
                    }));
                    window.dispatchEvent(new Event('storage')); // notify App.jsx

                    setCompleted(prev => ({ ...prev, [activeTaskIndex]: true }));
                    setPlan(prev => prev.map((item, idx) => idx === activeTaskIndex ? { ...item, logged_hours: (item.logged_hours || 0.0) + hoursToLog } : item));
                    setActiveTaskIndex(null);
                }

                setIsTimerRunning(false);
                setTimeElapsed(0);
                setManualHours('');
                setManualMinutes('');
            }
        } catch (e) {
            console.error("Failed to log study hours:", e);
            setLogStatus({ type: 'error', message: 'Failed to log study hours. Make sure backend is running.' });
        }

        setTimeout(() => {
            setLogStatus(null);
        }, 4000);
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

            {/* Study Session Stopwatch & Tracker */}
            <div id="study-session-tracker" className="glass-card" style={{ padding: '2.5rem', marginBottom: '3rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                            background: 'rgba(99,102,241,0.15)', 
                            borderRadius: '12px', 
                            padding: '10px', 
                            color: '#6366f1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Clock size={24} className={isTimerRunning ? "animate-pulse" : ""} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Study Session Tracker</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '2px 0 0 0' }}>Log real-time study hours to database</p>
                        </div>
                    </div>

                    {/* Mode Toggle Tabs */}
                    <div style={{ 
                        display: 'inline-flex', 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid var(--glass-border)', 
                        borderRadius: '10px',
                        padding: '3px' 
                    }}>
                        <button 
                            onClick={() => setTimerMode('stopwatch')}
                            style={{
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                background: timerMode === 'stopwatch' ? 'rgba(255,255,255,0.08)' : 'transparent',
                                color: timerMode === 'stopwatch' ? 'white' : 'var(--text-muted)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Stopwatch Timer
                        </button>
                        <button 
                            onClick={() => setTimerMode('manual')}
                            style={{
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                background: timerMode === 'manual' ? 'rgba(255,255,255,0.08)' : 'transparent',
                                color: timerMode === 'manual' ? 'white' : 'var(--text-muted)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Log Manually
                        </button>
                    </div>
                </div>

                {logStatus && (
                    <div style={{
                        padding: '12px 18px',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '550',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: logStatus.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        border: logStatus.type === 'success' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
                        color: logStatus.type === 'success' ? '#10b981' : '#ef4444',
                        animation: 'fadeIn 0.3s ease'
                    }}>
                        <Sparkles size={16} />
                        {logStatus.message}
                    </div>
                )}

                {activeTaskIndex !== null && (
                    <div style={{
                        background: 'rgba(99,102,241,0.08)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: '12px',
                        padding: '12px 18px',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.9rem',
                        color: '#c7d2fe',
                        animation: 'fadeIn 0.3s ease'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Brain size={16} className="animate-pulse" color="#818cf8" />
                            <span>Timing study session for: <strong style={{ color: '#fff' }}>{plan[activeTaskIndex].topic}</strong></span>
                        </div>
                        <button 
                            onClick={() => setActiveTaskIndex(null)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#a5b4fc',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                textDecoration: 'underline'
                            }}
                        >
                            Cancel Active Tracker
                        </button>
                    </div>
                )}

                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    flexDirection: 'column', 
                    background: 'rgba(255,255,255,0.01)', 
                    border: '1px dashed var(--glass-border)',
                    borderRadius: '16px',
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center'
                }}>
                    {timerMode === 'stopwatch' ? (
                        <>
                            {/* Glowing Digital Timer */}
                            <div style={{ 
                                fontSize: '3.75rem', 
                                fontWeight: '800', 
                                fontFamily: 'Courier New, Courier, monospace', 
                                letterSpacing: '2px', 
                                color: '#ffffff',
                                textShadow: isTimerRunning ? '0 0 15px rgba(99, 102, 241, 0.6)' : 'none',
                                marginBottom: '1.5rem',
                                transition: 'all 0.3s ease'
                            }}>
                                {formatTime(timeElapsed)}
                            </div>

                            {/* Controls */}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {!isTimerRunning ? (
                                    <button 
                                        onClick={() => setIsTimerRunning(true)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '12px 24px',
                                            border: 'none',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            background: 'var(--primary)',
                                            color: 'white',
                                            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Play size={18} fill="white" /> Start Session
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setIsTimerRunning(false)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '12px 24px',
                                            border: 'none',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            background: '#ef4444',
                                            color: 'white',
                                            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Pause size={18} fill="white" /> Pause Session
                                    </button>
                                )}

                                <button 
                                    onClick={() => { setIsTimerRunning(false); setTimeElapsed(0); }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '12px 24px',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        background: 'rgba(255,255,255,0.03)',
                                        color: '#ffffff',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <RotateCcw size={18} /> Reset
                                </button>

                                <button 
                                    onClick={handleLogSession}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '12px 24px',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        background: '#10b981',
                                        color: 'white',
                                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Log Session
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Manual Hour Inputs */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Hours</label>
                                    <input 
                                        type="number" 
                                        placeholder="0" 
                                        value={manualHours}
                                        onChange={(e) => setManualHours(e.target.value)}
                                        min="0"
                                        style={{
                                            width: '80px',
                                            padding: '12px',
                                            borderRadius: '10px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--glass-border)',
                                            color: '#fff',
                                            textAlign: 'center',
                                            fontSize: '1.1rem',
                                            fontWeight: '600'
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', alignSelf: 'flex-end', paddingBottom: '8px' }}>:</span>
                                <div style={{ textAlign: 'left' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Minutes</label>
                                    <input 
                                        type="number" 
                                        placeholder="30" 
                                        value={manualMinutes}
                                        onChange={(e) => setManualMinutes(e.target.value)}
                                        min="0"
                                        max="59"
                                        style={{
                                            width: '80px',
                                            padding: '12px',
                                            borderRadius: '10px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--glass-border)',
                                            color: '#fff',
                                            textAlign: 'center',
                                            fontSize: '1.1rem',
                                            fontWeight: '600'
                                        }}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleLogSession}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 32px',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    background: '#10b981',
                                    color: 'white',
                                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Log Study Hours
                            </button>
                        </>
                    )}
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
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        Day {item.day || idx + 1} • {item.activity || 'Study'} • Due: {item.date}
                                    </span>
                                    {item.logged_hours > 0 && (
                                        <span style={{ 
                                            fontSize: '0.75rem', 
                                            background: 'rgba(99,102,241,0.12)', 
                                            color: '#a5b4fc', 
                                            padding: '2px 8px', 
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            border: '1px solid rgba(99,102,241,0.2)'
                                        }}>
                                            <Clock size={10} /> Timed: {item.logged_hours.toFixed(2)}h
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                {/* Start Timer action */}
                                {!isDone && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // prevent card click toggling completion
                                            setActiveTaskIndex(idx);
                                            setTimerMode('stopwatch');
                                            setIsTimerRunning(true);
                                            document.getElementById('study-session-tracker')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        style={{
                                            background: 'rgba(99,102,241,0.1)',
                                            border: '1px solid rgba(99,102,241,0.2)',
                                            color: '#a5b4fc',
                                            borderRadius: '10px',
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Play size={12} fill="#a5b4fc" /> Start Timer
                                    </button>
                                )}

                                {isDone ? (
                                    <CheckCircle2 color="#10b981" size={24} />
                                ) : (
                                    <CalendarIcon color="var(--text-muted)" size={24} />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

export default StudyPlanner;