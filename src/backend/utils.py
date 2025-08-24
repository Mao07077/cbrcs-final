def get_dashboard_metrics(id_number: str, users_collection, modules_collection, scores_collection, pre_test_collection, post_test_collection):
    user = users_collection.find_one({"id_number": id_number})
    program = user.get("program", "All Programs") if user else None
    query = {}
    if program and program != "All Programs":
        query["program"] = program
    modules = list(modules_collection.find(query))
    modules_list = [{"_id": str(module["_id"]), "title": module["title"], "image_url": module.get("image_url", "")} for module in modules]
    scores = list(scores_collection.find({"user_id": id_number}))
    pre_tests = []
    post_tests = []
    module_completion = set()
    study_hour = 0
    assessment_results = []
    streak_days = set()
    daily_progress = {}
    subject_scores = {}
    total_questions = 0
    correct_answers = 0
    flashcard_time = user.get("flashcard_time", 0) if user else 0

    for module in modules:
        module_id = str(module["_id"])
        module_title = module["title"]
        pre_score = next((s for s in scores if s["module_id"] == module_id and s.get("test_type") == "pretest"), None)
        post_score = next((s for s in scores if s["module_id"] == module_id and s.get("test_type") == "posttest"), None)
        if pre_score:
            time_spent = min(pre_score.get("time_spent", 0), 600)
            study_hour += time_spent / 60
            total_questions += pre_score.get("total_questions", 0)
            correct_answers += pre_score.get("correct", 0)
            date_taken = pre_score.get("date_taken")
            if date_taken:
                day = date_taken.split("T")[0]
                daily_progress.setdefault(day, {"hours": 0, "score": 0, "count": 0})
                daily_progress[day]["hours"] += time_spent / 60
                daily_progress[day]["score"] += (pre_score.get("correct", 0) / max(pre_score.get("total_questions", 1), 1)) * 100
                daily_progress[day]["count"] += 1
                if daily_progress[day]["hours"] >= 1:
                    streak_days.add(day)
            pre_test = pre_test_collection.find_one({"module_id": module_id})
            pre_test_title = pre_test["title"] if pre_test else f"Pre-Test for {module_title}"
            pre_tests.append({
                "module_id": module_id,
                "pre_test_title": pre_test_title,
                "correct": pre_score["correct"],
                "incorrect": pre_score["incorrect"],
                "total_questions": pre_score["total_questions"],
                "time_spent": time_spent
            })
            assessment_results.append({
                "module": module_title,
                "type": "Pre-Test",
                "score": (pre_score["correct"] / max(pre_score["total_questions"], 1)) * 100,
                "duration": time_spent,
            })
        else:
            pre_tests.append({
                "module_id": module_id,
                "pre_test_title": f"Pre-Test for {module_title}",
                "correct": 0,
                "incorrect": 0,
                "total_questions": 0,
                "time_spent": 0
            })
        if post_score:
            time_spent = min(post_score.get("time_spent", 0), 600)
            study_hour += time_spent / 60
            total_questions += post_score.get("total_questions", 0)
            correct_answers += post_score.get("correct", 0)
            date_taken = post_score.get("date_taken")
            if date_taken:
                day = date_taken.split("T")[0]
                daily_progress.setdefault(day, {"hours": 0, "score": 0, "count": 0})
                daily_progress[day]["hours"] += time_spent / 60
                daily_progress[day]["score"] += (post_score.get("correct", 0) / max(post_score.get("total_questions", 1), 1)) * 100
                daily_progress[day]["count"] += 1
                if daily_progress[day]["hours"] >= 1:
                    streak_days.add(day)
            post_test = post_test_collection.find_one({"module_id": module_id})
            post_test_title = post_test["title"] if post_test else f"Post-Test for {module_title}"
            post_tests.append({
                "module_id": module_id,
                "post_test_title": post_test_title,
                "correct": post_score["correct"],
                "incorrect": post_score["incorrect"],
                "total_questions": post_score["total_questions"],
                "time_spent": time_spent
            })
            module_completion.add(module_id)
            assessment_results.append({
                "module": module_title,
                "type": "Post-Test",
                "score": (post_score["correct"] / max(post_score["total_questions"], 1)) * 100,
                "duration": time_spent,
            })
        else:
            post_tests.append({
                "module_id": module_id,
                "post_test_title": f"Post-Test for {module_title}",
                "correct": 0,
                "incorrect": 0,
                "total_questions": 0,
                "time_spent": 0
            })
        subject_scores.setdefault(module_title, {"score": 0, "count": 0})
        if pre_score:
            subject_scores[module_title]["score"] += pre_score.get("correct", 0)
            subject_scores[module_title]["count"] += pre_score.get("total_questions", 0)
        if post_score:
            subject_scores[module_title]["score"] += post_score.get("correct", 0)
            subject_scores[module_title]["count"] += post_score.get("total_questions", 0)

    study_hour += flashcard_time / 60
    completed_modules = len(module_completion)
    total_modules = len(modules)
    import datetime
    today = datetime.date.today()
    weekly_progress = []
    for i in range(6, -1, -1):
        day = (today - datetime.timedelta(days=i)).isoformat()
        data = daily_progress.get(day, {"hours": 0, "score": 0, "count": 0})
        avg_score = (data["score"] / data["count"]) if data["count"] > 0 else 0
        weekly_progress.append({"day": day, "hours": round(data["hours"], 2), "score": round(avg_score, 2)})
    subject_performance = []
    strengths = []
    weaknesses = []
    for module_title, stats in subject_scores.items():
        percent = (stats["score"] / max(stats["count"], 1)) * 100
        subject_performance.append({"subject": module_title, "score": round(percent, 2)})
    passed = [sp for sp in subject_performance if sp["score"] >= 50]
    failed = [sp for sp in subject_performance if sp["score"] < 50]
    if passed:
        strengths = [max(passed, key=lambda x: x["score"])]
    if failed:
        weaknesses = [min(failed, key=lambda x: x["score"])]
    accuracy = (correct_answers / max(total_questions, 1)) * 100
    pre_test_count = len(pre_tests)
    post_test_count = len(post_tests)
    recommended_pages = []
    if user and user.get("top3Habits"):
        habit_to_page = {
            "Study with Friends": "learn-together",
            "Asking for Help": "messages",
            "Test Yourself Periodically": "modules",
            "Creating a Study Schedule": "scheduler",
            "Setting Study Goals": "notes",
            "Organizing Notes": "notes",
            "Teach What You've Learned": "learn-together",
            "Use of Flashcards": "flashcards",
            "Using Aromatherapy, Plants, or Music": "music"
        }
        for habit in user.get("top3Habits", []):
            page = habit_to_page.get(habit)
            if page and page not in recommended_pages:
                recommended_pages.append(page)
        default_pages = ["modules", "scheduler", "flashcards", "learn-together", "notes", "music"]
        for page in default_pages:
            if len(recommended_pages) >= 3:
                break
            if page not in recommended_pages:
                recommended_pages.append(page)
    else:
        recommended_pages = ["notes", "scheduler", "flashcards"]
    return {
        "modules": modules_list,
        "completedModules": completed_modules,
        "totalModules": total_modules,
        "studyHours": round(study_hour, 2),
        "learningStreak": len(streak_days),
        "weeklyProgress": weekly_progress,
        "subjectPerformance": subject_performance,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "detailedMetrics": {
            "totalQuestions": total_questions,
            "correctAnswers": correct_answers,
            "accuracy": round(accuracy, 2)
        },
        "assessmentBreakdown": assessment_results,
        "preTestCount": pre_test_count,
        "postTestCount": post_test_count,
        "recommendedPages": recommended_pages
    }
