#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="${REPO_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
PYTHON_BIN="${PYTHON_BIN:-${REPO_DIR}/.venv/bin/python}"
AWS_BIN="${AWS_BIN:-$(command -v aws)}"

S3_BUCKET="${S3_BUCKET:?S3_BUCKET is required}"
S3_PREFIX="${S3_PREFIX:-linkedin-jobs}"
ENV_FILE="${ENV_FILE:-${REPO_DIR}/.env}"
OUTPUT_FILE="${OUTPUT_FILE:-${REPO_DIR}/job_urls.txt}"
COLLECTOR_SCRIPT="${COLLECTOR_SCRIPT:-${SCRIPT_DIR}/collect_job_urls_ec2.py}"

if [[ ! -x "${PYTHON_BIN}" ]]; then
  echo "Python binary not found at ${PYTHON_BIN}"
  exit 1
fi

if [[ -z "${AWS_BIN}" ]]; then
  echo "aws CLI not found"
  exit 1
fi

export ENV_FILE
export MCP_SERVER_PYTHON="${MCP_SERVER_PYTHON:-${PYTHON_BIN}}"
export OUTPUT_FILE

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting collector"
cd "${REPO_DIR}"
"${PYTHON_BIN}" "${COLLECTOR_SCRIPT}"

if [[ ! -f "${OUTPUT_FILE}" ]]; then
  echo "Output file not found: ${OUTPUT_FILE}"
  exit 1
fi

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
latest_key="${S3_PREFIX}/latest/job_urls.txt"
history_key="${S3_PREFIX}/history/job_urls_${timestamp}.txt"

"${AWS_BIN}" s3 cp "${OUTPUT_FILE}" "s3://${S3_BUCKET}/${latest_key}"
"${AWS_BIN}" s3 cp "${OUTPUT_FILE}" "s3://${S3_BUCKET}/${history_key}"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Upload complete"
echo "Latest: s3://${S3_BUCKET}/${latest_key}"
echo "History: s3://${S3_BUCKET}/${history_key}"
