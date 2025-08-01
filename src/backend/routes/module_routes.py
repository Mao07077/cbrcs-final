from fastapi import APIRouter, HTTPException, Query, Form, File, UploadFile
from database import modules_collection, post_test_collection
from bson import ObjectId
from config import logger
import os
import shutil
from typing import Optional

router = APIRouter()

@router.post("/api/create_module")
async def create_module(
    title: str = Form(...),
    topic: str = Form(...),
    description: str = Form(...),
    program: str = Form(...),
    id_number: str = Form(...),
    document: UploadFile = File(...),
    picture: UploadFile = File(...),
):
    try:
        document_path = f"uploads/{document.filename}"
        picture_path = f"uploads/{picture.filename}"
        os.makedirs("uploads", exist_ok=True)
        with open(document_path, "wb") as document_file:
            shutil.copyfileobj(document.file, document_file)
        with open(picture_path, "wb") as picture_file:
            shutil.copyfileobj(picture.file, picture_file)
        module_data = {
            "title": title,
            "topic": topic,
            "description": description,
            "program": program,
            "id_number": id_number,
            "document_url": document_path,
            "image_url": picture_path,
        }
        result = modules_collection.insert_one(module_data)
        if result.inserted_id:
            return {
                "success": True,
                "message": "Module created successfully!",
                "module_id": str(result.inserted_id)
            }
        raise HTTPException(status_code=500, detail="Failed to create module")
    except Exception as e:
        logger.error(f"Error creating module: {e}")
        raise HTTPException(status_code=500, detail="Module creation failed")

@router.get("/api/modules")
def get_modules(program: Optional[str] = Query(None)):
    query = {}
    if program and program != "All Programs":
        query["program"] = program
    modules = list(modules_collection.find(query))
    for module in modules:
        module["_id"] = str(module["_id"])
    return modules

@router.get("/api/modules/{module_id}")
def get_module_by_id(module_id: str):
    try:
        module = modules_collection.find_one({"_id": ObjectId(module_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid module ID format")
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    module["_id"] = str(module["_id"])
    return module

@router.delete("/api/modules/{module_id}")
async def delete_module(module_id: str):
    try:
        if not ObjectId.is_valid(module_id):
            logger.error(f"Invalid module ID format: {module_id}")
            raise HTTPException(status_code=400, detail="Invalid module ID format.")
        delete_result = modules_collection.delete_one({"_id": ObjectId(module_id)})
        if delete_result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Module not found.")
        post_test_collection.delete_many({"module_id": module_id})
        return {"success": True, "message": "Module and associated post-tests deleted successfully!"}
    except Exception as e:
        logger.error(f"Error deleting module with ID {module_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete module.")