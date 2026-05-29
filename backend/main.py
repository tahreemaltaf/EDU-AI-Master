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


@app.route('/api/study-plan', methods=['GET'])
def get_study_plan():
    """Return the current personalised study plan."""
    return jsonify({"study_plan": _session["study_plan"]})


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


if __name__ == '__main__':
    app.run(debug=True, port=5000)
