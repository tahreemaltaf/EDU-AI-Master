# AI Personalized Study Planner & Quiz Generator
**"Study Smarter, Not Harder"**

## Overview
EduAI Master is a comprehensive study platform that uses NLP to transform lecture notes into an interactive learning experience. Students upload their course slides or notes (PDF), and the AI extracts key concepts, identifies weak areas based on a diagnostic quiz, and builds a personalized day-by-day study plan with auto-generated practice questions and flashcards.

## Features
- **PDF Concept Mapping:** Automatically extracts keywords and topics from uploaded files.
- **AI Quiz Generator:** Generates MCQs and Flashcards using HuggingFace T5.
- **Diagnostic Quiz:** Per-topic scoring to identify weak areas in the student's knowledge.
- **Weak Area Detection:** Analyses quiz results to pinpoint topics that need extra focus.
- **Personalised Study Plan:** Day-by-day schedule weighted by weakness -- weak topics get more sessions.
- **Auto-Generated Flashcards:** Front/back flashcards created from the PDF content for each topic.
- **Smart Study Planner:** Timeline and list views with study, quiz, and spaced review sessions.
- **Performance Analytics:** Visual charts tracking topic mastery, weak vs strong breakdown, and study streaks.
- **Spaced Repetition:** Optimized review cycles based on performance (SM-2 Algorithm).

## Tech Stack
- **Frontend:** React.js, Chart.js, Framer Motion, Lucide Icons.
- **Backend:** Python, Flask, PyMuPDF, HuggingFace (T5), Torch.
- **Tools:** Git, Vite.

## Setup Instructions

### Backend
1. Navigate to `/backend`.
2. Create a virtual environment: `python -m venv venv`.
3. Activate it: `venv\Scripts\activate`.
4. Install dependencies: `pip install -r requirements.txt`.
5. Run the server: `python main.py`.

### Frontend
1. Navigate to `/frontend`.
2. Install dependencies: `npm install`.
3. Run the dev server: `npm run dev`.

## Team
- Tahreem Altaf 230962
- Mehar u Nisa 230988
- Komal Nisar 230912

## Demo
[Link to Video Demo]
