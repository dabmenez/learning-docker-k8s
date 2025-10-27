# Deploying on AWS with Amazon EKS (Elastic Kubernetes Service)

This chapter summarizes how to take a Kubernetes app and deploy it on AWS using **EKS**. It is written as a concise, practical guide that you can keep in your repo.


---

## Deployment Options: Self-Managed vs Managed Kubernetes

Understanding your deployment options is crucial for making the right decision:

### Option A: Self-Managed Kubernetes (Roll Your Own)

**What you need to do:**
- Provision and configure virtual machines or bare metal servers
- Install and configure Kubernetes control plane components (API Server, etcd, Controller Manager, Scheduler)
- Set up networking (CNI plugin configuration)
- Install and manage worker nodes
- Handle cluster upgrades and patches manually
- Monitor and maintain cluster health

**Where it's used:** On-premises data centers, bare metal installations, or VMs in clouds without managed Kubernetes

**Pros:** Full control, no per-cluster costs
**Cons:** Significant operational overhead, requires Kubernetes expertise, time-consuming

### Option B: Managed Kubernetes (Recommended)

**What the provider does:**
- Hosts and operates the control plane (API Server, etcd, Scheduler, Controllers)
- Handles control plane patching and updates
- Provides integration with cloud services (load balancers, storage)

**What you do:**
- Define the cluster architecture (region, VPC/subnets, node groups)
- Configure worker nodes
- Deploy your applications

**Examples:** **AWS EKS**, **Google GKE**, **Azure AKS**

**High-level steps with managed Kubernetes:**

1. **Create cluster** – Control plane and VPC networking configuration
2. **Add worker nodes** – Managed node groups, Fargate, or self-managed nodes
3. **Connect kubectl** – Update kubeconfig to point to your cluster
4. **Apply manifests** – Deploy your Deployments, Services, ConfigMaps, etc.
5. **Install add-ons** – Optional: Ingress Controller, storage CSI drivers, metrics-server, autoscalers

**Pros:** Reduced operational overhead, automatic upgrades, cloud integrations
**Cons:** Control plane costs, some control limitations

**Decision:** For most teams, managed Kubernetes (like EKS) is the recommended path.

---

## EKS vs ECS: When to Choose What

Both services run containers in AWS, but they differ significantly:

**AWS EKS (Elastic Kubernetes Service)**
- Uses standard **Kubernetes API** (upstream compatible)
- Standard kubectl commands and Kubernetes manifests work
- Portable to other Kubernetes platforms (GKE, AKS, on-prem)
- Rich ecosystem of tools (Helm, Kustomize, operators)
- Industry standard for container orchestration

**AWS ECS (Elastic Container Service)**
- Uses **AWS-native** container orchestration
- Simpler API and concepts (tasks, services, clusters)
- Tightly integrated with AWS services
- No kubectl - uses AWS CLI/Console
- Locked into AWS ecosystem

**When to Choose EKS:**
- You want to learn/use standard Kubernetes
- You need portability across clouds
- You want to leverage Kubernetes ecosystem tools
- You're building multi-cloud strategies
- Your team has Kubernetes experience

**When to Choose ECS:**
- You're all-in on AWS and prefer simplicity
- You want faster startup and simpler operations
- You don't need Kubernetes features or portability
- You want AWS-only integrations

**Bottom Line:** If you're learning Kubernetes and want to build transferable skills, choose **EKS**. It lets you reuse your local Kubernetes experience directly in production.

---

## Prerequisites & starting project

Have your app packaged in containers and Kubernetes manifests ready (Deployments, Services, ConfigMaps, etc.). Locally, install:

- `aws` CLI (configured with an IAM user/role that can manage EKS).
- `kubectl`
- One of:
  - `eksctl` (quickest way to create EKS), or
  - AWS Console + CloudFormation/Terraform.
- (Optional) `helm` for installing add‑ons.

> Tip: keep your cluster & IaC in a `infra/` folder next to your app manifests for easy reproducibility.

---

## EKS Pricing: What to Expect

EKS pricing consists of several components:

**Control Plane Costs:**
- Fixed cost: ~$0.10 per hour per cluster ($73/month per cluster)
- This covers the managed control plane (API Server, etcd, controllers)
- Price is per cluster regardless of node count

**Worker Node Costs:**
- EC2 instance costs based on instance type (t3.small: ~$15/month, t3.medium: ~$30/month)
- OR Fargate: pay per vCPU and GB used (serverless, no EC2 to manage)
- Node groups determine capacity (min/max/desired instances)

**Networking Costs:**
- Load Balancers: ~$20-30/month per ELB/NLB created
- NAT Gateway: ~$32/month + data transfer ($0.045/GB)
- Data transfer: $0.01-0.09 per GB depending on source/dest

