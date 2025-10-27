# Kubernetes in Action: Diving into the Core Concepts


---

## Introduction
Here we put Kubernetes into practice: create a workload, expose it inside/outside the cluster, scale it, update it safely, and roll back if needed. You will learn both **imperative** and **declarative** styles and the core objects that appear in every real project.

---

## Kubernetes does not Manage Your Infrastructure
Kubernetes orchestrates containers; it does **not** provision raw infrastructure by itself.
- You (or a managed service) must provide machines (control plane + workers), networking, and storage.
- Kubernetes then uses provider integrations (CNI/CSI, load balancers, etc.) to realize your **declarative** configuration.

---

## Kubernetes: Required Setup & Installation Steps

You need:
- A **cluster** (local or cloud): Kind or Minikube are great for local labs.
- The **kubectl** CLI.

### macOS Setup
```bash
# Install kubectl (Homebrew)
brew install kubectl

# Install a local cluster runtime (choose one)
brew install kind
# or
brew install minikube

# Verify
kubectl version --client
kind version || minikube version
```

### Windows Setup
```powershell
# Using winget
winget install Kubernetes.kubectl
winget install kind
winget install Microsoft.Minikube

# Or using Chocolatey (Administrator PowerShell)
choco install kubernetes-cli -y
choco install kind -y
choco install minikube -y
```
> Tip: On Windows, prefer **WSL2** for a smoother container developer experience.

Create a local cluster:
```bash
# Kind
kind create cluster --name k8s-lab
# or Minikube
minikube start
kubectl cluster-info
kubectl get nodes
```

---

## Understanding Kubernetes Objects (Resources)
Kubernetes manages **objects** that represent desired state:
- **Pod**, **Deployment**, **Service**, **Ingress**, **ConfigMap**, **Secret**, **Job/CronJob**, **Volume/PersistentVolumeClaim**, etc.

Objects can be created in two ways:
- **Imperatively:** run a `kubectl` command that asks Kubernetes to do something now.
- **Declaratively:** apply YAML that describes the desired end state; controllers reconcile until reality matches.

---

## The **Deployment** Object
A **Deployment**:
- Controls one or more **Pods** (via a **ReplicaSet**).
- Maintains a desired **replica** count.
- Performs **rolling updates** and supports **rollbacks**.
- Can be **scaled** dynamically (and automatically via HPA).

At a high level you declare:
- the **Pod template** (containers, images, ports, env, resources, probes, volumes),
- the number of **replicas**,
- the **update strategy** (e.g., RollingUpdate with `maxSurge`/`maxUnavailable`).

---

## A First Deployment — Imperative Approach
```bash
# Create a Deployment with one container
kubectl create deployment users-deployment \
  --image=nginxdemos/hello:plain-text

# Inspect
kubectl get deployments
kubectl get pods -o wide

# Scale it
kubectl scale deployment/users-deployment --replicas=3
kubectl get rs,pods
```
This style is fast for demos but not reproducible. Prefer declarative YAML for real work.

---

## kubectl: Behind the Scenes

When you run `kubectl apply`, the following happens:

1. `kubectl` sends your intent to the **API Server** (cluster frontend).
2. **etcd** stores the state; controllers detect a new desired state.
3. The **Scheduler** picks the best worker node(s) for the new Pod(s).
4. The **kubelet** on that node pulls the image and runs the containers.
5. The **kube-proxy** programs networking so Services can reach Pods.

Understanding this flow helps troubleshoot issues and understand how Kubernetes reconciles desired state with actual state.

---

## The **Service** Object

**Services** provide stable networking and load balancing to a set of Pods.

Key Concepts:
- Pods have IPs that change across restarts; Services keep a **stable virtual IP** that never changes.
- Services select Pods via **labels** and distribute traffic across them automatically.
- Services enable discovery and communication between application components.

Service Types:
- **ClusterIP**: Default type, exposes the Service internally within the cluster only.
- **NodePort**: Exposes the Service on each Node's IP at a static port (30000-32767 range).
- **LoadBalancer**: Creates an external load balancer in cloud environments (e.g., AWS ELB, GCP LB).
- **ExternalName**: Returns a CNAME record to map the Service to an external name.

