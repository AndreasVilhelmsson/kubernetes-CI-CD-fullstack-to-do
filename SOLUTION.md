# ✅ Solution Report - ToDo App Kubernetes Deployment

**Datum:** 2025-10-02  
**Projekt:** ToDo App - React TypeScript + .NET 9 + MongoDB  
**Miljö:** Kubernetes (Minikube) på macOS M1  
**Status:** ✅ Löst och verifierat

---

## Problem #1: Pods Startar Inte - ImagePullBackOff

### Sammanfattning av Problemet
Efter `helm install` startade inga pods. Status visade `ImagePullBackOff` för backend och frontend. MongoDB startade korrekt men applikationen var otillgänglig.

### Slutlig Lösning
```bash
# 1. Bygg Docker images lokalt
docker build -t todo-backend:latest ./app/backend
docker build -t todo-frontend:v5 ./app/frontend

# 2. Ladda images till Minikube
minikube image load todo-backend:latest
minikube image load todo-frontend:v5

# 3. Konfigurera Helm values
# helm/cloud-app/values.yaml
backend:
  image: todo-backend:latest
frontend:
  image: todo-frontend:v5

# 4. Sätt imagePullPolicy
# helm/cloud-app/templates/*-deployment.yaml
imagePullPolicy: IfNotPresent

# 5. Deploy
helm upgrade todo-app helm/cloud-app
```

### Varför Lösningen Fungerade
**Root Cause:** Minikube kör sin egen Docker daemon isolerad från host-maskinen.

**Teknisk Förklaring:**
- Docker images byggda på host finns i host's Docker daemon
- Kubernetes i Minikube använder Minikube's Docker daemon
- `minikube image load` kopierar image från host till Minikube
- `imagePullPolicy: IfNotPresent` säger åt Kubernetes att använda lokal image först

**Varför tidigare försök misslyckades:**
- `imagePullPolicy: Never` krävde att imagen redan fanns (den gjorde det inte)
- `imagePullPolicy: Always` försökte hämta från Docker Hub (imagen fanns inte där)
- Att bara bygga på host gjorde inte imagen tillgänglig i Minikube

### Rekommendation

**Förebyggande åtgärder:**

1. **Dokumentation i README:**
```markdown
## Lokal Utveckling med Minikube

### Bygg och ladda images:
```bash
# Backend
docker build -t todo-backend:latest ./app/backend
minikube image load todo-backend:latest

# Frontend
docker build -t todo-frontend:latest ./app/frontend
minikube image load todo-frontend:latest
```

2. **Automatisera med Makefile:**
```makefile
.PHONY: build-load-backend
build-load-backend:
	docker build -t todo-backend:latest ./app/backend
	minikube image load todo-backend:latest

.PHONY: build-load-frontend
build-load-frontend:
	docker build -t todo-frontend:latest ./app/frontend
	minikube image load todo-frontend:latest

.PHONY: deploy
deploy: build-load-backend build-load-frontend
	helm upgrade --install todo-app helm/cloud-app
```

3. **CI/CD Pipeline Check:**
```yaml
# .github/workflows/ci.yaml
- name: Verify images exist
  run: |
    docker images | grep todo-backend
    docker images | grep todo-frontend
```

4. **Pre-deployment Script:**
```bash
#!/bin/bash
# scripts/pre-deploy.sh

echo "Checking if images exist in Minikube..."
if ! minikube image ls | grep -q "todo-backend:latest"; then
    echo "❌ Backend image missing in Minikube"
    exit 1
fi
if ! minikube image ls | grep -q "todo-frontend:latest"; then
    echo "❌ Frontend image missing in Minikube"
    exit 1
