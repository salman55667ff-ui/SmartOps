from database import engine, Base

from models import WorkflowStep

Base.metadata.create_all(bind=engine)

print("Workflow steps table created successfully!")