Use ClusterIP for internal services and LoadBalancer for public-facing applications in production.

---

## Exposing a Deployment with a Service
**Imperative:**
```bash
kubectl expose deployment users-deployment \
  --name=users-svc --port=80 --target-port=80 --type=ClusterIP

kubectl get svc
kubectl get endpoints users-svc
```
If using Minikube:
```bash
minikube service users-svc --url    # Opens/prints a URL when using NodePort or LB
```

---

## Restarting Containers
- Kubernetes automatically restarts containers on failure (**CrashLoopBackOff** indicates repeated failures).
- You can request a **rolling restart** to pick up ConfigMaps/Secrets without changing the image:
```bash
kubectl rollout restart deployment/users-deployment
```
- Check restart counts:
```bash
kubectl get pod -o=custom-columns=NAME:.metadata.name,RESTARTS:.status.containerStatuses[0].restartCount
```

---

## Scaling in Action
```bash
# Scale up/down manually
kubectl scale deployment/users-deployment --replicas=5
kubectl scale deployment/users-deployment --replicas=2

# Watch changes
kubectl get deploy,rs,pods -w
```
See also **HPA** for automatic scaling in a later chapter.

---

## Updating Deployments
Update by applying a new container image or Pod spec.
```bash
# Imperative image update
kubectl set image deployment/users-deployment \
  users=nginxdemos/hello:plain-text@sha256:e2...  # example digest

# Or update declaratively by editing YAML and applying it
kubectl apply -f deploy-users.yaml

# Observe rollout
kubectl rollout status deployment/users-deployment
```

---

## Deployment Rollbacks & History
```bash
# View rollout history
kubectl rollout history deployment/users-deployment

# See details for a specific revision
kubectl rollout history deployment/users-deployment --revision=3

# Roll back to the previous revision (or a specific one)
kubectl rollout undo deployment/users-deployment
# or
kubectl rollout undo deployment/users-deployment --to-revision=2
```
A new **revision** is recorded when the Pod template changes (image, env, labels in `spec.template`, etc.).

---

## Imperative vs Declarative
- **Imperative:** quick, ad‑hoc commands (`kubectl create`, `kubectl set image`, `kubectl scale`).
- **Declarative:** store intended state as code (`kubectl apply -f`), version it, review it, and reconcile repeatedly.

Use imperative for exploration; prefer declarative for production and CI/CD.

---

## Creating a Deployment Configuration (Declarative)
`deploy-users.yaml`:
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
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
  template:
    metadata:
      labels: { app: users, tier: web }
    spec:
      containers:
      - name: users
        image: nginxdemos/hello:plain-text
        ports:
        - containerPort: 80
        resources:
          requests: { cpu: 50m, memory: 64Mi }
          limits:   { cpu: 250m, memory: 128Mi }
        readinessProbe:
          httpGet: { path: /, port: 80 }
          initialDelaySeconds: 2
          periodSeconds: 5
        livenessProbe:
          httpGet: { path: /, port: 80 }
          initialDelaySeconds: 10
          periodSeconds: 10
```
Apply it:
```bash
kubectl apply -f deploy-users.yaml
kubectl get deploy,rs,pods
```

---

## Adding Pod and Container Specs
Common `spec.template.spec.containers[]` fields:
- `image`, `imagePullPolicy`
- `ports[]`
- `env[]`, `envFrom` (ConfigMaps/Secrets)
- `resources.requests/limits`
- `volumeMounts` (with `volumes` at Pod level)
- Probes: `readinessProbe`, `livenessProbe`, `startupProbe`
- Security: `securityContext`, `capabilities`, `runAsUser`, `runAsNonRoot`

---

## Working with Labels & Selectors
Labels are key-value pairs used to group and select resources.
```bash
# Select Pods by label
kubectl get pods -l app=users
kubectl get pods -l 'app=users,tier=web'

# Add or change labels
kubectl label deployment users-deployment track=stable --overwrite
kubectl get deploy -L track

# Use label selectors in Services, NetworkPolicies, HPAs, etc.
```
Labeling conventions: `app`, `component`, `tier`, `env`, `track`, `version`.

---

## Creating a Service Declaratively
`svc-users.yaml`:
```yaml
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
Apply and validate:
```bash
kubectl apply -f svc-users.yaml
kubectl get svc users-svc
kubectl get endpoints users-svc
```

