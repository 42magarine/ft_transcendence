all: env up shell

up: env
	docker-compose up --build --detach

start stop:
	docker-compose $@

ls:
	docker compose ps --all
	docker compose images

shell:
	docker-compose exec ft_transcendence bash

logs:
	docker compose logs

env:
	@IP=$$(ipconfig getifaddr en0); \
	if [ -n "$$IP" ]; then \
		sed -i '' "s|^BASE_URL=.*|BASE_URL=https://$$IP:3000|" .env; \
		echo "BASE_URL set to https://$$IP:3000"; \
	else \
		echo "Could not determine IP address from en0" && exit 1; \
	fi

clean:
	docker compose down

fclean: clean
	docker system prune --all --force --volumes

re: clean all

.PHONY: all up start stop ls shell logs clean fclean re