import bcrypt
import smtplib
from email.mime.text import MIMEText
import pdfplumber
from io import BytesIO
from pptx import Presentation
from PyPDF2 import PdfReader
import os
import re
import random
import asyncio
import ollama
import logging
from datetime import datetime
from fastapi import HTTPException
from config import EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, logger
from models import Flashcard
from typing import List, Dict, Any

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return password == hashed

def send_email(to_email: str, subject: str, body: str):
    try:
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = EMAIL_HOST_USER
        msg['To'] = to_email
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
            server.send_message(msg)
        logger.info(f"Email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")

def extract_text_from_pdf(file_path: str) -> str:
    try:
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"PDF file not found at {file_path}")
        with open(file_path, "rb") as file:
            reader = PdfReader(file)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        raise HTTPException(status_code=500, detail="Failed to extract text from PDF")

def create_prompt(input_text: str, correct_answer: str = None, wrong_answers: List[str] = None) -> str:
    prompt = (
        f"You are a helpful assistant. Please paraphrase the following question. "
        f"REMOVE ANY INTRODUCTION THAT SAYS IT'S A PARAPHRASE, REMOVE NUMBERING, AND REMOVE ANY NOTES. "
        f"DO NOT INCLUDE THE CORRECT ANSWER ('{correct_answer}') IN THE QUESTION TEXT. "
        f"Keep the meaning intact and maintain proper grammar.\n\n"
        f"Original question: {input_text}\n"
    )
    if wrong_answers:
        prompt += f"Wrong answers: {', '.join(wrong_answers)}\n"
    return prompt

