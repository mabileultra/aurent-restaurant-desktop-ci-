#!/usr/bin/env bash
# Разовая подготовка: чистый Ubuntu, .env, SSH-ключ для GitHub Actions.
# Использование:
#   sudo bash deploy/server-setup.sh ubuntu  — Ubuntu 22.04/24.04: Docker, UFW (root)
#   bash deploy/server-setup.sh env          — создать .env из .env.example со случайными секретами
#   bash deploy/server-setup.sh ci-ssh       — GitHub Actions: ~/.ssh/deploy_key из DEPLOY_SSH_KEY(_B64)
set -euo pipefail

SUBCOMMAND="${1:-}"

cmd_ubuntu() {
  if [[ "${EUID}" -ne 0 ]]; then
    echo "Запустите: sudo bash deploy/server-setup.sh ubuntu"
    exit 1
  fi

  export DEBIAN_FRONTEND=noninteractive

  echo "==> Обновление пакетов..."
  apt-get update -qq
  apt-get upgrade -y -qq

  echo "==> Базовые утилиты..."
  apt-get install -y -qq ca-certificates curl git ufw fail2ban

  echo "==> Docker (official)..."
  if ! command -v docker >/dev/null 2>&1; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
    . /etc/os-release
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
      > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  fi

  systemctl enable docker
  systemctl start docker

  echo "==> Firewall (UFW)..."
  ufw --force reset
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow OpenSSH
  ufw allow 80/tcp comment 'Aurent web'
  ufw allow 8080/tcp comment 'Aurent API (касса)'
  ufw --force enable

  echo "==> Каталог приложения..."
  mkdir -p /opt/aurent-pos
  chown -R "${SUDO_USER:-root}:${SUDO_USER:-root}" /opt/aurent-pos 2>/dev/null || true

  echo ""
  echo "Готово."
  echo "  Docker: $(docker --version)"
  echo "  Compose: $(docker compose version)"
  echo ""
  echo "Дальше:"
  echo "  1) Скопируйте проект в /opt/aurent-pos (git clone или scp)"
  echo "  2) cd /opt/aurent-pos && bash deploy/server-setup.sh env && nano .env"
  echo "  3) bash deploy/deploy.sh"
}

cmd_env() {
  local root jwt_secret postgres_password
  root="$(cd "$(dirname "$0")/.." && pwd)"
  cd "$root"

  if [[ -f .env ]]; then
    echo ".env уже существует — не перезаписываю."
    echo "Удалите вручную, если нужен новый: rm .env && bash deploy/server-setup.sh env"
    exit 0
  fi

  if [[ ! -f .env.example ]]; then
    echo "Нет .env.example"
    exit 1
  fi

  jwt_secret="$(openssl rand -base64 32 | tr -d '\n')"
  postgres_password="$(openssl rand -base64 24 | tr -d '\n')"

  cp .env.example .env

  # macOS и Linux sed
  if sed --version >/dev/null 2>&1; then
    sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${postgres_password}|" .env
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${jwt_secret}|" .env
  else
    sed -i '' "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${postgres_password}|" .env
    sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=${jwt_secret}|" .env
  fi

  echo "Создан .env с новыми секретами."
  echo "  POSTGRES_PASSWORD — сохранён в .env"
  echo "  JWT_SECRET        — сохранён в .env"
  echo ""
  echo "На сервере используйте тот же .env или создайте заново: bash deploy/server-setup.sh env"
  echo "Дальше: bash deploy/prod-check.sh"
}

cmd_ci_ssh() {
  python3 <<'PY'
import base64
import os
import subprocess
from pathlib import Path

raw = os.environ.get("DEPLOY_SSH_KEY", "").strip()
b64 = os.environ.get("DEPLOY_SSH_KEY_B64", "").strip()
key_path = Path.home() / ".ssh" / "deploy_key"
key_path.parent.mkdir(mode=0o700, exist_ok=True)

def validate(path: Path) -> None:
    path.chmod(0o600)
    subprocess.run(
        ["ssh-keygen", "-y", "-f", str(path)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

if b64:
    if b64.startswith("ssh-"):
        raise SystemExit(
            "DEPLOY_SSH_KEY_B64 содержит публичный ключ. "
            "Нужен private: base64 -i ~/.ssh/aurent-deploy | tr -d '[:space:]' | pbcopy"
        )
    data = base64.b64decode("".join(b64.split()), validate=True)
    key_path.write_bytes(data)
    validate(key_path)
elif raw and "BEGIN" in raw:
    text = raw.replace("\r\n", "\n").replace("\r", "\n")
    if not text.endswith("\n"):
        text += "\n"
    key_path.write_text(text, encoding="utf-8")
    validate(key_path)
else:
    raise SystemExit(
        "Нет DEPLOY_SSH_KEY / DEPLOY_SSH_KEY_B64. "
        "Создайте secret DEPLOY_SSH_KEY_B64 в GitHub."
    )

fp = subprocess.check_output(["ssh-keygen", "-l", "-f", str(key_path)], text=True)
print("SSH key OK:", fp.split()[1] if fp else fp)
PY
}

case "$SUBCOMMAND" in
  ubuntu)
    cmd_ubuntu
    ;;
  env)
    cmd_env
    ;;
  ci-ssh)
    cmd_ci_ssh
    ;;
  *)
    echo "Использование: bash deploy/server-setup.sh [ubuntu|env|ci-ssh]" >&2
    exit 1
    ;;
esac
