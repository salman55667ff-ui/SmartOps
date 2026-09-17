from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, Task, Workflow, WorkflowStep
from schemas import (
    WorkflowCreate,
    WorkflowStepCreate,
    WorkflowStepStatusUpdate,
)
from dependencies import get_current_user


router = APIRouter(
    prefix="/workflow",
    tags=["Workflow"]
)


# =========================================================
# Create Workflow
# =========================================================

@router.post("/")
def create_workflow(
    workflow_data: WorkflowCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    new_workflow = Workflow(
        name=workflow_data.name,
        description=workflow_data.description,
        status="active",
        created_by=current_user.id
    )

    db.add(new_workflow)
    db.commit()
    db.refresh(new_workflow)

    return {
        "message": "Workflow created successfully",
        "workflow": {
            "id": new_workflow.id,
            "name": new_workflow.name,
            "description": new_workflow.description,
            "status": new_workflow.status,
            "created_by": new_workflow.created_by,
            "created_at": new_workflow.created_at
        }
    }


# =========================================================
# Get All Workflows
# =========================================================

@router.get("/")
def get_workflows(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    workflows = db.query(Workflow).all()

    return {
        "message": "Workflows retrieved successfully",
        "total_workflows": len(workflows),
        "workflows": [
            {
                "id": workflow.id,
                "name": workflow.name,
                "description": workflow.description,
                "status": workflow.status,
                "created_by": workflow.created_by,
                "created_at": workflow.created_at
            }
            for workflow in workflows
        ]
    }


# =========================================================
# Create Workflow Step
# =========================================================

@router.post("/steps")
def create_workflow_step(
    step_data: WorkflowStepCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    workflow = db.query(Workflow).filter(
        Workflow.id == step_data.workflow_id
    ).first()

    if not workflow:
        raise HTTPException(
            status_code=404,
            detail="Workflow not found"
        )

    if step_data.task_id is not None:

        task = db.query(Task).filter(
            Task.id == step_data.task_id
        ).first()

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )

    if step_data.assigned_to is not None:

        employee = db.query(User).filter(
            User.id == step_data.assigned_to
        ).first()

        if not employee:
            raise HTTPException(
                status_code=404,
                detail="Assigned user not found"
            )

        if employee.role != "employee":
            raise HTTPException(
                status_code=400,
                detail="Workflow step can only be assigned to an employee"
            )

    new_step = WorkflowStep(
        workflow_id=step_data.workflow_id,
        task_id=step_data.task_id,
        step_number=step_data.step_number,
        title=step_data.title,
        description=step_data.description,
        assigned_to=step_data.assigned_to,
        status="pending"
    )

    db.add(new_step)
    db.commit()
    db.refresh(new_step)

    return {
        "message": "Workflow step created successfully",
        "step": {
            "id": new_step.id,
            "workflow_id": new_step.workflow_id,
            "task_id": new_step.task_id,
            "step_number": new_step.step_number,
            "title": new_step.title,
            "description": new_step.description,
            "assigned_to": new_step.assigned_to,
            "status": new_step.status,
            "created_at": new_step.created_at
        }
    }


# =========================================================
# Get Workflow Steps
# =========================================================

@router.get("/{workflow_id}/steps")
def get_workflow_steps(
    workflow_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id
    ).first()

    if not workflow:
        raise HTTPException(
            status_code=404,
            detail="Workflow not found"
        )

    steps = db.query(WorkflowStep).filter(
        WorkflowStep.workflow_id == workflow_id
    ).order_by(
        WorkflowStep.step_number
    ).all()

    return {
        "message": "Workflow steps retrieved successfully",
        "workflow_id": workflow_id,
        "total_steps": len(steps),
        "steps": [
            {
                "id": step.id,
                "workflow_id": step.workflow_id,
                "task_id": step.task_id,
                "step_number": step.step_number,
                "title": step.title,
                "description": step.description,
                "assigned_to": step.assigned_to,
                "status": step.status,
                "created_at": step.created_at
            }
            for step in steps
        ]
    }


# =========================================================
# Update Workflow Step Status
# =========================================================

@router.patch("/steps/{step_id}/status")
def update_workflow_step_status(
    step_id: int,
    status_data: WorkflowStepStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    step = db.query(WorkflowStep).filter(
        WorkflowStep.id == step_id
    ).first()

    if not step:
        raise HTTPException(
            status_code=404,
            detail="Workflow step not found"
        )

    allowed_statuses = [
        "pending",
        "in_progress",
        "completed"
    ]

    if status_data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    if current_user.role == "employee":

        if step.assigned_to != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to update this workflow step"
            )

    step.status = status_data.status

    db.commit()
    db.refresh(step)

    return {
        "message": "Workflow step status updated successfully",
        "step_id": step.id,
        "status": step.status
    }


# =========================================================
# Start Workflow
# =========================================================

@router.post("/start/{task_id}")
def start_workflow(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    task = db.query(Task).filter(
        Task.id == task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    if current_user.role == "employee":

        if task.assigned_to != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to start this workflow"
            )

    task.status = "in_progress"

    db.commit()
    db.refresh(task)

    return {
        "message": "Workflow started successfully",
        "task_id": task.id,
        "status": task.status
    }


# =========================================================
# Complete Workflow
# =========================================================

@router.post("/complete/{task_id}")
def complete_workflow(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    task = db.query(Task).filter(
        Task.id == task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    if current_user.role == "employee":

        if task.assigned_to != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to complete this workflow"
            )

    task.status = "completed"

    db.commit()
    db.refresh(task)

    return {
        "message": "Workflow completed successfully",
        "task_id": task.id,
        "status": task.status
    }