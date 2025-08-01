from fastapi import APIRouter, HTTPException, Body, Path
from models import ProfileData, UserSettings
from database import users_collection, request_collection
from datetime import datetime
from typing import Dict, List

router = APIRouter()

@router.get("/api/profile/{id_number}", response_model=ProfileData)
def get_profile(id_number: str):
    user = users_collection.find_one({"id_number": id_number})
    if user:
        return {
            "firstname": user.get("firstname", ""),
            "lastname": user.get("lastname", ""),
            "id_number": user.get("id_number", ""),
            "program": user.get("program", ""),
            "hoursActivity": user.get("hoursActivity", 0)
        }
    raise HTTPException(status_code=404, detail="User not found")

@router.get("/students/{id_number}/recommended-pages", response_model=Dict[str, List[str]])
def get_recommended_pages(id_number: str):
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    top3_habits = user.get("top3Habits", [])
    habit_to_page = {
        "Study with Friends": "learn-together",
        "Asking for Help": "instructor-chat",
        "Test Yourself Periodically": "modules",
        "Creating a Study Schedule": "scheduler",
        "Setting Study Goals": "notes",
        "Organizing Notes": "notes",
        "Teach What You've Learned": "learn-together",
        "Use of Flashcards": "flashcard",
        "Using Aromatherapy, Plants, or Music": "music"
    }
    recommended_pages = []
    for habit in top3_habits:
        page = habit_to_page.get(habit)
        if page and page not in recommended_pages:
            recommended_pages.append(page)
    return {"recommendedPages": recommended_pages}

@router.get("/user/settings/{id_number}")
async def get_user_settings(id_number: str):
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "success": True,
        "data": {
            "firstname": user.get("firstname", ""),
            "middlename": user.get("middlename", ""),
            "lastname": user.get("lastname", ""),
            "suffix": user.get("suffix", ""),
            "birthdate": user.get("birthdate", ""),
            "email": user.get("email", ""),
            "program": user.get("program", ""),
            "username": user.get("username", ""),
        },
    }

@router.post("/user/settings/request/{id_number}")
async def request_settings_change(id_number: str, data: dict = Body(...)):
    request_collection.insert_one({
        "id_number": id_number,
        "requested_changes": data,
        "created_at": datetime.utcnow()
    })
    return {"success": True, "message": "Request sent to admin."}

@router.get("/admin/requests")
def get_settings_requests():
    requests = list(request_collection.find())
    result = []
    for req in requests:
        result.append({
            "_id": str(req.get("_id", "")),
            "id_number": req.get("id_number", ""),
            "firstname": req.get("requested_changes", {}).get("firstname", ""),
            "lastname": req.get("requested_changes", {}).get("lastname", ""),
            "program": req.get("requested_changes", {}).get("program", ""),
            "update_data": req.get("requested_changes", {}),
        })
    return {"success": True, "data": result}

@router.post("/admin/requests/accept/{request_id}")
def accept_settings_request(request_id: str = Path(...), update_data: dict = Body(...)):
    req = request_collection.find_one({"_id": ObjectId(request_id)})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    id_number = req.get("id_number")
    users_collection.update_one({"id_number": id_number}, {"$set": update_data})
    request_collection.delete_one({"_id": ObjectId(request_id)})
    return {"success": True, "message": "Request accepted and changes applied."}

@router.delete("/admin/requests/decline/{request_id}")
def decline_settings_request(request_id: str = Path(...)):
    result = request_collection.delete_one({"_id": ObjectId(request_id)})
    if result.deleted_count == 1:
        return {"success": True, "message": "Request declined and removed."}
    raise HTTPException(status_code=404, detail="Request not found")