.PHONY: init dev migrate seed test-idea check build doctor db .env

init: .env
	npm ci
	$(MAKE) db migrate
	npm run seed -- --all

dev: db
	npm run dev

.env:
	@test -f .env || cp .env.example .env

db: .env
	docker compose up -d --wait db

migrate: .env
	npm run migrate

seed: .env
	@test -n "$(IDEA)" || { echo "Usage: make seed IDEA=idea-b"; exit 1; }
	npm run seed -- "$(IDEA)"

test-idea: .env
	node --env-file-if-exists=.env scripts/test-idea.mjs "$(IDEA)"

check: .env
	npm run check

build:
	npm run build

doctor:
	node --version
	npm --version
	docker compose version
	docker info --format '{{.ServerVersion}}'
