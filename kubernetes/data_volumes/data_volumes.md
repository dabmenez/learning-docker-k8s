# Managing Data Volumes with Kubernetes

---

## Introduction
Applications create and use **state** (user data, uploads, cache, intermediate results). Containers are replaceable; your data is not. In Kubernetes, we attach **volumes** to Pods so data can outlive container restarts and, with the right abstraction, outlive Pods and nodes as well.

---

## Starting Project & What We Know Already
From the previous chapter, you created a `users-deployment` and a `users-svc`. We will extend that example to:
- attach scratch storage for temporary files,
- persist data across Pod recreations,
- separate config from code via environment variables and ConfigMaps.

---

## Kubernetes & Volumes — More Than Docker Volumes

Understanding the difference between Docker and Kubernetes storage is crucial:

**Docker Volumes**: Primarily local storage managed by Docker daemon. Simple but limited to local filesystems.

**Kubernetes Volumes**: Support multiple storage backends through the Container Storage Interface (CSI):
- Local paths and node storage
- Network storage (NFS, Ceph)
- Cloud-native storage (AWS EBS, GCP Persistent Disk, Azure Disk)
- Distributed storage systems (GlusterFS, Longhorn)

Volumes in Kubernetes are mounted into Pods and automatically survive container restarts. Whether they survive **Pod** deletion depends on the volume type you choose - regular volumes are ephemeral, while Persistent Volumes provide durable storage.

---

## Kubernetes Volumes: Theory & Docker Comparison

**Kubernetes Volumes**
- Many drivers/types, from local paths to cloud disks (via CSI).
- Survive **container** restarts by design.
- Lifetime may be **tied to the Pod** (e.g., `emptyDir`) or **decoupled** (via PV/PVC).

**Docker Volumes**
- Fewer types; primarily local drivers.
- Persist until manually removed by the user/daemon.
- No cluster‑level abstraction by themselves.

---

## Creating a New Deployment & Service
For clarity, we will create a fresh demo workload.

```yaml
# k8s/deploy-web.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  labels: { app: web }
spec:
  replicas: 2
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web, tier: frontend }
    spec:
      containers:
      - name: web
        image: nginxdemos/hello:plain-text
        ports: [{ containerPort: 80 }]
---
# k8s/svc-web.yaml
apiVersion: v1
kind: Service
metadata:
  name: web-svc
spec:
  selector: { app: web }
  ports: [{ port: 80, targetPort: 80 }]
  type: ClusterIP
```

Apply:
```bash
kubectl apply -f k8s/deploy-web.yaml -f k8s/svc-web.yaml
kubectl get deploy,rs,pods,svc -l app=web
```

---

## Getting Started with Kubernetes Volumes

Volumes in Kubernetes follow a two-step process:

1. **Declare the volume** at the Pod level in `spec.template.spec.volumes[]` - this defines what storage to attach
2. **Mount the volume** in the container via `volumeMounts[]` - this defines where in the container the storage appears

Different volume **types** determine:
- The backing storage (local disk, network storage, cloud storage)
- The lifetime (temporary vs persistent)
- Portability across nodes

Common volume types: `emptyDir` (temporary), `hostPath` (node-specific), `persistentVolumeClaim` (durable storage via PV/PVC).

---

## A First Volume: the `emptyDir` type
Use it for **scratch** space (caches, temp files) that should exist as long as the **Pod** exists.

```yaml
# k8s/deploy-web-emptydir.yaml (patch of the Deployment above)
apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  template:
    spec:
      volumes:
      - name: cache
        emptyDir: {}           # tmpfs if medium: Memory
      containers:
      - name: web
        image: nginxdemos/hello:plain-text
        volumeMounts:
        - name: cache
          mountPath: /var/cache/app
```
Notes:
- Created when the Pod is scheduled onto a node; deleted when the Pod is removed.
- Survives **container** restarts but not **Pod** deletion or rescheduling to another node.

Apply the patch:
```bash
kubectl apply -f k8s/deploy-web-emptydir.yaml
```

