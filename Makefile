all: up shell

up:
	docker compose up --build --detach

start stop:
	docker compose $@

ls:
	docker compose ps --all
	docker compose images

shell:
	docker compose exec ft_transcendence bash

logs:
	docker compose logs

clean:
	docker compose down

fclean:
	docker system prune --all --force --volumes

prune: stop fclean

re: clean all

.PHONY: all up start stop ls shell logs clean fclean re
