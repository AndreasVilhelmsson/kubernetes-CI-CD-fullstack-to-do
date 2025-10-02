# 🔥 Fail Report - ToDo App Kubernetes Deployment

**Datum:** 2025-10-02  
**Projekt:** ToDo App - React TypeScript + .NET 9 + MongoDB  
**Miljö:** Kubernetes (Minikube) på macOS M1  
**Status:** ✅ Löst efter 6 huvudproblem

---

## Problem #1: Pods Startar Inte - ImagePullBackOff

### Problemidentifiering
Efter `helm install todo-app helm/cloud-app` startade inga pods. Status visade `ImagePullBackOff` för både backend och frontend.

### Symptom
```bash
$ kubectl get pods
NAME                                 READY   STATUS             RESTARTS   AGE
todo-app-backend-85f9c87f6c-bdtgh    0/1     ImagePullBackOff   0          52s
todo-app-backend-85f9c87f6c-vg5vd    0/1     ImagePullBackOff   0          52s
todo-app-frontend-78697cc6f7-c6bpz   0/1     ImagePullBackOff   0          52s
todo-app-frontend-78697cc6f7-q4dbn   0/1     ImagePullBackOff   0          52s
todo-app-mongodb-95f9c48d8-rw7gr     1/1     Running            0          52s
```

```bash
$ kubectl describe pod todo-app-backend-85f9c87f6c-bdtgh
Events:
  Warning  Failed     Failed to pull image "your-registry/todo-backend:latest": 
           Error response from daemon: pull access denied for todo-backend
```

### Hypoteser & Misslyckade Försök

**Försök 1: Ändra imagePullPolicy till Never**
```yaml
imagePullPolicy: Never
```
**Resultat:** ❌ Misslyckades  
**Fel:** `ErrImageNeverPull - Container image "todo-backend:latest" is not present with pull policy of Never`  
**Root Cause:** Imagen fanns inte i Minikube's Docker daemon, endast på host

**Försök 2: Ändra imagePullPolicy till IfNotPresent**
```yaml
imagePullPolicy: IfNotPresent
```
**Resultat:** ❌ Misslyckades  
**Fel:** `Failed to pull image "todo-backend:latest": repository does not exist`  
**Root Cause:** Kubernetes försökte hämta från Docker Hub istället för lokal image

**Försök 3: Använda Docker Desktop Kubernetes**
**Åtgärd:** Försökte byta från Minikube till Docker Desktop's inbyggda Kubernetes  
**Resultat:** ❌ Misslyckades  
**Root Cause:** Minikube var redan konfigurerat, konflikt mellan contexts

### Slutsats - Återvändsgränder
- ❌ `imagePullPolicy: Never` fungerar inte om imagen inte finns i cluster
- ❌ Att bygga images på host gör dem inte automatiskt tillgängliga i Minikube
- ❌ Docker Desktop Kubernetes är inte samma som Minikube's Docker daemon

### Faktisk Orsak
Minikube kör sin egen Docker daemon isolerad från host. Images måste explicit laddas in med `minikube image load`.

---

## Problem #2: Frontend Docker Build Misslyckas

### Problemidentifiering
När vi försökte bygga frontend Docker image fick vi TypeScript-kompileringsfel.

### Symptom
```bash
$ docker build -t todo-frontend:latest ./app/frontend

#14 0.726 src/App.tsx(1,37): error TS2307: Cannot find module 'react' or its 
            corresponding type declarations.
#14 0.726 src/App.tsx(51,5): error TS17004: Cannot use JSX unless the '--jsx' 
            flag is provided.
#14 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 2
```

### Hypoteser & Misslyckade Försök

**Försök 1: Installera React lokalt och bygga om**
```bash
cd app/frontend
npm install react react-dom
docker build -t todo-frontend:latest .
```
**Resultat:** ❌ Misslyckades  
**Fel:** Samma TypeScript-fel  
**Root Cause:** `package.json` i Docker imagen hade inte dependencies, npm install kördes innan COPY

**Försök 2: Lägga till @types/react i devDependencies**
```json
"devDependencies": {
  "@types/react": "^18.3.12"
}
```
**Resultat:** ❌ Misslyckades  
**Fel:** `error TS17004: Cannot use JSX unless the '--jsx' flag is provided`  
**Root Cause:** `tsconfig.json` saknade JSX-konfiguration

**Försök 3: Lägga till --jsx flag i build script**
```json
"scripts": {
  "build": "tsc --jsx react && vite build"
}
```
**Resultat:** ❌ Misslyckades  
**Fel:** `Cannot find module './App.tsx'`  
**Root Cause:** Vite plugin för React saknades, JSX transformerades inte korrekt

### Slutsats - Återvändsgränder
- ❌ Att installera dependencies lokalt hjälper inte Docker build
- ❌ Endast lägga till types räcker inte för JSX-stöd
- ❌ Manuella TypeScript flags löser inte Vite-konfiguration

