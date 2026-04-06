import os
import sys
import subprocess
import time
import platform

def print_header():
    print("=" * 70)
    print("  SafeNow - Complete Environment Startup")
    print("  Your Safety, Our Priority")
    print("=" * 70)
    print()

def check_command(command):
    """Check if a command is available"""
    try:
        subprocess.run([command, "--version"], 
                      capture_output=True, 
                      check=False,
                      shell=True if platform.system() == "Windows" else False)
        return True
    except:
        return False

def start_backend():
    """Start Django backend server"""
    print("[1/3] Starting Django Backend Server...")
    print("-" * 70)
    
    backend_dir = os.path.join(os.path.dirname(__file__), "backend")
    
    if platform.system() == "Windows":
        cmd = f'start "SafeNow Backend" cmd /k "cd /d {backend_dir} && python manage.py runserver 0.0.0.0:8000"'
        subprocess.Popen(cmd, shell=True)
    else:
        cmd = ["python", "manage.py", "runserver", "0.0.0.0:8000"]
        subprocess.Popen(cmd, cwd=backend_dir)
    
    print("✓ Backend server starting on http://localhost:8000")
    print("  Waiting 5 seconds for server to initialize...")
    time.sleep(5)
    print()

def start_emulator():
    """Start Android emulator"""
    print("[2/3] Starting Android Emulator...")
    print("-" * 70)
    
    if not check_command("emulator"):
        print("⚠ WARNING: Android emulator not found in PATH")
        print("  Make sure Android SDK is installed")
        print("  You can manually start the emulator from Android Studio")
        print()
        return
    
    try:
        # List available AVDs
        result = subprocess.run(["emulator", "-list-avds"], 
                              capture_output=True, 
                              text=True,
                              timeout=10)
        avds = result.stdout.strip().split('\n')
        
        if avds and avds[0]:
            avd_name = avds[0]
            print(f"  Found AVD: {avd_name}")
            
            if platform.system() == "Windows":
                cmd = f'start "Android Emulator" emulator -avd {avd_name}'
                subprocess.Popen(cmd, shell=True)
            else:
                subprocess.Popen(["emulator", "-avd", avd_name])
            
            print(f"✓ Emulator '{avd_name}' starting...")
            print("  Waiting 15 seconds for emulator to boot...")
            time.sleep(15)
        else:
            print("⚠ No Android Virtual Devices found")
            print("  Create one in Android Studio (Tools > Device Manager)")
    except Exception as e:
        print(f"⚠ Could not start emulator: {e}")
    
    print()

def start_mobile_app():
    """Start Expo mobile app"""
    print("[3/3] Starting Expo Mobile App...")
    print("-" * 70)
    
    mobile_dir = os.path.join(os.path.dirname(__file__), "mobile")
    
    if not os.path.exists(os.path.join(mobile_dir, "node_modules")):
        print("  Node modules not found. Installing dependencies...")
        subprocess.run(["npm", "install"], cwd=mobile_dir, shell=True)
        print()
    
    if platform.system() == "Windows":
        cmd = f'start "SafeNow Mobile" cmd /k "cd /d {mobile_dir} && npm start"'
        subprocess.Popen(cmd, shell=True)
    else:
        subprocess.Popen(["npm", "start"], cwd=mobile_dir)
    
    print("✓ Expo development server starting...")
    print()

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print_header()
    
    # Check Python
    print(f"Python version: {sys.version.split()[0]}")
    print()
    
    try:
        start_backend()
        start_emulator()
        start_mobile_app()
        
        print("=" * 70)
        print("  All Services Started Successfully!")
        print("=" * 70)
        print()
        print("  📱 Backend:   http://localhost:8000")
        print("  🔐 Admin:     http://localhost:8000/admin")
        print("  📲 Mobile:    Follow instructions in Expo terminal")
        print()
        print("  Demo Login Credentials:")
        print("  ├─ Mobile: 1234567890")
        print("  └─ OTP:    000000")
        print()
        print("=" * 70)
        print()
        print("Keep all terminal windows open for the app to work!")
        print("Press Ctrl+C here to view instructions for stopping services...")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n\nTo stop all services:")
            print("  1. Close the Backend terminal window")
            print("  2. Close the Expo terminal window")
            print("  3. Close the Android Emulator")
            print()
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("Please check the error above and try again.")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
