from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    role = Column(String, nullable=False, default="employee")

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)

    description = Column(String, nullable=True)

    priority = Column(
        String,
        nullable=False,
        default="medium"
    )

    status = Column(
        String,
        nullable=False,
        default="pending"
    )

    due_date = Column(
        DateTime(timezone=True),
        nullable=True
    )

    assigned_to = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    description = Column(String, nullable=True)

    status = Column(
        String,
        nullable=False,
        default="active"
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id = Column(Integer, primary_key=True, index=True)

    workflow_id = Column(
        Integer,
        ForeignKey("workflows.id"),
        nullable=False
    )

    task_id = Column(
        Integer,
        ForeignKey("tasks.id"),
        nullable=True
    )

    step_number = Column(
        Integer,
        nullable=False
    )

    title = Column(
        String,
        nullable=False
    )

    description = Column(
        String,
        nullable=True
    )

    assigned_to = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    status = Column(
        String,
        nullable=False,
        default="pending"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )