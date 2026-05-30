import React, { useState } from "react";
import axios from "axios";

const McqGenerator = () => {
    const [context, setContext] = useState("");
    const [questions, setQuestions] = useState([]);

    const generate = async () => {
        const res = await axios.post("http://localhost:5000/api/mcq", {
            context
        });

        setQuestions(res.data.questions || []);
    };

    return (
        <div style={{ padding: 40 }}>
            <h2>MCQ Generator</h2>

            <textarea
                rows={6}
                style={{ width: "100%" }}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Paste your notes..."
            />

            <button onClick={generate}>
                Generate MCQs
            </button>

            <div>
                {questions.map((q, i) => (
                    <div key={i} style={{ marginTop: 20 }}>
                        <h4>{q.question}</h4>
                        {q.options?.map((o, j) => (
                            <div key={j}>• {o}</div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default McqGenerator;