from flask import Flask, request, jsonify
from flask_cors import CORS
from nlp_engine import NLPEngine
from scheduler import SpacedRepetitionScheduler
import os

app = Flask(__name__)
CORS(app)

nlp = NLPEngine()
scheduler = SpacedRepetitionScheduler()

@app.route('/api/upload', methods=['POST'])
def upload_pdf():
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
    concepts = nlp.extract_concepts(text)
    
    # Generate an initial study plan based on extracted concepts
    study_plan = scheduler.generate_study_plan(concepts)
    
    return jsonify({
        "message": "File uploaded successfully",
        "concepts": concepts,
        "study_plan": study_plan,
        "text_preview": text[:500]
    })

@app.route('/api/generate-quiz', methods=['POST'])
def generate_quiz():
    data = request.json
    context = data.get("context", "")
    questions = nlp.generate_questions(context)
    return jsonify({"questions": questions})

@app.route('/api/update-progress', methods=['POST'])
def update_progress():
    data = request.json
    # Logic to update spaced repetition intervals
    # quality: 0-3
    quality = data.get("quality", 2)
    current_interval = data.get("interval", 1)
    ease_factor = data.get("ease_factor", 2.5)
    
    next_interval, new_ease, next_review = scheduler.calculate_next_review(current_interval, ease_factor, quality)
    
    return jsonify({
        "next_review": next_review.strftime("%Y-%m-%d"),
        "interval": next_interval,
        "ease_factor": new_ease
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
