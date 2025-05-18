# ft_transcendence

## This project is about making a website where you can play Pong against other players online.

---

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

---

## 🧩 Project Modules and Features

| Category             | Feature Description                                                | Points |
| -------------------- | ------------------------------------------------------------------ | ------ |
| **Web**              | Use a framework to build the backend                               | 1      |
|                      | Use a framework or a toolkit to build the frontend                 | 0.5    |
|                      | Use a database for the backend                                     | 0.5    |
| **User Management**  | Standard user management, authentication, users across tournaments | 1      |
|                      | Implementing a remote authentication                               | 1      |
| **Gameplay & UX**    | Remote players (real-time multiplayer)                             | 1      |
|                      | Game customization options (e.g. paddles, themes, speed)           | 0.5    |
| **Cybersecurity**    | Implement Two-Factor Authentication (2FA) and JWT                  | 1      |
| **Accessibility**    | Support on all devices (responsive design)                         | 0.5    |
|                      | Expanding browser compatibility                                    | 0.5    |
|                      | Supports multiple languages                                        | 0.5    |
|                      | Add accessibility features for visually impaired users (e.g. ARIA) | 0.5    |
| **Server-Side Pong** | Replace basic Pong with server-side Pong and implement an API      | 1      |

**→ Total Points: 9.5**

---
