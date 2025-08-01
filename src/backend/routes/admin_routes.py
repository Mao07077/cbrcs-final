from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from bson import ObjectId
from database import get_user_collection, get_reports_collection

router = APIRouter()

@router.get("/api/admin/accounts")
async def get_accounts():
    """Get all user accounts for admin"""
    try:
        user_collection = get_user_collection()
        accounts = list(user_collection.find({}))
        
        # Format account data
        formatted_accounts = []
        for account in accounts:
            formatted_accounts.append({
                "_id": str(account["_id"]),
                "firstname": account.get("firstname", ""),
                "lastname": account.get("lastname", ""),
                "id_number": account.get("id_number", ""),
                "role": account.get("role", ""),
                "email": account.get("email", ""),
                "contact_number": account.get("contact_number", ""),
                "is_verified": account.get("is_verified", False)
            })
        
        return {"success": True, "accounts": formatted_accounts}
    except Exception as e:
        return {"success": False, "error": str(e), "accounts": []}

@router.get("/api/admin/reports")
async def get_reports():
    """Get all reports for admin"""
    try:
        reports_collection = get_reports_collection()
        reports = list(reports_collection.find({}))
        
        # Format report data
        formatted_reports = []
        for report in reports:
            formatted_reports.append({
                "_id": str(report["_id"]),
                "student": report.get("student", ""),
                "studentId": report.get("studentId", ""),
                "issue": report.get("issue", ""),
                "status": report.get("status", "Pending"),
                "createdAt": report.get("createdAt"),
                "messages": report.get("messages", [])
            })
        
        return {"success": True, "reports": formatted_reports}
    except Exception as e:
        return {"success": False, "error": str(e), "reports": []}

@router.put("/api/admin/reports/{report_id}")
async def update_report_status(report_id: str, status_data: dict):
    """Update report status"""
    try:
        reports_collection = get_reports_collection()
        result = reports_collection.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"status": status_data.get("status")}}
        )
        
        if result.modified_count > 0:
            return {"success": True}
        else:
            return {"success": False, "error": "Report not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.delete("/api/admin/reports/{report_id}")
async def delete_report(report_id: str):
    """Delete a report"""
    try:
        reports_collection = get_reports_collection()
        result = reports_collection.delete_one({"_id": ObjectId(report_id)})
        
        if result.deleted_count > 0:
            return {"success": True}
        else:
            return {"success": False, "error": "Report not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/api/admin/student-performance/{student_id}")
async def get_student_performance(student_id: str):
    """Get detailed student performance data"""
    try:
        # This would typically fetch from multiple collections
        # For now, returning mock structure that matches frontend expectations
        details = {
            "preTests": [
                {"subject": "Mathematics", "score": 75, "total": 100, "date": "2023-09-01"},
                {"subject": "Science", "score": 80, "total": 100, "date": "2023-09-01"},
                {"subject": "English", "score": 85, "total": 100, "date": "2023-09-01"},
            ],
            "postTests": [
                {"subject": "Mathematics", "score": 88, "total": 100, "date": "2023-11-15"},
                {"subject": "Science", "score": 90, "total": 100, "date": "2023-11-15"},
            ],
            "studyHabits": [
                {"page": "Algebra II", "reason": "Struggled with quadratic equations"},
                {"page": "Grammar Basics", "reason": "Frequent errors in sentence structure"},
            ],
        }
        
        return {"success": True, "details": details}
    except Exception as e:
        return {"success": False, "error": str(e)}