---

## A Second Volume: the `hostPath` type
Mounts a **path from the node filesystem** into the Pod. Useful for **single‑node labs** only.

```yaml
# k8s/deploy-web-hostpath.yaml (patch)
apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  template:
    spec:
      volumes:
      - name: node-data
        hostPath:
          path: /data/web           # must exist (or set type: DirectoryOrCreate)
          type: DirectoryOrCreate
      containers:
      - name: web
        image: nginxdemos/hello:plain-text
        volumeMounts:
        - name: node-data
          mountPath: /var/data
```
Caveats:
- Ties the Pod to a particular node and complicates scheduling.
- Security‑sensitive; often **not** allowed in hardened clusters.
- Data stays on that node; if the Pod moves, the data does not follow.

Apply:
```bash
kubectl apply -f k8s/deploy-web-hostpath.yaml
```

---

## Understanding the CSI Volume Type

**CSI (Container Storage Interface)** is the standard plugin system for storage in Kubernetes that enables integration with virtually any storage backend.

**How CSI Works**:
1. Storage vendors provide CSI drivers that implement the CSI specification
2. These drivers expose storage backends as PersistentVolumes
3. Kubernetes uses these drivers to provision and mount storage dynamically

**Popular CSI Drivers**:
- **Cloud**: AWS EBS CSI, GCP PD CSI, Azure Disk CSI
- **Network**: Ceph CSI, GlusterFS CSI
- **Local**: Longhorn (for local clusters)
- **Distributed**: Rook

**Benefits**:
- **Persistent Volumes** that outlive Pod lifecycles
- **Dynamic provisioning** via **StorageClasses**: PVCs automatically create PVs on-demand
- **Abstraction**: You work with PVCs and StorageClasses; the CSI driver handles backend details

In practice, you mostly interact with **PVCs** and **StorageClasses**. The CSI driver works behind the scenes to provision, attach, and mount the actual storage.

---

## From Volumes to Persistent Volumes
Regular volumes (`emptyDir`, `hostPath`) are **Pod‑scoped**. For data that must survive Pod reschedules or be shared by multiple Pods, use:
- **PersistentVolume (PV)** — cluster resource representing real storage.
- **PersistentVolumeClaim (PVC)** — a request for storage (size, access modes, class).

A PVC binds to a matching PV (or triggers dynamic provisioning via a StorageClass). Pods then **use the PVC** as if it were a normal volume.

---

## Defining a Persistent Volume (PV) — static example
This is a **static** PV backed by a local path (fine for single‑node demos).

```yaml
# k8s/pv-local.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-web-local
spec:
  capacity:
    storage: 1Gi
  accessModes: ["ReadWriteOnce"]
  storageClassName: local-demo
  persistentVolumeReclaimPolicy: Retain
  hostPath:
    path: /data/pv-web-local
```
Apply:
```bash
kubectl apply -f k8s/pv-local.yaml
kubectl get pv
```

---

## Creating a Persistent Volume Claim (PVC)
```yaml
# k8s/pvc-web.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-web
spec:
  accessModes: ["ReadWriteOnce"]
  storageClassName: local-demo     # must match the PV class above
  resources:
    requests:
      storage: 512Mi
```
Apply and check binding:
```bash
kubectl apply -f k8s/pvc-web.yaml
kubectl get pvc,pv
```

> **Dynamic provisioning (alternative):** If your cluster has a default `StorageClass`, omit `storageClassName`. The PVC will create and bind a PV automatically via the CSI driver for that class.

---

## Using a Claim in a Pod
Patch the Deployment to mount the PVC.

```yaml
# k8s/deploy-web-pvc.yaml (patch)
apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  template:
    spec:
      volumes:
      - name: app-data
        persistentVolumeClaim:
          claimName: pvc-web
      containers:
      - name: web
        image: nginxdemos/hello:plain-text
        volumeMounts:
        - name: app-data
          mountPath: /var/app/data
```
Apply and verify:
```bash
kubectl apply -f k8s/deploy-web-pvc.yaml
kubectl get pods -l app=web
kubectl get pvc,pv
```

