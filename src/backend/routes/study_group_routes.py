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
    """Create a new study group and immediately start as live session"""
    try:
        creator_id = data.get("creator_id")
        if not creator_id:
            raise HTTPException(status_code=400, detail="Creator ID is required")
            
        print(f"Creating study group for creator_id: {creator_id}")  # Debug log
        
        group_data = {
            "title": data.get("title", ""),
            "subject": data.get("subject", ""),
            "schedule": data.get("schedule", ""),
            "creator_id": creator_id,
            "members": [creator_id],
            "created_at": datetime.utcnow(),
            "max_members": data.get("max_members", 10),
            "is_session_active": True,  # Start as active session immediately
            "session_started_at": datetime.utcnow(),
            "active_participants": [creator_id]  # Creator is first active participant
        }
        
        print(f"Group data to insert: {group_data}")  # Debug log
        
        result = study_groups_collection.insert_one(group_data)
        
        # Get the inserted document to ensure we have all fields correctly
        inserted_group = study_groups_collection.find_one({"_id": result.inserted_id})
        print(f"Inserted group from DB: {inserted_group}")  # Debug log

        if inserted_group:
            inserted_group["id"] = str(inserted_group["_id"])
            del inserted_group["_id"]

            # Ensure is_session_active is always present
            if "is_session_active" not in inserted_group:
                inserted_group["is_session_active"] = True

            print(f"Group created with id: {inserted_group['id']}")  # Debug log
            print(f"Group is_session_active: {inserted_group.get('is_session_active')}")  # Debug log

            return {
                "success": True,
                "group": inserted_group,
                "message": "Study group created successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to retrieve created group")
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

@router.post("/api/study-groups/{group_id}/start-session")
def start_study_session(group_id: str, data: dict = Body(...)):
    """Start a live study session"""
    try:
        user_id = data.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        # Check if group exists
        group = study_groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Study group not found")
        
        # Check if user is a member
        if user_id not in group.get("members", []):
            raise HTTPException(status_code=403, detail="You must be a member to start a session")
        
        # Update group to mark session as active with only the starter as active participant
        study_groups_collection.update_one(
            {"_id": ObjectId(group_id)},
            {
                "$set": {
                    "is_session_active": True,
                    "session_started_at": datetime.utcnow(),
                    "active_participants": [user_id]  # Reset to only the starter
                }
            }
        )
        
        return {
            "success": True,
            "message": "Study session started successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start session: {str(e)}")

@router.post("/api/study-groups/{group_id}/end-session")
def end_study_session(group_id: str, data: dict = Body(...)):
    """End a live study session and optionally delete the group"""
    try:
        user_id = data.get("user_id")
        delete_group = data.get("delete_group", True)  # Default to deleting the group
        
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        # Check if group exists
        group = study_groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Study group not found")
        
        if delete_group:
            # Delete the entire group when session ends
            study_groups_collection.delete_one({"_id": ObjectId(group_id)})
            return {
                "success": True,
                "message": "Study session ended and group deleted",
                "group_deleted": True
            }
        else:
            # Just mark session as inactive
            study_groups_collection.update_one(
                {"_id": ObjectId(group_id)},
                {
                    "$set": {
                        "is_session_active": False,
                        "session_started_at": None,
                        "active_participants": []
                    }
                }
            )
            return {
                "success": True,
                "message": "Study session ended",
                "group_deleted": False
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end session: {str(e)}")

@router.post("/api/study-groups/{group_id}/join-session")
def join_study_session(group_id: str, data: dict = Body(...)):
    """Join an active study session"""
    try:
        user_id = data.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        # Check if group exists
        group = study_groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Study group not found")
        
        # Check if session is active
        if not group.get("is_session_active", False):
            raise HTTPException(status_code=400, detail="No active session to join")
        
        # Add user to active participants if not already there
        if user_id not in group.get("active_participants", []):
            study_groups_collection.update_one(
                {"_id": ObjectId(group_id)},
                {"$addToSet": {"active_participants": user_id}}
            )
        
        return {
            "success": True,
            "message": "Successfully joined the study session"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to join session: {str(e)}")

@router.post("/api/study-groups/{group_id}/leave-session")
def leave_study_session(group_id: str, data: dict = Body(...)):
    """Leave an active study session"""
    try:
        user_id = data.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        # Remove user from active participants
        study_groups_collection.update_one(
            {"_id": ObjectId(group_id)},
            {"$pull": {"active_participants": user_id}}
        )
        
        # Check if no participants are left
        updated_group = study_groups_collection.find_one({"_id": ObjectId(group_id)})
        if updated_group and len(updated_group.get("active_participants", [])) == 0:
            # If no participants left, end the session and delete the group
            study_groups_collection.delete_one({"_id": ObjectId(group_id)})
            return {
                "success": True,
                "message": "Left session and group deleted (no participants remaining)",
                "group_deleted": True
            }
        
        return {
            "success": True,
            "message": "Successfully left the study session",
            "group_deleted": False
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to leave session: {str(e)}")

@router.get("/api/study-groups/active")
def get_active_study_sessions():
    """Get only active study sessions (live meetings)"""
    try:
        print("Fetching active study sessions...")  # Debug log
        groups = list(study_groups_collection.find({"is_session_active": True}))
        print(f"Found {len(groups)} active groups")  # Debug log
        
        # Convert ObjectId to string and format data
        formatted_groups = []
        for group in groups:
            group["id"] = str(group["_id"])
            del group["_id"]
            formatted_groups.append(group)
            print(f"Active group: {group['title']} - ID: {group['id']}")  # Debug log
        
        return {
            "success": True,
            "groups": formatted_groups
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch active sessions: {str(e)}")
