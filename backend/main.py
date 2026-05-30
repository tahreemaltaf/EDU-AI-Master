from flask import Flask, request, jsonify
from flask_cors import CORS
from nlp_engine import NLPEngine
from scheduler import SpacedRepetitionScheduler
import os
import json
from datetime import datetime, timedelta
import db_manager

# Initialize Database
db_manager.init_db()

app = Flask(__name__)
CORS(app)

nlp = NLPEngine()
scheduler = SpacedRepetitionScheduler()

# Helper to dynamically retrieve current user context
def get_current_user_id():
    u_id = request.headers.get("X-User-Id")
    if not u_id:
        u_id = request.args.get("user_id")
    if not u_id and request.is_json:
        try:
            u_id = request.json.get("user_id")
        except:
            pass
            
    if u_id:
        try:
            return int(u_id)
        except:
            pass
            
    # Default fallback profile
    user = db_manager.get_or_create_user("DefaultStudent")
    return user["id"]

@app.route('/api/login', methods=['POST'])
def login():
    """Register or log in a user profile by username."""
    data = request.json or {}
    username = data.get("username")
    if not username:
        return jsonify({"error": "Missing username"}), 400
    user = db_manager.get_or_create_user(username)
    return jsonify(user)

@app.route('/api/upload', methods=['POST'])
def upload_pdf():
    """Step 1 -- Upload PDF, extract text and key concepts, and save to DB."""
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

    u_id = get_current_user_id()

    # Pre-generate flashcards and study plan, then write them to DB
    flashcards = nlp.generate_flashcards(topics)
    db_manager.save_flashcards(u_id, flashcards)

    study_plan = scheduler.generate_study_plan(concepts)
    db_manager.save_study_plan(u_id, study_plan)

    quiz = nlp.generate_diagnostic_quiz(topics)

    return jsonify({
        "message": "File uploaded and analysed successfully",
        "concepts": concepts,
        "study_plan": study_plan,
        "text_preview": text[:500],
        "num_flashcards": len(flashcards),
        "num_quiz_questions": len(quiz)
    })

@app.route('/api/generate-quiz', methods=['POST'])
def generate_quiz():
    """Step 2a -- Return the diagnostic quiz derived from DB flashcards context."""
    u_id = get_current_user_id()
    cards = db_manager.get_flashcards(u_id)
    
    if cards:
        topics = [{"topic": c["topic"], "context": c["front"] + " " + c["back"]} for c in cards]
        quiz = nlp.generate_diagnostic_quiz(topics)
        return jsonify({"questions": quiz})
        
    # Fallback to provided context
    data = request.json or {}
    context = data.get("context", "")
    if not context:
        return jsonify({"questions": []})

    topics = nlp.extract_topics_with_context(context)
    quiz = nlp.generate_diagnostic_quiz(topics)
    return jsonify({"questions": quiz})

@app.route('/api/flashcards', methods=['GET'])
def get_flashcards():
    """Step 2b -- Return flashcards from the database."""
    u_id = get_current_user_id()
    cards = db_manager.get_flashcards(u_id)
    return jsonify({"flashcards": cards})

@app.route('/api/analyse-weak-areas', methods=['POST'])
def analyse_weak_areas():
    """Step 3 -- Receive quiz results, save scores to DB, and generate dynamic plan."""
    u_id = get_current_user_id()
    data = request.json or {}
    quiz_results = data.get("results", [])  # [{topic, correct: bool}, ...]

    # Save results to DB
    for r in quiz_results:
        score = 100 if r.get("correct") else 0
        db_manager.save_quiz_score(u_id, r["topic"], score)

    analysis = scheduler.analyse_weak_areas(quiz_results)
    plan = scheduler.generate_personalised_plan(analysis)
    db_manager.save_study_plan(u_id, plan)

    return jsonify({
        "weak_areas": analysis,
        "study_plan": plan
    })

