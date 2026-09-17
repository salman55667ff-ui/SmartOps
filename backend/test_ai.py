import requests

BASE_URL = "http://127.0.0.1:8000"


# Login
login_data = {
    "email": "ali.employee@gmail.com",
    "password": "Ali123456"
}

login_response = requests.post(
    f"{BASE_URL}/login",
    json=login_data
)

print("Login Status:", login_response.status_code)

if login_response.status_code != 200:
    print("Login Failed:")
    print(login_response.json())
    raise SystemExit()

token = login_response.json()["access_token"]

headers = {
    "Authorization": f"Bearer {token}"
}


# AI Task Analysis
task_data = {
    "title": "Complete SmartOps Documentation",
    "description": "Complete API, database, testing and project documentation for SmartOps."
}

ai_response = requests.post(
    f"{BASE_URL}/ai/analyze-task",
    json=task_data,
    headers=headers
)

print("\nAI Analysis:")
print("Status Code:", ai_response.status_code)
print("Response:")

try:
    print(ai_response.json())
except Exception:
    print(ai_response.text)