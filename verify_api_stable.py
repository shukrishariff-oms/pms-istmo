import requests
import json

def test_api():
    base_url = "http://localhost:8000"
    
    endpoints = [
        "/projects",
        "/portfolio/dashboard"
    ]
    
    for ep in endpoints:
        print(f"Testing {ep}...")
        try:
            # We don't have a token here, but some endpoints might be open 
            # or we can just check if it returns 200 or 401 (not 500)
            response = requests.get(f"{base_url}{ep}")
            print(f"Status Code: {response.status_code}")
            if response.status_code == 500:
                print(f"ERROR: {ep} returned 500 Internal Server Error")
            else:
                print(f"OK: {ep} is stable (returned {response.status_code})")
        except Exception as e:
            print(f"FAILED to connect: {e}")

if __name__ == "__main__":
    test_api()