@app.route('/api/study-plan', methods=['GET', 'POST'])
def handle_study_plan():
    """Return current study plan or generate chat planner dynamically."""
    u_id = get_current_user_id()
    if request.method == 'POST':
        data = request.json or {}
        message = data.get("message", "")

        import re
        days = 3
        match = re.search(r'(\d+)\s*day', message.lower())
        if match:
            days = int(match.group(1))
        elif "week" in message.lower():
            days = 7

        cards = db_manager.get_flashcards(u_id)
        topics = [c["topic"] for c in cards]
        if not topics:
            topics = ["Core Concepts", "Advanced Applications", "Key Methodologies", "Case Studies", "Review Questions"]

        plan = []
        for day in range(1, days + 1):
            topic_idx = (day - 1) % len(topics)
            topic = topics[topic_idx]

            plan.append({
                "day": day,
                "topic": topic,
                "activity": "Module Study",
                "type": "study",
                "date": (datetime.now() + timedelta(days=day-1)).strftime("%Y-%m-%d"),
                "completed": 0
            })
            if day == days:
                plan.append({
                    "day": day,
                    "topic": "Final Integration",
                    "activity": "Practice Mock Exam",
                    "type": "review",
                    "date": (datetime.now() + timedelta(days=day-1)).strftime("%Y-%m-%d"),
                    "completed": 0
                })
            else:
                plan.append({
                    "day": day,
                    "topic": topic,
                    "activity": "Flashcard Practice",
                    "type": "quiz",
                    "date": (datetime.now() + timedelta(days=day-1)).strftime("%Y-%m-%d"),
                    "completed": 0
                })
        db_manager.save_study_plan(u_id, plan)
        return jsonify({"plan": plan})
    else:
        plan = db_manager.get_study_plan(u_id)
        return jsonify({"study_plan": plan})

@app.route('/api/update-task-date', methods=['POST'])
def update_task_date():
    """Update task date by relative index."""
    u_id = get_current_user_id()
    data = request.json or {}
    idx = data.get("index")
    new_date = data.get("date")
    if idx is None or new_date is None:
        return jsonify({"error": "Missing index or date"}), 400

    success = db_manager.update_task_date(u_id, int(idx), new_date)
    if success:
        return jsonify({"message": "Task date updated successfully"})
    return jsonify({"error": "Index out of bounds"}), 400

@app.route('/api/toggle-task', methods=['POST'])
def toggle_task():
    """Toggle completed state of a task by index."""
    u_id = get_current_user_id()
    data = request.json or {}
    idx = data.get("index")
    if idx is None:
        return jsonify({"error": "Missing index"}), 400

    success = db_manager.toggle_task_completion(u_id, int(idx))
    if success:
        return jsonify({"message": "Task completion toggled successfully"})
    return jsonify({"error": "Index out of bounds"}), 400

@app.route('/api/add-task', methods=['POST'])
def add_task():
    """Manually add a task for the user."""
    u_id = get_current_user_id()
    data = request.json or {}
    topic = data.get("topic")
    activity = data.get("activity", "Study")
    task_type = data.get("type", "study")
    date = data.get("date")
    
    if not topic or not date:
        return jsonify({"error": "Missing topic or date"}), 400
        
    conn = db_manager.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM study_plans WHERE user_id = ?", (u_id,))
    count = cursor.fetchone()["count"]
    
    cursor.execute("""
        INSERT INTO study_plans (user_id, day, topic, activity, type, date, completed)
        VALUES (?, ?, ?, ?, ?, ?, 0)
    """, (u_id, count + 1, topic, activity, task_type, date))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Task added successfully", "study_plan": db_manager.get_study_plan(u_id)})

@app.route('/api/review-flashcard', methods=['POST'])
def review_flashcard():
    """Process spaced repetition rating for a topic and reschedule review in DB."""
    u_id = get_current_user_id()
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

    card = db_manager.get_flashcard_by_topic(u_id, topic)
    
    current_interval = 1
    ease_factor = 2.5
    if card:
        current_interval = card["interval"]
        ease_factor = card["ease_factor"]

    next_interval, new_ease, next_review = scheduler.calculate_next_review(
        current_interval, ease_factor, quality
    )

    db_manager.update_flashcard_sm2(u_id, topic, next_interval, new_ease)
    next_review_str = next_review.strftime("%Y-%m-%d")
    db_manager.reschedule_review_task(u_id, topic, next_review_str)

    return jsonify({
        "message": "Spaced repetition scheduler updated successfully",
        "topic": topic,
        "next_review": next_review_str,
        "interval": next_interval,
        "ease_factor": new_ease
    })

@app.route('/api/weak-areas', methods=['GET'])
def get_weak_areas():
    """Calculate and return latest weak area analytics from DB quiz scores history."""
    u_id = get_current_user_id()
    scores = db_manager.get_quiz_scores(u_id)

    topic_stats = {}
    for s in scores:
        t = s["topic"]
        if t not in topic_stats:
            topic_stats[t] = {"total": 0, "correct": 0}
        topic_stats[t]["total"] += 1
        if s["score"] > 50:
            topic_stats[t]["correct"] += 1

    analysis = []
    for topic, stats in topic_stats.items():
        score = round(stats["correct"] / max(stats["total"], 1) * 100)
        analysis.append({
            "topic": topic,
            "total": stats["total"],
            "correct": stats["correct"],
            "score": score,
            "is_weak": score < 60
        })
    analysis.sort(key=lambda x: x["score"])
    return jsonify({"weak_areas": analysis})

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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
