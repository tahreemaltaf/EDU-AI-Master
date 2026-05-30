import React, { useState } from "react";
import axios from "axios";

const StudyChat = () => {
    const [message, setMessage] = useState("");
    const [plan, setPlan] = useState([]);

    const generate = async () => {
        const res = await axios.post("http://localhost:5000/api/study-plan", {
            message
        });

        setPlan(res.data.plan || []);
    };

    return (
        <div style={{ padding: 40 }}>
            <h2>Study Planner Chat</h2>

            <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. exam in 2 days"
            />

            <button onClick={generate}>Generate Plan</button>

            {plan.map((p, i) => (
                <div key={i}>
                    <strong>{p.time}</strong> - {p.task}
                </div>
            ))}
        </div>
    );
};

export default StudyChat;