### Faktisk Orsak
Projektet skapades som vanilla TypeScript (inte React). Saknades:
1. React dependencies i `package.json`
2. `jsx: "react-jsx"` i `tsconfig.json`
3. `vite.config.ts` med React plugin
4. `main.tsx` som renderar React-appen

---

## Problem #3: Frontend Visar Fel Innehåll

### Problemidentifiering
Efter lyckad build och deploy visade frontend Vite's default startsida istället för ToDo-appen.

### Symptom
```
Webbläsare visar:
"Vite + TypeScript" med counter-knapp

Förväntat:
"📝 ToDo App" med input-fält och todo-lista
```

### Hypoteser & Misslyckade Försök

**Försök 1: Hårdladda webbläsaren (Cmd+Shift+R)**
**Resultat:** ❌ Misslyckades  
**Fel:** Samma startsida  
**Root Cause:** Problemet var inte browser cache

**Försök 2: Radera pods för att tvinga omstart**
```bash
kubectl delete pods -l app=frontend
```
**Resultat:** ❌ Misslyckades  
**Fel:** Nya pods visade fortfarande gammal sida  
**Root Cause:** Pods använde samma cachade image

**Försök 3: Bygga om image med --no-cache**
```bash
docker build --no-cache -t todo-frontend:latest .
minikube image load todo-frontend:latest
kubectl rollout restart deployment/todo-app-frontend
```
**Resultat:** ❌ Misslyckades  
**Fel:** Fortfarande gammal sida  
**Root Cause:** Minikube cachade imagen med samma tag

**Försök 4: Radera imagen från Minikube**
```bash
minikube image rm todo-frontend:latest
```
**Resultat:** ❌ Misslyckades  
**Fel:** `Error: unable to remove - container is using its referenced image`  
**Root Cause:** Pods använde imagen, kunde inte raderas

### Slutsats - Återvändsgränder
- ❌ Browser cache var inte problemet
- ❌ Att starta om pods hjälper inte om imagen är samma
- ❌ `--no-cache` i Docker build påverkar inte Minikube's cache
- ❌ Kan inte radera images som används av körande containers

### Faktisk Orsak
1. `main.ts` renderade fortfarande Vite's default template
2. Minikube cachade images med tag `latest` - nya builds med samma tag laddades inte
3. `imagePullPolicy: IfNotPresent` hämtade inte nya versioner

---

## Problem #4: CORS Error - Frontend Kan Inte Nå Backend

### Problemidentifiering
Frontend laddades korrekt men API-anrop blockerades av CORS policy.

### Symptom
```
Console Error:
Access to fetch at 'http://localhost:5000/api/todos' from origin 
'http://127.0.0.1:53392' has been blocked by CORS policy: Response to 
preflight request doesn't pass access control check: No 
'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Hypoteser & Misslyckade Försök

**Försök 1: Lägga till CORS i backend**
```csharp
builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});
```
**Resultat:** ❌ Misslyckades  
**Fel:** Samma CORS-fel  
**Root Cause:** CORS var redan konfigurerat, problemet var att backend inte nåddes alls

**Försök 2: Ändra API URL till backend service**
```bash
VITE_API_URL=http://backend
```
**Resultat:** ❌ Misslyckades  
**Fel:** `net::ERR_NAME_NOT_RESOLVED`  
**Root Cause:** DNS-namn "backend" fungerar inte från webbläsare (endast inom cluster)

**Försök 3: Använda Minikube IP och NodePort**
```bash
VITE_API_URL=http://192.168.49.2:30080
```
**Resultat:** ❌ Misslyckades  
**Fel:** `net::ERR_CONNECTION_REFUSED`  
**Root Cause:** NodePort var inte tillgänglig, Minikube tunnel krävdes

### Slutsats - Återvändsgränder
- ❌ CORS-konfiguration var inte problemet
- ❌ Kubernetes service-namn fungerar inte från webbläsare
- ❌ NodePort utan tunnel fungerar inte på Minikube

### Faktisk Orsak
Frontend körde i webbläsare (utanför cluster) och försökte nå backend via:
1. `localhost:5000` - backend körde inte där
2. `http://backend` - DNS fungerar inte från webbläsare
3. Minikube IP - krävde tunnel eller port-forward

---

## Problem #5: Image Cache - Ändringar Reflekteras Inte

### Problemidentifiering
Nya kod-ändringar byggdes och deployades men gamla filer serverades fortfarande.

### Symptom
```bash
# Lokal build
$ npm run build
dist/assets/index-DYBV0Es5.js   144.83 kB

# I Kubernetes pod
$ kubectl exec pod -- cat /usr/share/nginx/html/index.html
<script src="/assets/index-CW01TaJj.js"></script>  <!-- Gammal fil! -->
```

### Hypoteser & Misslyckade Försök

**Försök 1: Rollout restart**
```bash
kubectl rollout restart deployment/todo-app-frontend
```
**Resultat:** ❌ Misslyckades  
**Fel:** Nya pods använde samma gamla image  
**Root Cause:** Image tag var samma (`latest`)

