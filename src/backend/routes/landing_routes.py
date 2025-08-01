from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

router = APIRouter()

# Landing page data - can be moved to database later
LANDING_PAGE_DATA = {
    "intro": {
        "header": "Unlock Your Ultimate Review Experience",
        "subHeader": "Your all-in-one platform for interactive learning, progress tracking, and community collaboration. Let's start your journey to success.",
    },
    "about": {
        "header": "Dr. Carl Balita Review Center",
        "content": "CBRC, popularly known as the Dr. Carl E. Balita Review Center, stands as the biggest, most awarded, and the only ISO 9001-2015 certified business of its kind. An off-shoot of the 'review experience' of its founder Dr. Carl E. Balita, who started in the review industry in 1993, CBRC was founded in 2004 with just a chair and a table to boot. Since then, it has grown remarkably, boasting 125 branches in major cities nationwide, and has produced hundreds of topnotchers and thousands of board passers. This reputation underscores the importance of continually innovating and enhancing preparation methods to maintain its leadership in the industry.",
    },
    "news": {
        "header": "Latest News",
        "title": "Announcement",
        "content": "CBRC is proud to announce the launch of its new online learning platform, designed to make education accessible to everyone!",
    },
    "featuredCourses": [
        {
            "title": "Nursing Licensure Examination",
            "label": "Top Rated",
            "image": "https://picsum.photos/seed/nursing/600/400",
        },
        {
            "title": "Criminology Licensure Examination",
            "label": "Recommended",
            "image": "https://picsum.photos/seed/criminology/600/400",
        },
        {
            "title": "Professional Teacher Licensure Examination",
            "label": "Most Popular",
            "image": "https://picsum.photos/seed/teacher/600/400",
        },
    ],
}

@router.get("/api/landing-page")
async def get_landing_page_data():
    """Get landing page data"""
    return LANDING_PAGE_DATA
