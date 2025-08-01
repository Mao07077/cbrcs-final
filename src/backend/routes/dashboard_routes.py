from fastapi import APIRouter, HTTPException, Query
from database import users_collection, modules_collection, scores_collection, pre_test_collection, post_test_collection
from bson import ObjectId
from config import logger
from typing import Optional

router = APIRouter()

@router.get("/api/dashboard/{id_number}")
def dashboard(id_number: str):
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    program = user.get("program", "All Programs")
    query = {}
    if program and program != "All Programs":
        query["program"] = program
    modules = list(modules_collection.find(query))
    modules_list = [{"_id": str(module["_id"]), "title": module["title"], "image_url": module.get("image_url", "")} for module in modules]
    scores = scores_collection.find({"user_id": id_number})
    pre_tests = []
    post_tests = []
    for score in scores:
        module_id = score["module_id"]
        module = modules_collection.find_one({"_id": ObjectId(module_id)})
        module_title = module["title"] if module else "Unknown Module"
        if score.get("test_type") == "pretest":
            pre_test = pre_test_collection.find_one({"module_id": module_id})
            pre_test_title = pre_test["title"] if pre_test else f"Pre-Test for {module_title}"
            pre_tests.append({
                "module_id": module_id,
                "pre_test_title": pre_test_title,
                "correct": score["correct"],
                "incorrect": score["incorrect"],
                "total_questions": score["total_questions"],
                "time_spent": score.get("time_spent", 0)
            })
        else:
            post_test = post_test_collection.find_one({"module_id": module_id})
            post_test_title = post_test["title"] if post_test else f"Post-Test for {module_title}"
            post_tests.append({
                "module_id": module_id,
                "post_test_title": post_test_title,
                "correct": score["correct"],
                "incorrect": score["incorrect"],
                "total_questions": score["total_questions"],
                "time_spent": score.get("time_spent", 0)
            })
    
    # Generate recommended pages based on user's study habits
    recommended_pages = []
    if user.get("top3Habits"):
        # Map survey habits to page recommendations
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
        
        # First, add pages based on user's top habits
        for habit in user.get("top3Habits", []):
            page = habit_to_page.get(habit)
            if page and page not in recommended_pages:
                recommended_pages.append(page)
        
        # If we don't have 3 recommendations, fill with defaults
        default_pages = ["modules", "scheduler", "flashcards", "learn-together", "notes", "music"]
        for page in default_pages:
            if len(recommended_pages) >= 3:
                break
            if page not in recommended_pages:
                recommended_pages.append(page)
    else:
        # Default recommendations if no survey completed
        recommended_pages = ["notes", "scheduler", "flashcards"]
    
    return {
        "modules": modules_list,
        "preTests": pre_tests,
        "postTests": post_tests,
        "recommendedPages": recommended_pages
    }

@router.get("/api/instructor/dashboard/{instructor_id}")
async def get_instructor_dashboard(instructor_id: str, program: Optional[str] = Query(None)):
    try:
        instructor = users_collection.find_one({"id_number": instructor_id, "role": {"$regex": "^instructor$", "$options": "i"}})
        if not instructor:
            raise HTTPException(status_code=404, detail="Instructor not found")
        modules_query = {"id_number": instructor_id}
        if program:
            modules_query["program"] = program
        modules = list(modules_collection.find(modules_query))
        modules_list = [
            {
                "_id": str(module["_id"]),
                "title": module["title"],
                "image_url": module.get("image_url", ""),
                "program": module.get("program", ""),
            } for module in modules
        ]
        students_query = {"role": {"$regex": "^student$", "$options": "i"}}
        if program:
            students_query["program"] = program
        students = list(users_collection.find(students_query))
        total_students = len(students)
        scores = scores_collection.find({"test_type": "posttest"})
        total_submissions = 0
        total_questions = 0
        for score in scores:
            total_submissions += score["correct"] + score["incorrect"]
            total_questions += score["total_questions"]
        engagement_rate = (total_submissions / total_questions * 100) if total_questions > 0 else 0
        attendance_data = []
        for student in students:
            student_scores = scores_collection.find_one({"user_id": student["id_number"], "test_type": "posttest"})
            attendance_percentage = student_scores["correct"] / student_scores["total_questions"] * 100 if student_scores else 0
            attendance_data.append({
                "studentName": f"{student.get('firstname', '')} {student.get('lastname', '')}".strip(),
                "percentage": round(attendance_percentage, 2),
            })
        return {
            "stats": {
                "totalStudents": total_students,
                "engagementRate": round(engagement_rate, 2),
            },
            "modules": modules_list,
            "attendance": attendance_data,
        }
    except Exception as e:
        logger.error(f"Error fetching instructor dashboard data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")

@router.get("/api/engagement-rate")
async def get_engagement_rate(instructor_id: str = Query(None), program: str = Query(None)):
    try:
        query = {}
        if instructor_id:
            query["id_number"] = instructor_id
        if program:
            query["program"] = program
        modules = list(modules_collection.find(query))
        total_modules = len(modules)
        students_query = {"role": {"$regex": "^student$", "$options": "i"}}
        if program:
            students_query["program"] = program
        students = list(users_collection.find(students_query))
        total_students = len(students)
        completed_post_tests = 0
        for student in students:
            post_test_results = scores_collection.find({
                "user_id": student["id_number"],
                "test_type": "posttest",
                "module_id": {"$in": [str(module["_id"]) for module in modules]}
            })
            completed_post_tests += len(list(post_test_results))
        total_possible_completions = total_students * total_modules
        engagement_rate = (completed_post_tests / total_possible_completions * 100) if total_possible_completions > 0 else 0
        return {
            "engagementRate": round(engagement_rate, 1),
            "totalStudents": total_students,
            "totalModules": total_modules,
            "completedPostTests": completed_post_tests
        }
    except Exception as e:
        logger.error(f"Error calculating engagement rate: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate engagement rate")

@router.get("/api/progress/{user_id}")
async def get_progress(user_id: str):
    try:
        user = users_collection.find_one({"id_number": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        program = user["program"]
        modules = list(modules_collection.find({"program": program}))
        total_modules = len(modules)
        post_test_results = list(scores_collection.find({"user_id": user_id, "test_type": "posttest"}))
        completed_post_tests = len(post_test_results)
        progress = (completed_post_tests / total_modules * 100) if total_modules > 0 else 0
        return {
            "progress": round(progress, 0),
            "totalModules": total_modules,
            "completedPostTests": completed_post_tests
        }
    except Exception as e:
        logger.error(f"Error calculating progress for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate progress")