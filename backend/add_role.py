from database import engine
from sqlalchemy import text

with engine.connect() as connection:
    connection.execute(
        text(
            "ALTER TABLE users "
            "ADD COLUMN IF NOT EXISTS role VARCHAR NOT NULL DEFAULT 'employee'"
        )
    )
    connection.commit()

print("Role column added successfully!")