def generate_flashcards_from_text(text: str, module_id: str) -> List[Flashcard]:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    flashcards = []
    candidate_sentences = [
        s for s in sentences
        if len(s) > 30 and any(keyword in s.lower() for keyword in [
            'law', 'theory', 'principle', 'definition', 'rule', 'stage', 'category'
        ])
    ]
    for i in range(10):
        if i < len(candidate_sentences):
            sentence = candidate_sentences[i]
            words = sentence.split()
            key_term = next(
                (word for word in words if word[0].isupper() or word in [
                    'Cephalocaudal', 'Proximodistal', 'Oral', 'Anal', 'Phallic'
                ]),
                words[0]
            )
            question = f"What is {key_term}?"
            answer = sentence.strip()
        else:
            sentence = candidate_sentences[i % len(candidate_sentences)] if candidate_sentences else "No content available."
            question = f"What is a key concept from the module (part {i+1})?"
            answer = sentence.strip()
        flashcard = Flashcard(
            module_id=module_id,
            content=question,
            answer=answer,
            unique=f"flashcard-{module_id}-{i}"
        )
        flashcards.append(flashcard)
    return flashcards

async def generate_flashcards_with_ollama(text: str, module_id: str) -> List[Flashcard]:
    try:
        text = text[:2000]
        prompt = (
            f"Generate 10 flashcard questions from the following text. "
            f"Each question must start with 'What', 'Where', 'When', 'Who', 'Why', or 'How', "
            f"and focus on a specific concept, law, theory, or rule. "
            f"Ensure questions and the answer are unique, factual, and concise. "
            f"Answers should be brief and accurate. "
            f"Dont use What is a key concept from the module"
            f"Format as a JSON list of objects with 'question' and 'answer' fields.\n\n"
            f"Text: {text}\n\n"
            f"Example: "
            f'[{{"question": "What law mandates Rizal’s life study?", "answer": "RA 1425"}}, '
            f'{{"question": "What are Kolb’s learning stages?", "answer": "Concrete Experience, Reflective Observation, Abstract Conceptualization, Active Experimentation"}}]'
        )
        async def run_ollama_with_timeout():
            loop = asyncio.get_event_loop()
            return await asyncio.wait_for(
                loop.run_in_executor(None, lambda: ollama.generate(model='llama3:latest', prompt=prompt)),
                timeout=30
            )
        response = await run_ollama_with_timeout()
        flashcards_data = eval(response['response'])
        flashcards = []
        for i, item in enumerate(flashcards_data[:10]):
            flashcard = Flashcard(
                module_id=module_id,
                content=item['question'],
                answer=item['answer'],
                unique=f"flashcard-{module_id}-{i}"
            )
            flashcards.append(flashcard)
        return flashcards
    except asyncio.TimeoutError:
        logger.error("Ollama request timed out after 30 seconds")
        return None
    except Exception as e:
        logger.error(f"Error generating flashcards with ollama: {e}")
        return None

def send_reminder_email(user_id, task, current_time, current_day, users_collection, schedule_collection):
    user = users_collection.find_one({"id_number": user_id})
    if not user:
        return
    user_email = user["email"]
    subject = f"Reminder: Task '{task}' at {current_time} on {current_day}"
    body = f"Dear {user['firstname']} {user['lastname']},\n\nThis is a reminder for your task '{task}' scheduled for {current_time} on {current_day}.\n\nBest regards,\nYour Study Schedule App"
    message = MIMEText(body)
    message['From'] = EMAIL_HOST_USER
    message['To'] = user_email
    message['Subject'] = subject
    try:
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
            server.sendmail(EMAIL_HOST_USER, user_email, message.as_string())
        logger.info(f"Reminder sent to {user_email}")
    except Exception as e:
        logger.error(f"Error sending email: {e}")