---

## Volumes vs Persistent Volumes (Comparison)

Understanding when to use each volume type is critical for designing resilient Kubernetes applications.

| Topic | Pod‑scoped Volumes (`emptyDir`, `hostPath`) | Persistent Volumes (PV/PVC) |
|---|---|---|
| **Lifetime** | Tied to **Pod** existence | Independent of Pod lifecycle |
| **Resilience** | Lost when Pod is deleted/rescheduled (except node files for `hostPath`) | Survives Pod reschedules; can move between Pods (if backend supports it) |
| **Scheduling** | `hostPath` pins Pod to a specific node | StorageClass/CSI chooses backing storage dynamically |
| **Use cases** | Scratch space, caches, temporary files, single‑node demos | Databases, application data, uploads, shared content, any critical data |
| **Management** | Defined inside each Pod spec | Central cluster objects (PV, PVC), reusable across Pods |
| **Portability** | Pod-specific, not portable | Portable across nodes (with appropriate backend) |
| **Performance** | Fast (local) | Depends on backend (local/network storage) |

**Decision Tree**:
- Need temporary storage? → Use `emptyDir`
- Single-node demo/testing? → Use `hostPath`
- Production with stateful data? → Use PV/PVC with appropriate StorageClass

---

## Using Environment Variables
Environment variables are part of the **Pod** and **container** specs.

```yaml
# snippet
env:
- name: APP_ENV
  value: "dev"
- name: LOG_LEVEL
  value: "info"
```

Use environment variables to parameterize your app (paths, feature flags, secrets via `Secret` refs).

---

## Environment Variables & ConfigMaps

Separate configuration from application code with **ConfigMaps**. This enables:
- Changing configuration without rebuilding images
- Using different configurations across environments (dev, staging, prod)
- Centralized configuration management
- Version control for configuration

**Creating a ConfigMap**:
```yaml
# k8s/configmap-web.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: web-config
data:
  APP_ENV: "dev"
  WELCOME_MESSAGE: "Hello from ConfigMap"
```

**Consuming ConfigMap in Deployment**:
```yaml
# Patch Deployment to consume it
apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  template:
    spec:
      containers:
      - name: web
        image: nginxdemos/hello:plain-text
        env:
        # Reference individual keys from ConfigMap
        - name: APP_ENV
          valueFrom:
            configMapKeyRef:
              name: web-config
              key: APP_ENV
        - name: WELCOME_MESSAGE
          valueFrom:
            configMapKeyRef:
              name: web-config
              key: WELCOME_MESSAGE
```

Apply:
```bash
kubectl apply -f k8s/configmap-web.yaml
kubectl rollout restart deploy/web   # Picks up updated env values
```

**Alternative: Mount ConfigMap as Volume**

For larger configuration (files, directories), mount the ConfigMap as a volume and read files from a directory:
```yaml
volumes:
  - name: config
    configMap: 
      name: web-config
volumeMounts:
  - name: config
    mountPath: /etc/config
```

**ConfigMaps vs Secrets**: Use ConfigMaps for non-sensitive data. For sensitive information (passwords, tokens, keys), use **Secrets** instead.

---

## Cleanup
```bash
kubectl delete -f k8s/deploy-web-pvc.yaml -f k8s/deploy-web-hostpath.yaml -f k8s/deploy-web-emptydir.yaml \
  -f k8s/configmap-web.yaml -f k8s/svc-web.yaml -f k8s/deploy-web.yaml \
  -f k8s/pvc-web.yaml -f k8s/pv-local.yaml
# If PV uses Retain policy, remove its data path manually on the node for full cleanup.
```

---

### Summary
- Use `emptyDir` for per‑Pod scratch space.  
- Avoid `hostPath` beyond single‑node demos.  
- Prefer **PV + PVC** with a **StorageClass** for real persistence and portability.  
- Manage configuration separately with **ConfigMaps** (and **Secrets** for sensitive data).