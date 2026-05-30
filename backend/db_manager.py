import sqlite3
import os
import json
from datetime import datetime

DATABASE_FILE = os.path.join(os.path.dirname(__file__), "database.db")

def get_db_connection():
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create database tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Users Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            streak INTEGER DEFAULT 1,
            last_login TEXT
        )
    """)
    
    # 2. Study Plan Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS study_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            day INTEGER,
            topic TEXT,
            activity TEXT,
            type TEXT,
            date TEXT,
            completed INTEGER DEFAULT 0,
            logged_hours REAL DEFAULT 0.0,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # Ensure existing tables have the logged_hours column
    try:
        cursor.execute("ALTER TABLE study_plans ADD COLUMN logged_hours REAL DEFAULT 0.0")
    except sqlite3.OperationalError:
        pass
    
    # 3. Flashcards Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS flashcards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            topic TEXT,
            front TEXT,
            back TEXT,
            interval INTEGER DEFAULT 1,
            ease_factor REAL DEFAULT 2.5,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # 4. Quiz Scores Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS quiz_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            topic TEXT,
            score INTEGER,
            date TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # 5. Study Logs Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS study_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            hours REAL NOT NULL,
            date TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    conn.commit()
    conn.close()

# ── User Profile Operations ───────────────────────────────────────────

def get_or_create_user(username):
    """Retrieve an existing user profile or create a new one."""
    if not username:
        return None
        
    username_clean = username.strip()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE username = ?", (username_clean,))
    user = cursor.fetchone()
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    if user:
        # Update streak logic
        streak = user["streak"]
        last_login = user["last_login"]
        
        if last_login:
            try:
                last_date = datetime.strptime(last_login, "%Y-%m-%d")
                delta_days = (datetime.now() - last_date).days
                if delta_days == 1:
                    streak += 1
                elif delta_days > 1:
                    streak = 1  # Streak broken
            except Exception:
                pass
                
        cursor.execute("UPDATE users SET last_login = ?, streak = ? WHERE id = ?", (today_str, streak, user["id"]))
        conn.commit()
        
        user_dict = {
            "id": user["id"],
            "username": user["username"],
            "streak": streak,
            "last_login": today_str
        }
    else:
        # Create new user profile
        cursor.execute("INSERT INTO users (username, streak, last_login) VALUES (?, 1, ?)", (username_clean, today_str))
        conn.commit()
        user_id = cursor.lastrowid
        user_dict = {
            "id": user_id,
            "username": username_clean,
            "streak": 1,
            "last_login": today_str
        }
        
    conn.close()
    return user_dict

# ── Study Plan Operations ─────────────────────────────────────────────

def save_study_plan(user_id, plan_list):
    """Replace study plan for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM study_plans WHERE user_id = ?", (user_id,))
    
    for item in plan_list:
        cursor.execute("""
            INSERT INTO study_plans (user_id, day, topic, activity, type, date, completed, logged_hours)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id, 
            item.get("day", 1), 
            item.get("topic"), 
            item.get("activity"), 
            item.get("type", "study"), 
            item.get("date"),
            1 if item.get("completed") or item.get("status") == "completed" else 0,
            item.get("logged_hours", 0.0)
        ))
        
    conn.commit()
    conn.close()

def get_study_plan(user_id):
    """Retrieve study plan for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM study_plans WHERE user_id = ? ORDER BY id ASC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    plan = []
    for r in rows:
        plan.append({
            "day": r["day"],
            "topic": r["topic"],
            "activity": r["activity"],
            "type": r["type"],
            "date": r["date"],
            "completed": True if r["completed"] == 1 else False,
            "status": "completed" if r["completed"] == 1 else "upcoming",
            "logged_hours": r["logged_hours"] if "logged_hours" in r.keys() else 0.0
        })
    return plan

def update_task_date(user_id, task_idx, new_date):
    """Update task date by relative index order."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM study_plans WHERE user_id = ? ORDER BY id ASC", (user_id,))
    ids = [row["id"] for row in cursor.fetchall()]
    
    if 0 <= task_idx < len(ids):
        target_id = ids[task_idx]
        cursor.execute("UPDATE study_plans SET date = ? WHERE id = ?", (new_date, target_id))
        conn.commit()
        success = True
    else:
        success = False
        
    conn.close()
    return success

def reschedule_review_task(user_id, topic, next_review_date):
    """Reschedule the Spaced Review task for a topic."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if a review task already exists
    cursor.execute("""
        SELECT id FROM study_plans 
        WHERE user_id = ? AND LOWER(topic) = LOWER(?) AND type = 'review'
    """, (user_id, topic))
    row = cursor.fetchone()
    
    if row:
        cursor.execute("UPDATE study_plans SET date = ? WHERE id = ?", (next_review_date, row["id"]))
        conn.commit()
    else:
        # Create a new review task dynamically
        cursor.execute("SELECT COUNT(*) as count FROM study_plans WHERE user_id = ?", (user_id,))
        count = cursor.fetchone()["count"]
        
        cursor.execute("""
            INSERT INTO study_plans (user_id, day, topic, activity, type, date, completed)
            VALUES (?, ?, ?, 'Spaced Review', 'review', ?, 0)
        """, (user_id, count + 1, topic, next_review_date))
        conn.commit()
        
    conn.close()

def toggle_task_completion(user_id, task_idx):
    """Toggle complete status by index."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, completed FROM study_plans WHERE user_id = ? ORDER BY id ASC", (user_id,))
    rows = cursor.fetchall()
    
    if 0 <= task_idx < len(rows):
        target_id = rows[task_idx]["id"]
        new_val = 1 if rows[task_idx]["completed"] == 0 else 0
        cursor.execute("UPDATE study_plans SET completed = ? WHERE id = ?", (new_val, target_id))
        conn.commit()
        success = True
    else:
        success = False
        
    conn.close()
    return success

# ── Flashcard Operations ──────────────────────────────────────────────

def save_flashcards(user_id, flashcards_list):
    """Replace flashcards list for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM flashcards WHERE user_id = ?", (user_id,))
    
    for card in flashcards_list:
        cursor.execute("""
            INSERT INTO flashcards (user_id, topic, front, back, interval, ease_factor)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            user_id, 
            card.get("topic"), 
            card.get("front"), 
            card.get("back"),
            card.get("interval", 1),
            card.get("ease_factor", 2.5)
        ))
        
    conn.commit()
    conn.close()

def get_flashcards(user_id):
    """Retrieve flashcards for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM flashcards WHERE user_id = ? ORDER BY id ASC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    cards = []
    for r in rows:
        cards.append({
            "topic": r["topic"],
            "front": r["front"],
            "back": r["back"],
            "interval": r["interval"],
            "ease_factor": r["ease_factor"]
        })
    return cards

def get_flashcard_by_topic(user_id, topic):
    """Fetch tracking stats of a single flashcard by topic."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM flashcards WHERE user_id = ? AND LOWER(topic) = LOWER(?)", (user_id, topic))
    row = cursor.fetchone()
    conn.close()
    return row

def update_flashcard_sm2(user_id, topic, new_interval, new_ease):
    """Update SM2 intervals for a flashcard."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE flashcards SET interval = ?, ease_factor = ? 
        WHERE user_id = ? AND LOWER(topic) = LOWER(?)
    """, (new_interval, new_ease, user_id, topic))
    
    conn.commit()
    conn.close()

# ── Quiz Score Operations ─────────────────────────────────────────────

def save_quiz_score(user_id, topic, score):
    """Save quiz score details."""
    conn = get_db_connection()
    cursor = conn.cursor()
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    cursor.execute("""
        INSERT INTO quiz_scores (user_id, topic, score, date)
        VALUES (?, ?, ?, ?)
    """, (user_id, topic, score, today_str))
    
    conn.commit()
    conn.close()

def get_quiz_scores(user_id):
    """Retrieve quiz scores of a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM quiz_scores WHERE user_id = ? ORDER BY id ASC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [{"topic": r["topic"], "score": r["score"], "date": r["date"]} for r in rows]

# ── Study Logs Operations ─────────────────────────────────────────────

def log_study_hours(user_id, hours, date):
    """Log study hours for a user. If a log exists for that day, aggregate the hours."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if a log entry already exists for this user and date
    cursor.execute("SELECT id, hours FROM study_logs WHERE user_id = ? AND date = ?", (user_id, date))
    row = cursor.fetchone()
    
    if row:
        new_hours = row["hours"] + hours
        cursor.execute("UPDATE study_logs SET hours = ? WHERE id = ?", (new_hours, row["id"]))
    else:
        cursor.execute("INSERT INTO study_logs (user_id, hours, date) VALUES (?, ?, ?)", (user_id, hours, date))
        
    conn.commit()
    conn.close()

def get_study_logs(user_id):
    """Retrieve all study logs for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT hours, date FROM study_logs WHERE user_id = ? ORDER BY date ASC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [{"hours": r["hours"], "date": r["date"]} for r in rows]

def log_task_hours(user_id, task_idx, hours):
    """Log study hours specifically to a checklist task (by index order) and mark it completed."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, logged_hours FROM study_plans WHERE user_id = ? ORDER BY id ASC", (user_id,))
    rows = cursor.fetchall()
    
    if 0 <= task_idx < len(rows):
        target_id = rows[task_idx]["id"]
        current_hours = rows[task_idx]["logged_hours"] if rows[task_idx]["logged_hours"] is not None else 0.0
        new_hours = current_hours + hours
        cursor.execute("UPDATE study_plans SET logged_hours = ?, completed = 1 WHERE id = ?", (new_hours, target_id))
        conn.commit()
        success = True
    else:
        success = False
        
    conn.close()
    return success

