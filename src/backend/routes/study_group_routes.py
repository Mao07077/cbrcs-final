from fastapi import APIRouter, HTTPException, Body
from database import study_groups_collection, users_collection
from bson import ObjectId
from datetime import datetime
from typing import List, Dict

router = APIRouter()

@router.get("/api/study-groups/{user_id}")
def get_user_study_groups(user_id: str):
    """Get all study groups for a user"""
    try:
        # Find groups where user is a member
        groups = list(study_groups_collection.find({
            "members": user_id
        }))
        
        # Convert ObjectId to string and format data
        formatted_groups = []
        for group in groups:
            group["id"] = str(group["_id"])
            del group["_id"]
            formatted_groups.append(group)
        
        return {
            "success": True,
            "groups": formatted_groups
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch study groups: {str(e)}")

@router.post("/api/study-groups")
def create_study_group(data: dict = Body(...)):
    """Create a new study group"""
    try:
        group_data = {
            "title": data.get("title", ""),
            "subject": data.get("subject", ""),
            "schedule": data.get("schedule", ""),
            "creator_id": data.get("creator_id"),
            "members": [data.get("creator_id")],
            "created_at": datetime.utcnow(),
            "max_members": data.get("max_members", 10)
        }
        
        result = study_groups_collection.insert_one(group_data)
        group_data["id"] = str(result.inserted_id)
        del group_data["_id"]
        
        return {
            "success": True,
            "group": group_data,
            "message": "Study group created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create study group: {str(e)}")

@router.post("/api/study-groups/{group_id}/join")
def join_study_group(group_id: str, data: dict = Body(...)):
    """Join a study group"""
    try:
        user_id = data.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        # Check if group exists
        group = study_groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Study group not found")
        
        # Check if user is already a member
        if user_id in group.get("members", []):
            return {"success": True, "message": "Already a member of this group"}
        
        # Add user to group
        study_groups_collection.update_one(
            {"_id": ObjectId(group_id)},
            {"$push": {"members": user_id}}
        )
        
        return {
            "success": True,
            "message": "Successfully joined the study group"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to join study group: {str(e)}")

@router.delete("/api/study-groups/{group_id}/leave")
def leave_study_group(group_id: str, data: dict = Body(...)):
    """Leave a study group"""
    try:
        user_id = data.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        # Remove user from group
        study_groups_collection.update_one(
            {"_id": ObjectId(group_id)},
            {"$pull": {"members": user_id}}
        )
        
        return {
            "success": True,
            "message": "Successfully left the study group"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to leave study group: {str(e)}")

@router.get("/api/study-groups")
def get_all_study_groups():
    """Get all available study groups"""
    try:
        groups = list(study_groups_collection.find({}))
        
        # Convert ObjectId to string and format data
        formatted_groups = []
        for group in groups:
            group["id"] = str(group["_id"])
            del group["_id"]
            formatted_groups.append(group)
        
        return {
            "success": True,
            "groups": formatted_groups
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch study groups: {str(e)}")

@router.get("/api/study-groups/{group_id}/session-info")
def get_study_group_session_info(group_id: str):
    """Get current session information for a study group"""
    try:
        # Check if group exists
        group = study_groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Study group not found")
        
        # Format group data
        group["id"] = str(group["_id"])
        del group["_id"]
        
        # Get member details
        members_info = []
        for member_id in group.get("members", []):
            user = users_collection.find_one({"id_number": member_id})
            if user:
                members_info.append({
                    "id_number": user["id_number"],
                    "name": f"{user.get('firstname', '')} {user.get('lastname', '')}".strip(),
                    "program": user.get("program", "")
                })
        
        return {
            "success": True,
            "group": group,
            "members": members_info,
            "websocket_url": f"/ws/study-group/{group_id}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch session info: {str(e)}")
