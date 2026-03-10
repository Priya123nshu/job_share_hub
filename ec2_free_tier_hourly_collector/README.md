# EC2 Free-Tier Hourly Collector Bundle

This folder contains everything needed to run LinkedIn URL collection hourly on Amazon Linux 2023 and upload results to S3, without modifying your existing project files.

## What this bundle does

- Runs a Linux-safe collector entrypoint: `collect_job_urls_ec2.py`
- Uses a Linux-safe MCP helper: `linkedin_utils_ec2.py`
- Writes output to `job_urls.txt` in repo root (default)
- Uploads each run to S3:
  - `latest/job_urls.txt`
  - `history/job_urls_<UTC timestamp>.txt`
- Schedules execution with `systemd` timer at minute 5 every hour

## Files in this folder

- `collect_job_urls_ec2.py`: collector job
- `linkedin_utils_ec2.py`: MCP server startup + `search_jobs()` utility
- `run_collect_and_upload.sh`: run collector + upload to S3
- `bootstrap_amazon_linux_2023.sh`: install dependencies and Python environment
- `install_systemd_units.sh`: install service/timer and environment file
- `mcp-collector.service`: systemd service template
- `mcp-collector.timer`: systemd timer template
- `mcp-collector.env.example`: environment file template

## EC2 setup steps

1. Launch EC2:
- AMI: Amazon Linux 2023 (x86_64)
- Instance: free-tier eligible (for example, `t3.micro`)
- Security Group: allow `22` only from your IP
- IAM Role: allow `s3:PutObject` (and optionally `s3:ListBucket`) for your target bucket/prefix

2. Clone your repo to:
- `/home/ec2-user/mcp_client`

3. Set instance timezone:

```bash
sudo timedatectl set-timezone Asia/Kolkata
timedatectl
```

4. Create root project `.env` with your cookie:

```bash
cat > /home/ec2-user/mcp_client/.env << 'EOF'
LINKEDIN_COOKIE=your_li_at_cookie_here
EOF
chmod 600 /home/ec2-user/mcp_client/.env
```

5. Run bootstrap:

```bash
cd /home/ec2-user/mcp_client
bash ec2_free_tier_hourly_collector/bootstrap_amazon_linux_2023.sh
```

6. Install systemd timer:

```bash
cd /home/ec2-user/mcp_client
S3_BUCKET=your-bucket-name \
S3_PREFIX=linkedin-jobs \
bash ec2_free_tier_hourly_collector/install_systemd_units.sh
```

7. Validate:

```bash
sudo systemctl start mcp-collector.service
sudo systemctl status --no-pager mcp-collector.service
sudo systemctl status --no-pager mcp-collector.timer
systemctl list-timers --all | grep mcp-collector
```

8. Check logs:

```bash
journalctl -u mcp-collector.service -n 200 --no-pager
```

## Optional memory fallback (if Chromium OOMs)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
free -h
```