**Försök 2: Radera och ladda om image**
```bash
minikube image rm todo-frontend:latest
minikube image load todo-frontend:latest
```
**Resultat:** ❌ Misslyckades  
**Fel:** Kunde inte radera image som används  
**Root Cause:** Pods höll imagen låst

**Försök 3: Ändra imagePullPolicy till Always**
```yaml
imagePullPolicy: Always
```
**Resultat:** ❌ Misslyckades  
**Fel:** Försökte hämta från Docker Hub  
**Root Cause:** Lokal image har ingen registry, kan inte "pullas"

### Slutsats - Återvändsgränder
- ❌ Rollout restart med samma image tag hjälper inte
- ❌ Kan inte radera images som används av pods
- ❌ `imagePullPolicy: Always` fungerar inte för lokala images

### Faktisk Orsak
Minikube cachar images baserat på tag. Med `latest` tag:
1. Första `minikube image load` → sparar image
2. Andra `minikube image load` → ignoreras (tag finns redan)
3. Pods använder cachad version

---

## Problem #6: ERR_CONNECTION_REFUSED

### Problemidentifiering
Efter deployment kunde inte frontend nås via `http://localhost:3000`.

### Symptom
```
Webbläsare:
localhost avvisade anslutningen
ERR_CONNECTION_REFUSED
```

### Hypoteser & Misslyckade Försök

**Försök 1: Kolla om service finns**
```bash
$ kubectl get svc frontend
NAME       TYPE           CLUSTER-IP       PORT(S)
frontend   LoadBalancer   10.100.184.195   80:31746/TCP
```
**Resultat:** ❌ Service finns men inte tillgänglig  
**Root Cause:** LoadBalancer fungerar inte på Minikube utan tunnel

**Försök 2: Använda NodePort direkt**
```bash
$ curl http://localhost:31746
curl: (7) Failed to connect to localhost port 31746
```
**Resultat:** ❌ Misslyckades  
**Root Cause:** NodePort exponeras på Minikube IP, inte localhost

**Försök 3: Använda Minikube service**
```bash
$ minikube service frontend
```
**Resultat:** ⚠️ Fungerade men öppnade fel URL  
**Problem:** Öppnade Minikube IP istället för localhost  
**Root Cause:** Behövde port-forward för localhost access

### Slutsats - Återvändsgränder
- ❌ LoadBalancer utan tunnel fungerar inte på Minikube
- ❌ NodePort exponeras inte på localhost
- ⚠️ `minikube service` fungerar men ger inte localhost URL

### Faktisk Orsak
Port-forward processer hade stoppats eller startades aldrig. Minikube services är inte tillgängliga på localhost utan:
1. Port-forward
2. Minikube tunnel
3. Eller via Minikube IP

---

## Sammanfattning av Återvändsgränder

### ❌ Misslyckade Strategier att Undvika

1. **Image Management**
   - Använda `latest` tag för lokala images
   - Förvänta sig att Docker images automatiskt finns i Minikube
   - Försöka radera images som används av pods

2. **Networking**
   - Använda Kubernetes service-namn från webbläsare
   - Förvänta sig att LoadBalancer fungerar utan tunnel på Minikube
   - Använda localhost för services utan port-forward

3. **Build & Deploy**
   - Bygga images utan att verifiera innehåll
   - Förlita sig på browser cache-clearing för deployment-problem
   - Använda `imagePullPolicy: Always` för lokala images

4. **Configuration**
   - Hårdkoda localhost URLs i production builds
   - Förvänta sig att environment variables uppdateras runtime
   - Skippa Vite/React konfiguration för TypeScript-projekt

### ✅ Vad Som Faktiskt Fungerade

1. **Image Management:** Versionstaggade images (v1, v2, v3) + `minikube image load`
2. **Networking:** Port-forward för lokal utveckling
3. **Build:** Komplett React setup med Vite plugin
4. **Deploy:** Helm upgrade med nya image tags
5. **Debug:** Verifiera image innehåll med `docker run` och `kubectl exec`

---

## Lärdomar för Framtiden

### 🎯 Spårbarhet
- Dokumentera varje misslyckad hypotes
- Verifiera root cause innan nästa försök
- Använd versionstaggar för att spåra ändringar

### 🔍 Debugging Process
1. Identifiera exakt symptom (felmeddelande, logs)
2. Formulera hypotes om orsak
3. Testa EN ändring åt gången
4. Verifiera resultat innan nästa steg
5. Dokumentera vad som INTE fungerade

### 📚 Teknisk Kunskap
- Minikube ≠ Docker Desktop ≠ Host Docker
- Environment variables byggs in vid build-time i Vite
- Kubernetes DNS fungerar inte från webbläsare
- Image tags är viktiga för cache-hantering

---

## Related Files
- [SOLUTION.md](./SOLUTION.md) - Fungerande lösningar
- [verify.sh](./verify.sh) - Verifieringsskript
- [README.md](./README.md) - Projektdokumentation
