# Docker Networking Module

This module explores how Docker containers communicate with:
1. The **World Wide Web** (WWW)  
2. The **Local Host Machine**  
3. **Other Containers**

---

## 📌 Overview

Modern applications often consist of multiple containers, each focusing on a single task (e.g., running a web server or database). These containers frequently need to exchange data — with external services (the internet), with the host machine, or with each other.  
**Goal of this module**: Understand the different networking scenarios and how Docker handles them.

---

## 1. Container to WWW Communication

### Key Insight
- Containers can **send requests to external services** (e.g., REST APIs, external databases) out of the box.
- **No extra configuration** is typically required for outgoing traffic to the internet.

### Example
```js
// Inside any containerized app (Node.js, for example):
fetch('https://some-api.com/my-data')
  .then(response => response.json())
  .then(data => console.log(data));
```
- This works seamlessly from inside a container.  
- Docker routes the outgoing request to the internet, and the container awaits the response.

---

## 2. Container to Local Host Machine Communication

### Why Do We Need This?
- During development, you might run a local database, or a local service on your **host** (the machine running Docker) that the container should access.

### Challenge
- Using `localhost` **inside a container** refers to the container itself, **not** the physical host machine. This breaks requests like:
  ```js
  fetch('http://localhost:3000/demo');
  ```
  …because `localhost` here is the **container**, not the host’s environment.

### Solution: `host.docker.internal`
- Docker provides the special domain **`host.docker.internal`** which resolves to the **host’s IP** from inside the container.
- Revised request example:
  ```js
  // Correct approach to call a service on host machine from within a container:
  fetch('http://host.docker.internal:3000/demo')
    .then(response => response.json())
    .then(data => console.log(data));
  ```
- This makes development workflows easier without changing how your host-based services are configured.

---

## 3. Container to Container Communication

### Motivation
- Multi-container setups are common: one container for the web server, another for the database, etc.
- Containers often need to talk to each other.

### Two Approaches
1. **Find IP addresses manually**  
   - Not ideal because IPs can change if containers restart.
2. **Use Docker Networks**  
   - Recommended approach: containers in the **same network** can be addressed **by name** instead of IP.

#### Creating a Custom Network
```bash
# Create a new network
docker network create my-network

# Start two containers, attaching them to 'my-network'
docker run --name cont1 --network my-network my-image
docker run --name cont2 --network my-network my-other-image
```

- In this setup, `cont1` can **ping** or **fetch** from `cont2` by using the hostname `cont2`:
  ```js
  fetch('http://cont2:8080/any-endpoint')
    .then(response => response.json())
    .then(data => console.log(data));
  ```
- Docker internally resolves `cont2` to the correct IP, simplifying container-to-container communication.

---

## 4. Understanding Docker Network IP Resolving

- Docker runs a **DNS server** for each user-defined network.  
- Container names become DNS entries within that network.  
- This is how `fetch('cont2')` works inside `cont1`, resolving to the correct IP automatically.

---

## 5. Docker Network Drivers

1. **bridge**  
   - Standard local Docker network.  
   - Default driver used if you create a custom network without specifying a driver.

2. **host**  
   - Not recommended for production (removes isolation, the container uses the host’s network).

3. **overlay**  
   - Used in Docker Swarm or other orchestrators to connect multiple Docker hosts seamlessly.

---

## 6. Module Summary

- **Container to WWW**: Works automatically—no extra flags needed.  
- **Container to Host**: Use `host.docker.internal` instead of `localhost`.  
- **Container to Container**:  
  - Preferred approach is using **Docker networks** and container names.  
  - Simplifies config and avoids dealing with changing IPs.

**Key Takeaways**:
- Embrace Docker’s networking capabilities for multi-container apps.  
- Remember that `localhost` inside a container does **not** refer to your physical machine.  
- Use custom networks to enable straightforward, name-based container communication.

## 7. Useful Commands

Below are some useful commands to explore and manage container networking.

### Manage Networks
```bash
# List existing networks
docker network ls

# Create a new user-defined network
docker network create my-network

# Inspect network details (connected containers, IP addresses, etc.)
docker network inspect my-network

# Remove a network (works only if no containers are attached to it)
docker network rm my-network
```

### Running Containers on a Custom Network
```bash
# Run and attach directly to a custom network
docker run -d --name cont1 --network my-network my-image

# Or connect an already running container to a network
docker network connect my-network cont1
```

### Map Ports for External Access (host->container)
```bash
# Example: mapping container's port 3000 to port 3000 on the host
docker run -d --name cont1 -p 3000:3000 --network my-network my-image
```

### Check Exposed Ports
```bash
# Show which ports are mapped
docker port cont1
```
### Other Operations

```bash
# See container details (including internal IP address)
docker inspect cont1

# Test connectivity (e.g., using ping, if available in the container)
docker exec -it cont1 ping cont2
```
