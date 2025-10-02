# ToDo App - Kubernetes Demo

En fullstack ToDo-applikation med React TypeScript frontend, .NET C# backend och MongoDB, deployad på Kubernetes med Helm och ArgoCD.

## 🏗️ Arkitektur

- **Frontend**: React + TypeScript + Vite
- **Backend**: .NET 9.0 Minimal API
- **Databas**: MongoDB 7
- **Orchestration**: Kubernetes
- **Package Manager**: Helm
- **GitOps**: ArgoCD
- **CI/CD**: GitHub Actions

## 📁 Projektstruktur

```
projektAppdemo/
├── app/
│   ├── backend/          # .NET API
│   └── frontend/         # React app
├── k8s/                  # Kubernetes manifests
│   ├── backend/
│   ├── frontend/
│   └── mongodb/
├── helm/                 # Helm chart
│   └── cloud-app/
├── argocd/              # ArgoCD config
└── .github/workflows/   # CI/CD pipeline
```

## 🚀 Lokal utveckling

### Backend
```bash
cd app/backend
dotnet run
# API: http://localhost:5000
```

### Frontend
```bash
cd app/frontend
npm install
npm run dev
# UI: http://localhost:5173
```

### MongoDB (Docker)
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7
```

## ☸️ Kubernetes Deployment

### 1. Med kubectl (Manuellt)
```bash
# Deploy MongoDB
kubectl apply -f k8s/mongodb/

# Deploy Backend
kubectl apply -f k8s/backend/

# Deploy Frontend
kubectl apply -f k8s/frontend/

# Kontrollera status
kubectl get pods
kubectl get services
```

### 2. Med Helm
```bash
# Installera chart
helm install todo-app helm/cloud-app

# Uppgradera
helm upgrade todo-app helm/cloud-app

# Avinstallera
helm uninstall todo-app

# Testa template
helm template todo-app helm/cloud-app
```

### 3. Med ArgoCD (GitOps)
```bash
# Installera ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Skapa application
kubectl apply -f argocd/app.yaml

# Få admin lösenord
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Port-forward till UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
# UI: https://localhost:8080
```

## 🔧 Konfiguration

### Backend Environment Variables
- `Mongo__ConnectionString`: MongoDB connection string
- `Mongo__Database`: Database name
- `Mongo__Collection`: Collection name

### Frontend Environment Variables
- `VITE_API_URL`: Backend API URL

## 📝 API Endpoints

- `GET /api/todos` - Hämta alla todos
- `GET /api/todos/{id}` - Hämta en todo
- `POST /api/todos` - Skapa ny todo
- `PUT /api/todos/{id}` - Uppdatera todo
- `DELETE /api/todos/{id}` - Ta bort todo

## 🐳 Docker Images

Bygg images lokalt:
```bash
# Backend
cd app/backend
docker build -t todo-backend:latest .

# Frontend
cd app/frontend
docker build -t todo-frontend:latest .
```

## 📚 Tutorials som används

1. [Kubernetes MongoDB Demo](https://cloud-developer.educ8.se/clo/4.-run-cloud-applications/3.-kubernetes/demo-kubernetes-2.-mongodb/index.html)
2. [Kubernetes Helm Demo](https://cloud-developer.educ8.se/clo/4.-run-cloud-applications/3.-kubernetes/demo-kubernetes-3.-helm/index.html)
3. [Kubernetes ArgoCD Demo](https://cloud-developer.educ8.se/clo/4.-run-cloud-applications/3.-kubernetes/demo-kubernetes-5.-argocd/index.html)

## 🎯 Lärandemål

- ✅ Kubernetes Deployments, Services, ConfigMaps
- ✅ MongoDB i Kubernetes
- ✅ Helm charts och templating
- ✅ ArgoCD GitOps workflow
- ✅ CI/CD med GitHub Actions
- ✅ Container orchestration
- ✅ Microservices arkitektur

## 🔍 Felsökning

```bash
# Loggar
kubectl logs -f deployment/backend
kubectl logs -f deployment/frontend
kubectl logs -f deployment/mongodb

# Beskrivning
kubectl describe pod <pod-name>

# Exec in i pod
kubectl exec -it <pod-name> -- /bin/sh

# Port-forward för test
kubectl port-forward svc/backend 8080:80
kubectl port-forward svc/frontend 3000:80
kubectl port-forward svc/mongodb 27017:27017
```

## 📦 Nästa steg

- [ ] Lägg till Persistent Volumes för MongoDB
- [ ] Implementera Ingress för routing
- [ ] Lägg till monitoring (Prometheus/Grafana)
- [ ] Implementera autoscaling (HPA)
- [ ] Lägg till secrets management
- [ ] Implementera health checks
- [ ] Lägg till integration tests
