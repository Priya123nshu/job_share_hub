import asyncio
import json
import os
import shutil
import datetime
from mcp.client.stdio import stdio_client
from mcp import ClientSession

# Import our custom utilities
from linkedin_utils import get_server_parameters, search_jobs

DATA_FILE = "jobs_data.json"
KEYWORDS = [
    # --- General Intern / Fresher ---
    "Software Engineer Intern",
    "Software Developer Intern",
    "Junior Software Engineer",
    "Graduate Software Engineer",
    "Fresher Software Developer",

    # --- Frontend ---
    "Frontend Developer Intern",
    "React Intern",
    "Junior Frontend Developer",
    "Web Developer Intern",
    "UI Developer Intern",

    # --- Backend ---
    "Backend Developer Intern",
    "Node.js Intern",
    "Java Backend Intern",
    "Python Developer Intern",
    "Junior Backend Engineer",

    # --- Full Stack ---
    "Full Stack Developer Intern",
    "Junior Full Stack Developer",
    "MERN Stack Intern",
    "Web Engineer Intern",

    # --- Data ---
    "Data Analyst Intern",
    "Business Analyst Intern",
    "Data Science Intern",
    "Junior Data Analyst",
    "SQL Intern",

    # --- AI / ML ---
    "AI Intern",
    "Machine Learning Intern",
    "Deep Learning Intern",
    "Neural Network Intern",
    "Junior Machine Learning Engineer",

    # --- Cloud / DevOps ---
    "DevOps Intern",
    "Cloud Engineer Intern",
    "AWS Intern",
    "Site Reliability Intern",

    # --- QA / Testing ---
    "QA Intern",
    "Software Testing Intern",
    "Automation Testing Intern",

    # --- Product & Others ---
    "Product Analyst Intern",
    "Technical Analyst Intern",
    "IT Intern",
    "Engineering Intern"

]

def load_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading JSON, starting fresh: {e}")
            pass
    
    # Initialize default structure matches the requested grouping
    return {
        "metadata": {"last_updated": None},
        "profiles": {k: {"1h": [], "24h": []} for k in KEYWORDS}
    }

async def main():
    print(f"--- Starting Job Collection & Rotation Script [{datetime.datetime.now()}] ---")
    
    # 1. Load & Rotate
    data = load_data()
    profiles = data.get("profiles", {})
    
    # Ensure structure integrity
    for k in KEYWORDS:
        if k not in profiles:
            profiles[k] = {"1h": [], "24h": []}
            
    print("Rotating bucket contents (1h -> 24h)...")
    for key in KEYWORDS:
        curr_1h = profiles[key].get("1h", [])
        curr_24h = profiles[key].get("24h", [])
        
        # Merge 1h into 24h, removing duplicates
        combined = curr_24h + curr_1h
        new_24h = sorted(list(set(combined)), reverse=True) # Sort desc (likely newest first)
        
        profiles[key]["24h"] = new_24h
        profiles[key]["1h"] = [] # Clear the 1h bucket
        
    # 2. Search New Jobs
    # Note: Using 'r86400' (24h) for demonstration to ensure data population.
    # In a real hourly schedule, this should typically be 'r3600'.
    TIME_FILTER = "r3600" 
    LOCATION = "India"
    
    server_params = get_server_parameters()

    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                
                for keyword in KEYWORDS:
                    print(f"Searching for '{keyword}' in {LOCATION} (Last {TIME_FILTER})...")
                    urls = await search_jobs(session, keyword, limit=10, location=LOCATION, time_posted=TIME_FILTER)
                    
                    if urls:
                        count = len(urls)
                        print(f"  -> Found {count} jobs.")
                        # Add to 1h bucket
                        current_1h = profiles[keyword]["1h"]
                         # Deduplicate against current session finds
                        current_1h_set = set(current_1h)
                        for u in urls:
                            current_1h_set.add(u)
                        
                        # Sort and save
                        profiles[keyword]["1h"] = sorted(list(current_1h_set), reverse=True)
                        
                    else:
                        print("  -> No jobs found.")
                        
                    await asyncio.sleep(1.5)

    except Exception as e:
        print(f"CRITICAL ERROR during search: {e}")
        
    # 3. Save
    data["metadata"]["last_updated"] = datetime.datetime.now().isoformat()
    data["profiles"] = profiles
    
    # Prune profiles that are no longer in the KEYWORDS list
    # This ensures the frontend only shows what is actively configured
    current_keywords_set = set(KEYWORDS)
    pruned_profiles = {k: v for k, v in data["profiles"].items() if k in current_keywords_set}
    data["profiles"] = pruned_profiles

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    # Calculate stats
    total_1h = sum(len(p.get("1h", [])) for p in data["profiles"].values())
    total_24h = sum(len(p.get("24h", [])) for p in data["profiles"].values())
    
    print(f"Data saved to {DATA_FILE}")
    print(f"Summary: {total_1h} jobs in '1h' buckets, {total_24h} jobs in '24h' buckets.")

    # 4. Sync to Frontend
    FRONTEND_PATH = os.path.join("jobshare-frontend", "public", "jobs_data.json")
    if os.path.exists(os.path.dirname(FRONTEND_PATH)):
        try:
            shutil.copy2(DATA_FILE, FRONTEND_PATH)
            print(f"Successfully synced data to frontend: {FRONTEND_PATH}")
        except Exception as e:
            print(f"Error syncing to frontend: {e}")
    else:
         print(f"Frontend directory not found at {os.path.dirname(FRONTEND_PATH)}, skipping sync.")

    print("="*60)

if __name__ == "__main__":
    asyncio.run(main())
