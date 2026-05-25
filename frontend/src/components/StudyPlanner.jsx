import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const StudyPlanner = () => {
    const events = [
        { title: 'Neural Networks Basics', start: '2026-05-27T10:00:00', end: '2026-05-27T12:00:00', backgroundColor: '#6366f1' },
        { title: 'Backpropagation Deep Dive', start: '2026-05-28T14:00:00', end: '2026-05-28T16:00:00', backgroundColor: '#ec4899' },
        { title: 'Quiz: Optimization', start: '2026-05-29T11:00:00', end: '2026-05-29T12:00:00', backgroundColor: '#fbbf24' },
    ];

    return (
        <div style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '2rem' }}>AI Study Calendar 📅</h2>
            <div className="glass-card" style={{ background: 'rgba(30, 41, 59, 0.9)' }}>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek'
                    }}
                    events={events}
                    height="700px"
                    themeSystem="standard"
                />
            </div>
            <style>
                {`
                .fc { color: white; }
                .fc-toolbar-title { font-size: 1.2rem !important; }
                .fc-button { background: var(--primary) !important; border: none !important; }
                .fc-daygrid-day { border: 1px solid var(--glass-border) !important; }
                .fc-col-header-cell { background: rgba(255,255,255,0.05); }
                `}
            </style>
        </div>
    );
};

export default StudyPlanner;
