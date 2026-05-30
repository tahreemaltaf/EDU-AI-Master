from flask import Flask, request, jsonify
from flask_cors import CORS
from nlp_engine import NLPEngine
from scheduler import SpacedRepetitionScheduler
import os
import json

app = Flask(__name__)
CORS(app)

nlp = NLPEngine()
scheduler = SpacedRepetitionScheduler()

# In-memory store so the frontend can fetch data across requests
_session = {
    "topics": [],
    "text": "",
    "flashcards": [],
    "quiz": [],
    "weak_areas": [],
    "study_plan": []
}


@app.route('/api/upload', methods=['POST'])
def upload_pdf():
    """Step 1 -- Upload PDF, extract text and key concepts."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    file_path = os.path.join("uploads", file.filename)
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
    file.save(file_path)

    text = nlp.extract_text_from_pdf(file_path)
    topics = nlp.extract_topics_with_context(text)
    concepts = [t["topic"] for t in topics]

    # Persist for later endpoints
    _session["text"] = text
    _session["topics"] = topics

    # Also pre-generate flashcards and quiz so they are ready
    _session["flashcards"] = nlp.generate_flashcards(topics)
    _session["quiz"] = nlp.generate_diagnostic_quiz(topics)

    study_plan = scheduler.generate_study_plan(concepts)
    _session["study_plan"] = study_plan

    return jsonify({
        "message": "File uploaded and analysed successfully",
        "concepts": concepts,
        "study_plan": study_plan,
        "text_preview": text[:500],
        "num_flashcards": len(_session["flashcards"]),
        "num_quiz_questions": len(_session["quiz"])
    })


@app.route('/api/generate-quiz', methods=['POST'])
def generate_quiz():
    """Step 2a -- Return the diagnostic quiz (per-topic tagged questions)."""
    # If the session already has a quiz from upload, return it
    if _session["quiz"]:
        return jsonify({"questions": _session["quiz"]})

    # Fallback: generate from provided context
    data = request.json or {}
    context = data.get("context", "")
    if not context:
        return jsonify({"questions": []})

    topics = nlp.extract_topics_with_context(context)
    quiz = nlp.generate_diagnostic_quiz(topics)
    _session["quiz"] = quiz
    return jsonify({"questions": quiz})


@app.route('/api/flashcards', methods=['GET'])
def get_flashcards():
    """Step 2b -- Return auto-generated flashcards."""
    if _session["flashcards"]:
        return jsonify({"flashcards": _session["flashcards"]})
    return jsonify({"flashcards": [], "message": "Upload a PDF first."})


@app.route('/api/analyse-weak-areas', methods=['POST'])
def analyse_weak_areas():
    """Step 3 -- Receive quiz results, compute weak areas, and build a
    personalised study plan."""
    data = request.json or {}
    quiz_results = data.get("results", [])
    # quiz_results: [{topic, correct: bool}, ...]

    analysis = scheduler.analyse_weak_areas(quiz_results)
    _session["weak_areas"] = analysis

    plan = scheduler.generate_personalised_plan(analysis)
    _session["study_plan"] = plan

    return jsonify({
        "weak_areas": analysis,
        "study_plan": plan
    })


@app.route('/api/study-plan', methods=['GET', 'POST'])
def handle_study_plan():
    """Return or generate study plan."""
    if request.method == 'POST':
        data = request.json or {}
        message = data.get("message", "")
        
        # Parse days from message
        import re
        days = 3
        match = re.search(r'(\d+)\s*day', message.lower())
        if match:
            days = int(match.group(1))
        elif "week" in message.lower():
            days = 7
            
        topics = [t["topic"] for t in _session.get("topics", [])]
        if not topics:
            topics = ["Core Concepts", "Advanced Applications", "Key Methodologies", "Case Studies", "Review Questions"]
            
        plan = []
        for day in range(1, days + 1):
            topic_idx = (day - 1) % len(topics)
            topic = topics[topic_idx]
            
            plan.append({
                "time": f"Day {day} (Morning)",
                "task": f"Deep dive study: {topic} (Read text notes & highlight key details)"
            })
            if day == days:
                plan.append({
                    "time": f"Day {day} (Afternoon)",
                    "task": "Final practice mock exam covering all concepts"
                })
                plan.append({
                    "time": f"Day {day} (Evening)",
                    "task": "Review weak formulas/definitions and rest before exams"
                })
            else:
                plan.append({
                    "time": f"Day {day} (Afternoon)",
                    "task": f"Test yourself on {topic}: Attempt flashcards & custom MCQ quiz"
                })
        return jsonify({"plan": plan})
    else:
        return jsonify({"study_plan": _session["study_plan"]})


@app.route('/api/mcq', methods=['POST'])
def generate_mcq():
    """Generate MCQs from provided notes/context."""
    data = request.json or {}
    context = data.get("context", "")
    if not context:
        return jsonify({"questions": []})
    
    topics = nlp.extract_topics_with_context(context)
    questions = nlp.generate_diagnostic_quiz(topics)
    return jsonify({"questions": questions})


@app.route('/api/summary', methods=['POST'])
def generate_summary():
    """Extract and summarize topics from notes/context."""
    data = request.json or {}
    text = data.get("text", "")
    if not text:
        return jsonify({"summary": json.dumps({"topics": []})})
    
    import re
    topics = nlp.extract_topics_with_context(text)
    
    summary_topics = []
    for t in topics:
        topic_name = t["topic"]
        context_snippet = t["context"]
        
        clean_text = text.replace('\n', ' ')
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', clean_text) if len(s.strip()) > 15]
        
        matching_sentences = []
        for s in sentences:
            if topic_name.lower() in s.lower() and s not in matching_sentences:
                matching_sentences.append(s)
                if len(matching_sentences) >= 2:
                    break
        
        if not matching_sentences:
            matching_sentences = [context_snippet]
            
        summary_topics.append({
            "title": topic_name,
            "summary": matching_sentences
        })
        
    summary_data = {
        "topics": summary_topics
    }
    return jsonify({"summary": json.dumps(summary_data)})


@app.route('/api/weak-areas', methods=['GET'])
def get_weak_areas():
    """Return the latest weak-area analysis."""
    return jsonify({"weak_areas": _session["weak_areas"]})


@app.route('/api/update-progress', methods=['POST'])
def update_progress():
    data = request.json
    quality = data.get("quality", 2)
    current_interval = data.get("interval", 1)
    ease_factor = data.get("ease_factor", 2.5)

    next_interval, new_ease, next_review = scheduler.calculate_next_review(
        current_interval, ease_factor, quality
    )

    return jsonify({
        "next_review": next_review.strftime("%Y-%m-%d"),
        "interval": next_interval,
        "ease_factor": new_ease
    })


@app.route('/api/update-task-date', methods=['POST'])
def update_task_date():
    """Update date of a specific study plan task by index."""
    data = request.json or {}
    idx = data.get("index")
    new_date = data.get("date")
    if idx is None or new_date is None:
        return jsonify({"error": "Missing index or date"}), 400
    try:
        idx = int(idx)
        if 0 <= idx < len(_session["study_plan"]):
            _session["study_plan"][idx]["date"] = new_date
            return jsonify({
                "message": "Task date updated successfully",
                "study_plan": _session["study_plan"]
            })
        return jsonify({"error": "Index out of bounds"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/review-flashcard', methods=['POST'])
def review_flashcard():
    """Process spaced repetition rating for a topic flashcard and update study plan."""
    data = request.json or {}
    topic = data.get("topic")
    quality = data.get("quality")  # 0 to 3
    
    if not topic or quality is None:
        return jsonify({"error": "Missing topic or quality rating"}), 400
        
    try:
        quality = int(quality)
        if not (0 <= quality <= 3):
            return jsonify({"error": "Quality rating must be 0, 1, 2, or 3"}), 400
    except Exception:
        return jsonify({"error": "Invalid quality rating"}), 400
        
    # Find flashcard in session or create default tracking values
    card = None
    for f in _session.get("flashcards", []):
        if f.get("topic", "").lower() == topic.lower():
            card = f
            break
            
    if not card:
        # Fallback: Create dynamic card in session
        card = {
            "topic": topic,
            "interval": 1,
            "ease_factor": 2.5
        }
        _session.setdefault("flashcards", []).append(card)
        
    # Ensure tracking fields are initialized
    current_interval = card.get("interval", 1)
    ease_factor = card.get("ease_factor", 2.5)
    
    # Calculate next review date using SM-2 scheduler
    next_interval, new_ease, next_review = scheduler.calculate_next_review(
        current_interval, ease_factor, quality
    )
    
    # Update tracking values in the card object
    card["interval"] = next_interval
    card["ease_factor"] = new_ease
    
    next_review_str = next_review.strftime("%Y-%m-%d")
    
    # Now update the date of the corresponding Spaced Review task in the study plan
    updated_task = None
    for task in _session.get("study_plan", []):
        # Find review task for this topic
        if task.get("topic", "").lower() == topic.lower() and task.get("type") == "review":
            task["date"] = next_review_str
            updated_task = task
            break
            
    if not updated_task:
        # If no review task exists yet, create one dynamically in the schedule
        new_review_task = {
            "day": len(_session["study_plan"]) + 1,
            "topic": topic,
            "date": next_review_str,
            "activity": "Spaced Review",
            "type": "review",
            "status": "upcoming"
        }
        _session.setdefault("study_plan", []).append(new_review_task)
        updated_task = new_review_task
        
    return jsonify({
        "message": "Spaced repetition scheduler updated successfully",
        "topic": topic,
        "next_review": next_review_str,
        "interval": next_interval,
        "ease_factor": new_ease
    })



if __name__ == '__main__':
    app.run(debug=True, port=5000)
