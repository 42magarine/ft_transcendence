all: up shell

up:
	docker-compose up --build --detach

start stop:
	docker-compose $@

ls:
	docker compose ps --all
	docker compose images

shell:
	docker-compose exec ft_transcendence bash

logs:
	docker compose logs -f

clean:
	docker compose down

fclean: clean
	docker system prune --all --force --volumes

re: clean all

.PHONY: all up start stop ls shell logs clean fclean re
