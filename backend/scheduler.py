from datetime import datetime, timedelta


class SpacedRepetitionScheduler:
    def __init__(self):
        pass

    # ── SM-2 Spaced Repetition ───────────────────────────────────────────
    def calculate_next_review(self, current_interval, ease_factor, quality):
        """
        quality: 0 (forgot), 1 (hard), 2 (good), 3 (easy)
        """
        if quality == 0:
            return 1, 2.5, datetime.now() + timedelta(days=1)

        if current_interval == 0:
            next_interval = 1
        elif current_interval == 1:
            next_interval = 6
        else:
            next_interval = round(current_interval * ease_factor)

        new_ease_factor = ease_factor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02))
        if new_ease_factor < 1.3:
            new_ease_factor = 1.3

        return next_interval, new_ease_factor, datetime.now() + timedelta(days=next_interval)

    def generate_study_plan(self, topics, start_date=None):
        """Generate a basic but detailed study plan before weak areas are known."""
        if not start_date:
            start_date = datetime.now()

        plan = []
        day_offset = 0

        for topic in topics:
            # 1. Initial Study
            plan.append({
                "topic": topic,
                "date": (start_date + timedelta(days=day_offset)).strftime("%Y-%m-%d"),
                "day": day_offset + 1,
                "activity": f"Module Study: {topic}",
                "type": "study",
                "status": "upcoming"
            })
            day_offset += 1
            
            # 2. Practice & Review
            plan.append({
                "topic": topic,
                "date": (start_date + timedelta(days=day_offset)).strftime("%Y-%m-%d"),
                "day": day_offset + 1,
                "activity": "Flashcards & Practice Test",
                "type": "quiz",
                "status": "upcoming"
            })
            day_offset += 1
            
        # Add final integration days
        plan.append({
            "topic": "All Module Integration",
            "date": (start_date + timedelta(days=day_offset)).strftime("%Y-%m-%d"),
            "day": day_offset + 1,
            "activity": "Past Papers & Full Mock Exam",
            "type": "review",
            "status": "upcoming"
        })

        return plan

    # ── Weak-Area Analysis ───────────────────────────────────────────────
    @staticmethod
    def analyse_weak_areas(quiz_results):
        """
        quiz_results: list of {topic, correct: bool}
        Returns a list of {topic, total, correct, score, is_weak} sorted
        weakest-first.
        """
        topic_stats = {}
        for r in quiz_results:
            t = r["topic"]
            if t not in topic_stats:
                topic_stats[t] = {"total": 0, "correct": 0}
            topic_stats[t]["total"] += 1
            if r.get("correct"):
                topic_stats[t]["correct"] += 1

        analysis = []
        for topic, stats in topic_stats.items():
            score = round(stats["correct"] / max(stats["total"], 1) * 100)
            analysis.append({
                "topic": topic,
                "total": stats["total"],
                "correct": stats["correct"],
                "score": score,
                "is_weak": score < 60  # below 60% is a weak area
            })

        analysis.sort(key=lambda x: x["score"])
        return analysis

    # ── Personalised Study Plan (weak areas get more time) ───────────────
    def generate_personalised_plan(self, weak_area_analysis, start_date=None):
        """
        Build a day-by-day plan that prioritises weak topics.
        Weak topics get 2-3 study sessions; strong topics get 1 session.
        Review sessions are scheduled using spaced repetition gaps.
        """
        if not start_date:
            start_date = datetime.now()

        plan = []
        day_offset = 0

        # Phase 1: Focus sessions - weak topics first, more days
        for item in weak_area_analysis:
            topic = item["topic"]
            score = item["score"]

            if score < 40:
                sessions = 3          # very weak: 3 days
                activity = "Deep Review"
            elif score < 60:
                sessions = 2          # weak: 2 days
                activity = "Focused Study"
            else:
                sessions = 1          # strong: 1 day
                activity = "Quick Review"

            for s in range(sessions):
                study_date = start_date + timedelta(days=day_offset)
                plan.append({
                    "topic": topic,
                    "date": study_date.strftime("%Y-%m-%d"),
                    "day": day_offset + 1,
                    "activity": activity,
                    "type": "study",
                    "status": "upcoming",
                    "score": score
                })
                day_offset += 1

        # Phase 2: Practice quiz days (every 3rd day)
        quiz_day = day_offset
        weak_topics = [a["topic"] for a in weak_area_analysis if a["is_weak"]]
        for i, topic in enumerate(weak_topics[:3]):
            quiz_date = start_date + timedelta(days=quiz_day)
            plan.append({
                "topic": topic,
                "date": quiz_date.strftime("%Y-%m-%d"),
                "day": quiz_day + 1,
                "activity": "Practice Quiz",
                "type": "quiz",
                "status": "upcoming",
                "score": None
            })
            quiz_day += 1

        # Phase 3: Spaced review for all topics
        for item in weak_area_analysis:
            review_gap = 3 if item["is_weak"] else 7
            review_date = start_date + timedelta(days=quiz_day + review_gap)
            plan.append({
                "topic": item["topic"],
                "date": review_date.strftime("%Y-%m-%d"),
                "day": quiz_day + review_gap + 1,
                "activity": "Spaced Review",
                "type": "review",
                "status": "upcoming",
                "score": item["score"]
            })

        return plan
