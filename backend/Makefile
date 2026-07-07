# Circly Backend Makefile

.PHONY: dev dev-local test lint format migrate seed help

# 개발 서버 (네트워크 접근 가능 - Expo Go용)
dev:
	uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8002

# 로컬 전용 서버
dev-local:
	uv run uvicorn app.main:app --reload --port 8000

# 테스트
test:
	uv run pytest

test-cov:
	uv run pytest --cov=app --cov-report=html

# 린트 & 포맷
lint:
	uv run ruff check .

format:
	uv run ruff format .

# 타입 체크
typecheck:
	uv run mypy .

# 마이그레이션
migrate:
	uv run alembic upgrade head

migrate-new:
	@read -p "Migration message: " msg; \
	uv run alembic revision --autogenerate -m "$$msg"

# 시드 데이터
seed:
	uv run python scripts/seed_templates.py
	uv run python scripts/seed_data.py

# 도움말
help:
	@echo "사용 가능한 명령어:"
	@echo "  make dev        - 개발 서버 실행 (0.0.0.0:8002, Expo Go용)"
	@echo "  make dev-local  - 로컬 전용 서버 실행 (127.0.0.1:8000)"
	@echo "  make test       - 테스트 실행"
	@echo "  make lint       - 린트 검사"
	@echo "  make format     - 코드 포맷팅"
	@echo "  make migrate    - DB 마이그레이션 적용"
	@echo "  make seed       - 시드 데이터 생성"
