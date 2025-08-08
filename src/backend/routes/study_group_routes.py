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
        print(f"After removing user {user_id}, active participants: {updated_group.get('active_participants', [])}")  # Debug log
        
        if updated_group and len(updated_group.get("active_participants", [])) == 0:
            # Instead of deleting immediately, just mark session as inactive
            # This allows other users to still see and join the session
            print(f"No participants left, but keeping session active for others to join")  # Debug log
            study_groups_collection.update_one(
                {"_id": ObjectId(group_id)},
                {
                    "$set": {
                        "is_session_active": True,  # Keep it active
                        "active_participants": []  # Empty but still active
                    }
                }
            )
            return {
                "success": True,
                "message": "Left session but keeping it active for others to join",
                "group_deleted": False
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
        
        # First, let's see all groups in the database
        all_groups = list(study_groups_collection.find({}))
        print(f"Total groups in database: {len(all_groups)}")  # Debug log
        
        for group in all_groups:
            print(f"Group: {group.get('title', 'No title')} - is_session_active: {group.get('is_session_active')} - type: {type(group.get('is_session_active'))}")
        
        # Now find only active groups
        groups = list(study_groups_collection.find({"is_session_active": True}))
        print(f"Found {len(groups)} active groups")  # Debug log
        
        # Also try with different query variations
        groups_alt1 = list(study_groups_collection.find({"is_session_active": {"$eq": True}}))
        print(f"Alt query 1 found {len(groups_alt1)} groups")  # Debug log
        
        groups_alt2 = list(study_groups_collection.find({"is_session_active": {"$ne": False}}))
        print(f"Alt query 2 found {len(groups_alt2)} groups")  # Debug log
        
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
        print(f"Error in get_active_study_sessions: {str(e)}")  # Debug log
        raise HTTPException(status_code=500, detail=f"Failed to fetch active sessions: {str(e)}")

@router.get("/api/study-groups/debug")
def debug_all_groups():
    """Debug endpoint to see all groups in database"""
    try:
        all_groups = list(study_groups_collection.find({}))
        formatted_groups = []
        for group in all_groups:
            # Keep the original _id for debugging
            group_copy = group.copy()
            group_copy["id"] = str(group_copy["_id"])
            group_copy["_id"] = str(group_copy["_id"])  # Keep both for debugging
            formatted_groups.append(group_copy)
        
        return {
            "success": True,
            "total_groups": len(formatted_groups),
            "groups": formatted_groups,
            "debug_info": {
                "collection_name": study_groups_collection.name,
                "database_name": study_groups_collection.database.name
            }
        }
    except Exception as e:
        return {"error": str(e), "error_type": type(e).__name__}

@router.post("/api/study-groups/test-create")
def test_create_group():
    """Test endpoint to create a simple group and immediately check if it exists"""
    try:
        # Create a simple test group
        test_group = {
            "title": "TEST GROUP",
            "subject": "TEST",
            "schedule": "NOW",
            "creator_id": "TEST_USER",
            "members": ["TEST_USER"],
            "created_at": datetime.utcnow(),
            "max_members": 10,
            "is_session_active": True,
            "session_started_at": datetime.utcnow(),
            "active_participants": ["TEST_USER"]
        }
        
        # Insert the group
        result = study_groups_collection.insert_one(test_group)
        print(f"Test group inserted with ID: {result.inserted_id}")
        
        # Immediately try to find it
        found_group = study_groups_collection.find_one({"_id": result.inserted_id})
        print(f"Found group: {found_group}")
        
        # Try to find it with active query
        active_groups = list(study_groups_collection.find({"is_session_active": True}))
        print(f"Active groups found: {len(active_groups)}")
        
        # Clean up - delete the test group
        study_groups_collection.delete_one({"_id": result.inserted_id})
        
        return {
            "success": True,
            "inserted_id": str(result.inserted_id),
            "found_group": bool(found_group),
            "active_groups_count": len(active_groups),
            "test_completed": True
        }
    except Exception as e:
        return {"error": str(e), "error_type": type(e).__name__}
