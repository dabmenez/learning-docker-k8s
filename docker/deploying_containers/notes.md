# Module 8: Docker Deployment - From Development to Production

This module covers the critical process of deploying a Dockerized application. It bridges the gap between running containers on our local machine and making them accessible to the world in a stable, performant, and secure production environment. The hands-on projects, from `deployment-01-starting-setup` to `deployment-09-finished`, guide us through this evolution.

---

## 1. Core Concepts: Development vs. Production Environments

While Docker ensures consistency, the configuration and goals for development and production differ significantly.

### Development Environment
- **Goal**: Maximize developer productivity with a fast feedback loop.
- **Volumes**: We use **Bind Mounts** to sync local source code directly into the container. This allows for instant updates without rebuilding the image.
- **Image Content**: The Docker image is minimal, containing only the runtime (e.g., Node.js) and necessary development tools. The code itself lives on the host.

### Production Environment
- **Goal**: Stability, security, performance, and reproducibility.
- **Volumes**: **Bind Mounts are an anti-pattern in production.** They break the "self-contained" principle by creating a dependency on the host's file system.
- **Image Content**: The image is the **"single source of truth"**. It contains a complete snapshot of the application code, achieved using the `COPY` instruction.

---

## 2. Manual Deployment to a Virtual Machine (`deployment-02-deployed-to-ec2`)

This is the foundational deployment strategy where we have full control. We manually provision a server and run our containers on it.

### Workflow: Deploying to AWS EC2

**AWS EC2 (Elastic Compute Cloud)** provides virtual servers (called "instances").

**The Step-by-Step Process:**
1.  **Local Image Preparation**: Build the production-ready image on the local machine.
    ```bash
    docker build -t your-docker-hub-username/your-app-name:latest .
    ```
2.  **Push to Container Registry**: A registry stores Docker images. We push our local image to a central registry like Docker Hub so the remote server can access it.
    ```bash
    docker push your-docker-hub-username/your-app-name:latest
    ```
3.  **Provision Server (EC2)**:
    * In the AWS Console, launch a new EC2 instance (e.g., using Amazon Linux 2 AMI).
    * Configure its **Security Group** (virtual firewall) with inbound rules to allow traffic on necessary ports (Port 22 for SSH, Port 80 for HTTP).
4.  **Connect and Configure Server**:
    * Connect to the instance via SSH using the provided `.pem` key.
    * Install the Docker engine on the server.
5.  **Deploy and Run Container**:
    * Pull the image from the registry to the EC2 instance.
    * Run the container, mapping the host's port 80 to the container's application port.
    ```bash
    # On the remote server (EC2)
    docker pull your-docker-hub-username/your-app-name:latest
    docker run -d -p 80:8000 your-docker-hub-username/your-app-name:latest
    ```

### Disadvantages of Manual Deployment
- **High Operational Overhead**: We are responsible for all system administration (OS patching, security updates, etc.).
- **Manual and Error-Prone Updates**: Updating the app is a tedious process of SSH'ing, pulling, stopping the old container, and starting the new one, which can cause downtime.
- **Difficult to Scale**: Scaling requires manually launching and configuring new instances and a load balancer.

---

## 3. Managed Services & Multi-Container Deployments (`deployment-05` to `deployment-08`)

This is the modern, recommended approach. We delegate infrastructure management to a cloud service.

### Introduction to AWS ECS (Elastic Container Service)
- **Task Definition**: A JSON blueprint for our application, defining the Docker image, CPU/memory, ports, and environment variables.
- **Task**: A running instance of a Task Definition.
- **Service**: The core of ECS. It maintains a specified number of running tasks, handles auto-restarts, and integrates with load balancing and auto-scaling.
- **Cluster**: A logical grouping of services and tasks.

### Evolving the Architecture
- **`deployment-05-ecs-two-containers-node-mongo`**: We deployed a multi-container application (Node.js backend + MongoDB database) to ECS. Here, both services ran as containers in the cloud, but managing the database container's data persistence required using **EFS (Elastic File System)** for volumes.
- **`deployment-06-switched-to-mongodb-atlas`**: We recognized the challenges of self-managing a database in production. The architecture was improved by replacing the MongoDB container with **MongoDB Atlas**, a fully managed Database-as-a-Service (DBaaS).
    - **Benefit**: Atlas handles backups, scaling, and high availability. Our Node.js application simply connects to it via a connection string stored securely as an environment variable in the ECS Task Definition.
- **`deployment-07-added-frontend-project` & `deployment-08-deployed-to-multiple-tasks`**: The application was completed by adding a frontend service. The final architecture involved:
    1. An **Application Load Balancer (ALB)** as the main entry point.
    2. An **ECS Service for the Frontend**, running multiple tasks.
    3. An **ECS Service for the Backend**, also running multiple tasks.
    4. The backend tasks connect to the external **MongoDB Atlas** database.
    
    This setup provides scalability and high availability, as the ALB distributes traffic across multiple instances of both frontend and backend tasks.

---

## 4. Optimizing for Production: Multi-Stage Builds (`deployment-09-finished`)

The final step in our journey was to optimize our Docker images for production. Production images should be minimal, containing only what's necessary to *run* the application, not to *build* it.

### The Problem: Build-Time vs. Run-Time Bloat
Modern frontend applications have a build step that requires a large toolchain (Node.js, npm, compilers, etc.). The final production artifact, however, is just a small set of static files. A naive `Dockerfile` would bundle all the build tools into the final image, making it unnecessarily large and increasing its potential attack surface.

### The Solution: Multi-Stage Builds
A multi-stage build uses multiple `FROM` statements in a single `Dockerfile`. Each `FROM` defines a separate build stage. We use one stage with the full toolchain to build the application, and then a second, lightweight stage to copy **only the build artifacts** into the final production image.

**Detailed `Dockerfile` Example for a React App (from `deployment-09-finished/frontend/Dockerfile`):**

```dockerfile
# STAGE 1: The "builder" stage
# This stage uses a full Node.js environment to build our application.
# We give it a name "builder" using "AS builder".
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies, including devDependencies.
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code.
COPY . .

# Run the production build script. This creates an optimized set of static files
# in the /app/build directory.
RUN npm run build

# ---

# STAGE 2: The "production" stage
# This stage uses a very small, efficient Nginx web server. It does NOT
# contain Node.js or any of our previous npm modules.
FROM nginx:stable-alpine

# Copy ONLY the optimized build output from the "builder" stage.
# This is the magic of multi-stage builds!
COPY --from=builder /app/build /usr/share/nginx/html

# Expose the default Nginx port to the outside world.
EXPOSE 80

# The default command for the nginx image will start the server automatically.
# CMD ["nginx", "-g", "daemon off;"] is inherited from the base image.
```

This two-stage process ensures our final image is lean, secure, and ready for production, containing only Nginx and the static files needed to serve the application.
