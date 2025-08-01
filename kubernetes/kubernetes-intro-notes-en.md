
# Getting Started with Kubernetes

## ✨ Chapter Overview
This module introduces the fundamental concepts of Kubernetes, explaining why it is important, how it works, and what its main components are. The idea is to understand the "**desired state**" and how Kubernetes automatically manages your container infrastructure.

---

## 🔎 Problems with Manual Deployment
- Hard to maintain
- Error-prone
- Requires constant monitoring
- Manually scaling is complex
- Load balancing must be handled manually

> “Just using Docker is not enough”

Alternatives like AWS ECS help, but they lock you into a specific cloud provider (vendor lock-in).

---

## 🌐 What is Kubernetes?
- **Open-source** system to **orchestrate containers**
- Helps to **scale, balance, update, and monitor** containers automatically
- Works **anywhere** Kubernetes is supported: cloud or bare-metal

### Kubernetes is NOT:
- A cloud provider
- A Docker replacement
- A single software tool

Kubernetes is a **collection of tools and concepts**

---

## ⚙️ How Kubernetes Works
- You define the **desired state** using YAML files
- Example:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: users-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: users
  template:
    metadata:
      labels:
        app: users
    spec:
      containers:
        - name: users
          image: my-repo/users-application
```
- You use `kubectl` to send this to the cluster
- Kubernetes creates and manages the corresponding Pods

---

## 🪫 Key Concepts
### Cluster
A network of machines (Nodes) running Kubernetes

### Nodes
- **Master Node (Control Plane):** controls the cluster
- **Worker Nodes:** where containers run

### Master Node components:
- `API Server`: Main communication interface
- `Scheduler`: Chooses which Node runs the Pods
- `Controller Manager`: Maintains the desired state
- `Cloud Controller Manager`: Integrates with cloud provider resources

### Worker Node components:
- `kubelet`: Executes commands from the Master Node
- `container runtime` (e.g., Docker, containerd): runs the containers
- `kube-proxy`: manages network communication

---

## 🧱 Understanding the Pod
- The **smallest unit** in Kubernetes
- Contains:
  - One or more containers
  - Configurations
  - Volumes
  - Its own IP address
- Kubernetes manages Pods, not containers directly

---

## 📊 Benefits of Using Kubernetes
- Autoscaling
- Auto-restart
- Easy rollbacks
- Built-in load balancing
- Simplified container networking
- Declarative and reusable configuration

---

## 🔗 Concept Summary
| Concept       | Function                                                   |
|----------------|-----------------------------------------------------------|
| **Cluster**     | A network of machines running containers                 |
| **Node**        | One of these machines (Master or Worker)                |
| **Pod**         | Unit that runs containers                               |
| **Service**     | Network abstraction to access Pods                      |
| **Deployment**  | Manages Pods, scales and updates                        |

---

## 📄 Useful Resources and Links
- [Kubernetes official documentation](https://kubernetes.io/docs/home/)
- [Cheat Sheet - Kubernetes (PDF)](https://kubernetes.io/docs/concepts/overview/components/)
- [Course Slides - Kubernetes Introduction](https://www.udemy.com/course/docker-kubernetes-the-practical-guide/)

---