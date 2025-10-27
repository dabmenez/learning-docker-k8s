
# Kubernetes Networking 
---

## Mental Model (Read This First)

Understanding Kubernetes networking requires grasping three fundamental concepts:

**Pod Networking:**
- Every **Pod gets its own IP address** in a flat network
- Pods can communicate with each other **without NAT** (no translation layer)
- Pods are **ephemeral**; their IPs change when they are recreated
- Pod IPs are **unstable** - they change across restarts and reschedules

**Services - The Stable Layer:**
- **Services** provide a stable virtual IP that never changes
- Services act as a consistent DNS name and IP for a group of Pods
- Services use **label selectors** to find matching Pods
- Traffic is automatically load-balanced across all Pods in the Service

**External Access:**
- To expose an app **from outside** the cluster:
  - Use a **Service of type `LoadBalancer`** (cloud) or **`NodePort`** (bare metal)
  - Or use an **Ingress** controller (recommended for HTTP/HTTPS traffic)

High-level network path:

```
Client (browser) ──> Ingress / LoadBalancer ──> Service ──> Pod
```

**Key Rule**: Never reference Pod IPs directly. Always use Service DNS names.



---

## Introduction

Kubernetes networking is a multi-layer abstraction that simplifies container networking.

**The CNI Layer:**
Kubernetes doesn't implement networking itself; it uses a **CNI plugin** (Container Network Interface) to create the Pod network. Popular CNI plugins:
- **Calico**: Policy-driven networking with BGP
- **Cilium**: eBPF-based, high-performance networking
- **Flannel**: Simple overlay network (VXLAN)
- **Weave Net**: Encrypted mesh networking

These plugins create a **flat, routable network** where every Pod gets its own IP.

**Kubernetes Networking Objects:**
What you work with day-to-day are Kubernetes **objects**, not raw networking:
- **Deployments**: Create and scale Pods (which get IPs)
- **Services**: Provide stable DNS names and IPs for Pods
- **Ingress**: HTTP(S) routing to multiple Services (layer 7)
- **DNS**: Automatic service discovery via CoreDNS

**Networking Pattern:**
Connect microservices using **Services + DNS names** for internal communication. Expose only the **edge services** to users via a **LoadBalancer** or **Ingress** for security.

---

## Starting project & our goal

Imagine three APIs and a frontend:

- `users` (public) – the entrypoint for clients
- `auth` (internal) – used by `users`
- `tasks` (internal) – also used by `users`
- `frontend` (static app) – talks to `users`

**Goal**: Make `users` reachable from the Internet but keep `auth` and `tasks` **cluster‑internal**. All services must reach each other reliably even when Pods get recreated.

---

## Creating a first Deployment

A minimal Deployment for the **Users API**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: users-deployment
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
        image: your-registry/users:1.0.0
        ports: [{ containerPort: 3000, name: http }]
        readinessProbe:
          httpGet: { path: /healthz, port: http }
        livenessProbe:
          httpGet: { path: /healthz, port: http }
```

Create it:

```bash
kubectl apply -f users.deployment.yaml
```

---

## Another Look at Services

**Why Services?** Pods are ephemeral with changing IPs. Services solve this by providing:
- Stable **virtual IP** that persists across Pod restarts
- Stable **DNS name** for service discovery
- Automatic **load balancing** across all Pod endpoints
- Health-aware traffic distribution

**Service Types Comparison:**

| Type | What it does | Typical use | Access scope |
|---|---|---|---|
| `ClusterIP` (default) | Creates internal virtual IP | Internal microservices (Auth, Tasks, DB) | Cluster-internal only |
| `NodePort` | Opens port 30000-32767 on every node's IP | On-prem or quick lab access | Node IP + port from outside |
| `LoadBalancer` | Creates cloud L4 load balancer | Public APIs/sites in cloud environments | Public Internet access |
| `ExternalName` | Returns CNAME record for external service | Legacy service integration | Redirects to external endpoint |

**Best Practice**: Use `ClusterIP` for internal services, `LoadBalancer` or `Ingress` for public access.

**Internal Service for Users** (ClusterIP):

```yaml
apiVersion: v1
kind: Service
metadata: { name: users }
spec:
  selector: { app: users }
  ports:
  - name: http
    port: 80        # service port
    targetPort: http # container port by name
```

**Public edge** (cloud) via `LoadBalancer`:

```yaml
apiVersion: v1
kind: Service
metadata: { name: users-public }
spec:
  type: LoadBalancer
  selector: { app: users }
  ports:
  - name: http
    port: 80
    targetPort: http
```

> Keep internal services as `ClusterIP`. Only the **edge** should be public.

---

## Multiple containers in one Pod

A Pod can run multiple containers that **share the same network namespace** and **localhost**. Common patterns:

- **Sidecars** (e.g., log shipper, proxy)
- **Tightly coupled processes** that must share the same lifecycle

Example Pod with two containers (`users` + `auth`) in the **same Pod**:

```yaml
spec:
  containers:
  - name: users
    image: your-registry/users:1.0.0
    ports: [{ containerPort: 3000, name: http }]
  - name: auth
    image: your-registry/auth:1.0.0
    ports: [{ containerPort: 8080, name: auth }]
