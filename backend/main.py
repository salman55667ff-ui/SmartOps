
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from models import User
from schemas import UserRegister, UserLogin

from auth import (
    hash_password,
    verify_password,
    create_access_token
)

from dependencies import get_current_user

from users import router as users_router
from tasks import router as tasks_router
from dashboard import router as dashboard_router
from workflow import router as workflow_router
from ai import router as ai_router


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="SmartOps API",
    description="AI-Powered Employee Task & Workflow Management System",
    version="1.0.0"
)


# =========================================================
# CORS CONFIGURATION
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Vite ports
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        "http://localhost:5174",
        "http://127.0.0.1:5174",

        "http://localhost:5175",
        "http://127.0.0.1:5175",

        "http://localhost:5176",
        "http://127.0.0.1:5176",

        "http://localhost:5177",
        "http://127.0.0.1:5177",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# HOME / HEALTH CHECK
# =========================================================

@app.get("/")
def home():
    return {
        "message": "SmartOps API is running",
        "status": "success"
    }


# =========================================================
# REGISTER
# =========================================================

@app.post("/register")
def register(
    user: UserRegister,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = hash_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user_id": new_user.id,
        "email": new_user.email
    }


# =========================================================
# LOGIN
# =========================================================

@app.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_ok = verify_password(
        user.password,
        existing_user.password
    )

    if not password_ok:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "sub": str(existing_user.id)
        }
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": existing_user.id,
        "email": existing_user.email
    }


# =========================================================
# PROFILE
# =========================================================

@app.get("/profile")
def profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "message": "Profile accessed successfully",
        "user_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }


# =========================================================
# ADMIN DASHBOARD
# =========================================================

@app.get("/admin")
def admin_dashboard(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return {
        "message": "Welcome to Admin Dashboard",
        "user_id": current_user.id,
        "name": current_user.name,
        "role": current_user.role
    }


# =========================================================
# MAKE USER ADMIN
# =========================================================

@app.put("/make-admin/{user_id}")
def make_admin(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.role = "admin"

    db.commit()
    db.refresh(user)

    return {
        "message": "User is now admin",
        "user_id": user.id,
        "name": user.name,
        "role": user.role
    }


# =========================================================
# ROUTERS
# =========================================================

app.include_router(users_router)
app.include_router(tasks_router)
app.include_router(dashboard_router)
app.include_router(workflow_router)
app.include_router(ai_router)
