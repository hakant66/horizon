#!/bin/sh
set -eu

if [ -n "${DATABASE_URL:-}" ]; then
  echo "Applying schema with prisma db push..."
  npx prisma db push --accept-data-loss

  if [ "${SEED_ON_START:-true}" = "true" ]; then
    echo "Seeding demo data..."
    npm run prisma:seed
  fi
fi

exec "$@"
