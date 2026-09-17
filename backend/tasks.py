from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, Task
from schemas import TaskCreate, TaskResponse, TaskStatusUpdate
from dependencies import get_current_user


router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"]
)


# Create Task
@router.post("/", response_model=TaskResponse)
def create_task(
    task: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Only admin can create tasks
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    # Check assigned employee
    if task.assigned_to is not None:

        employee = db.query(User).filter(
            User.id == task.assigned_to
        ).first()

        if not employee:
            raise HTTPException(
                status_code=404,
                detail="Assigned user not found"
            )

        if employee.role != "employee":
            raise HTTPException(
                status_code=400,
                detail="Task can only be assigned to an employee"
            )

    new_task = Task(
        title=task.title,
        description=task.description,
        priority=task.priority,
        due_date=task.due_date,
        assigned_to=task.assigned_to,
        created_by=current_user.id
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task


# Get All Tasks
@router.get("/", response_model=list[TaskResponse])
def get_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Admin can see all tasks
    if current_user.role == "admin":
        tasks = db.query(Task).all()

    # Employee can see only assigned tasks
    else:
        tasks = db.query(Task).filter(
            Task.assigned_to == current_user.id
        ).all()

    return tasks


# Get Single Task
@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
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

    # Admin can view any task
    if current_user.role == "admin":
        return task

    # Employee can view only assigned task
    if task.assigned_to != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to view this task"
        )

    return task


# Update Task
@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Find task
    task = db.query(Task).filter(
        Task.id == task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    # Only admin can update tasks
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    # Check assigned employee
    if task_data.assigned_to is not None:

        employee = db.query(User).filter(
            User.id == task_data.assigned_to
        ).first()

        if not employee:
            raise HTTPException(
                status_code=404,
                detail="Assigned user not found"
            )

        if employee.role != "employee":
            raise HTTPException(
                status_code=400,
                detail="Task can only be assigned to an employee"
            )

    # Update task fields
    task.title = task_data.title
    task.description = task_data.description
    task.priority = task_data.priority
    task.due_date = task_data.due_date
    task.assigned_to = task_data.assigned_to

    db.commit()
    db.refresh(task)

    return task


# Update Task Status - Employee
@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: int,
    status_data: TaskStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Find task
    task = db.query(Task).filter(
        Task.id == task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    # Only employee can update task status
    if current_user.role != "employee":
        raise HTTPException(
            status_code=403,
            detail="Only employees can update task status"
        )

    # Employee can update only their assigned task
    if task.assigned_to != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to update this task"
        )

    # Allowed statuses
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

    # Update status
    task.status = status_data.status

    db.commit()
    db.refresh(task)

    return task


# Delete Task
@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Find task
    task = db.query(Task).filter(
        Task.id == task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    # Only admin can delete tasks
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully",
        "task_id": task_id
    }