**Storage Costs:**
- EBS volumes: ~$0.10 per GB/month
- EFS: ~$0.30 per GB/month (more expensive but shared and scalable)

**Cost Optimization Tips:**
- Use small instance types in development (t3.small, t3.medium)
- Single NAT gateway per environment (or none if acceptable)
- Use Spot Instances for non-critical workloads (up to 90% savings)
- Delete clusters when not in use
- Consider Fargate for low-traffic or bursty workloads
- Use EFS sparingly (EBS is cheaper for single-Pod scenarios)

**Estimated Monthly Cost:**
- Development cluster: $100-200/month (1-2 nodes, minimal storage)
- Production cluster: $500-2000/month (depending on scale and traffic)

---

## Create the cluster

### Option A — `eksctl` (fast path)

```bash
# 1) Create cluster + managed node group (adjust region, node type/size)
eksctl create cluster \
  --name demo-cluster \
  --region us-east-1 \
  --nodes 2 --nodes-min 2 --nodes-max 4 \
  --node-type t3.small

# 2) Update kubeconfig automatically (eksctl usually does this)
aws eks update-kubeconfig --name demo-cluster --region us-east-1

# 3) Verify access
kubectl get nodes
```

### Option B — AWS Console / IaC
- Create an **EKS cluster** (control plane) in a VPC with public/private subnets.
- Add a **managed node group** (or Fargate profile).
- Download/update your kubeconfig, then `kubectl get nodes`.

---

## Apply your Kubernetes config

Deploy your application the same way you did locally:

```bash
kubectl apply -f k8s/ # folder with Deployments, Services, ConfigMaps...
kubectl get pods -n your-namespace
kubectl get svc  -n your-namespace
```

For public access you typically use:
- `Service` of type `LoadBalancer` (creates an AWS ELB) **or**
- `Ingress` (recommended) + an Ingress Controller (e.g., AWS Load Balancer Controller) for path/host routing and TLS.

**Install AWS Load Balancer Controller (Helm example)**

```bash
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Create IAM OIDC provider & IAM role (see AWS docs or IaC) then:
helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=demo-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

Then define an `Ingress` resource that routes to your Services.

---

## Storage on EKS: EFS with the CSI Driver

### Why EFS (Elastic File System)?

**EFS Characteristics:**
- **Shared storage** across multiple Pods and nodes
- **Regional** - accessible across multiple Availability Zones
- **Network-based** file system (NFS protocol)
- **Durable** - survives Pod and node replacements
- **Scalable** - grows and shrinks automatically

**Perfect for:**
- Sharing files between multiple Pods (e.g., content management systems)
- Applications that need POSIX-compliant file system semantics
- Content that needs to be accessible from multiple replicas
- User uploads, logs, temporary files shared across instances

**When NOT to use EFS:**
- Single-Pod databases (use EBS instead - faster and cheaper)
- High-performance workloads requiring low latency
- Large databases (use managed services like RDS)

**EBS vs EFS Comparison:**
- **EBS**: Block storage, attached to single node, ReadWriteOnce
- **EFS**: File storage, mounted to multiple nodes, ReadWriteMany

### Installing the EFS CSI Driver

The CSI driver enables Kubernetes to provision and mount EFS volumes automatically.

**Step 1: Install via Helm**

```bash
helm repo add aws-efs-csi-driver https://kubernetes-sigs.github.io/aws-efs-csi-driver/
helm repo update
helm upgrade --install aws-efs-csi-driver aws-efs-csi-driver/aws-efs-csi-driver \
  -n kube-system
```

**Step 2: Create EFS File System in AWS**

Before using the CSI driver, you need an EFS file system:
1. Go to AWS Console → EFS → Create file system
2. Choose your VPC and select subnets (one per AZ)
3. Note the **File System ID** (format: `fs-xxxxxxxxx`)
4. Ensure mount targets are created in each subnet

**Step 3: Configure Network Access**

EFS mount targets need security groups that allow NFS traffic (port 2049) from your EKS nodes.

### StorageClass (dynamic provisioning)

```yaml
# storageclass-efs.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: efs-sc
provisioner: efs.csi.aws.com
parameters:
  provisioningMode: efs-ap
  fileSystemId: fs-1234567890abcdef    # <-- your EFS FS ID
  directoryPerms: "750"
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
```

Apply:
```bash
kubectl apply -f storageclass-efs.yaml
```

### PersistentVolumeClaim (PVC) — dynamic PV

```yaml
# pvc-efs.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-efs
spec:
  accessModes: ["ReadWriteMany"]
  storageClassName: efs-sc
  resources:
    requests:
      storage: 5Gi
