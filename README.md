# Docker & Kubernetes Study Repository

This repository contains comprehensive notes, practical code examples, exercises, and projects created during systematic study of Docker and Kubernetes technologies. All materials are based on the [Docker & Kubernetes: The Practical Guide (2025 Edition)](https://www.udemy.com/course/docker-kubernetes-the-practical-guide/) Udemy course.

## About This Repository

This is a **learning repository** organized by course chapters. Each folder represents a chapter with practical examples, educational code comments, and detailed explanatory notes (`.md` files) to facilitate understanding and future reference.

All code files include educational comments explaining concepts, and all documentation follows a professional, didactic approach focused on knowledge transfer.

## Technologies Covered

**Docker:**
- Container fundamentals (images, containers, Dockerfile)
- Docker Compose for multi-container orchestration
- Volumes and data persistence
- Networking between containers
- Utility containers and production deployments
- Multi-stage builds and deployment strategies (AWS ECS)

**Kubernetes:**
- Core concepts and architecture
- Deployments, ReplicaSets, and Pods
- Services and networking (ClusterIP, NodePort, LoadBalancer)
- PersistentVolumes and storage management
- Service-to-service communication via DNS
- Health probes (Liveness, Readiness, Startup)
- ConfigMaps and Secrets
- Deployment on AWS EKS with EFS storage

## Repository Structure

```
learning-docker-k8s/
│
├── docker/
│   ├── basics/                    # Docker fundamentals
│   │   ├── notes.md              # Comprehensive theory
│   │   └── assignment-problem/   # Hands-on exercises
│   │
│   ├── docker-compose/           # Multi-container apps
│   │   ├── notes.md
│   │   └── compose-02-finished/
│   │
│   ├── deploying_containers/     # Production deployments
│   │   ├── notes.md
│   │   └── deployment/           # EC2, ECS examples
│   │
│   ├── networking/               # Container networking
│   │   ├── notes.md
│   │   └── multi_container_app/
│   │
│   ├── volumes/                  # Data persistence
│   │   ├── notes.md
│   │   └── data-volumes/         # Named volumes, bind mounts
│   │
│   ├── php_project/             # Laravel containerization
│   │   └── laravel-04-fixed/
│   │
│   └── summary.md               # Docker concepts summary
│
└── kubernetes/
    ├── kubernetes-intro.md       # Introduction to K8s
    
    ├── kubernetes_in_action/    # Core concepts hands-on
    │   ├── core_concepts.md
    │   └── kub-action/           # Practical examples
    
    ├── Networking/               # Service networking
    │   ├── networking.md
    │   └── kub-network/          # Microservices examples
    │
    ├── data_volumes/             # Storage management
    │   ├── data_volumes.md
    │   └── kub-data/             # PVCs, PVs, ConfigMaps
    │
    └── aws_eks/                  # EKS deployment guide
        ├── aws_eks.md
        └── kub-deploy/           # Production-ready examples
```

## Learning Path

### Part 1: Docker Foundation

1. **Basics** (`docker/basics/`) - Build your first images and run containers
2. **Docker Compose** (`docker/docker-compose/`) - Orchestrate multi-container applications
3. **Volumes** (`docker/volumes/`) - Understand data persistence
4. **Networking** (`docker/networking/`) - Connect containers securely
5. **Deployment** (`docker/deploying_containers/`) - Deploy to AWS ECS

### Part 2: Kubernetes Mastery

1. **Introduction** (`kubernetes/kubernetes-intro.md`) - Understanding K8s architecture
2. **Core Concepts** (`kubernetes/kubernetes_in_action/`) - Deployments, Services, Probes
3. **Networking** (`kubernetes/Networking/`) - Service discovery, DNS, Ingress
4. **Storage** (`kubernetes/data_volumes/`) - Volumes, PVCs, ConfigMaps, Secrets
5. **Cloud Deployment** (`kubernetes/aws_eks/`) - Production deployment on AWS EKS

## Key Features

**Educational Code Comments:**
- All code files include detailed, educational comments explaining concepts
- YAML manifests include explanations of each field and its purpose
- JavaScript/application code documents inter-service communication patterns

**Comprehensive Documentation:**
- Each major topic has a corresponding `.md` file with theory, examples, and best practices
- Professional, serious tone without excessive decorations
- Practical examples from real-world scenarios

**Progressive Learning:**
- Structured from basics to advanced topics
- Each chapter builds on previous knowledge
- Practical exercises reinforce concepts

## How to Use This Repository

1. **Follow the folder structure** - Each folder represents a course chapter
2. **Read the notes files** - Start with `notes.md` in each section for theory
3. **Study the code** - Review practical examples with educational comments
4. **Run the examples** - Execute the code to see concepts in action
5. **Reference the documentation** - Use `.md` files as quick reference guides

## Quick Start Examples

### Docker: Build and Run

```bash
cd docker/basics/assignment-problem
docker build -t my-node-app ./node-app
docker run -p 3000:3000 my-node-app
```

### Kubernetes: Local Deployment

```bash
cd kubernetes/kubernetes_in_action/kub-action
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl get pods,svc
```

### Kubernetes: Multi-Service Networking

```bash
cd kubernetes/Networking/kub-network
kubectl apply -f kubernetes/
kubectl get deploy,svc,endpoints
```

## Prerequisites

- Docker Desktop installed (or Docker Engine + Docker Compose)
- `kubectl` CLI tool
- Local Kubernetes cluster: [Kind](https://kind.sigs.k8s.io/) or [Minikube](https://minikube.sigs.k8s.io/)
- (For EKS) AWS account and AWS CLI configured

## Important Notes

**Security Warning:**
Some examples contain hardcoded credentials for demonstration purposes. In production:
- Use Kubernetes Secrets for sensitive data
- Never commit credentials to version control
- Rotate exposed credentials immediately
- Follow security best practices

**Best Practices:**
- Always use `kubectl apply` (declarative) over `kubectl create` (imperative) for production
- Use meaningful labels and selectors
- Implement health probes (readiness/liveness) in all Deployments
- Use ConfigMaps for configuration, Secrets for sensitive data
- Keep internal services as ClusterIP, expose only edge services

## Course Information

This repository follows the comprehensive [Docker & Kubernetes: The Practical Guide (2025 Edition)](https://www.udemy.com/course/docker-kubernetes-the-practical-guide/) course from Udemy. The structure, examples, and explanations complement the course material for practical, hands-on learning.

**Course Coverage:**
- Docker containerization fundamentals
- Production Docker deployment strategies
- Kubernetes architecture and core concepts
- Hands-on Kubernetes workloads (Deployments, Services, Volumes)
- Production deployment on AWS EKS

## Repository Purpose

This is a **personal learning repository** created to:
- Document the learning journey through a structured course
- Provide a reference for future projects
- Serve as a practical knowledge base
- Demonstrate proficiency in containerization and orchestration

---

**License:** This repository is for educational purposes only, based on course materials from [Academind](https://academind.com/) Udemy courses.