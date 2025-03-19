# Docker: Working with Data & Volumes

## 📌 Overview

Docker images are immutable (read-only), meaning you can't directly modify them after creation; changes require rebuilding the image. Containers, however, add a writable layer, allowing temporary file changes without altering the original image.

## 1. Main Problems with Data in Docker

- **Data Persistence:** Data written in a container is lost when the container is removed.
- **Host Interaction:** Containers can't reflect changes made to the host filesystem automatically.

Docker addresses these issues using:

## 2. Volumes

Volumes are managed folders/files on your host machine connected to container paths.

### Types of Volumes

#### Anonymous Volumes:
- Created with `-v /container/path`
- Automatically removed when container started with `--rm` stops.
- Useful for preventing host bind mounts from overwriting container-internal folders.

#### Named Volumes:
- Created via `-v volume-name:/path/in/container`
- Persist independently, must be manually removed.
- Ideal for storing persistent data (logs, databases, uploaded files).

### Commands:

```sh
docker volume ls                  # Lists volumes
docker volume create VOL_NAME     # Create new named volume
docker volume rm VOL_NAME         # Remove a specific volume
docker volume prune               # Remove unused volumes
```

## 3. Bind Mounts

Bind mounts allow you to explicitly map a folder from your host to a path inside the container.

- **Usage:** `-v /absolute/host/path:/container/path`
- **Advantage:** Instantly reflects code changes in container (excellent for development).
- **Drawback:** Not recommended in production (container should be isolated from host).

### 3.1 Example docker run command explained:

```sh
docker run -d --rm -p 3000:80 --name feedback-app \
-v feedback-files:/app/feedback \
-v "/Users/maximilianschwarzmuller/development/teaching/udemy/docker-complete:/app:ro" \
-v /app/node_modules \
-v /app/temp feedback-node:volumes
```

#### Explanation:

- `-d`: Detached mode, runs container in background.
- `--rm`: Automatically removes container and anonymous volumes upon exit.
- `-p 3000:80`: Maps host port 3000 to container port 80.
- `--name`: Assigns a name (`feedback-app`) to the container.

**Named Volume (`feedback-files`):** Persists data at `/app/feedback`.

**Bind Mount:** Host folder mapped read-only (`:ro`) to `/app`. Protects host files from being modified by container.

**Anonymous Volumes (`/app/node_modules` & `/app/temp`):** Prevent overwrites from host folders.

## 4. Read-Only Volumes

Used to mount data inside containers as read-only (`:ro`), enhancing security and integrity.

## 5. COPY vs Bind Mounts

- **COPY:** Stores files permanently inside the image. Good for production.
- **Bind Mounts:** Ideal for development, allowing real-time updates without image rebuild.

## 6. Using .dockerignore

- **Purpose:** Exclude unnecessary files/folders from image builds.
- **Benefits:** Faster build times, smaller images, cleaner deployments.

## 7. Environment Variables (ENV) and Build Arguments (ARG)

### ARG:
- Used only at build-time, not accessible in runtime.

### ENV:
- Available at runtime, useful for configuring containers dynamically.
- Use `.env` files for secure handling of sensitive data; **never commit these files to version control**.

## 8. Important Docker Commands

```sh
# Create anonymous volume
docker run -v /path/in/container IMAGE

# Create named volume
docker run -v name:/path/in/container IMAGE

# Create bind mount
docker run -v /host/path:/container/path IMAGE

# List volumes
docker volume ls

# Remove volume
docker volume rm volume-name

# Cleanup unused volumes
docker volume prune
```

## 9. Summary of Best Practices

✅ Use **named volumes** for data persistence.  
✅ Use **bind mounts** during development for live code syncing.  
✅ Secure sensitive data through `.env` files and **Docker secrets**.  
✅ Optimize builds using `.dockerignore`.  
✅ Clearly differentiate between **ARG (build-time)** and **ENV (runtime)**.

By mastering these concepts, you'll be better equipped to build efficient, secure, and maintainable Dockerized applications.