```

Apply:
```bash
kubectl apply -f pvc-efs.yaml
```

### Use the claim in a Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-with-efs
spec:
  replicas: 2
  selector:
    matchLabels: { app: app-with-efs }
  template:
    metadata:
      labels: { app: app-with-efs }
    spec:
      containers:
        - name: web
          image: nginx:1.25
          volumeMounts:
            - name: app-data
              mountPath: /usr/share/nginx/html/uploads
      volumes:
        - name: app-data
          persistentVolumeClaim:
            claimName: data-efs
```

This creates (on demand) an EFS **Access Point** + a backing **PersistentVolume**, and your pods mount it at `/usr/share/nginx/html/uploads`.

---

## Putting it all together (checklist)

1. **Create** EKS cluster + node group (eksctl/Console/IaC).
2. **Connect** `kubectl` (`aws eks update-kubeconfig`).
3. **Install add‑ons** (Ingress controller, EFS CSI driver, metrics-server…).
4. **Create** EFS FS + mount targets; install `StorageClass` for EFS.
5. **Deploy** your app manifests.
6. **Expose** publicly via `Ingress` or `Service: LoadBalancer`.
7. **Add storage** using PVCs that bind to EFS (or EBS for single‑node disks).
8. **Verify**: `kubectl get pods,svc,ingress,pvc,pv -A`.
9. **Observe**: logs, events (`kubectl logs`, `kubectl describe`), LB DNS.
10. **Cleanup** when done to avoid charges (delete Ingress/LB, PVC/PV/EFS if appropriate, node groups, cluster).

---

## Troubleshooting Tips

Common issues and how to resolve them:

**Pods Stuck in Pending State**
```bash
# Check why Pods aren't scheduling
kubectl describe pod <pod-name> -n <namespace>

# Common causes:
# - Insufficient resources on nodes (CPU/memory)
# - No nodes in the node group
# - Node affinity/selector issues
# - PVC not bound (for Pods with storage)
```
**Solution:** Scale up the node group or check resource requests/limits

**Service Not Reachable**
```bash
# Check if Service has endpoints
kubectl get endpoints <service-name>

# Verify LoadBalancer status
kubectl get svc -o wide

# Common causes:
# - LoadBalancer still provisioning (can take 5-10 minutes)
# - Security group blocking traffic
# - No Pods matching the Service selector
```
**Solution:** Check security groups, wait for LB provisioning, verify Pod labels match Service selector

**PVC Stuck in Pending**
```bash
# Check PVC status
kubectl get pvc
kubectl describe pvc <pvc-name>

# Common causes:
# - StorageClass not installed
# - Invalid EFS File System ID
# - EFS mount targets not configured
# - Network connectivity issues
```
**Solution:** Verify EFS CSI driver is running, check File System ID in StorageClass

**Ingress Returns 404**
```bash
# Check Ingress status
kubectl get ingress
kubectl describe ingress <ingress-name>

# Verify Ingress Controller is running
kubectl get pods -n kube-system | grep ingress

# Common causes:
# - Ingress Controller not installed
# - Wrong Ingress class annotation
# - Path/Service mismatch
# - Service selector doesn't match Pod labels
```
**Solution:** Install Ingress Controller, verify annotations and routing rules

**Pods CrashLoopBackOff**
```bash
# Check container logs
kubectl logs <pod-name>

# Check events
kubectl describe pod <pod-name>

# Common causes:
# - Application errors
# - Wrong environment variables
# - Database connection failures
# - Missing dependencies
```
**Solution:** Debug application logs and verify configuration

---

## Summary: What You Now Know

By working through this chapter, you've learned:

- The difference between **EKS** and **ECS** and why EKS keeps you in the Kubernetes ecosystem
- Concrete steps to stand up an EKS cluster using `eksctl` or AWS Console
- How to deploy your existing Kubernetes manifests to EKS (they work without modification!)
- How to add **durable, shared storage** with **EFS** using the **CSI** driver (StorageClass → PVC → volumeMounts)
- The importance of IAM roles and security groups in EKS
- How AWS Load Balancer Controller enables Ingress on EKS

**Key Takeaway:** What works locally (Kind/Minikube) works on EKS. The same Kubernetes manifests, the same kubectl commands. The only differences are cloud integrations (Load Balancers, EFS, etc.).

---

## Important Security Note

The YAML files in this chapter contain **hardcoded credentials** (MongoDB connection strings) for demonstration purposes. 

**In production, ALWAYS use Kubernetes Secrets:**

```yaml
#  DON'T DO THIS IN PRODUCTION:
env:
  - name: MONGODB_CONNECTION_URI
    value: 'mongodb+srv://user:password@...'

# DO THIS INSTEAD:
env:
  - name: MONGODB_CONNECTION_URI
    valueFrom:
      secretKeyRef:
        name: mongodb-secret
        key: connection-uri
```

Create the Secret:
```bash
kubectl create secret generic mongodb-secret \
  --from-literal=connection-uri='mongodb+srv://...'
```

Keep this file as a reference when you spin up new EKS environments.