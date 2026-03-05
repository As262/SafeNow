"""
Quick test script to verify service provider login API
Run this after starting the Django server: python manage.py runserver
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/auth"

def test_service_login():
    """Test service provider login endpoint"""
    
    test_cases = [
        {
            "name": "Admin Login",
            "service_id": "ADM-001",
            "password": "admin123",
        },
        {
            "name": "Hospital Login",
            "service_id": "HSP-001",
            "password": "hospital123",
        },
        {
            "name": "Fire Department Login",
            "service_id": "FIR-001",
            "password": "fire123",
        },
        {
            "name": "NGO Login",
            "service_id": "NGO-001",
            "password": "ngo123",
        },
        {
            "name": "Invalid Credentials",
            "service_id": "HSP-999",
            "password": "wrongpassword",
            "should_fail": True,
        },
    ]
    
    print("=" * 70)
    print("TESTING SERVICE PROVIDER LOGIN API")
    print("=" * 70)
    print()
    
    for test in test_cases:
        print(f"Testing: {test['name']}")
        print(f"  Service ID: {test['service_id']}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/service-login/",
                json={
                    "service_id": test["service_id"],
                    "password": test["password"],
                },
                timeout=5
            )
            
            if test.get("should_fail"):
                if response.status_code == 401:
                    print(f"  ✓ PASS - Correctly rejected invalid credentials")
                else:
                    print(f"  ✗ FAIL - Should have rejected but got {response.status_code}")
            else:
                if response.status_code == 200:
                    data = response.json()
                    print(f"  ✓ PASS - Login successful")
                    print(f"    Role: {data['user']['role']}")
                    print(f"    Name: {data['user']['name']}")
                    print(f"    Token: {data['token'][:50]}...")
                else:
                    print(f"  ✗ FAIL - Got status {response.status_code}")
                    print(f"    Response: {response.text}")
        
        except requests.exceptions.ConnectionError:
            print(f"  ✗ ERROR - Could not connect to server")
            print(f"    Make sure Django server is running: python manage.py runserver")
            break
        except Exception as e:
            print(f"  ✗ ERROR - {str(e)}")
        
        print()
    
    print("=" * 70)
    print("TEST COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    test_service_login()
