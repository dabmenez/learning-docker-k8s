# Kubernetes Introduction

---

## Introduction
Manual container deployment quickly becomes fragile once you have multiple services, traffic spikes, and the need for zero/low‑downtime updates. You need a system that can describe **desired state** and then **continuously reconcile** it across multiple machines: creating, scaling, healing, and updating containers in a repeatable way.

---

## More Problems with Manual Deployment
- Containers and processes can fail; manual restarts do not scale.
- Traffic spikes require adding instances quickly and removing them later.
- You need consistent **service discovery** and **load balancing** across instances.
- **Rollouts** (progressive updates) and **rollbacks** must be predictable and safe.
- Doing this across many remote hosts (on‑prem or cloud) increases risk and complexity.

Managed container services (e.g., AWS ECS) provide automation, but tie you to provider‑specific constructs and APIs.

---

## Why Kubernetes?
- **Open‑source, de‑facto standard** for orchestrating containerized workloads across many hosts.
- **Self‑healing**: restarts failed Pods and reschedules them on healthy nodes.
- Built‑in **horizontal scaling**, **service discovery**, and **load balancing**.
- **Declarative configuration**: you describe the target state; controllers reconcile the system to match it.
- **Provider‑agnostic**: a Kubernetes configuration can run anywhere a Kubernetes cluster exists (managed cloud or your own data center).

---

## What Is Kubernetes Exactly?
Kubernetes is an open‑source **system for automating the deployment, scaling, and management of containerized applications**. It is a **collection of concepts and tools** that work together to schedule and operate containers across multiple machines.

Kubernetes is **not**:
- a cloud provider,
- a single proprietary service (though providers offer managed Kubernetes),
- an infrastructure provisioner (it does **not** create machines by itself),
- an alternative to Docker/container runtimes (it orchestrates containers built by those runtimes).

---

## How Kubernetes Works
- You have a **Kubernetes Cluster** (a network of machines configured for Kubernetes).
- You write **Kubernetes configuration files** (YAML) that declare the **desired state** (images, replicas, ports, health checks, resources, etc.).
- With a few commands (`kubectl apply -f ...`), the **control plane** brings that state to life on the cluster and continuously **reconciles** it.

---

## Kubernetes: Architecture & Core Concepts
A **cluster** has two types of nodes:

- **Master Node / Control Plane** — the “brain” of the cluster; it exposes the API, schedules work, and runs controllers that reconcile desired vs. actual state.
- **Worker Nodes** — machines that actually run your **Pods** (which in turn host one or more containers).

High‑level view (conceptual):
```
Client (kubectl / controllers)
            |
        API Server  —— etcd (state store)
            |    \
       Scheduler   Controller Managers
            \         (reconcile loops)
             \_____________________
                               |
                         Worker Nodes
                   (kubelet, runtime, kube‑proxy)
                               |
                              Pods (containers + volumes + config)
```

**Core building blocks you will meet immediately:**
- **Pod** (smallest deployable unit; typically one container, sometimes more as sidecars)
- **ReplicaSet / Deployment** (replicas, rolling updates, rollbacks)
- **Service** (stable virtual IP + load balancing to a set of Pods)
- **Ingress** (HTTP/HTTPS routing from outside the cluster to Services)
- **ConfigMap / Secret** (runtime configuration and sensitive values)
- **Volume / PersistentVolumeClaim** (persistent storage abstraction)

---

## Kubernetes Will **Not** Manage Your Infrastructure (Your Work vs. Kubernetes’ Work)

**What Kubernetes does**
- Creates and manages your declared objects (Pods, Deployments, Services, etc.).
- Monitors and recreates Pods, schedules them across nodes, scales them.
- Utilizes provided (cloud/on‑prem) resources—LBs, volumes—via integrations.

**What you must do / provide**
- Create the cluster and the node instances (control plane + workers) or use a **managed** offering (EKS/GKE/AKS).
- Install and run the Kubernetes components on nodes (managed offerings do this for you).
- Create additional provider resources when needed (e.g., load balancers, filesystems/volumes).

> Managed Kubernetes exposes cloud interfaces (Cloud Provider API). Kubernetes remains provider‑agnostic at the API level; provider‑specific settings are added via annotations and plugins.

---

