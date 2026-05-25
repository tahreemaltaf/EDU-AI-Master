from datetime import datetime, timedelta

class SpacedRepetitionScheduler:
    def __init__(self):
        # Default intervals for SM-2 simplified
        # 1: Again (1 day), 2: Hard (2 days), 3: Good (4 days), 4: Easy (7 days)
        pass

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
            
        # Update ease factor
        new_ease_factor = ease_factor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02))
        if new_ease_factor < 1.3:
            new_ease_factor = 1.3
            
        return next_interval, new_ease_factor, datetime.now() + timedelta(days=next_interval)

    def generate_study_plan(self, topics, start_date=None):
        if not start_date:
            start_date = datetime.now()
        
        plan = []
        for i, topic in enumerate(topics):
            study_date = start_date + timedelta(days=i)
            plan.append({
                "topic": topic,
                "date": study_date.strftime("%Y-%m-%d"),
                "status": "upcoming"
            })
        return plan