def check_schedule_and_notify(users_collection, schedule_collection):
    current_time = datetime.now().strftime('%I:%M %p')
    current_day = datetime.now().strftime('%a').upper()
    schedules = schedule_collection.find()
    daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    for schedule in schedules:
        user_id = schedule["id_number"]
        times = schedule["times"]
        schedule_data = schedule["schedule"]
        for i, time in enumerate(times):
            if time == current_time:
                for j, day in enumerate(schedule_data[i]):
                    if day and day != '0' and daysOfWeek[j] == current_day:
                        send_reminder_email(user_id, day, current_time, current_day, users_collection, schedule_collection)

async def paraphrase_question_with_ollama(original_question: str, correct_answer: str, wrong_answers: List[str]) -> Dict[str, Any]:
    """
    Paraphrase a pre-test question using Ollama to create a post-test question.
    Returns the paraphrased question with the same correct answer and options.
    """
    try:
        # Create a simple, direct prompt for better results
        prompt = f"Paraphrase this question while keeping the exact same meaning: '{original_question}'. Return only the paraphrased question, no extra text or quotes."

        # Run Ollama with shorter timeout for faster response
        async def run_ollama_with_timeout():
            loop = asyncio.get_event_loop()
            return await asyncio.wait_for(
                loop.run_in_executor(None, lambda: ollama.generate(model='llama3:latest', prompt=prompt)),
                timeout=15  # Increased timeout slightly for better results
            )

        logger.info(f"Paraphrasing question: {original_question[:50]}...")
        response = await run_ollama_with_timeout()
        paraphrased_question = response['response'].strip()
        
        # Clean up the response thoroughly
        paraphrased_question = re.sub(r'^(Paraphrased question:|Here\'s the paraphrased question:|Here\'s a paraphrased version:|Question:|Paraphrased:|Here is the paraphrased question:)', '', paraphrased_question, flags=re.IGNORECASE).strip()
        paraphrased_question = re.sub(r'^\d+\.?\s*', '', paraphrased_question).strip()
        paraphrased_question = re.sub(r'^["\'](.+)["\']$', r'\1', paraphrased_question).strip()  # Remove surrounding quotes
        paraphrased_question = re.sub(r'\s+', ' ', paraphrased_question).strip()  # Normalize whitespace
        
        # If paraphrasing failed, is too short, or is identical to original, return original
        if (len(paraphrased_question) < 10 or 
            paraphrased_question.lower().strip() == original_question.lower().strip() or
            not paraphrased_question):
            logger.warning(f"Paraphrasing failed or identical, using original question")
            paraphrased_question = original_question
        else:
            logger.info(f"Successfully paraphrased question")
        
        return {
            "question": paraphrased_question,
            "correct_answer": correct_answer,
            "wrong_answers": wrong_answers
        }
        
    except asyncio.TimeoutError:
        logger.error("Ollama request timed out after 15 seconds for question paraphrasing")
        return {
            "question": original_question,
            "correct_answer": correct_answer,
            "wrong_answers": wrong_answers
        }
    except Exception as e:
        logger.error(f"Error paraphrasing question with ollama: {e}")
        return {
            "question": original_question,
            "correct_answer": correct_answer,
            "wrong_answers": wrong_answers
        }

