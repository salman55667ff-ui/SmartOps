
import os

from dotenv import load_dotenv
from google import genai

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models import User, Task
from database import get_db
from dependencies import get_current_user


# =========================
# LOAD ENVIRONMENT VARIABLES
# =========================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is not set in the .env file."
    )


# =========================
# GEMINI CLIENT
# =========================

client = genai.Client(
    api_key=GEMINI_API_KEY,
    vertexai=False
)


# =========================
# ROUTER
# =========================

router = APIRouter(
    prefix="/ai",
    tags=["AI Assistant"]
)


# =========================
# ANALYZE TASK
# =========================

@router.post("/analyze-task/{task_id}")
def analyze_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # -------------------------
    # Find task
    # -------------------------

    task = db.query(Task).filter(
        Task.id == task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )


    # -------------------------
    # Permission check
    # -------------------------

    if current_user.role == "employee":

        if task.assigned_to != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to analyze this task"
            )


    # -------------------------
    # AI Prompt
    # -------------------------

    prompt = f"""
You are an AI assistant inside SmartOps,
an employee task and workflow management system.

Analyze this employee task.

Task ID:
{task.id}

Task Title:
{task.title}

Task Description:
{task.description or "No description provided"}

Current Priority:
{task.priority}

Current Status:
{task.status}

Due Date:
{task.due_date or "No due date"}

Provide the answer in this format:

1. Suggested Priority
2. Estimated Effort
3. Step-by-Step Task Breakdown
4. Helpful Advice

Keep the response practical, professional and concise.
"""


    # -------------------------
    # Call Gemini
    # -------------------------

    try:

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        if not response.text:
            raise Exception(
                "Gemini returned an empty response."
            )

        return {
            "message": "AI task analysis generated successfully",

            "user_id": current_user.id,

            "task": {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "priority": task.priority,
                "status": task.status,
                "due_date": task.due_date
            },

            "ai_analysis": response.text
        }


    except Exception as e:

        print("GEMINI ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail=f"AI service error: {str(e)}"
        )

