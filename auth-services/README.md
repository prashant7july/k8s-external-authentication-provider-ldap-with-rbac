## In Local
curl -X POST http://localhost:7443/auth \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "authentication.k8s.io/v1",
    "kind": "TokenReview",
    "spec": {
      "token": "alice:alicepassword"
    }
  }'

curl http://localhost:7443

## Ngrok
https://65bb-223-190-80-131.ngrok-free.app/

curl https://65bb-223-190-80-131.ngrok-free.app/

curl -X POST https://65bb-223-190-80-131.ngrok-free.app/auth \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "authentication.k8s.io/v1",
    "kind": "TokenReview",
    "spec": {
      "token": "alice:alicepassword"
    }
  }'


## 1  Test from inside the Minikube VM itself

```bash
# Open an interactive shell in the Minikube node
minikube ssh

# From inside the VM:
# 1. Resolve the hostname
getent hosts 65bb-223-190-80-131.ngrok-free.app

curl https://65bb-223-190-80-131.ngrok-free.app

# 2. Fetch the HTTPS endpoint (ignore self-signed / ngrok cert warnings)
curl -v -k https://65bb-223-190-80-131.ngrok-free.app/auth
# or, for the full TokenReview:
curl -X POST https://d960-223-190-85-35.ngrok-free.app/auth \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "authentication.k8s.io/v1",
    "kind": "TokenReview",
    "spec": {
      "token": "alice:alicepassword"
    }
  }'
```
