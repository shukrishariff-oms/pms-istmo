import requests

def test_api():
    # Login as admin to get token
    login_data = {"username": "admin", "password": "password"}
    resp = requests.post("http://localhost:8000/token", data=login_data)
    if resp.status_code != 200:
        print("Login failed", resp.text)
        return
    
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get department stats
    resp = requests.get("http://localhost:8000/finance/my-department", headers=headers)
    print("Status:", resp.status_code)
    print("Response:", resp.json())

if __name__ == "__main__":
    test_api()
