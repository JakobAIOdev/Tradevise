DEV_COMPOSE = docker compose -f compose.yml -f compose.dev.yml
PROD_COMPOSE = docker compose -f compose.yml -f compose.prod.yml

.PHONY: dev-up dev-down dev-logs dev-ps dev-restart prod-up prod-down prod-logs prod-ps prod-restart

dev-up:
	$(DEV_COMPOSE) up -d

dev-down:
	$(DEV_COMPOSE) down

dev-logs:
	$(DEV_COMPOSE) logs -f

dev-ps:
	$(DEV_COMPOSE) ps

dev-restart:
	$(DEV_COMPOSE) restart

prod-up:
	$(PROD_COMPOSE) up -d --build

prod-down:
	$(PROD_COMPOSE) down

prod-logs:
	$(PROD_COMPOSE) logs -f

prod-ps:
	$(PROD_COMPOSE) ps

prod-restart:
	$(PROD_COMPOSE) restart