```

This allows **localhost** communication (see next section), but couples scaling and rollouts. Use with care.

---

## Pod‑internal communication

Containers in one Pod can talk via **`localhost`** because they share the same network namespace:

- `users` → `http://localhost:8080/login` (to reach the `auth` container)
- They can also share files via an **`emptyDir`** volume if needed.

Pros: zero network hops, very fast.  
Cons: you can’t scale or roll each container independently; this pattern is best for “sidecars”, not separate microservices.

---

## Creating multiple Deployments

The common microservices layout is **one Deployment per service**:

- `users-deployment` (`app: users`)
- `auth-deployment` (`app: auth`)
- `tasks-deployment` (`app: tasks`)

…and one **ClusterIP Service** for each, selecting by label. This lets you scale/roll versions independently.

---

## Pod-to-Pod Communication: The Three Approaches

There are three ways for Pods to communicate (from simplest to most recommended):

1. **Service Environment Variables** (Not Recommended)
   - Kubernetes automatically injects env vars like `USERS_SERVICE_HOST`, `USERS_SERVICE_PORT` when a Pod starts
   - Nice for demos, but **not dynamic**: if Services change after Pod creation, the env vars don't update
   - The Pod would need to be restarted to pick up new Service IPs
   - Example: `http://${USERS_SERVICE_HOST}:${USERS_SERVICE_PORT}`

2. **Direct Pod IPs** (NEVER Use)
   - Never rely on Pod IPs—Pods are ephemeral, IPs change frequently
   - Pod IPs are completely unreliable in production
   - Anti-pattern that breaks when Pods restart or reschedule

3. **DNS Names for Services** (Best Practice)
   - Use Service DNS names: stable, simple, and automatic
   - Format: `http://service-name/endpoint` (same namespace)
   - Full format: `http://service-name.namespace.svc.cluster.local/endpoint`
   - Automatically resolves via CoreDNS
   - Example: `http://auth-service.default:80/verify-token/token123`

**Alternative for Config-Driven Apps:**
If you prefer environment-style configuration, store the Service DNS names in a **ConfigMap** and reference those values from the ConfigMap. This way you still benefit from automatic DNS resolution while maintaining a clean config structure.

---

## Using DNS for Pod-to-Pod Communication

**Service DNS Resolution:**
CoreDNS automatically creates DNS names for every Service. The DNS format is:
```
<service-name>.<namespace>.svc.cluster.local
```

**Short Names:**
- Inside the same namespace, you can use just `service-name`
- Example: From a Pod in `default` namespace, `http://auth-service` works
- Cross-namespace requires the full name: `http://auth-service.production.svc.cluster.local`

**DNS Examples:**
```yaml
# Same namespace (default)
value: "http://auth-service"

# Different namespace (production)
value: "http://auth-service.production.svc.cluster.local"

# With port
value: "http://auth-service:80"
```

**Testing DNS from a Debug Pod:**

```bash
# Create a temporary debugging Pod
kubectl run -it dnsutils \
  --image=ghcr.io/kubernetes-sigs/e2e-test-images/jessie-dnsutils:1.3 \
  --restart=Never -- sh

# Inside the pod, test DNS resolution
nslookup users
nslookup auth-service

# Test service connectivity
curl -sS http://users/healthz
curl http://auth-service:80
```

**DNS Configuration:**
CoreDNS is configured via ConfigMap in `kube-system` namespace. In most cases, default settings work fine, but you can customize for special requirements.

---

## Which approach is best? And a Challenge!

**Best practice** in almost all cases:
- One **Deployment per microservice**
- One **ClusterIP Service** per microservice
- Services call each other by **DNS name**

### Challenge
Wire three services (`users`, `auth`, `tasks`) so that:
- Only `users` is public.
- `users` calls `auth` and `tasks` by **DNS**.
- Users must *not* be able to reach `auth` or `tasks` directly from the Internet.

> You’ll find a reference solution below.

---

## Important hint: create `tasks.txt`

If your `tasks` API writes to a file (like `./tasks.txt`) for the demo, ensure the file/path exists. In a container, either:
- include the file in the image, **or**
- mount an `emptyDir`/`hostPath`/PV to that location.

Otherwise the app may crash on first write.

---

## Challenge solution (reference)

**Deployments** (abbreviated):

```yaml
# users
apiVersion: apps/v1
kind: Deployment
metadata: { name: users-deployment }
spec:
  replicas: 2
  selector: { matchLabels: { app: users } }
  template:
    metadata: { labels: { app: users } }
    spec:
      containers:
      - name: users
        image: your-registry/users:1.0.0
        env:
        - name: AUTH_URL
          value: http://auth     # Service DNS
        - name: TASKS_URL
          value: http://tasks
---
# auth
apiVersion: apps/v1
kind: Deployment
metadata: { name: auth-deployment }
spec:
  selector: { matchLabels: { app: auth } }
  template:
    metadata: { labels: { app: auth } }
    spec:
      containers:
      - name: auth
        image: your-registry/auth:1.0.0
---
# tasks
apiVersion: apps/v1
kind: Deployment
metadata: { name: tasks-deployment }
spec:
  selector: { matchLabels: { app: tasks } }
  template:
    metadata: { labels: { app: tasks } }
    spec:
      containers:
      - name: tasks
        image: your-registry/tasks:1.0.0
```

