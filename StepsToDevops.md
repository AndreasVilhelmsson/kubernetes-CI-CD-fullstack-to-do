# Reverse Engineering & Learning Roadmap

Detta dokument är en steg-för-steg plan för att förstå och reverse-engineera ditt projekt (React frontend + .NET backend + Kubernetes + Helm + Argo CD).

---

## 📊 Roadmap-diagram

```mermaid
flowchart TD
    A[Frontend (React)] --> B[Backend (.NET)]
    B --> C[Docker]
    C --> D[Kubernetes Manifests]
    D --> E[Helm Charts]
    E --> F[Argo CD (GitOps)]
    F --> G[CI/CD Pipelines]
    G --> H[Felsökning & Vanliga problem]
    H --> I[Egen vidareutveckling]
```

---

## 📚 Steg-för-steg plan för att lära dig ditt projekt

### **Steg 1 – Få helikopterperspektivet**
- Kör den långa Amazon Q prompten → generera `docs/REVERSE_ENGINEERING.md`.
- Läs **# Översikt** och **# Arkitektur på hög nivå**.
- Rita upp arkitekturen själv för att befästa bilden.

👉 **Mål:** Förstå helheten och hur komponenterna hänger ihop.

---

### **Steg 2 – Frontend (React)**
- Läs `app/frontend/`.
- Kolla `package.json` → versioner.
- Följ flödet i App.tsx → komponenter → API-anrop.
- Förstå state-hantering och API-klient.

📝 **Uppgifter:**
- Skapa en ny feature: lägg till en “mark as completed” checkbox på varje Todo.
- Lägg till en knapp “Clear completed” som raderar alla klara todos.

👉 **Mål:** Kunna köra frontend själv och förstå hur ett API-anrop görs.

---

### **Steg 3 – Backend (.NET)**
- Läs `app/backend/`.
- Förstå `Program.cs`, controllers och endpoints (`/api/todos`).
- Identifiera databas (MongoDB eller annan).
- Kolla `appsettings.json` för config.

📝 **Uppgifter:**
- Skapa en ny endpoint `PUT /api/todos/{id}/complete` som markerar en Todo som klar.
- Implementera enkel validering (t.ex. Todo-text får inte vara tom).

👉 **Mål:** Kunna skriva nya endpoints och förstå config.

---

### **Steg 4 – Docker**
- Läs Dockerfile för frontend + backend.
- Bygg och kör lokalt:
  ```bash
  docker build -t todo-backend ./app/backend
  docker run -p 5000:5000 todo-backend
  ```

📝 **Uppgifter:**
- Förklara vad varje rad i Dockerfile gör (FROM, WORKDIR, COPY, RUN, EXPOSE, ENTRYPOINT).
- Experimentera: ändra en miljövariabel i `docker run -e` och logga den i backend.

👉 **Mål:** Köra backend och frontend i containrar.

---

### **Steg 5 – Kubernetes (k8s/)**
- Läs Deployment + Service för backend och frontend.
- Förstå portflödet: Pod → Service → Ingress.
- Testa:
  ```bash
  kubectl apply -f k8s/
  kubectl get pods,svc,ingress
  ```

📝 **Uppgifter:**
- Öppna en Deployment.yaml och förklara parametrarna `replicas`, `selector`, `template.spec.containers.env`.
- Skala upp din backend med `kubectl scale deployment backend --replicas=3`.

👉 **Mål:** Förstå grunderna i Kubernetes.

---

### **Steg 6 – Helm**
- Läs `helm/Chart.yaml`, `values.yaml` och templates.
- Kör:
  ```bash
  helm install todo-app ./helm -n demo
  helm upgrade todo-app ./helm -n demo
  ```

📝 **Uppgifter:**
- Förklara vad `values.yaml` parametrarna betyder (replicaCount, image.repository, image.tag, service.port).
- Lägg till en ny value i values.yaml (t.ex. `appTitle: "My Todo App"`) och använd den i en ConfigMap-template.

👉 **Mål:** Förstå Helm som “templating för Kubernetes”.

---

### **Steg 7 – Argo CD**
- Läs `argocd/Application.yaml`.
- Förstå repo → kluster sync.
- Testa manuellt:
  ```bash
  argocd app sync todo-app
  ```

📝 **Uppgifter:**
- Förklara vad parametrarna `destination.server` och `destination.namespace` betyder.
- Testa att ändra `syncPolicy` mellan automatiskt och manuellt.