## A Closer Look at the Worker Nodes
Each worker node runs:
- **kubelet** — node agent that applies Pod specs from the API Server, manages the container lifecycle, and reports status.
- **Container runtime** — e.g., `containerd` (via CRI) to pull images and run containers.
- **kube‑proxy** — implements Service networking (iptables/ipvs) for stable virtual IPs and load balancing to Pod endpoints.
- **CNI plugin** (cluster‑wide) — configures Pod networking (Pod IPs, routing, policies).

A worker hosts one or more **Pods**, which share a network namespace (one IP per Pod), can share volumes, and have a single scheduling destiny.

---

## A Closer Look at the Master Node (Control Plane)
- **API Server (kube‑apiserver)** — the front door; handles all requests, authentication/authorization/admission, and persists state in etcd.
- **Scheduler (kube‑scheduler)** — assigns **unscheduled Pods** to nodes based on resource requests/limits, taints/tolerations, node selectors, and affinity/anti‑affinity.
- **Controller Managers (kube‑controller‑manager, cloud‑controller‑manager)** — reconciliation loops for Deployments/ReplicaSets, Jobs/CronJobs, Nodes, EndpointSlices, and cloud integration (LBs, volumes, node lifecycle).
- **etcd** — consistent key‑value store that holds cluster state; single source of truth for the control plane.

Control plane components can be run in **high availability** (multiple replicas, often on dedicated nodes).

---

## Pods: The Smallest Deployable Unit
A **Pod** groups one or more tightly‑coupled containers that:
- share the same network namespace (Pod IP/ports),
- can share volumes,
- are scheduled together and restarted together by Kubernetes.

In Kubernetes, you manage **Pods** (directly or via controllers like Deployments) instead of managing individual containers by hand.

---

## 11) Important Terms & Core Concepts (Quick Reference)
- **Cluster** — all control plane and worker nodes.
- **Node** — a single machine (VM or physical); either control plane or worker.
- **Pod** — one or more containers deployed together, with shared network/storage.
- **ReplicaSet / Deployment** — ensures the desired replica count and manages rollouts/rollbacks.
- **Service** — stable virtual IP + load balancing for a set of Pods (selected via **labels**).
- **Ingress** — HTTP/HTTPS routing into the cluster.
- **Namespace** — logical isolation and multi‑tenancy within the same cluster.
- **Labels / Selectors** — key‑value metadata used to group and target resources.
- **Annotations** — non‑identifying metadata (incl. provider‑specific settings).
- **ConfigMap / Secret** — configuration (non‑sensitive / sensitive) injected at runtime.
- **Volume / PVC / StorageClass** — persistent storage abstractions (CSI‑backed).
- **Requests / Limits** — CPU/memory hints and constraints that drive scheduling and stability.
- **Probes** — **readiness** (traffic gating) and **liveness** (restart on failure).
- **HPA** — Horizontal Pod Autoscaler based on resource or custom metrics.
- **RBAC** — role‑based access control for users, service accounts, and components.

---

## Minimal Manifest Example (Deployment + Service)
Below is a small example to illustrate declarative configuration and the separation between **workload** (Deployment) and **access** (Service).

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: users-deployment
  labels: { app: users }
spec:
  replicas: 2
  selector:
    matchLabels: { app: users }
  template:
    metadata:
      labels: { app: users }
    spec:
      containers:
      - name: users
        image: my-repo/users-application
        ports:
        - containerPort: 80
        readinessProbe:
          httpGet: { path: /healthz, port: 80 }
        livenessProbe:
          httpGet: { path: /healthz, port: 80 }
          initialDelaySeconds: 15
---
apiVersion: v1
kind: Service
metadata:
  name: users-svc
spec:
  selector: { app: users }
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

---

## Mini‑Lab (Kind)
**Goal:** Deploy a 2‑replica “users” workload and expose it via a ClusterIP Service.

```bash
# 1) Create a local cluster
kind create cluster --name lab-k8s

# 2) Apply the manifests (save the YAML above as deploy-users.yaml)
kubectl apply -f deploy-users.yaml

# 3) Validate state
kubectl get deploy,rs,pods,svc
kubectl describe deploy users-deployment
kubectl get endpoints users-svc

# 4) Test from inside the cluster
kubectl run tmp --rm -it --image=alpine -- sh
# inside the temporary pod:
wget -qO- http://users-svc
```

**Troubleshooting**
- `kubectl describe <resource>` for events (ImagePullBackOff, CrashLoopBackOff).
- `kubectl logs -f <pod>` for runtime errors.
- `kubectl get endpoints users-svc` to ensure the Service selects **Ready** Pods.