fi
echo "✅ All images present"
```

### Lessons Learned

1. **Minikube är inte Docker Desktop**
   - Olika Docker daemons
   - Images måste explicit laddas med `minikube image load`
   - Kan inte förlita sig på att images "bara finns"

2. **imagePullPolicy är kritisk för lokala images**
   - `Always` fungerar inte för lokala images
   - `Never` kräver att imagen redan finns
   - `IfNotPresent` är bäst för lokal utveckling

3. **Verifiera innan deploy**
   - Kolla att images finns: `minikube image ls`
   - Testa image lokalt: `docker run --rm <image>`
   - Använd pre-deployment checks

---

## Problem #2: Frontend Docker Build Misslyckas

### Sammanfattning av Problemet
Docker build för frontend misslyckades med TypeScript-kompileringsfel. React och JSX kunde inte kompileras.

### Slutlig Lösning

**1. Uppdatera package.json:**
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "~5.9.3",
    "vite": "^7.1.7"
  }
}
```

**2. Uppdatera tsconfig.json:**
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

**3. Skapa vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

**4. Uppdatera src/main.tsx:**
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './App.css'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**5. Uppdatera index.html:**
```html
<script type="module" src="/src/main.tsx"></script>
```

### Varför Lösningen Fungerade

**Root Cause:** Projektet skapades som vanilla TypeScript, inte React TypeScript.

**Teknisk Förklaring:**

1. **React Dependencies:** TypeScript behöver React runtime och type definitions
2. **JSX Transform:** `"jsx": "react-jsx"` aktiverar nya JSX transform (React 17+)
3. **Vite Plugin:** `@vitejs/plugin-react` hanterar JSX transformation och HMR
4. **Entry Point:** `main.tsx` måste rendera React-appen med `createRoot`

**Varför tidigare försök misslyckades:**
- Endast lägga till types räckte inte (behövde runtime dependencies)
- Manuella TypeScript flags löste inte Vite-konfiguration
- Utan Vite plugin kunde JSX inte transformeras korrekt

### Rekommendation

**Förebyggande åtgärder:**

1. **Använd rätt template från början:**
```bash
# Skapa React TypeScript projekt
npm create vite@latest my-app -- --template react-ts
```

2. **Project Setup Checklist:**
```markdown
## React TypeScript Setup Checklist
- [ ] React & React-DOM i dependencies
- [ ] @types/react & @types/react-dom i devDependencies
- [ ] @vitejs/plugin-react installerat
- [ ] vite.config.ts med React plugin
- [ ] tsconfig.json med "jsx": "react-jsx"
- [ ] main.tsx renderar med createRoot
- [ ] index.html pekar på main.tsx
```

3. **CI/CD Build Test:**
```yaml
# .github/workflows/ci.yaml
- name: Test Frontend Build
  run: |
    cd app/frontend
    npm ci
    npm run build
    # Verifiera att dist/ innehåller filer
    test -f dist/index.html
```

4. **Pre-commit Hook:**
```bash
# .husky/pre-commit
#!/bin/sh
cd app/frontend && npm run build
```

### Lessons Learned

1. **Template Matters**
   - Vanilla TypeScript ≠ React TypeScript
   - Använd rätt Vite template från början
   - Verifiera setup innan kodning

2. **Build Pipeline är kritisk**
   - Testa build lokalt innan Docker
   - Verifiera output i dist/
   - Kolla att alla dependencies finns

3. **TypeScript + React kräver specifik config**
   - JSX transform måste aktiveras
   - Vite plugin är obligatorisk
   - Type definitions behövs för både runtime och dev

---

## Problem #3: Frontend Visar Fel Innehåll

### Sammanfattning av Problemet
Efter lyckad build och deploy visade frontend Vite's default startsida istället för ToDo-appen. Nya builds reflekterades inte i Kubernetes.

### Slutlig Lösning

**1. Använd versionstaggade images:**
```bash
# Istället för:
docker build -t todo-frontend:latest .

# Använd:
docker build -t todo-frontend:v1 .
docker build -t todo-frontend:v2 .
docker build -t todo-frontend:v3 .
```

**2. Uppdatera Helm values vid varje deploy:**
```yaml
# helm/cloud-app/values.yaml
frontend:
  image: todo-frontend:v3  # Öka version vid varje ändring
```

**3. Deployment process:**
```bash
# 1. Bygg med ny version
docker build -t todo-frontend:v4 ./app/frontend

# 2. Ladda till Minikube
minikube image load todo-frontend:v4

# 3. Uppdatera values.yaml (ändra v3 → v4)

# 4. Upgrade Helm
helm upgrade todo-app helm/cloud-app

# 5. Verifiera
kubectl get pods -l app=frontend
kubectl exec <pod> -- cat /usr/share/nginx/html/index.html
```

