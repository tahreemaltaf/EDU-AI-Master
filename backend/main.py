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
    db_manager.save_user_document(u_id, file.filename, text)

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

    # Save overall quiz score to quiz_scores table (with topic "Overall Diagnostic")
    correct_count = sum(1 for r in quiz_results if r.get("correct"))
    total_count = len(quiz_results)
    overall_percentage = round((correct_count / max(total_count, 1)) * 100)
    db_manager.save_quiz_score(u_id, "Overall Diagnostic", overall_percentage)

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


@app.route('/api/quiz-history', methods=['GET'])
def get_quiz_history():
    """Retrieve quiz scores of the user under Overall Diagnostic category."""
    u_id = get_current_user_id()
    conn = db_manager.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT score, date FROM quiz_scores 
        WHERE user_id = ? AND topic = 'Overall Diagnostic' 
        ORDER BY id ASC
    """, (u_id,))
    rows = cursor.fetchall()
    conn.close()
    
    scores = [r["score"] for r in rows]
    labels = [f"Quiz {i+1}" for i in range(len(scores))]
    
    return jsonify({
        "labels": labels,
        "scores": scores
    })


@app.route('/api/study-progress', methods=['GET'])
def get_study_progress():
    """Calculate and return study hours mapped to weekdays and detailed logs list."""
    u_id = get_current_user_id()
    plan = db_manager.get_study_plan(u_id)
    logs = db_manager.get_study_logs(u_id)
    
    weekly_hours = {
        "Mon": 0.0, "Tue": 0.0, "Wed": 0.0, "Thu": 0.0, "Fri": 0.0, "Sat": 0.0, "Sun": 0.0
    }
    
    task_logs = []
    for task in plan:
        if task.get("completed"):
            try:
                dt = datetime.strptime(task["date"], "%Y-%m-%d")
                day_name = dt.strftime("%a")  # "Mon", "Tue", etc.
                if day_name in weekly_hours:
                    hours_to_add = task.get("logged_hours", 0.0)
                    if hours_to_add == 0.0:
                        hours_to_add = 1.5  # default allocation per completed task if untimed
                    weekly_hours[day_name] += hours_to_add
            except Exception:
                pass
                
            hours_val = task.get("logged_hours", 0.0)
            if hours_val > 0:
                task_logs.append({
                    "type": "task",
                    "topic": task["topic"],
                    "activity": task.get("activity") or "Study",
                    "date": task["date"],
                    "hours": hours_val
                })
                
    general_logs = []
    for log in logs:
        try:
            dt = datetime.strptime(log["date"], "%Y-%m-%d")
            day_name = dt.strftime("%a")
            if day_name in weekly_hours:
                weekly_hours[day_name] += log["hours"]
        except Exception:
            pass
            
        general_logs.append({
            "type": "general",
            "topic": "General Study Session",
            "activity": "Self Study",
            "date": log["date"],
            "hours": log["hours"]
        })
        
    all_logs = task_logs + general_logs
    all_logs.sort(key=lambda x: x["date"], reverse=True)
                
    return jsonify({
        "progress": [
            weekly_hours["Mon"],
            weekly_hours["Tue"],
            weekly_hours["Wed"],
            weekly_hours["Thu"],
            weekly_hours["Fri"],
            weekly_hours["Sat"],
            weekly_hours["Sun"]
        ],
        "logs": all_logs
    })


@app.route('/api/log-study-hours', methods=['POST'])
def log_study_hours():
    """Log study hours manually or from stopwatch timer."""
    u_id = get_current_user_id()
    data = request.json or {}
    hours = data.get("hours")
    date = data.get("date")
    
    if hours is None or not date:
        return jsonify({"error": "Missing hours or date"}), 400
        
    try:
        hours_float = float(hours)
        if hours_float <= 0:
            return jsonify({"error": "Hours must be greater than zero"}), 400
    except ValueError:
        return jsonify({"error": "Hours must be a number"}), 400
        
    db_manager.log_study_hours(u_id, hours_float, date)
    return jsonify({"success": True, "message": f"Successfully logged {hours_float} study hours."})


@app.route('/api/log-task-hours', methods=['POST'])
def log_task_hours():
    """Log study hours specifically to a checklist task (by index order) and mark it completed."""
    u_id = get_current_user_id()
    data = request.json or {}
    task_idx = data.get("task_index")
    hours = data.get("hours")
    
    if task_idx is None or hours is None:
        return jsonify({"error": "Missing task_index or hours"}), 400
        
    try:
        task_idx_int = int(task_idx)
        hours_float = float(hours)
        if hours_float <= 0:
            return jsonify({"error": "Hours must be greater than zero"}), 400
    except ValueError:
        return jsonify({"error": "Invalid task_index or hours value"}), 400
        
    success = db_manager.log_task_hours(u_id, task_idx_int, hours_float)
    if success:
        return jsonify({"success": True, "message": f"Successfully logged {hours_float} hours to task."})
    else:
        return jsonify({"error": "Task index out of bounds"}), 404




@app.route('/api/generate-topic-quiz', methods=['POST'])
def generate_topic_quiz():
    """Generate a custom quiz specifically for a chosen concept topic."""
    u_id = get_current_user_id()
    data = request.json or {}
    topic = data.get("topic")
    if not topic:
        return jsonify({"error": "Missing topic"}), 400
        
    card = db_manager.get_flashcard_by_topic(u_id, topic)
    
    if card:
        topics_with_context = [{
            "topic": card["topic"],
            "context": card["front"] + " " + card["back"]
        }]
    else:
        topics_with_context = [{
            "topic": topic,
            "context": f"{topic} is a core concept that requires detailed review and practice."
        }]
        
    quiz = nlp.generate_diagnostic_quiz(topics_with_context)
    
    # Generate minimum 3 questions for variety
    if len(quiz) < 3:
        quiz.append({
            "topic": topic,
            "question": f"Which of the following represents a primary function or characteristic of '{topic}'?",
            "options": [topic, "A secondary unrelated method", "An abstract undefined framework", "None of the above"],
            "correct_answer": topic,
            "context_snippet": topics_with_context[0]["context"][:200]
        })
        quiz.append({
            "topic": topic,
            "question": f"True or False: The concept of '{topic}' is critical to optimizing learning outcomes in this module.",
            "options": ["True", "False", "Cannot be determined", "Both"],
            "correct_answer": "True",
            "context_snippet": topics_with_context[0]["context"][:200]
        })
        
    return jsonify({"questions": quiz})

@app.route('/api/generate-hint', methods=['POST'])
def generate_hint():
    data = request.json

    answer = data.get('answer', '')

    words = answer.split()

    hint = (
        "Focus on: " +
        " ".join(words[:10]) +
        " ..."
    )

    return jsonify({
        "hint": hint
    })


@app.route('/api/chat', methods=['POST'])
def chat():
    """AI Conversational Tutor endpoint using user profiles and PDF context."""
    u_id = get_current_user_id()
    data = request.json or {}
    message = data.get("message", "")
    
    if not message:
        return jsonify({"error": "Missing message"}), 400

    # Retrieve profile data
    conn = db_manager.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, streak FROM users WHERE id = ?", (u_id,))
    user_row = cursor.fetchone()
    
    username = user_row["username"] if user_row else "Student"
    streak = user_row["streak"] if user_row else 1
    
    # Retrieve weak areas
    cursor.execute("SELECT DISTINCT topic FROM quiz_scores WHERE user_id = ? AND score < 60 AND topic != 'Overall Diagnostic'", (u_id,))
    weak_areas = [r["topic"] for r in cursor.fetchall()]
    conn.close()

    # Retrieve flashcard topics
    cards = db_manager.get_flashcards(u_id)
    topics = list(set([c["topic"] for c in cards]))

    # Retrieve user PDF slides document
    doc = db_manager.get_user_document(u_id)
    pdf_text = doc["file_text"] if doc else ""
    filename = doc["filename"] if doc else None

    # Generate reply
    reply = nlp.generate_chat_response(message, pdf_text, username, streak, weak_areas, topics)
    return jsonify({
        "response": reply,
        "filename": filename
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)


