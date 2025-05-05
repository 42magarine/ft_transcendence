# ft_transcendence

## This project is about making a website where you can play Pong against other players online.

## 🛠️ Project Setup
  ```bash
  # Clone the Repository
  git clone git@github.com:42magarine/ft_transcendence.git
  cd ft_transcendence

  # Set Up Environment Variables.
  cp .env.example .env

  # Build and Start the Docker Container
  make

  # Start the Game Server
  npm run dev
  ```

---

## 🔧 Useful Makefile Commands

| Command       | Description                                      |
| ------------- | ------------------------------------------------ |
| `make`        | Builds and starts the container (`up` + `shell`) |
| `make up`     | Builds and starts the container (detached)       |
| `make start`  | Starts the container                             |
| `make stop`   | Stops the container                              |
| `make shell`  | Opens an interactive shell in the container      |
| `make ls`     | Lists containers and Docker images               |
| `make logs`   | Shows container logs                             |
| `make clean`  | Stops and removes the container                  |
| `make fclean` | Removes all containers, images, and volumes      |
| `make re`     | Rebuilds everything from scratch                 |

---

## 📦 Install Node.js Dependencies

If needed, run this inside the container:
  ```bash
  npm install
  ```

---

## 🌐 Default Port

The application runs on [http://localhost:3000](http://localhost:3000)
