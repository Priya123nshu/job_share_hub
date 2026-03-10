#!/usr/bin/env bash
set -Eeuo pipefail

REPO_DIR="${REPO_DIR:-/home/ec2-user/mcp_client}"
REPO_URL="${REPO_URL:-}"

if [[ ! -d "${REPO_DIR}" ]]; then
  if [[ -z "${REPO_URL}" ]]; then
    echo "Repo directory ${REPO_DIR} does not exist. Set REPO_URL to clone automatically."
    exit 1
  fi
  git clone "${REPO_URL}" "${REPO_DIR}"
fi

sudo dnf update -y
sudo dnf install -y \
  git awscli tar gzip unzip which findutils \
  python3.12 python3.12-pip python3.12-devel \
  atk cups-libs libXcomposite libXdamage libXfixes libXrandr mesa-libgbm \
  pango alsa-lib at-spi2-atk gtk3 nss nspr libdrm libxkbcommon libX11-xcb \
  libxcb libxshmfence libXtst xorg-x11-fonts-Type1 xorg-x11-fonts-misc

cd "${REPO_DIR}"
python3.12 -m venv .venv
source .venv/bin/activate

python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt
python -m pip install -e ./linkedin-mcp-server
python -m pip install playwright
python -m playwright install chromium

chmod +x ec2_free_tier_hourly_collector/run_collect_and_upload.sh
chmod +x ec2_free_tier_hourly_collector/install_systemd_units.sh

echo "Bootstrap complete."
echo "Next: create .env with LINKEDIN_COOKIE, then run install_systemd_units.sh"
