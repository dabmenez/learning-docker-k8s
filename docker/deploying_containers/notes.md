# Module 8: Docker Deployment

This module covers the crucial step of moving a Dockerized application from a local development environment to a live production server. We'll explore different strategies, tools, and best practices to make this process smooth and efficient.

## Key Concepts: Development vs. Production

While Docker provides consistency between environments, our goals and configurations for development and production are different.

**In Development:**
* **Goal:** Fast feedback loop, easy debugging.
* **Volumes:** Use **Bind Mounts** to sync local source code directly into the container. This allows for instant updates without rebuilding the image.
* **Image Content:** The image only needs to contain the runtime environment (e.g., Node.js). The code is mounted from the host machine.

**In Production:**
* **Goal:** Stability, performance, and self-contained applications.
* **Volumes:** **Bind Mounts should NOT be used**. The container must be a "single source of truth".
* **Image Content:** The image must contain a snapshot of the application code. This is achieved using the `COPY` instruction in the `Dockerfile`. This ensures the container is a standalone, reproducible unit.

---

## Manual Deployment: The "Do-it-yourself" Approach

This approach involves manually setting up a remote server and running our containers.

### Workflow Example: Deploying to AWS EC2

1.  **Build Docker Image:** Build the production-ready image on your local machine.
    ```bash
    docker build -t your-username/your-app-name .
    ```
2.  **Push to Registry:** Push the image to a container registry like Docker Hub.
    ```bash
    docker push your-username/your-app-name
    ```
3.  **Set up Remote Server (AWS EC2):**
    * Create a new EC2 instance (a virtual machine in the cloud).
    * Configure its **Security Group** (firewall) to allow incoming traffic on necessary ports (e.g., Port 80 for HTTP).
4.  **Connect & Install Docker:**
    * Connect to the EC2 instance using SSH.
    * Install Docker on the remote machine (EC2 instances often use a flavor of Linux).
5.  **Run the Container:**
    * Pull the image from the registry.
    * Run the container, publishing the necessary ports.
    ```bash
    # On the remote server (EC2)
    docker pull your-username/your-app-name
    docker run -d -p 80:8000 your-username/your-app-name
    ```

**Disadvantages of Manual Deployment:**
* **High Responsibility:** You are fully responsible for managing the server, including security updates, firewall rules, and software patches.
* **Complex Updates:** Updating the application requires manually SSH'ing into the server, pulling the new image, stopping the old container, and starting the new one. This can lead to downtime.
* **Scalability:** Manually scaling the application (adding more servers/containers) is complex.

---

## Managed Services: The Automated Approach

Managed services abstract away the underlying server management, allowing you to focus only on your containers.

* **Examples:** AWS ECS (Elastic Container Service), Google Cloud Run, Azure Container Instances.
* **Concept:** You provide a Docker image, and the service handles creating, managing, updating, and scaling the infrastructure needed to run it.
* **Benefits:**
    * **Simplified Management:** The cloud provider handles server maintenance, security, and updates.
    * **Easy Scaling & Load Balancing:** Services often have built-in, easy-to-configure tools for scaling and distributing traffic.
    * **Higher Availability:** Managed services are designed to be resilient and can automatically restart failed containers.

### Architecture with AWS ECS

A typical architecture using ECS might look like this:

1.  **AWS ECS:** Manages the container execution.
2.  **ECS Task:** A running instance of your Docker container. ECS can run multiple tasks for scaling.
3.  **AWS Load Balancer:** Distributes incoming traffic across your running ECS tasks, providing a single, stable domain name for your app.
4.  **AWS EFS (Elastic File System):** Can be used to provide persistent storage (volumes) for your containers if needed.

### A Note on Databases in Production

While you *can* run a database in a container, it comes with challenges in a production environment:
* **Data Persistence & Backups:** Requires careful volume management and a robust backup strategy.
* **Scaling & Availability:** Managing a highly-available, scalable database cluster is complex.
* **Performance:** Performance tuning can be difficult.

**Recommendation:** For production, use a **managed database service** like **MongoDB Atlas** or **AWS RDS**. These services handle data management, availability, backups, and scaling for you.

---

## Optimizing for Production: Multi-Stage Builds

Production images should be as small and clean as possible. They shouldn't contain development dependencies, build tools, or source code that isn't needed at runtime.

### The Problem

A typical React or Angular app requires a build step.
* **Development:** Needs Node.js, `npm`, and many `devDependencies`.
* **Production:** Only needs the final, static HTML, CSS, and JS files served by a simple web server like Nginx.

If we use a single `Dockerfile`, our final image will be bloated with all the unnecessary development tools.

### The Solution: Multi-Stage Builds

A multi-stage build uses multiple `FROM` instructions in a single `Dockerfile`. Each `FROM` instruction begins a new "stage". We can copy artifacts from one stage to another, allowing us to discard everything we don't need for the final image.

**Example `Dockerfile` for a React App:**

```dockerfile
# STAGE 1: The "builder" stage
# Contains Node.js, installs all dependencies, and builds the app
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
# The build script creates an optimized set of static files in /app/build
RUN npm run build

# STAGE 2: The "production" stage
# Contains only Nginx and the static files from the build stage
FROM nginx:stable-alpine

# Copy the build output from the "builder" stage
COPY --from=builder /app/build /usr/share/nginx/html

# Expose the default Nginx port
EXPOSE 80

# Nginx starts automatically
```

**How it works:**
* **Stage 1 (aliased as `builder`):** This stage has Node.js, installs all `npm` dependencies, and runs the `npm run build` command. The result is a `/app/build` folder with the optimized production code.
* **Stage 2:** This stage starts from a clean, lightweight `nginx` image. The `COPY --from=builder` command copies **only** the `/app/build` folder from the previous stage into the Nginx server's public directory.
* **Final Image:** The final image is only created from the last stage. It contains Nginx and our static files, but **none** of the Node.js or `devDependencies` from the `builder` stage. This results in a much smaller and more secure production image.
