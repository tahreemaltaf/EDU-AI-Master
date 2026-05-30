import React, { useState } from "react";
import axios from "axios";

const TopicSummary = () => {
    const [text, setText] = useState("");
    const [summary, setSummary] = useState([]);

    const generate = async () => {
        const res = await axios.post("http://localhost:5000/api/summary", {
            text
        });

        setSummary(JSON.parse(res.data.summary));
    };

    return (
        <div style={{ padding: 40 }}>
            <h2>Smart Topic Summary</h2>

            <textarea
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste notes..."
            />

            <button onClick={generate}>Summarize</button>

            {summary?.topics?.map((t, i) => (
                <div key={i}>
                    <h3>{t.title}</h3>
                    <ul>
                        {t.summary.map((s, j) => (
                            <li key={j}>{s}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default TopicSummary;