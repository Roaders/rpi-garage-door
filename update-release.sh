#!/usr/bin/env bash
set -euo pipefail

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

echo "Finding latest release..."

URL="$(curl -fsSL https://api.github.com/repos/Roaders/rpi-garage-door/releases/latest \
    | grep -o '"browser_download_url": *"[^"]*\.tgz"' \
    | head -n 1 \
    | grep -o 'https://[^"]*' || true)"

if [ -z "$URL" ]; then
    echo "Could not find a .tgz on the latest release. Nothing changed." >&2
    exit 1
fi

echo "Downloading $URL"

curl -fL -o "$WORK_DIR/release.tgz" "$URL"
tar -tzf "$WORK_DIR/release.tgz" > /dev/null

echo "Stopping garage-door"

sudo systemctl stop garage-door
# From here on, always try to start the service again, even if a later step fails
trap 'echo "Starting garage-door"; sudo systemctl start garage-door; rm -rf "$WORK_DIR"' EXIT

echo "Extracting tar..."

tar -zxf "$WORK_DIR/release.tgz" --strip-components=1

echo "Rebuilding epoll"

npm rebuild epoll

echo "$(basename "$URL") installed."
