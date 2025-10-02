#!/bin/bash

echo "🔍 Verifierar ToDo App deployment..."
echo ""

# Färger
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Kontrollera pods
echo "📦 Pods status:"
kubectl get pods
echo ""

# Kontrollera att alla pods är Running
PENDING=$(kubectl get pods --no-headers | grep -v "Running\|Completed" | wc -l)
if [ $PENDING -gt 0 ]; then
    echo -e "${RED}❌ Alla pods är inte Running${NC}"
    kubectl get pods | grep -v "Running\|Completed"
else
    echo -e "${GREEN}✅ Alla pods är Running${NC}"
fi
echo ""

# Kontrollera services
echo "🌐 Services:"
kubectl get svc
echo ""

# Testa MongoDB
echo "🍃 Testar MongoDB..."
MONGO_POD=$(kubectl get pod -l app=mongodb -o jsonpath="{.items[0].metadata.name}")
if [ -n "$MONGO_POD" ]; then
    kubectl exec $MONGO_POD -- mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ MongoDB fungerar${NC}"
    else
        echo -e "${RED}❌ MongoDB svarar inte${NC}"
    fi
else
    echo -e "${RED}❌ MongoDB pod hittades inte${NC}"
fi
echo ""

# Testa Backend API
echo "🔧 Testar Backend API..."
kubectl port-forward svc/backend 8080:80 > /dev/null 2>&1 &
PF_PID=$!
sleep 2

BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/todos)
if [ "$BACKEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Backend API svarar (HTTP $BACKEND_RESPONSE)${NC}"
    curl -s http://localhost:8080/api/todos | jq '.' 2>/dev/null || echo "Todos: $(curl -s http://localhost:8080/api/todos)"
else
    echo -e "${RED}❌ Backend API svarar inte korrekt (HTTP $BACKEND_RESPONSE)${NC}"
fi
kill $PF_PID 2>/dev/null
echo ""

# Testa Frontend
echo "🎨 Testar Frontend..."
kubectl port-forward svc/frontend 3000:80 > /dev/null 2>&1 &
PF_PID=$!
sleep 2

FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Frontend svarar (HTTP $FRONTEND_RESPONSE)${NC}"
else
    echo -e "${RED}❌ Frontend svarar inte korrekt (HTTP $FRONTEND_RESPONSE)${NC}"
fi
kill $PF_PID 2>/dev/null
echo ""

# Sammanfattning
echo "📊 Sammanfattning:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Frontend: http://localhost:3000 (kör: kubectl port-forward svc/frontend 3000:80)"
echo "Backend:  http://localhost:8080 (kör: kubectl port-forward svc/backend 8080:80)"
echo "MongoDB:  localhost:27017 (kör: kubectl port-forward svc/mongodb 27017:27017)"
echo ""
echo -e "${YELLOW}💡 Tips: Öppna http://localhost:3000 i webbläsaren efter port-forward${NC}"