def randomize_quiz_questions(quiz_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Randomize the order of questions and shuffle the answer choices for each question.
    """
    import random
    from copy import deepcopy
    
    randomized_quiz = deepcopy(quiz_data)
    
    # Randomize question order
    if "questions" in randomized_quiz:
        questions = randomized_quiz["questions"]
        random.shuffle(questions)
        
        # For each question, randomize the answer choices
        for question in questions:
            if "choices" in question:
                # Get the correct answer before shuffling
                correct_answer = question.get("correct_answer", "")
                choices = question["choices"][:]  # Create a copy
                
                # Shuffle the choices
                random.shuffle(choices)
                
                # Update the question with shuffled choices
                question["choices"] = choices
                
                # Find the new position of the correct answer
                if correct_answer in choices:
                    correct_index = choices.index(correct_answer)
                    # Update choice labels (A, B, C, D)
                    choice_labels = ['A', 'B', 'C', 'D']
                    if correct_index < len(choice_labels):
                        question["correct_answer"] = choice_labels[correct_index]
    
    return randomized_quiz

async def paraphrase_all_questions_batch(questions_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Paraphrase all questions in a single batch request to Ollama for maximum speed.
    This is much faster than individual requests.
    """
    try:
        if not questions_data:
            return []
        
        # Create a batch prompt with all questions
        questions_text = ""
        for i, question in enumerate(questions_data):
            questions_text += f"{i+1}. {question.get('question', '')}\n"
        
        prompt = (
            f"Paraphrase these {len(questions_data)} questions. Keep the same meaning for each. "
            f"Return only the paraphrased questions in the same order, numbered 1-{len(questions_data)}:\n\n"
            f"{questions_text}\n"
            f"Format: Just return the numbered paraphrased questions, nothing else."
        )

        # Single Ollama call for all questions
        async def run_ollama_batch():
            loop = asyncio.get_event_loop()
            return await asyncio.wait_for(
                loop.run_in_executor(None, lambda: ollama.generate(model='llama3:latest', prompt=prompt)),
                timeout=20  # Reasonable timeout for batch processing
            )

        logger.info(f"Starting batch paraphrasing of {len(questions_data)} questions...")
        start_time = asyncio.get_event_loop().time()
        
        response = await run_ollama_batch()
        paraphrased_text = response['response'].strip()
        
        end_time = asyncio.get_event_loop().time()
        logger.info(f"Batch paraphrasing completed in {end_time - start_time:.2f} seconds")
        
        # Parse the response to extract individual questions
        paraphrased_lines = paraphrased_text.split('\n')
        paraphrased_questions = []
        
        for i, question in enumerate(questions_data):
            # Try to find the paraphrased version
            paraphrased_question = None
            for line in paraphrased_lines:
                if line.strip().startswith(f"{i+1}."):
                    paraphrased_question = re.sub(r'^\d+\.?\s*', '', line).strip()
                    break
            
            # If not found or too short, use original
            if not paraphrased_question or len(paraphrased_question) < 10:
                paraphrased_question = question.get('question', '')
            
            paraphrased_questions.append({
                "question": paraphrased_question,
                "options": question.get('options', []),
                "correctAnswer": question.get('correctAnswer', '')
            })
        
        return paraphrased_questions
        
    except asyncio.TimeoutError:
        logger.error("Batch paraphrasing timed out, falling back to parallel processing")
        return await paraphrase_all_questions(questions_data)
    except Exception as e:
        logger.error(f"Error in batch paraphrasing: {e}, falling back to parallel processing")
        return await paraphrase_all_questions(questions_data)

async def paraphrase_all_questions(questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Paraphrase all questions in a test using Ollama with parallel processing for speed.
    """
    async def paraphrase_single_question(question):
        original_question = question.get('question', '')
        correct_answer = question.get('correctAnswer', '')
        all_options = question.get('options', [])
        
        # Get wrong answers by filtering out the correct answer
        wrong_answers = [opt for opt in all_options if opt != correct_answer]
        
        # Paraphrase the question
        paraphrased = await paraphrase_question_with_ollama(original_question, correct_answer, wrong_answers)
        
        # Reconstruct the question structure
        return {
            "question": paraphrased["question"],
            "options": all_options,  # Keep the same options
            "correctAnswer": correct_answer  # Keep the same correct answer
        }
    
    # Process all questions in parallel for much faster performance
    logger.info(f"Starting to paraphrase {len(questions)} questions in parallel...")
    start_time = asyncio.get_event_loop().time()
    
    paraphrased_questions = await asyncio.gather(
        *[paraphrase_single_question(question) for question in questions],
        return_exceptions=True
    )
    
    end_time = asyncio.get_event_loop().time()
    logger.info(f"Paraphrasing completed in {end_time - start_time:.2f} seconds")
    
    # Handle any exceptions that occurred during parallel processing
    result = []
    for i, paraphrased in enumerate(paraphrased_questions):
        if isinstance(paraphrased, Exception):
            logger.error(f"Error paraphrasing question {i}: {paraphrased}")
            # Use original question if paraphrasing failed
            result.append({
                "question": questions[i].get('question', ''),
                "options": questions[i].get('options', []),
                "correctAnswer": questions[i].get('correctAnswer', '')
            })
        else:
            result.append(paraphrased)
    
    return result