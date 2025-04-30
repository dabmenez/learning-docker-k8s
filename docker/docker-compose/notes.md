# 📘 Course Notes on Docker Compose

---

## 📌 Introduction to Docker Compose

- **Docker Compose** is a tool to orchestrate multiple containers using a **single configuration file (`docker-compose.yml`)**.
- It’s ideal for **multi-container applications**, but can also be used with just one.
- **Main goal:** avoid repeating long commands like `docker run ...`, making development and deployment easier.

---

## 🤔 Why Use Docker Compose?

Before:
```bash
docker build -t my-app .
docker run -v logs:/app/logs --network my-network --name my-container my-app
docker run ...
```

With Docker Compose:
```bash
docker-compose up
```

- Just **one command** brings all containers up.
- **Fewer errors**, more productivity.
- **Consistent environments** for dev and production.

---

## 🛠 Creating a `docker-compose.yml`

```yaml
version: "3.8"
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    volumes:
      - logs:/app/logs
    env_file:
      - backend.env
    networks:
      - goals-net

  mongodb:
    image: mongo
    env_file:
      - mongo.env
    volumes:
      - data:/data/db
    networks:
      - goals-net

volumes:
  logs:
  data:

networks:
  goals-net:
```

---

## ⚙️ Key Components in Compose

- `services`: defines **containers**.
- `volumes`: persistent data between runs.
- `networks`: allows container communication.
- `env_file`: loads environment variables (e.g. `mongo.env`, `backend.env`).
- `build`: path and Dockerfile used to build an image.

---

## 📥 Installing Docker Compose on Linux

- Already comes with Docker Desktop.
- On Linux distros:

```bash
sudo apt install docker-compose
```

---

## ▶️ Main Commands

```bash
docker-compose up           # Starts all defined services
docker-compose up -d        # Starts in detached mode (in background)
docker-compose up --build   # Forces image rebuild
docker-compose down         # Stops and removes all services
docker-compose down -v      # Removes volumes as well
```

---

## 🔗 Advantages with Multiple Containers

- **All in one place:** front end, back end, database, etc.
- Each service can be scaled, stopped, or restarted independently.
- Automatic internal **network for container communication**.

---

## 🧱 Building Images

When using `build` in the `docker-compose.yml`, it builds the image from the Dockerfile:

```yaml
build:
  context: ./backend
  dockerfile: Dockerfile
```

You can also use prebuilt images:

```yaml
image: mongo
```

---

## 🧠 What Docker Compose is **NOT**

- **Does not replace Dockerfiles** (you still need them for custom images).
- **Does not replace Docker**, just simplifies orchestration.
- **Not suited for managing containers across multiple hosts** — for that, use Kubernetes.

---

## 📌 Final Tips

- Use `volumes:` for data persistence.
- Use `env_file:` to avoid hardcoding passwords in `.yml`.
- Service names act as internal hostnames (e.g. `backend` accesses `mongodb:27017`).