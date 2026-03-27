#!/usr/bin/env python3
"""
Mud Patch Garment Reusability AI Engine - Backend API Tests
Tests all API endpoints for functionality and integration
"""

import requests
import sys
import json
from datetime import datetime

class MudPatchAPITester:
    def __init__(self, base_url="https://sharp-jones-6.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=60)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting Mud Patch API Comprehensive Tests...")
        print(f"   Base URL: {self.base_url}")
        print(f"   API URL: {self.api_url}")
        
        # Basic endpoint tests
        self.run_test("Health Check", "GET", "health", 200)
        self.run_test("Root API", "GET", "", 200)
        
        # Admin endpoints
        self.run_test("Admin Settings", "GET", "admin/settings", 200)
        self.run_test("Admin Brands", "GET", "admin/brands", 200)
        self.run_test("Admin Categories", "GET", "admin/categories", 200)
        
        # Seed data (this should populate brands and categories)
        self.run_test("Seed Default Data", "POST", "admin/seed", 200)
        
        # Test history (should be empty initially or have previous data)
        self.run_test("Analysis History", "GET", "history", 200)
        
        # CRUD operations
        self.test_brand_crud()
        self.test_category_crud()
        self.test_settings_update()
        
        # AI Analysis test (main feature)
        self.test_ai_analysis()
        
        # Print summary
        print(f"\n📊 Backend API Test Summary:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

    def test_brand_crud(self):
        """Test brand CRUD operations"""
        brand_data = {
            "name": "Test Brand CRUD",
            "category": "medium_quality",
            "score": 65,
            "keywords": ["test", "crud"]
        }
        
        success, response = self.run_test("Create Brand", "POST", "admin/brands", 200, brand_data)
        if success and 'id' in response:
            brand_id = response['id']
            self.run_test("Delete Brand", "DELETE", f"admin/brands/{brand_id}", 200)

    def test_category_crud(self):
        """Test category CRUD operations"""
        category_data = {
            "name": "Test Category CRUD",
            "market_demand_score": 75
        }
        
        success, response = self.run_test("Create Category", "POST", "admin/categories", 200, category_data)
        if success and 'id' in response:
            category_id = response['id']
            self.run_test("Delete Category", "DELETE", f"admin/categories/{category_id}", 200)

    def test_settings_update(self):
        """Test updating admin settings"""
        success, current_settings = self.run_test("Get Settings for Update", "GET", "admin/settings", 200)
        
        if success:
            updated_settings = current_settings.copy()
            # Slightly modify weights to test update
            updated_settings['formula_weights']['Q'] = 0.32
            self.run_test("Update Settings", "PUT", "admin/settings", 200, updated_settings)

    def test_ai_analysis(self):
        """Test AI analysis with mock garment image"""
        # Simple 1x1 red pixel JPEG in base64
        test_image = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A"
        
        analysis_data = {
            "image_base64": test_image,
            "retail_price": 49.99,
            "brand_name": "Test Brand",
            "category": "T-shirts",
            "age_months": 6
        }
        
        print("   Note: This test uses Claude AI integration and may take longer...")
        success, response = self.run_test("AI Garment Analysis", "POST", "analyze", 200, analysis_data)
        
        if success:
            print(f"   ✓ RVS Score: {response.get('rvs_total', 'N/A')}")
            print(f"   ✓ Suggested Action: {response.get('suggested_action', 'N/A')}")
            print(f"   ✓ Return Credit: ${response.get('return_credit', 0):.2f}")
            print(f"   ✓ Fabric Type: {response.get('ai_analysis', {}).get('fabric_type', 'N/A')}")

def main():
    tester = MudPatchAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
