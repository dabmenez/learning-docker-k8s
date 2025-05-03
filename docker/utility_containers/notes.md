# 🛠️ Working with Utility Containers in Docker

---

## 📌 What Are Utility Containers?

Utility Containers are **temporary containers** used to run **one-off commands or scripts**. 
They’re different from traditional application containers, which are meant to run a full application continuously.

Think of utility containers as:
- 🔧 A way to run a setup command
- 🧪 A testing tool
- 🧰 A temporary working environment (e.g., npm, Node.js, or bash)

---

## ❓ Why Use Utility Containers?

- Avoids installing tools like Node, npm, Python on your host machine.
- Provides a **clean, isolated environment**.
- Ideal for **repetitive commands** or **development scripts**.
- Helps maintain consistency across different development setups.

---

## 🧠 Ways to Execute Commands

You can run utility containers in different ways:

### 1. Ad-hoc with `docker run` (one-shot)

```bash
docker run -it --rm node:14-alpine npm init
```

This launches a temporary container, runs `npm init`, and deletes the container when done.

### 2. Using `docker exec` on a running container

```bash
docker exec -it mycontainer bash
```

This executes a command **inside** a running container. Useful for debugging or running interactive sessions.

---

## 🛠 Building a Utility Container with ENTRYPOINT

You can create a lightweight utility container using a custom Dockerfile:

**Dockerfile**
```Dockerfile
FROM node:14-alpine
WORKDIR /app
ENTRYPOINT [ "npm" ]
```

Build and tag the image:
```bash
docker build -t mynpm .
```

Now you can run commands like:
```bash
docker run -it mynpm init
docker run -it mynpm install express --save
```

---

## 📦 Using Docker Compose for Utility Containers

`docker-compose.yml` example:
```yaml
version: "3.8"
services:
  npm:
    build: .
    stdin_open: true
    tty: true
    volumes:
      - ./:/app
```

Then run:
```bash
docker-compose run npm init
```

This runs the `npm init` command inside the `npm` utility container.

---

## 🛡 Utility Containers, Permissions & Linux

When working with utility containers on Linux, **file permission issues** may arise due to different user IDs between host and container.

- Docker often runs processes as root inside containers.
- Files created inside containers may be **owned by root** on your host machine.
- You can tweak this by **setting a specific UID/GID** or mapping users.

🧵 More info here: [Udemy Thread on Permissions](https://www.udemy.com/course/docker-kubernetes-the-practical-guide/learn/#questions/12977214/)

---

## ✅ Summary

- Utility containers are great for one-off or dev tasks.
- Use `docker run` or `docker-compose run` to execute commands.
- Use `ENTRYPOINT` to make a container behave like a CLI tool.
- Pay attention to permissions on Linux hosts.