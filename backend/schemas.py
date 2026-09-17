from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    priority: str = "medium"
    due_date: datetime | None = None
    assigned_to: int | None = None


class TaskStatusUpdate(BaseModel):
    status: str


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str | None
    priority: str
    status: str
    due_date: datetime | None
    assigned_to: int | None
    created_by: int

    class Config:
        from_attributes = True


# =========================
# Workflow Schemas
# =========================

class WorkflowCreate(BaseModel):
    name: str
    description: str | None = None


class WorkflowStepCreate(BaseModel):
    workflow_id: int
    task_id: int | None = None
    step_number: int
    title: str
    description: str | None = None
    assigned_to: int | None = None


class WorkflowStepStatusUpdate(BaseModel):
    status: str