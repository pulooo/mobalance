#!/bin/bash
set -e

echo "⏳ A aplicar migrações..."
alembic upgrade head

echo "🚀 A iniciar servidor..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
