#!/bin/sh
set -eu

if [ -n "${DATABASE_URL:-}" ]; then
  echo "Applying schema with prisma db push..."
  npx prisma db push --accept-data-loss

  echo "Setting up pgvector..."
  npm run prisma:setup-vector

  if [ "${SEED_ON_START:-true}" = "true" ]; then
    echo "Seeding Karel data..."
    npm run prisma:seed
  fi
fi

exec "$@"