👉 **Mål:** Förstå GitOps-flödet: Git = källan till sanning.

---

### **Steg 8 – CI/CD (.github/workflows)**
- Läs `ci.yaml`.
- Följ pipeline-stegen: checkout, build, test, docker build/push, helm deploy, argocd sync.

📝 **Uppgifter:**
- Förklara varje `job` och `step` i workflow-filen.
- Lägg till ett nytt steg som kör `dotnet test` innan deploy.

👉 **Mål:** Förstå hur pipelines automatiserar dina manuella steg.

---

### **Steg 9 – Felsökning**
- Läs `TROUBLESHOOTING.md`.
- Vanliga fel:
  - `ERR_CONNECTION_TIMED_OUT`
  - CORS-fel
  - CrashLoopBackOff
  - OutOfSync i ArgoCD

📝 **Uppgifter:**
- För varje fel, skriv ner: *“Vad betyder felet? Hur hittar man orsaken? Hur fixar man det?”*
- Testa att återskapa ett fel och fixa det.

👉 **Mål:** Lära dig diagnostisera problem i verkligheten.

---

### **Steg 10 – Egen vidareutveckling**
- Lägg till en ny feature, t.ex. “completed”-flagga på Todo.
- Uppdatera frontend, backend, Dockerfile, Helm values.
- Deploya med Argo CD.
- Dokumentera processen i en egen `NOTES.md`.

📝 **Uppgifter:**
- Skapa en “User” entity och koppla todos till en användare.
- Lägg till inloggningsfunktion (enkelt token-baserat).

👉 **Mål:** Bevisa för dig själv att du kan hela kedjan.

---

⚡ **Tips:** Ta det i små steg. Fokusera på ett lager i taget. När du förstår varje steg, koppla ihop dem.


---

## 🎓 Examensdel – Utmaningar för hela kedjan

När du har gått igenom alla steg är det dags att testa om du verkligen behärskar hela kedjan.
Här är några större uppgifter som binder ihop alla delar:

### 🔹 Utmaning 1 – Ny feature end-to-end
- Lägg till en ny egenskap på Todo: `dueDate` (förfallodatum).
- Uppdatera backend-modellen och CRUD endpoints.
- Uppdatera frontend-formuläret för att sätta `dueDate`.
- Uppdatera listan så att Todos sorteras på `dueDate`.
- Bygg nya Docker-images, uppdatera Helm values och deploya med Argo CD.

### 🔹 Utmaning 2 – Skapa en ny mikrotjänst
- Skapa en ny backend-tjänst `UserService` i .NET.
- Lägg till endpoints för att skapa/lista användare.
- Lägg till en relation så att Todos kopplas till en UserId.
- Skapa en ny frontend-vy för att hantera användare.
- Lägg till egna Kubernetes-manifests eller Helm chart för `user-service`.

### 🔹 Utmaning 3 – Säkerhet & miljövariabler
- Lägg till stöd för att läsa hemligheter (DB-lösenord, API-nycklar) via Kubernetes Secrets.
- Uppdatera backend så att connection string hämtas från en Secret.
- Förklara varför detta är bättre än att hårdkoda i `appsettings.json`.

### 🔹 Utmaning 4 – CI/CD förbättring
- Lägg till ett nytt jobb i GitHub Actions som kör Playwright tester för frontend.
- Se till att testerna körs automatiskt vid varje push.
- Lägg till ett villkor så att deploy bara sker om testerna lyckas.

### 🔹 Utmaning 5 – Skalning och hälsa
- Lägg till readiness och liveness probes i backend Deployment.
- Aktivera HorizontalPodAutoscaler (HPA) för backend med min=2, max=5 pods.
- Testa med `kubectl describe hpa` att skalningen fungerar.

### 🔹 Utmaning 6 – GitOps kontroll
- Gör en ändring i values.yaml och pusha till GitHub.
- Verifiera att Argo CD auto-syncar ändringen till klustret.
- Testa att göra rollback till en tidigare version via Argo CD CLI eller UI.

---

✅ **Mål med examensdelen:** Efter att du klarat dessa utmaningar ska du kunna bygga, förstå och drifta en modern molnapplikation end-to-end med frontend, backend, Docker, Kubernetes, Helm, Argo CD och CI/CD.
