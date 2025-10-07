# 🚀 Snabbstart - Starta projektet

## Starta allt (tar ~1 minut)

```bash
# 1. Starta Docker Desktop (GUI)
# Minikube körs som en container i Docker

# 2. Kolla att minikube-containern körs:
docker ps | grep minikube
# Du ska se: gcr.io/k8s-minikube/kicbase:v0.0.48

# 3. Om containern inte körs, starta minikube:
minikube start

# 4. Vänta tills klustret är redo
kubectl get nodes
# NAME       STATUS   ROLE           AGE   VERSION
# minikube   Ready    control-plane  1m    v1.28.3

# 5. Kolla att dina pods körs
kubectl get pods
# NAME                        READY   STATUS    RESTARTS   AGE
# backend-xxx                 1/1     Running   0          5m
# frontend-xxx                1/1     Running   0          5m
# mongodb-xxx                 1/1     Running   0          5m

# 6. Öppna applikationen
kubectl port-forward svc/frontend 3000:80
# Öppna: http://localhost:3000
```

## Om något inte fungerar

```bash
# Kolla status
kubectl get all

# Kolla logs
kubectl logs -f deployment/backend
kubectl logs -f deployment/frontend
kubectl logs -f deployment/mongodb

# Starta om en deployment
kubectl rollout restart deployment/backend

# Om inget fungerar, re-deploy:
helm upgrade todo-app helm/cloud-app
# eller
kubectl apply -f k8s/
```

## Med ArgoCD

```bash
# 1. Starta Docker Desktop (GUI)
# Minikube startar automatiskt om den var igång innan

# 2. Verifiera att minikube körs:
minikube status

# 3. Kolla ArgoCD status
kubectl get pods -n argocd

# 4. Öppna ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Öppna: https://localhost:8080

# 5. ArgoCD synkar automatiskt från Git
# Allt borde vara grönt och "Synced"
```

## Snabba kommandon

```bash
# Se allt
kubectl get all

# Följ logs
kubectl logs -f deployment/backend

# Skala upp/ner
kubectl scale deployment/backend --replicas=2

# Starta om
kubectl rollout restart deployment/backend

# Radera allt (om du vill börja om)
helm uninstall todo-app
# eller
kubectl delete -f k8s/
```

## 💡 Tips

- **Minikube körs i Docker** - du ser en container `gcr.io/k8s-minikube/kicbase` i Docker Desktop
- **Kubernetes startar automatiskt dina pods** - du behöver inte köra `docker run` manuellt
- **Om en pod kraschar** - Kubernetes startar om den automatiskt
- **Om du stänger datorn** - när Docker Desktop startar igen, startar minikube automatiskt
- **ArgoCD** - håller allt synkat med Git automatiskt

## 🔍 Förstå arkitekturen

```
Din Mac
  └── Docker Desktop
       └── Minikube Container (Kubernetes kluster)
            ├── Backend Pod
            ├── Frontend Pod
            └── MongoDB Pod
```

**Två lager:**
1. **Docker-lager**: Minikube-containern (synlig i Docker Desktop)
2. **Kubernetes-lager**: Dina pods (inne i minikube)

```bash
# Se Docker-lagret:
docker ps | grep minikube

# Se Kubernetes-lagret:
kubectl get pods
```

## ⚠️ Vanliga problem

**Problem:** Pods är i `Pending` eller `CrashLoopBackOff`
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

**Problem:** Kan inte nå frontend
```bash
# Kolla att service finns
kubectl get svc frontend

# Port-forward direkt till pod
kubectl port-forward deployment/frontend 3000:80
```

**Problem:** Backend kan inte nå MongoDB
```bash
# Kolla att MongoDB körs
kubectl get pods | grep mongodb

# Kolla connection string i backend
kubectl describe deployment backend | grep -A 5 "Environment"
```
