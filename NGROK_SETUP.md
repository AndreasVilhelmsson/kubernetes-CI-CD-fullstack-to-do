# 🌐 Exponera din app med ngrok

## Snabbstart

```bash
# 1. Installera ngrok
brew install ngrok

# 2. Kör scriptet
./scripts/expose-with-ngrok.sh
```

Din app är nu tillgänglig på en publik URL! 🎉

---

## Steg-för-steg

### 1. Installera ngrok
```bash
brew install ngrok
```

### 2. (Valfritt) Skapa gratis konto för persistent URL
- Gå till https://ngrok.com/signup
- Kopiera din authtoken
- Kör: `ngrok config add-authtoken <din-token>`

### 3. Starta din Kubernetes-app
```bash
kubectl get pods  # Kontrollera att pods körs
```

### 4. Exponera med ngrok
```bash
./scripts/expose-with-ngrok.sh
```

### 5. Öppna URL:en i webbläsaren
Kopiera URL:en från terminalen (t.ex. `https://abc-123.ngrok-free.app`)

---

## Manuell metod

Om du vill köra stegen manuellt:

```bash
# Terminal 1: Port-forward
kubectl port-forward svc/frontend 8080:80

# Terminal 2: Starta ngrok
ngrok http 8080
```

---

## Tips

- **Persistent URL:** Med gratis konto kan du reservera en fast URL
- **HTTPS:** ngrok ger automatiskt HTTPS
- **Dela:** Skicka URL:en till vem som helst för att visa din app
- **Stoppa:** Tryck Ctrl+C i ngrok-terminalen

---

## Felsökning

**Problem:** "command not found: ngrok"  
**Lösning:** Installera med `brew install ngrok`

**Problem:** "connection refused"  
**Lösning:** Kontrollera att `kubectl port-forward` körs

**Problem:** "ERR_NGROK_108"  
**Lösning:** Lägg till authtoken från ngrok.com
