#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

for f in .env.*; do
    echo "Pushing schema for $f..."
    (
        set -a
        # shellcheck disable=SC1090
        source "$f"
        set +a
        
        if [[ -z "${DATABASE_URL:-}" ]]; then
            echo "DATABASE_URL is missing in $f, skipping."
            exit 0
        fi
        
        pnpm -C apps/backend exec prisma db push --schema /root/app/apps/backend/prisma/schema.prisma
    )
done