### Varför Lösningen Fungerade

**Root Cause:** Minikube cachar images baserat på tag. Med `latest` tag ignoreras nya versioner.

**Teknisk Förklaring:**

1. **Image Tagging:** Kubernetes identifierar images med `name:tag`
2. **Cache Behavior:** Med samma tag antar Kubernetes att imagen är samma
3. **imagePullPolicy: IfNotPresent:** Hämtar inte om tag redan finns
4. **Version Tags:** Unika tags (v1, v2, v3) tvingar Kubernetes att använda ny image

**Varför tidigare försök misslyckades:**
- `latest` tag cachades - nya builds ignorerades
- Rollout restart med samma tag använde cachad image
- Kunde inte radera image som användes av pods
- `imagePullPolicy: Always` fungerar inte för lokala images

### Rekommendation

**Förebyggande åtgärder:**

1. **Semantic Versioning:**
```bash
# Använd git commit hash
VERSION=$(git rev-parse --short HEAD)
docker build -t todo-frontend:$VERSION .

# Eller timestamp
VERSION=$(date +%Y%m%d-%H%M%S)
docker build -t todo-frontend:$VERSION .
```

2. **Automatisera versioning i Makefile:**
```makefile
VERSION ?= $(shell git rev-parse --short HEAD)

.PHONY: build-frontend
build-frontend:
	docker build -t todo-frontend:$(VERSION) ./app/frontend
	docker tag todo-frontend:$(VERSION) todo-frontend:latest

.PHONY: deploy-frontend
deploy-frontend: build-frontend
	minikube image load todo-frontend:$(VERSION)
	helm upgrade todo-app helm/cloud-app \
		--set frontend.image=todo-frontend:$(VERSION)
```

3. **CI/CD Pipeline:**
```yaml
# .github/workflows/ci.yaml
env:
  VERSION: ${{ github.sha }}

- name: Build and tag
  run: |
    docker build -t todo-frontend:$VERSION ./app/frontend
    docker build -t todo-frontend:latest ./app/frontend
```

4. **Image Verification Script:**
```bash
#!/bin/bash
# scripts/verify-image.sh

IMAGE=$1
VERSION=$2

echo "Verifying image content..."
EXPECTED_HASH=$(docker run --rm $IMAGE:$VERSION \
  sh -c "cat /usr/share/nginx/html/assets/*.js | md5sum")

ACTUAL_HASH=$(kubectl exec deployment/todo-app-frontend -- \
  sh -c "cat /usr/share/nginx/html/assets/*.js | md5sum")

if [ "$EXPECTED_HASH" = "$ACTUAL_HASH" ]; then
  echo "✅ Image verified"
else
  echo "❌ Image mismatch!"
  exit 1
fi
```

### Lessons Learned

1. **Never use `latest` for local development**
   - Caching gör det omöjligt att spåra versioner
   - Använd alltid unika tags
   - Git hash eller timestamp är bra alternativ

2. **Verifiera deployment**
   - Kolla inte bara pod status
   - Verifiera faktiskt innehåll i pod
   - Använd `kubectl exec` för att inspektera filer

3. **Image lifecycle management**
   - Förstå hur Kubernetes cachar images
   - `imagePullPolicy` påverkar beteende
   - Lokala images kräver speciell hantering

---

## Problem #4: CORS Error & Backend Connectivity

### Sammanfattning av Problemet
Frontend kunde inte nå backend API. Först CORS-fel, sedan DNS-fel, slutligen connection refused.

### Slutlig Lösning

**För lokal utveckling med Minikube:**

```bash
# 1. Konfigurera frontend för localhost
# app/frontend/.env
VITE_API_URL=http://localhost:8080

# 2. Bygg och deploya frontend
npm run build
docker build -t todo-frontend:v5 ./app/frontend
minikube image load todo-frontend:v5
helm upgrade todo-app helm/cloud-app

# 3. Starta port-forwards
kubectl port-forward svc/backend 8080:80 &
kubectl port-forward svc/frontend 3000:80 &

# 4. Öppna app
open http://localhost:3000
```

