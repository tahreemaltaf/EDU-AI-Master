import fitz  # PyMuPDF
import torch
import re
try:
    from transformers import T5ForConditionalGeneration, T5Tokenizer
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False

try:
    import spacy
    nlp_spacy = spacy.load("en_core_web_sm")
    HAS_SPACY = True
except Exception:
    HAS_SPACY = False

class NLPEngine:
    def __init__(self):
        if HAS_TRANSFORMERS:
            try:
                self.device = "cuda" if torch.cuda.is_available() else "cpu"
                self.tokenizer = T5Tokenizer.from_pretrained("t5-small")
                self.model = T5ForConditionalGeneration.from_pretrained("t5-small").to(self.device)
                self.has_model = True
            except Exception:
                self.has_model = False
        else:
            self.has_model = False

    def extract_text_from_pdf(self, pdf_path):
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text

    def generate_questions(self, context, num_questions=3):
        if not self.has_model:
            return ["What is the main topic of this section?", "How does this relate to the previous concept?", "Can you summarize the key takeaways?"]
            
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
        return questions

    def extract_concepts(self, text):
        if HAS_SPACY:
            doc = nlp_spacy(text[:10000]) # Limit to first 10k chars for speed
            concepts = [chunk.text for chunk in doc.noun_chunks if len(chunk.text) > 3]
            return list(set(concepts))[:10]
        
        concepts = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
        return list(set(concepts))[:10]

if __name__ == "__main__":
    engine = NLPEngine()
    # test_text = "The quick brown fox jumps over the lazy dog."
    # print(engine.generate_questions(test_text))
