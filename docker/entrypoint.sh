#!/bin/sh
set -eu

if [ -n "${DATABASE_URL:-}" ]; then
  echo "Enabling pgvector extension..."
  npm run prisma:enable-vector

  echo "Applying schema with prisma db push..."
  npx prisma db push --accept-data-loss

  echo "Setting up pgvector column and index..."
  npm run prisma:setup-vector

  if [ "${SEED_ON_START:-true}" = "true" ]; then
    echo "Seeding demo data..."
    npm run prisma:seed
  fi
fi

exec "$@"
