# Project Report: AI Personalized Study Planner & Quiz Generator
**Study Smarter, Not Harder**

## 1. Introduction
The digital age has brought an explosion of educational content, yet students often struggle with information overload and inefficient study habits. Our project, the **AI Personalized Study Planner**, aims to solve this by leveraging NLP and machine learning to automate the creation of study materials and schedules...

## 2. Problem Statement
Traditional study methods are often manual, time-consuming, and fail to account for individual learning curves. Students spend too much time organizing and not enough time learning...

## 3. System Architecture
Our system consists of three main layers:
- **Data Layer:** PyMuPDF for text extraction from course slides.
- **AI Layer:** HuggingFace T5 for MCQ generation and custom Spaced Repetition algorithms for scheduling.
- **Presentation Layer:** A glassmorphism-inspired React dashboard with FullCalendar.js for scheduling and Chart.js for analytics.

## 4. Methodology
### 4.1 NLP & Text Extraction
We use PyMuPDF to parse PDF files. Text is then cleaned and processed to identify key concepts using frequency analysis and named entity recognition...

### 4.2 Model Selection (T5 vs GPT)
We compared T5-small and GPT-based models for question generation. While GPT provides more creative questions, T5 offers better performance for factual extraction from provided text blocks...

## 5. Evaluation Metrics
- **Accuracy:** The relevance of generated questions to the text.
- **Latency:** Time taken to process a 50-page PDF.
- **Engagement:** Retention rate measured via spaced repetition intervals.

[... More content to be added ...]
