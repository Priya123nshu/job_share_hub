
# Auto-update script for JobShare
# This script runs the collection, moves data to frontend, commits, and pushes.

Write-Host "--- Starting Hourly Update [$(Get-Date)] ---"

# 1. Run the Python Collection Script
python collect_job_urls_unique.py

if ($LASTEXITCODE -ne 0) {
    Write-Error "Python script failed."
    exit $LASTEXITCODE
}

# 2. Python script already copied data to Next.js Public Folder
# Removing manual copy step

# 3. Git Operations
Write-Host "Staging changes..."
# We stage the public copy
git add jobshare-frontend/public/jobs_data.json

# Check if there are changes
$status = git status --porcelain
if ($status) {
    Write-Host "Committing changes..."
    git commit -m "update: fresh jobs data [$(Get-Date -Format 'yyyy-MM-dd HH:mm')]"

    Write-Host "Pushing to remote..."
    git push origin main
} else {
    Write-Host "No changes to commit."
}

Write-Host "--- Update Complete ---"