**Services**:

```yaml
apiVersion: v1
kind: Service
metadata: { name: users }
spec:
  selector: { app: users }
  ports: [{ name: http, port: 80, targetPort: 3000 }]
---
apiVersion: v1
kind: Service
metadata: { name: users-public }
spec:
  type: LoadBalancer
  selector: { app: users }
  ports: [{ name: http, port: 80, targetPort: 3000 }]
---
apiVersion: v1
kind: Service
metadata: { name: auth }
spec:
  selector: { app: auth }
  ports: [{ name: http, port: 80, targetPort: 8080 }]
---
apiVersion: v1
kind: Service
metadata: { name: tasks }
spec:
  selector: { app: tasks }
  ports: [{ name: http, port: 80, targetPort: 8080 }]
```

> Swap the `users-public` Service for an **Ingress** if you prefer one IP/host for many services.

---

## Adding a containerized frontend

Package your SPA or server‑rendered frontend in a container:

- **Static** (React/Vue/etc.): build assets, serve with NGINX (or any static server).
- Configure the frontend to call the **`users` Service DNS** (e.g., via env vars injected at runtime or a config endpoint).

Example Deployment (static app over NGINX):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: frontend-deployment }
spec:
  replicas: 2
  selector: { matchLabels: { app: frontend } }
  template:
    metadata: { labels: { app: frontend } }
    spec:
      containers:
      - name: web
        image: your-registry/frontend:1.0.0
        ports: [{ containerPort: 80, name: http }]
```

Create an internal Service and (optionally) expose through an **Ingress** along with the backend routes.

---

## Deploying the frontend with Kubernetes

**Service** (internal):

```yaml
apiVersion: v1
kind: Service
metadata: { name: frontend }
spec:
  selector: { app: frontend }
  ports: [{ name: http, port: 80, targetPort: http }]
```

**Ingress** (one host, multiple paths):

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port: { number: 80 }
      - path: /api/users
        pathType: Prefix
        backend:
          service:
            name: users
            port: { number: 80 }
```

Add TLS with a cert (e.g., cert‑manager) to terminate HTTPS at the Ingress.

---

## Using a reverse proxy for the frontend

You have two good options:

1. **Ingress as the reverse proxy** (recommended) – route `/` → `frontend`, `/api/*` → `users`, `/auth/*` → `auth` etc. Centralized TLS and routing.
2. **Web server as reverse proxy** – NGINX inside the `frontend` Pod proxies `/api/*` to `http://users`. Good for local dev or when you can’t use Ingress.

NGINX snippet (inside the frontend image):

```nginx
location /api/ {
  proxy_pass http://users;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## Troubleshooting & verification

```bash
# Objects and endpoints
kubectl get deploy,svc,endpoints,endpointslices -o wide

# Service details and selector matching
kubectl describe svc users

# DNS from inside cluster
kubectl run -it toolbox --image=busybox:1.36 --restart=Never -- sh
/ # nslookup users
/ # wget -qO- http://users/healthz

# Ingress
kubectl get ingress
kubectl describe ingress app
```

Common issues:
- Service `selector` doesn’t match Pod `labels` → **no endpoints**.
- Wrong `targetPort` (container isn’t listening there).
- Ingress controller not installed / wrong class → Ingress has no effect.
- Frontend tries to call `localhost` instead of the Service DNS (remember: browser runs on the user’s machine!).

---

## Mini Glossary

- **CNI (Container Network Interface)**: Network plugin that implements the cluster's Pod networking layer (e.g., Calico, Cilium, Flannel).

- **Service (ClusterIP)**: Stable virtual IP and DNS name that proxies traffic to a set of Pods. Provides internal load balancing and service discovery.

- **Endpoints / EndpointSlice**: Actual list of Pod IP:port combinations behind a Service. Automatically updated by Kubernetes as Pods change.

- **Ingress**: Layer 7 (HTTP/HTTPS) router that maps external hostnames and paths to internal Services. Handles SSL termination and virtual hosting.

- **Headless Service**: Service with `clusterIP: None`. DNS returns actual Pod IPs instead of a virtual IP. Useful for StatefulSets where each Pod needs its own identity.

- **NetworkPolicy**: Label-based firewall rules that control Pod-to-Pod communication. Requires a capable CNI plugin (not all CNIs support it).

- **Service DNS**: Automatic DNS resolution for Services via CoreDNS. Format: `<service>.<namespace>.svc.cluster.local`.

- **LoadBalancer**: Cloud provider service that creates an external load balancer and assigns it a public IP address for Internet access.

---

### TL;DR
- Talk to **Services** (not Pods).
- For the Internet: **Ingress** (HTTP) or **LoadBalancer** (L4).
- Use **Service DNS** for internal comms.
- Keep internal services **private** (ClusterIP).
- Inspect `svc` + `endpoints` when “it doesn’t respond”.