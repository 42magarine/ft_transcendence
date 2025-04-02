IMAGE_NAME = tic_tac_toe
CONTAINER_NAME = tic_tac_toe
PORT = 3000

.PHONY: all
all: build run

.PHONY: build
build:
	docker compose build

.PHONY: run
run:
	docker compose up -d

.PHONY: start
start:
	docker start $(CONTAINER_NAME)

.PHONY: stop
stop:
	docker stop $(CONTAINER_NAME)

.PHONY: restart
restart: stop start

.PHONY: rm
rm: stop
	docker rm $(CONTAINER_NAME)

.PHONY: build-direct
build-direct:
	docker build -t $(IMAGE_NAME) .

.PHONY: run-direct
run-direct:
	docker run -d --name $(CONTAINER_NAME) -p $(PORT):$(PORT) -v ./src:/app/ $(IMAGE_NAME)

.PHONY: logs
logs:
	docker logs $(CONTAINER_NAME)

.PHONY: logs-follow
logs-follow:
	docker logs -f $(CONTAINER_NAME)

.PHONY: shell
shell:
	docker exec -it $(CONTAINER_NAME) /bin/sh

.PHONY: clean
clean: rm
	docker rmi $(IMAGE_NAME)

.PHONY: rebuild
rebuild: clean build run