---

## Updating & Deleting Resources
```bash
# Update desired state
kubectl apply -f deploy-users.yaml -f svc-users.yaml

# Delete resources when no longer needed
kubectl delete -f svc-users.yaml
kubectl delete -f deploy-users.yaml
# or target by kind/name
kubectl delete deployment/users-deployment
kubectl delete service/users-svc
```

---

## Multiple vs Single Config Files
You may:
- Keep **multiple** focused files (e.g., one per resource).
- Maintain a **single** combined file separated by `---`.
- Apply a **directory**:
```bash
kubectl apply -f k8s/       # applies all YAMLs in the folder
```
For complex setups, consider **Kustomize** or **Helm** to compose overlays and templated manifests.

---

## More on Labels & Selectors
- **Selector types:** equality-based (`key=value`) and set-based (`in`, `notin`, `exists`).
- **Consistent labeling** allows teams and tools to filter by `env=prod`, `track=canary`, etc.
- **Selectors must match** between a Deployment’s `spec.selector.matchLabels` and the Pod template labels; mismatches cause orphaned Pods or blocked updates.

---

## Liveness and Readiness Probes

Probes make workloads resilient and safe to roll out by allowing Kubernetes to understand the application's health status.

The Three Types of Probes:

1. **Startup Probe**: Determines if the application has successfully started. Useful for slow-starting apps to avoid premature restarts. Runs before other probes.

2. **Readiness Probe**: Determines if a Pod is ready to accept traffic. If this probe fails, the Pod is removed from Service endpoints (stops receiving traffic) but is not restarted.

3. **Liveness Probe**: Determines if a container is still alive. If this probe fails, Kubernetes restarts the container. This is a drastic action compared to readiness.

When to use each:
- Use **Startup** for apps that take time to initialize (databases, startup scripts).
- Use **Readiness** to handle temporary unavailability (loading cache, temporary file operations).
- Use **Liveness** for detecting deadlocks or zombie processes that require container restart.

Example (HTTP):
```yaml
livenessProbe:
  httpGet: 
    path: /healthz
    port: 80
  initialDelaySeconds: 10
  periodSeconds: 10
  failureThreshold: 3
readinessProbe:
  httpGet: 
    path: /ready
    port: 80
  initialDelaySeconds: 2
  periodSeconds: 5
  failureThreshold: 3
```

Configuration parameters:
- `initialDelaySeconds`: Wait time before starting the first probe.
- `periodSeconds`: How often to perform the probe.
- `failureThreshold`: Number of consecutive failures before marking unhealthy.
- `successThreshold`: Number of consecutive successes required after a failure (default 1).

---

## A Closer Look at Key Configuration Options

**Deployment**
- `spec.replicas`: desired count.
- `spec.selector`: label selector that must match `template.metadata.labels`.
- `spec.strategy`: `RollingUpdate` (with `maxSurge`/`maxUnavailable`) or `Recreate`.
- `spec.template.spec.containers[]`: image, ports, env, resources, probes, volumeMounts.
- `spec.template.spec.volumes[]`: volumes used by the Pod.
- `spec.template.metadata.labels/annotations`: labels used by Services, HPAs; annotations can carry provider-specific hints.

**Service**
- `spec.type`: `ClusterIP`, `NodePort`, `LoadBalancer`, `ExternalName`.
- `spec.selector`: labels of target Pods.
- `spec.ports[]`: `port` (Service port) and `targetPort` (Pod container port).
- `sessionAffinity`, `clusterIP`, and annotations for cloud LB options (when applicable).

---

## Appendix: Handy `kubectl` Commands
```bash
# Discovery
kubectl api-resources
kubectl explain deployment.spec --recursive | less

# Introspection
kubectl get all
kubectl describe deploy/users-deployment
kubectl logs -f deploy/users-deployment -c users

# Rollouts
kubectl rollout status deploy/users-deployment
kubectl rollout history deploy/users-deployment
kubectl rollout undo deploy/users-deployment

# Label/Selector practice
kubectl get pods -L app,tier,track
kubectl get pods -l 'app=users,track=stable'
```

---