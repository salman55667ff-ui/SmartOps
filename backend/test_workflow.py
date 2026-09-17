import requests

BASE_URL = "http://127.0.0.1:8000"


# =========================
# LOGIN AS ALI (EMPLOYEE)
# =========================

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


# =========================
# GET WORKFLOW
# =========================

workflow_response = requests.get(
    f"{BASE_URL}/workflow/",
    headers=headers
)

print("\nWorkflow Information:")
print("Status Code:", workflow_response.status_code)
print("Response:", workflow_response.json())


# =========================
# START WORKFLOW FOR TASK 1
# =========================

start_response = requests.post(
    f"{BASE_URL}/workflow/start/1",
    headers=headers
)

print("\nStart Workflow:")
print("Status Code:", start_response.status_code)
print("Response:", start_response.json())


# =========================
# COMPLETE WORKFLOW FOR TASK 1
# =========================

complete_response = requests.post(
    f"{BASE_URL}/workflow/complete/1",
    headers=headers
)

print("\nComplete Workflow:")
print("Status Code:", complete_response.status_code)
print("Response:", complete_response.json())