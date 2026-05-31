import re
import os
import random

try:
    import fitz  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False
except Exception:
    HAS_FITZ = False

try:
    import pypdf
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

try:
    import torch
    from transformers import T5ForConditionalGeneration, T5Tokenizer
    HAS_TRANSFORMERS = True
except Exception:
    HAS_TRANSFORMERS = False

try:
    import spacy
    try:
        nlp_spacy = spacy.load("en_core_web_sm")
        HAS_SPACY = True
    except:
        HAS_SPACY = False
except Exception:
    HAS_SPACY = False


class NLPEngine:
    def __init__(self):
        self.has_model = False
        if HAS_TRANSFORMERS:
            try:
                self.device = "cuda" if torch.cuda.is_available() else "cpu"
                self.tokenizer = T5Tokenizer.from_pretrained("t5-small")
                self.model = T5ForConditionalGeneration.from_pretrained("t5-small").to(self.device)
                self.has_model = True
            except Exception as e:
                print(f"Transformers Model loading failed: {e}")

    # ── PDF Text Extraction ──────────────────────────────────────────────
    def extract_text_from_pdf(self, pdf_path):
        if HAS_FITZ:
            try:
                doc = fitz.open(pdf_path)
                text = ""
                for page in doc:
                    text += page.get_text()
                return text
            except Exception as e:
                print(f"PyMuPDF extraction failed: {e}")

        if HAS_PYPDF:
            try:
                reader = pypdf.PdfReader(pdf_path)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() or ""
                return text
            except Exception as e:
                print(f"pypdf extraction failed: {e}")

        return "Could not extract text from PDF. Please check environment dependencies."

    # ── Concept / Topic Extraction ───────────────────────────────────────
    def extract_concepts(self, text):
        if HAS_SPACY:
            try:
                doc = nlp_spacy(text[:10000])
                concepts = [chunk.text for chunk in doc.noun_chunks if len(chunk.text) > 3]
                return list(set(concepts))[:10]
            except:
                pass

        # Word frequency fallback without stop words
        from collections import Counter
        stop_words = {"this", "that", "with", "from", "your", "what", "how", "when", "where", "who", "why", "there", "their", "then", "than", "could", "would", "should", "these", "those", "because", "which", "while", "about", "other", "after"}
        words = re.findall(r'\b[A-Za-z]{5,}\b', text.lower())
        counts = Counter(w for w in words if w not in stop_words)
        top = [w.title() for w, c in counts.most_common(12)]
        return top[:10]

    def extract_topics_with_context(self, text):
        """Return a list of {topic, context_snippet} dicts so we can generate
        per-topic questions and flashcards."""
        concepts = self.extract_concepts(text)
        
        # Clean up the text by removing newlines that break sentences
        clean_text = text.replace('\n', ' ')
        # Split into whole sentences to avoid chopping words in half 
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', clean_text) if len(s.strip()) > 15]
        
        topics = []
        for concept in concepts:
            # Gather sentences containing this concept
            ctx_sentences = [s for s in sentences if concept.lower() in s.lower()]
            if ctx_sentences:
                # Use exactly 1 sentence for optimal flashcard conciseness
                snippet = ctx_sentences[0]
            else:
                snippet = f"{concept} is a core concept covered in this study material."
                
            topics.append({
                "topic": concept,
                "context": snippet
            })
        return topics

    # ── Question Generation (per-topic) ──────────────────────────────────
    def generate_questions(self, context, num_questions=3):
        fallback_concepts = self.extract_concepts(context)

        if not self.has_model:
            if fallback_concepts:
                return [f"Based on the text, what is the significance of '{c}'?" for c in fallback_concepts[:num_questions]]
            return [
                "What is the main topic of this section?",
                "How does this relate to the previous concept?",
                "Can you summarize the key takeaways?"
            ]

        try:
            input_text = "generate questions: " + context
            inputs = self.tokenizer.encode(input_text, return_tensors="pt", truncation=True, max_length=512).to(self.device)
            outputs = self.model.generate(
                inputs,
                max_length=128,
                num_beams=4,
                num_return_sequences=num_questions,
                early_stopping=True
            )
            questions = [self.tokenizer.decode(output, skip_special_tokens=True) for output in outputs]

            if not questions or all(len(q) < 5 for q in questions):
                raise Exception("Model returned insufficient output")
            return questions
        except Exception as e:
            print(f"Question generation failed: {e}")
            if fallback_concepts:
                return [f"Explain the concept of '{c}' as described in the PDF." for c in fallback_concepts[:num_questions]]
            return ["What are the key points of the uploaded document?"]

    def generate_diagnostic_quiz(self, topics_with_context):
        """Generate a diagnostic quiz with questions tagged by topic so we can
        score per-topic performance and detect weak areas. Uses T5 AI where possible."""
        quiz = []
        all_topics = [item["topic"] for item in topics_with_context]
        
        for item in topics_with_context:
            topic = item["topic"]
            ctx = item["context"]
            
            q_text = None
            
            # --- AI Question Generation (T5) ---
            if self.has_model:
                try:
                    # Specialized prompt for MCQ stem generation
                    prompt = f"generate question: {ctx} answer: {topic}"
                    inputs = self.tokenizer.encode(prompt, return_tensors="pt", truncation=True, max_length=512).to(self.device)
                    outputs = self.model.generate(
                        inputs, 
                        max_length=64, 
                        num_beams=4, 
                        early_stopping=True
                    )
                    gen_q = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                    
                    if len(gen_q) > 15 and "?" in gen_q:
                        q_text = gen_q
                except Exception as e:
                    print(f"AI QG failed for topic {topic}: {e}")

            # --- Fallback: Rule-based (Fill-in-the-blank) ---
            if not q_text:
                sentences = re.split(r'[.!?]', ctx)
                relevant = [s.strip() for s in sentences if topic.lower() in s.lower() and len(s.strip()) > 15]
                
                if relevant:
                    # Replace only the first occurrence of the topic with a single blank
                    q_text = re.sub(re.escape(topic), "_____", relevant[0], count=1, flags=re.IGNORECASE)
                    if not q_text.endswith("?"):
                        q_text += "?"
                    q_text = f"Fill in the blank: {q_text}"
                else:
                    q_text = f"Which of the following describes the key aspects of '{topic}'?"

            distractors = self._generate_distractors(topic, all_topics)
            options = [topic] + distractors
            random.shuffle(options)
            
            quiz.append({
                "topic": topic,
                "question": q_text,
                "options": options,
                "correct_answer": topic,
                "context_snippet": ctx[:200]
            })
            
        return quiz

    def _generate_distractors(self, correct, all_topics):
        """Use other extracted topics as distractors for realism."""
        others = [t for t in all_topics if t.lower() != correct.lower()]
        if len(others) >= 3:
            return random.sample(others, 3)
        
        # Fallback if too few topics
        bases = ["None of the above", "All of the above", "Not applicable", "Undefined"]
        random.shuffle(bases)
        return bases[:3]

    # ── Flashcard Generation ─────────────────────────────────────────────
    def generate_flashcards(self, topics_with_context):
        """Return exactly ONE highly relevant flashcard per topic with exact extracted context."""
        flashcards = []
        for item in topics_with_context:
            topic = item["topic"]
            ctx = item["context"]

            # Use the explicitly extracted sentences from the PDF as the definitive answer
            answer = ctx if len(ctx) > 10 else f"A core concept found in the material related to '{topic}'."
            
            flashcards.append({
                "front": f"Discuss the context or definition of: {topic}",
                "back": answer,
                "topic": topic
            })

        return flashcards

    def generate_chat_response(self, user_query, pdf_text, username, streak, weak_areas, topics):
        """Generate a response to a study query using the extracted PDF context and user profile info."""
        query = user_query.strip().lower()
        
        # Check if user asks about streaks
        if "streak" in query:
            return f"Hello {username}! Your current daily learning streak is 🔥 **{streak} day(s)**. Keep logging in daily and completing your planner checklist tasks to keep the streak alive!"

        # Check if user asks about weak areas
        if "weak area" in query or "weakness" in query or "weak topics" in query:
            if weak_areas:
                weak_str = ", ".join(weak_areas)
                return f"Sure {username}! Your current weak areas (detected from recent quizzes) are: ⚠️ **{weak_str}**. I recommend going to the Dashboard or Planner and practicing a dedicated quiz for these concepts."
            else:
                return f"Excellent news {username}! You do not have any weak areas detected in your profile. Complete some quizzes on the Dashboard so I can analyze your mastery!"

        # If user asks about their study plan or topics
        if "study plan" in query or "schedule" in query or "what should i study" in query or "topics" in query:
            if topics:
                top_str = ", ".join(topics[:5])
                return f"Hi {username}! Currently, your study topics include: **{top_str}**. You can view your FullCalendar schedule on the Study Planner page or practice custom quizzes directly from the Dashboard key insights."
            else:
                return f"Hi {username}! Your study plan is currently empty. Please upload course slides PDF on the Dashboard to generate a dynamic monthly schedule!"

        # Search PDF text context
        matched_sentences = []
        if pdf_text and len(pdf_text) > 100:
            clean_text = pdf_text.replace('\n', ' ')
            sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', clean_text) if len(s.strip()) > 15]
            
            # Extract main keywords from the query
            words = [w for w in re.findall(r'\b[A-Za-z]{4,}\b', query) 
                     if w not in {"explain", "what", "about", "study", "topic", "please", "concept", "define", "definition", "tell", "slide", "slides"}]
            
            # Find matching sentences
            for s in sentences:
                for word in words:
                    if word in s.lower() and s not in matched_sentences:
                        matched_sentences.append(s)
                        if len(matched_sentences) >= 3:
                            break
                if len(matched_sentences) >= 3:
                    break

        if matched_sentences:
            context_info = " ".join(matched_sentences)
            return f"Hi {username}! According to your uploaded slides document:\n\n💬 *\"{context_info}\"*\n\nLet me know if you would like me to break down any of these terms further!"

        # Fallback greetings / explanations
        # Try matching simple topic names
        if topics:
            for t in topics:
                if t.lower() in query:
                    return f"Ah, {username}! '{t}' is one of your active study topics. It is covered in your course material. Try creating flashcards or practicing a quiz on '{t}' to reinforce your memory!"

        # General helper message
        return f"Hello {username}! I am your AI Study Buddy. I can explain concepts from your uploaded PDF slides, show your active study topics, identify your quiz weak areas, or check your login streak (🔥 {streak}d). What would you like to review today?"

    def summarize_transcript(self, text):
        """Summarize user's voice notes/transcript using T5 or fallback bullet-points."""
        if not text or len(text.strip()) < 10:
            return ["Transcript too short to summarize."]

        # Attempt AI summarization
        if self.has_model:
            try:
                input_text = "summarize: " + text
                inputs = self.tokenizer.encode(input_text, return_tensors="pt", truncation=True, max_length=512).to(self.device)
                outputs = self.model.generate(
                    inputs,
                    max_length=150,
                    min_length=30,
                    length_penalty=2.0,
                    num_beams=4,
                    early_stopping=True
                )
                summary = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                if len(summary.strip()) > 10:
                    # Split summary into distinct sentences as bullets
                    bullets = [s.strip() + "." for s in re.split(r'\. ', summary) if len(s.strip()) > 5]
                    return bullets
            except Exception as e:
                print(f"T5 Transcript summarization failed: {e}")

        # Robust NLP Fallback: Extract key sentences and noun concepts
        clean_text = text.replace('\n', ' ')
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', clean_text) if len(s.strip()) > 10]
        
        if not sentences:
            return ["No structured sentences found in transcription. Try speaking in complete statements."]
            
        concepts = self.extract_concepts(text)
        bullets = []
        
        # 1. Main concept bullet
        if concepts:
            bullets.append(f"Primary study concepts identified in note: {', '.join(concepts[:5])}.")
            
        # 2. Extract up to 3 most important sentences
        selected_sentences = []
        for concept in concepts[:3]:
            for s in sentences:
                if concept.lower() in s.lower() and s not in selected_sentences:
                    selected_sentences.append(s)
                    break
        
        # Add remaining fallback sentences if we don't have enough bullets
        for s in sentences:
            if len(selected_sentences) >= 3:
                break
            if s not in selected_sentences:
                selected_sentences.append(s)
                
        for s in selected_sentences[:3]:
            if not s.endswith(('.', '!', '?')):
                s += '.'
            bullets.append(s)
            
        return bullets

    def generate_flashcards_from_text(self, text):
        """Extract concepts from voice notes and construct matching spaced-repetition flashcards."""
        if not text or len(text.strip()) < 15:
            return []
            
        concepts = self.extract_concepts(text)
        if not concepts:
            concepts = ["Key Takeaway", "Study Note"]
            
        # Filter concepts to avoid generic filler words in fallback counter
        ignored_words = {
            "between", "represents", "statistical", "method", "variable", "dependent", 
            "independent", "using", "through", "under", "about", "called", "would", 
            "should", "could", "first", "second", "third", "where", "there", "their", 
            "these", "those", "other", "another", "simple", "example", "please", "study"
        }
        filtered_concepts = [c for c in concepts if c.lower() not in ignored_words]
        
        # Fallback if filtered list is empty
        if not filtered_concepts:
            filtered_concepts = [c for c in concepts]
            
        # Select top 4 concepts for clean flashcard creation
        selected_concepts = filtered_concepts[:4]
        
        clean_text = text.replace('\n', ' ')
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', clean_text) if len(s.strip()) > 10]
        
        flashcards = []
        for concept in selected_concepts:
            matching_s = [s for s in sentences if concept.lower() in s.lower()]
            if matching_s:
                answer = matching_s[0]
            else:
                answer = text[:150] + "..." if len(text) > 150 else text
                
            if not answer.endswith(('.', '!', '?')):
                answer += '.'
                
            flashcards.append({
                "topic": concept,
                "front": f"Explain the concept of '{concept}' as described in your voice study notes.",
                "back": answer
            })
            
        return flashcards

    def generate_oral_question(self, topic, context):
        """Generate a study question for oral test viva practice based on topic and slide context."""
        if not context or len(context.strip()) < 15:
            return f"Can you explain the main definition, characteristics, and practical application of the topic '{topic}'?"

        if self.has_model:
            try:
                prompt = f"generate question: {context} topic: {topic}"
                inputs = self.tokenizer.encode(prompt, return_tensors="pt", truncation=True, max_length=512).to(self.device)
                outputs = self.model.generate(
                    inputs, 
                    max_length=64, 
                    num_beams=4, 
                    early_stopping=True
                )
                gen_q = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                if len(gen_q) > 12 and "?" in gen_q:
                    return gen_q
            except Exception as e:
                print(f"Oral QG failed for {topic}: {e}")

        questions_pool = [
            f"What is the significance of '{topic}' in this course, and how would you explain it to a beginner?",
            f"Based on your study material, how would you define '{topic}' and what are its key features?",
            f"Can you summarize the primary purpose, details, and function of '{topic}' as mentioned in the slides?",
            f"Explain what '{topic}' means and provide any specific examples or equations associated with it."
        ]
        return random.choice(questions_pool)

    def evaluate_oral_answer(self, topic, question, user_answer, reference_context):
        """Semantically grade user's spoken answer against reference slide context."""
        if not user_answer or len(user_answer.strip()) < 5:
            return {
                "score": 0,
                "grade": "Needs Review",
                "mentioned_keywords": [],
                "missing_keywords": [],
                "feedback": "It looks like you didn't provide a spoken answer. Please record your voice and try again!"
            }

        ref_clean = reference_context.lower()
        ans_clean = user_answer.lower()

        stop_words = {
            "this", "that", "with", "from", "your", "what", "how", "when", "where", 
            "who", "why", "there", "their", "then", "than", "could", "would", "should", 
            "these", "those", "because", "which", "while", "about", "other", "after", 
            "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", 
            "do", "does", "did", "a", "an", "the", "and", "but", "if", "or", "as", 
            "of", "at", "by", "for", "to", "in", "on", "into", "onto", "under", "over", 
            "again", "further", "then", "once", "here", "there", "when", "where", "why", 
            "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", 
            "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
            "can", "will", "just", "should", "now", "topic", "context"
        }
        
        ref_words = re.findall(r'\b[a-z]{4,}\b', ref_clean)
        ref_keywords = list(set([w for w in ref_words if w not in stop_words and len(w) > 4]))
        
        topic_words = re.findall(r'\b[a-z]{4,}\b', topic.lower())
        for tw in topic_words:
            if tw not in ref_keywords and tw not in stop_words:
                ref_keywords.append(tw)

        ref_keywords = ref_keywords[:15]

        mentioned = []
        missing = []
        for kw in ref_keywords:
            if kw in ans_clean:
                mentioned.append(kw.capitalize())
            else:
                missing.append(kw.capitalize())

        total_keywords = len(ref_keywords)
        score = 0
        if total_keywords > 0:
            score = int((len(mentioned) / total_keywords) * 100)
            
        word_count = len(ans_clean.split())
        if word_count > 30 and score < 90:
            score = min(100, score + 10)

        if score >= 75:
            grade = "Mastered"
        elif score >= 45:
            grade = "Partial Match"
        else:
            grade = "Needs Review"

        feedback = ""
        if self.has_model:
            try:
                prompt = f"summarize: user answered '{user_answer}' to question '{question}' about '{topic}' based on slide '{reference_context}'."
                inputs = self.tokenizer.encode(prompt, return_tensors="pt", truncation=True, max_length=512).to(self.device)
                outputs = self.model.generate(
                    inputs, 
                    max_length=90, 
                    num_beams=4, 
                    early_stopping=True
                )
                gen_feed = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                if len(gen_feed) > 20:
                    feedback = gen_feed
            except Exception as e:
                print(f"Feedback generation failed: {e}")

        if not feedback:
            if grade == "Mastered":
                feedback = (
                    f"Excellent explanation! You successfully explained the concept of '{topic}'. "
                    f"You mentioned key aspects like: {', '.join(mentioned[:4])}. You have a very strong understanding of this concept!"
                )
            elif grade == "Partial Match":
                missing_str = f" Try to also mention: {', '.join(missing[:3])}." if missing else ""
                feedback = (
                    f"Good effort! You understand the basic idea of '{topic}' but missed a few crucial details from the course slides.{missing_str} "
                    f"Review these slides again to build complete mastery."
                )
            else:
                missing_str = f" make sure to explain: {', '.join(missing[:4])}." if missing else ""
                feedback = (
                    f"Your answer was a bit brief or missed the main definition of '{topic}'. "
                    f"In your next attempt,{missing_str} Refer to your study planner to schedule a spaced revision session."
                )

        return {
            "score": score,
            "grade": grade,
            "mentioned_keywords": mentioned,
            "missing_keywords": missing,
            "feedback": feedback
        }


if __name__ == "__main__":
    engine = NLPEngine()
