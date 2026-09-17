import requests

BASE_URL = "http://127.0.0.1:8000"

login_data = {
    "email": "ali.employee@gmail.com",
    "password": "Ali123456"
}

login_response = requests.post(
    f"{BASE_URL}/login",
    json=login_data
)

print("Login Status:", login_response.status_code)
print(login_response.json())

if login_response.status_code != 200:
    raise SystemExit("Login failed. Test stopped.")

token = login_response.json()["access_token"]

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

status_data = {
    "status": "in_progress"
}

response = requests.patch(
    f"{BASE_URL}/tasks/1/status",
    json=status_data,
    headers=headers
)

print("\nTask Status Update:")
print("Status Code:", response.status_code)
print("Response:", response.json())