#!/usr/bin/env bash
# Безопасная загрузка .env: только строки KEY=VALUE, без выполнения мусора.
# Использование: source deploy/load-dotenv.sh [.env]
load_dotenv() {
  local file="${1:-.env}"
  local line key val
  if [[ ! -f "$file" ]]; then
    echo "Нет файла $file" >&2
    return 1
  fi

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ -z "${line//[[:space:]]/}" ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      val="${BASH_REMATCH[2]}"
      # Снять окружающие кавычки
      if [[ "$val" =~ ^\"(.*)\"$ ]]; then
        val="${BASH_REMATCH[1]}"
      elif [[ "$val" =~ ^\'(.*)\'$ ]]; then
        val="${BASH_REMATCH[1]}"
      fi
      printf -v "$key" '%s' "$val"
      export "$key"
    else
      echo "WARN: пропуск неверной строки в ${file}: ${line:0:48}" >&2
    fi
  done < "$file"
}
