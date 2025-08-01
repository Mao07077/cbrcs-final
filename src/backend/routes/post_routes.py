from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from database import posts_collection
from config import logger
import os
import shutil
from typing import Optional

router = APIRouter()

@router.post("/api/save_post")
async def save_post(
    intro_header: Optional[str] = Form(None),
    intro_subHeader: Optional[str] = Form(None),
    intro_image: Optional[UploadFile] = File(None),
    news_content: Optional[str] = Form(None),
    news_image: Optional[UploadFile] = File(None),
    course_image_1: Optional[UploadFile] = File(None),
    course_image_2: Optional[UploadFile] = File(None),
    course_image_3: Optional[UploadFile] = File(None)
):
    try:
        post_data = {}
        if intro_header and intro_subHeader:
            intro_data = {"header": intro_header, "subHeader": intro_subHeader}
            if intro_image:
                intro_image_path = f"uploads/{intro_image.filename}"
                os.makedirs("uploads", exist_ok=True)
                with open(intro_image_path, "wb") as f:
                    shutil.copyfileobj(intro_image.file, f)
                intro_data["introImage"] = intro_image_path
            post_data["intro"] = intro_data
        if news_content:
            news_data = {"content": news_content}
            if news_image:
                news_image_path = f"uploads/{news_image.filename}"
                os.makedirs("uploads", exist_ok=True)
                with open(news_image_path, "wb") as f:
                    shutil.copyfileobj(news_image.file, f)
                news_data["newsImage"] = news_image_path
            post_data["news"] = news_data
        course_images = []
        for img, idx in [(course_image_1, 1), (course_image_2, 2), (course_image_3, 3)]:
            if img:
                img_path = f"uploads/{img.filename}"
                os.makedirs("uploads", exist_ok=True)
                with open(img_path, "wb") as f:
                    shutil.copyfileobj(img.file, f)
                course_images.append(img_path)
            else:
                course_images.append(None)
        post_data["courseImages"] = {"images": course_images}
        existing_post = posts_collection.find_one()
        if existing_post:
            posts_collection.update_one({}, {"$set": post_data})
        else:
            posts_collection.insert_one(post_data)
        return {"success": True, "message": "Post saved successfully!"}
    except Exception as e:
        logger.error(f"Error saving post: {e}")
        raise HTTPException(status_code=500, detail="Failed to save post")

@router.get("/api/get_post")
async def get_post():
    try:
        post = posts_collection.find_one()
        if not post:
            return {
                "success": True,
                "data": {
                    "intro": {"header": "", "subHeader": "", "introImage": None},
                    "news": {"content": "", "newsImage": None},
                    "courseImages": {"images": [None, None, None]}
                }
            }
        post["_id"] = str(post["_id"])
        return {"success": True, "data": post}
    except Exception as e:
        logger.error(f"Error fetching post: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch post")