**För production (Ingress):**

```yaml
# helm/cloud-app/templates/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: todo-app-ingress
spec:
  rules:
  - host: todo.local
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

```bash
# app/frontend/.env
VITE_API_URL=/api  # Relativ URL via Ingress
```

### Varför Lösningen Fungerade

**Root Cause:** Frontend körs i webbläsare (utanför cluster) och kan inte nå Kubernetes service-namn.

**Teknisk Förklaring:**

1. **Browser Context:** JavaScript i webbläsare körs på klientens maskin, inte i cluster
2. **DNS Resolution:** Kubernetes DNS (backend, frontend) fungerar endast inom cluster
3. **Port-forward:** Skapar tunnel från localhost till Kubernetes service
4. **Build-time Variables:** Vite bygger in `VITE_API_URL` vid build, inte runtime

**Varför tidigare försök misslyckades:**
- `http://backend` - DNS fungerar inte från webbläsare
- `http://192.168.49.2:30080` - NodePort utan tunnel fungerar inte
- CORS var inte problemet - backend nåddes aldrig

### Rekommendation

**Förebyggande åtgärder:**

1. **Environment-specifik konfiguration:**
```bash
# app/frontend/.env.development
VITE_API_URL=http://localhost:8080

# app/frontend/.env.production
VITE_API_URL=/api
```

```json
// package.json
{
  "scripts": {
    "dev": "vite --mode development",
    "build": "vite build --mode production",
    "build:local": "vite build --mode development"
  }
}
```

2. **Port-forward Manager Script:**
```bash
#!/bin/bash
# scripts/start-dev.sh

echo "Starting port-forwards..."

# Kill existing port-forwards
pkill -f "port-forward"

# Start new port-forwards
kubectl port-forward svc/backend 8080:80 > /tmp/backend-pf.log 2>&1 &
kubectl port-forward svc/frontend 3000:80 > /tmp/frontend-pf.log 2>&1 &

sleep 2

# Verify
if curl -s http://localhost:8080/api/todos > /dev/null; then
  echo "✅ Backend ready at http://localhost:8080"
else
  echo "❌ Backend not responding"
fi

if curl -s http://localhost:3000 > /dev/null; then
  echo "✅ Frontend ready at http://localhost:3000"
else
  echo "❌ Frontend not responding"
fi
```

3. **Health Check Endpoint:**
```csharp
// app/backend/Program.cs
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));
```

4. **Ingress för Production:**
```yaml
# helm/cloud-app/values.yaml
ingress:
  enabled: true
  host: todo.mycompany.com
  tls:
    enabled: true
    secretName: todo-tls
```

### Lessons Learned

1. **Kubernetes networking är komplex**
   - Service-namn fungerar endast inom cluster
   - Webbläsare är utanför cluster
   - Port-forward eller Ingress krävs för extern access

2. **Environment variables i Vite**
   - Byggs in vid build-time, inte runtime
   - Olika .env filer för olika miljöer
   - Måste rebuilda för att ändra API URL

3. **Development vs Production**
   - Port-forward för lokal utveckling
   - Ingress för production
   - Olika konfiguration för olika miljöer

---

## Problem #5 & #6: Port-forward Management

### Sammanfattning av Problemet
Port-forward processer dog eller startades aldrig, vilket ledde till `ERR_CONNECTION_REFUSED`.

### Slutlig Lösning

**Automatiserad port-forward management:**

