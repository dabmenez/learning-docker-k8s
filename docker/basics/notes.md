# Docker Fundamentals: Expanded Summary

## 1. What Is Docker?
Docker is a **containerization** platform that enables developers to build, package, and run applications in lightweight, portable containers. Unlike virtual machines, containers share the host OS kernel but maintain isolated processes, file systems, and network stacks, making them more resource-efficient and faster to start.

---

## 2. Why Docker & Containers?
- **Consistency Across Environments**: Containers ensure your app runs the same way in development, testing, and production (the “it works on my machine” problem is eliminated).  
- **Isolation**: Each container has its own runtime environment, so multiple containers don’t interfere with each other.  
- **Scalability & Efficiency**: Because containers use fewer resources, scaling up (running more containers) is simpler and cost-effective.  
- **Portability**: A containerized application can be run on any host with Docker installed, regardless of the underlying OS (Windows, macOS, Linux).

---

## 3. Virtual Machines vs Docker Containers
- **Virtual Machines (VMs)** provide **full OS virtualization** with a guest OS on top of a hypervisor. They are more heavyweight and slower to boot.  
- **Containers** leverage **OS-level virtualization**, sharing the host OS kernel but isolating the application processes. They are lighter, faster to spin up, and easier to manage at scale.

---

## 4. Docker Setup & Toolbox
- **Docker Desktop** is the recommended installation for **Windows** and **macOS**, offering a user-friendly UI and essential Docker components (e.g., Docker Engine, Docker CLI).  
- **Docker Toolbox** might be required for older systems without native virtualization support.  
- **Docker Playground** (e.g., [Play with Docker](https://labs.play-with-docker.com/)) provides a browser-based environment to quickly try Docker without a local install.

---

## 5. Basic Docker Tools
- **Docker Engine**: Core service that manages containers, images, networks, and volumes.  
- **Docker CLI**: Command-line interface (`docker` commands) to interact with Docker Engine.  
- **Dockerfile**: A blueprint for creating custom images, containing instructions on how to build the environment and run the application.

---

## 6. Images & Containers: The Core Concepts

### Images
- **Read-only Templates** containing the complete app environment (OS, libraries, dependencies).  
- **Layers**: Each Dockerfile instruction (e.g., `RUN`, `COPY`, `ADD`) creates a layer, allowing efficient reuse and caching.  
- **Creation**: Built with `docker build . -t <IMAGE_NAME:TAG>`.  
- **Distribution**: Pushed to and pulled from registries (e.g., DockerHub).

### Containers
- **Instances of Images** that run your applications.  
- **Isolation**: Each container has its own filesystem layer on top of the image layers, plus network and process space.  
- **Lifecycle**: Start, stop, and remove containers with CLI commands like `docker run`, `docker stop`, and `docker rm`.  

---

## 7. Managing Containers
- **Starting & Stopping**: Use `docker run <IMAGE>`, `docker stop <CONTAINER>` or `docker start <CONTAINER>`.  
- **Restarting**: `docker restart <CONTAINER>` helps refresh a stopped container quickly.  
- **Detached vs Attached**:  
  - **Detached (`-d`)**: Runs in the background. Logs are viewable via `docker logs <CONTAINER>`.  
  - **Attached**: The container’s output is directly tied to your terminal session until you exit or the process ends.  
- **Interactive Mode (`-it`)**: Allows you to interact with the container via the terminal (useful for debugging or shell access).

---

## 8. Attaching & Entering Containers
- **Attaching to a Running Container**: `docker attach <CONTAINER>` connects your terminal to a container’s standard input/output.  
- **Entering Interactive Mode**: `docker exec -it <CONTAINER> /bin/bash` (or `sh`), gives you a shell inside the running container for real-time inspection or debugging.

---

## 9. Removing & Cleaning Up
- **Deleting Images & Containers**:  
  - `docker rm <CONTAINER>` removes a container,  
  - `docker rmi <IMAGE>` removes an image.  
- **Automatic Cleanup**:  
  - `docker container prune` removes all stopped containers,  
  - `docker image prune` removes dangling (untagged) images.  

---

## 10. Inspecting & Copying Files
- **Inspecting Images**: `docker image inspect <IMAGE>` reveals metadata (layers, environment variables, etc.).  
- **Inspecting Containers**: `docker container inspect <CONTAINER>` helps view config details (IP address, mounts, etc.).  
- **Copying Files**:  
  - `docker cp <HOST_PATH> <CONTAINER>:<CONTAINER_PATH>` to copy files in,  
  - `docker cp <CONTAINER>:<CONTAINER_PATH> <HOST_PATH>` to copy files out.

---

## 11. Naming & Tagging
- **Name Your Containers**: `docker run --name mycontainer <IMAGE>` is easier to manage than random IDs.  
- **Tag Your Images**: `<IMAGE_NAME>:<TAG>` (e.g., `my-node-app:1.0`) ensures clarity across different versions.

---

## 12. Sharing Images
- **Pushing to DockerHub**: `docker push <USERNAME>/<IMAGE>:<TAG>` uploads your image to a public or private repository.  
- **Pulling Images**: `docker pull <USERNAME>/<IMAGE>:<TAG>` fetches an image from DockerHub (or another registry).  
- **Using Shared Images**: Once pulled, you can run others’ images locally without extra setup.


---

## 13. Conclusion
Docker fundamentally reshapes how applications are **developed**, **packaged**, and **deployed**. With **containerization**, you gain a consistent, lightweight, and modular approach to software delivery—whether working on a single developer machine or deploying at scale in the cloud.

**Key Takeaways**:
- Images define **what** you run (the application environment).  
- Containers are **how** you run it (instances created from those images).  
- Use Docker’s CLI and ecosystem tools to **build**, **run**, **manage**, and **share** containers effectively.
