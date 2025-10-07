#!/bin/bash

echo "🚀 Exponerar Todo-app med ngrok..."

# Kontrollera att ngrok är installerat
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok är inte installerat"
    echo "Installera med: brew install ngrok"
    exit 1
fi

# Kontrollera att kubectl fungerar
if ! kubectl get svc &> /dev/null; then
    echo "❌ Kubernetes är inte tillgängligt"
    exit 1
fi

echo "✅ Startar port-forward till frontend..."
kubectl port-forward svc/frontend 8080:80 &
PF_PID=$!

sleep 3

echo "✅ Startar ngrok tunnel..."
echo ""
echo "📋 Din app kommer vara tillgänglig på en URL som:"
echo "   https://abc-123-def.ngrok-free.app"
echo ""
echo "⚠️  Tryck Ctrl+C för att stoppa"
echo ""

ngrok http 8080

# Cleanup när ngrok stoppas
kill $PF_PID 2>/dev/null
