# Docker Course Summary

This document summarizes the core concepts and commands of Docker, from creating images and containers to orchestrating multiple services with Docker Compose and deploying to production.

---

## 1. Images & Containers: The Pillars of Docker

The main idea behind Docker is to separate software from its environment, ensuring that it runs consistently anywhere.

### Images
Images are the **"blueprints"** or templates for our containers.

- **Nature:** They are **read-only** packages that contain the application code, a filesystem, libraries, and all other dependencies required to run the software.
- **Layered Structure:** They are built from a series of instructions in a `Dockerfile`. Each instruction creates a new layer in the image. This layering system allows for reusability and efficiency, as layers are cached.
- **State:** An image does not "run". It is a static artifact that can be built and shared (via a *Container Registry* like Docker Hub).

### Containers
Containers are the **running instances** of an image.

- **Nature:** They are **isolated** and **ephemeral** environments. When a container is started, it adds a thin **read-write layer** on top of the read-only image.
- **Key Characteristics:**
    - **Isolated:** They have their own filesystem, network, and processes, isolated from the host and other containers.
    - **Single-Task Focused:** The best practice is for each container to run a single process or service (e.g., one for the database, one for the API).
    - **Shareable and Reproducible:** Because they are based on images, they guarantee that the environment is the same on any machine.
    - **Stateless:** By default, any data written inside the container is lost when it is removed. To persist data, we use **Volumes**.

---

## 2. Key Commands

Mastering a few key commands is essential for working with Docker.

- #### `docker build -t <NAME>:<TAG> .`
  Builds an image from a `Dockerfile` in the current directory (`.`).
  - `-t`: Assigns a **name** and a **tag** (version) to the image, making it easy to identify. Ex: `my-app:1.0`.

- #### `docker run --name <CONTAINER_NAME> --rm -d -p <HOST_PORT>:<CONTAINER_PORT> <IMAGE>`
  Creates and starts a container from an image.
  - `--name`: Gives a specific name to the container.
  - `-d`: **Detached mode**. Runs the container in the background.
  - `--rm`: Automatically removes the container when it is stopped.
  - `-p`: **Publishes** a port, mapping the `HOST_PORT` to the `CONTAINER_PORT`.

- #### `docker push <REPOSITORY>/<NAME>:<TAG>`
  Uploads a local image to a *Container Registry* (default is Docker Hub).

- #### `docker pull <REPOSITORY>/<NAME>:<TAG>`
  Downloads an image from a *Container Registry*.

---

## 3. Data & Network Management

### Data: Volumes vs. Bind Mounts
Since containers are stateless, we need strategies to persist data.

- **Bind Mounts (`-v /local/path:/container/path`)**
  - **What:** Maps a directory from the host machine directly to a directory inside the container.
  - **When to use:** Ideal for **development**. It allows changes in local code to be reflected instantly in the container without rebuilding the image.

- **Volumes (`-v <VOLUME_NAME>:/container/path`)**
  - **What:** Creates a storage area managed by Docker, which is decoupled from the container's lifecycle.
  - **When to use:** It is the preferred approach for **production**. It ensures that data (like from a database) persists even if the container is removed and recreated.

### Networking
By default, containers are isolated. For them to communicate, we need to connect them.

- **Incorrect Option:** Using the container's IP address. IPs are dynamic and can change whenever a container is restarted.
- **Correct Option:** Create a **custom Docker network**.
  - `docker network create <NETWORK_NAME>`
  - When starting containers, attach them to this network (`--network <NETWORK_NAME>`).
  - **Benefit:** Docker provides an internal DNS. Containers can communicate with each other using their **service names** as hostnames (e.g., `http://mongodb-container:27017`).

---

## 4. Docker Compose: Multi-Container Orchestration

Managing multiple containers with long and complex `docker run` commands quickly becomes impractical.

- **The Problem:** Manual commands are repetitive, error-prone, and hard to share.
- **The Solution: `docker-compose`**: A tool for defining and running multi-container Docker applications.
  - **`docker-compose.yaml`**: A configuration file where you declaratively define all your **services**, **networks**, and **volumes**.
  - **`docker-compose up`**: Reads the `yaml` file, builds any missing images, creates networks and volumes, and starts all containers in the correct order.
  - **`docker-compose down`**: Stops and removes all containers, networks, and optionally, volumes created by `up`.

---

## 5. Deployment: From Local to Production

Docker is extremely useful for both local development and deployment to remote servers.

### Local Development
- **Benefits:**
  - **Encapsulated Environments:** Each project has its own isolated dependencies, eliminating conflicts.
  - **No Global Tool Installation:** You don't need to install Node.js, Python, MongoDB, etc., globally on your machine. Docker handles it.
  - **Easy to Share:** A new developer just needs to run `docker-compose up` to have the complete development environment up and running.

### Production Deployment
- **The Goal:** To run the application in an environment identical to development but optimized for performance and security.
- **Main Trade-off: Control vs. Ease-of-Use**
  - **Full Control (DIY):** Launch a remote server (e.g., AWS EC2), install Docker, and manage everything manually. You have full control, but also all the responsibility.
  - **Managed Services:** Use a service like **AWS ECS**. You provide your image, and the service handles execution, scaling, and management. Less control, but much easier and less responsibility.
- **Key Considerations for Production:**
  - **Replace Bind Mounts:** Use the `COPY` instruction in your `Dockerfile` to include the code in the image.
  - **Multi-Stage Builds:** Create optimized production images by removing build dependencies and tools that are not needed at runtime.
