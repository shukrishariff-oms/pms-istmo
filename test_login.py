import requests

URL = "http://localhost:8000/token"
DATA = {
    "username": "admin",
    "password": "admin123"
}

try:
    print(f"Attempting to login to {URL} with {DATA['username']}...")
    response = requests.post(URL, data=DATA)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
