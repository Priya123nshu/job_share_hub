#!/usr/bin/env bash
set -Eeuo pipefail

REPO_DIR="${REPO_DIR:-/home/ec2-user/mcp_client}"
BUNDLE_DIR="${BUNDLE_DIR:-${REPO_DIR}/ec2_free_tier_hourly_collector}"

SERVICE_SRC="${BUNDLE_DIR}/mcp-collector.service"
TIMER_SRC="${BUNDLE_DIR}/mcp-collector.timer"
ENV_DST="/etc/mcp-collector.env"

S3_BUCKET="${S3_BUCKET:?S3_BUCKET is required}"
S3_PREFIX="${S3_PREFIX:-linkedin-jobs}"
AWS_REGION="${AWS_REGION:-ap-south-1}"
PYTHON_BIN="${PYTHON_BIN:-${REPO_DIR}/.venv/bin/python}"
MCP_SERVER_PYTHON="${MCP_SERVER_PYTHON:-${PYTHON_BIN}}"
COLLECTOR_SCRIPT="${COLLECTOR_SCRIPT:-${BUNDLE_DIR}/collect_job_urls_ec2.py}"
OUTPUT_FILE="${OUTPUT_FILE:-${REPO_DIR}/job_urls.txt}"

if [[ ! -f "${SERVICE_SRC}" || ! -f "${TIMER_SRC}" ]]; then
  echo "Systemd template files not found in ${BUNDLE_DIR}"
  exit 1
fi

sudo install -m 0644 "${SERVICE_SRC}" /etc/systemd/system/mcp-collector.service
sudo install -m 0644 "${TIMER_SRC}" /etc/systemd/system/mcp-collector.timer

sudo tee "${ENV_DST}" > /dev/null <<EOF
S3_BUCKET=${S3_BUCKET}
S3_PREFIX=${S3_PREFIX}
AWS_REGION=${AWS_REGION}
AWS_DEFAULT_REGION=${AWS_REGION}
REPO_DIR=${REPO_DIR}
PYTHON_BIN=${PYTHON_BIN}
MCP_SERVER_PYTHON=${MCP_SERVER_PYTHON}
COLLECTOR_SCRIPT=${COLLECTOR_SCRIPT}
OUTPUT_FILE=${OUTPUT_FILE}
ENV_FILE=${REPO_DIR}/.env
EOF

sudo chmod 600 "${ENV_DST}"

sudo systemctl daemon-reload
sudo systemctl enable --now mcp-collector.timer

echo "Timer installed and started."
sudo systemctl status --no-pager mcp-collector.timer
