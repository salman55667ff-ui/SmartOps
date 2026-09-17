from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, Task
from dependencies import get_current_user

router = APIRouter(
	prefix="/dashboard",
	tags=["Dashboard"]
)

# =========================
# ADMIN DASHBOARD
# =========================

@router.get("/admin")
def admin_dashboard(
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):

	# Only admin can access
	if current_user.role != "admin":
		raise HTTPException(
			status_code=403,
			detail="Admin access required"
		)

	# User statistics
	total_users = db.query(User).count()

	total_employees = db.query(User).filter(
		User.role == "employee"
	).count()

	total_admins = db.query(User).filter(
		User.role == "admin"
	).count()

	# Task statistics
	total_tasks = db.query(Task).count()

	pending_tasks = db.query(Task).filter(
		Task.status == "pending"
	).count()

	in_progress_tasks = db.query(Task).filter(
		Task.status == "in_progress"
	).count()

	completed_tasks = db.query(Task).filter(
		Task.status == "completed"
	).count()

	unassigned_tasks = db.query(Task).filter(
		Task.assigned_to.is_(None)
	).count()

	return {
		"dashboard": "admin",
		"admin": {
			"id": current_user.id,
			"name": current_user.name,
			"email": current_user.email
		},
		"users": {
			"total_users": total_users,
			"total_employees": total_employees,
			"total_admins": total_admins
		},
		"tasks": {
			"total_tasks": total_tasks,
			"pending": pending_tasks,
			"in_progress": in_progress_tasks,
			"completed": completed_tasks,
			"unassigned": unassigned_tasks
		}
	}

# =========================
# EMPLOYEE DASHBOARD
# =========================

@router.get("/employee")
def employee_dashboard(
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):

	# Only employee can access
	if current_user.role != "employee":
		raise HTTPException(
			status_code=403,
			detail="Employee access required"
		)

	# Get employee's assigned tasks
	total_tasks = db.query(Task).filter(
		Task.assigned_to == current_user.id
	).count()

	pending_tasks = db.query(Task).filter(
		Task.assigned_to == current_user.id,
		Task.status == "pending"
	).count()

	in_progress_tasks = db.query(Task).filter(
		Task.assigned_to == current_user.id,
		Task.status == "in_progress"
	).count()

	completed_tasks = db.query(Task).filter(
		Task.assigned_to == current_user.id,
		Task.status == "completed"
	).count()

	return {
		"dashboard": "employee",
		"employee": {
			"id": current_user.id,
			"name": current_user.name,
			"email": current_user.email
		},
		"tasks": {
			"total_tasks": total_tasks,
			"pending": pending_tasks,
			"in_progress": in_progress_tasks,
			"completed": completed_tasks
		}
	}