```bash
#!/bin/bash
# scripts/dev-env.sh

set -e

echo "🚀 Starting development environment..."

# Cleanup
cleanup() {
    echo "🧹 Cleaning up..."
    pkill -f "port-forward" || true
}
trap cleanup EXIT

# Kill existing port-forwards
pkill -f "port-forward" || true
sleep 1

# Start backend port-forward
echo "Starting backend port-forward..."
kubectl port-forward svc/backend 8080:80 > /tmp/backend-pf.log 2>&1 &
BACKEND_PID=$!

# Start frontend port-forward
echo "Starting frontend port-forward..."
kubectl port-forward svc/frontend 3000:80 > /tmp/frontend-pf.log 2>&1 &
FRONTEND_PID=$!

# Wait for services
sleep 3

# Verify
echo "Verifying services..."
if curl -sf http://localhost:8080/api/todos > /dev/null; then
    echo "✅ Backend: http://localhost:8080"
else
    echo "❌ Backend failed"
    exit 1
fi

if curl -sf http://localhost:3000 > /dev/null; then
    echo "✅ Frontend: http://localhost:3000"
else
    echo "❌ Frontend failed"
    exit 1
fi

echo ""
echo "🎉 Development environment ready!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8080/api/todos"
echo ""
echo "Press Ctrl+C to stop..."

# Keep script running
wait
```

### Varför Lösningen Fungerade

**Root Cause:** Port-forward processer är fragila och kan dö utan varning.

**Teknisk Förklaring:**

1. **Process Management:** Script håller koll på PIDs och kan stänga ner korrekt
2. **Trap EXIT:** Cleanup körs automatiskt vid Ctrl+C eller fel
3. **Verification:** Testar att services faktiskt svarar
4. **Logging:** Sparar output för debugging

### Rekommendation

**Förebyggande åtgärder:**

1. **Använd Process Manager:**
```bash
# Installera kubefwd
brew install txn2/tap/kubefwd

# Starta alla services
sudo kubefwd svc -n default
```

2. **Docker Compose för lokal dev:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./app/backend
    ports:
      - "8080:8080"
    environment:
      - Mongo__ConnectionString=mongodb://mongodb:27017
  
  frontend:
    build: ./app/frontend
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=http://localhost:8080
  
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
```

3. **Monitoring Script:**
```bash
#!/bin/bash
# scripts/monitor-pf.sh

while true; do
    if ! curl -sf http://localhost:8080/health > /dev/null; then
        echo "❌ Backend down, restarting..."
        pkill -f "port-forward svc/backend"
        kubectl port-forward svc/backend 8080:80 &
    fi
    sleep 10
done
```

### Lessons Learned

1. **Port-forward är inte production-ready**
   - Endast för lokal utveckling
   - Kan dö utan varning
   - Behöver monitoring och auto-restart

2. **Automation är nyckeln**
   - Script för att starta dev environment
   - Cleanup vid exit
   - Verification att allt fungerar

3. **Alternativ finns**
   - kubefwd för automatisk port-forwarding
   - Docker Compose för lokal utveckling
   - Minikube tunnel för LoadBalancer support

---

## Sammanfattning av Alla Lösningar

### ✅ Fungerande Deployment Process

```bash
# 1. Bygg images med versionstaggar
VERSION=$(git rev-parse --short HEAD)
docker build -t todo-backend:$VERSION ./app/backend
docker build -t todo-frontend:$VERSION ./app/frontend

# 2. Ladda till Minikube
minikube image load todo-backend:$VERSION
minikube image load todo-frontend:$VERSION

# 3. Uppdatera Helm values
helm upgrade todo-app helm/cloud-app \
  --set backend.image=todo-backend:$VERSION \
  --set frontend.image=todo-frontend:$VERSION

# 4. Starta dev environment
./scripts/dev-env.sh

# 5. Verifiera
./verify.sh
```

### 🎯 Key Takeaways

1. **Image Management**
   - Använd versionstaggade images
   - Ladda explicit till Minikube
   - Verifiera innehåll innan deploy

2. **Networking**
   - Port-forward för lokal utveckling
   - Ingress för production
   - Förstå skillnaden mellan cluster och browser context

3. **Configuration**
   - Environment-specifika .env filer
   - Build-time vs runtime variables
   - Automation för consistency

4. **Debugging**
   - Verifiera varje steg
   - Inspektera pod innehåll
   - Använd logs och describe

5. **Automation**
   - Scripts för repetitiva tasks
   - Makefile för build pipeline
   - CI/CD för kvalitetssäkring

---

## Related Files
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Detaljerad fail report
- [verify.sh](./verify.sh) - Verifieringsskript
- [README.md](./README.md) - Projektdokumentation
