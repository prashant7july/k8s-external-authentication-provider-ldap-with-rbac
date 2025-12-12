# k8s-external-authentication-provider-ldap-with-rbac
k8s External Authentication Provider LDAP with RBAC

# LDAP Authentication for Kubernetes Using Webhook Token Authentication Plugin

A step-by-step guide to configure Kubernetes API server to authenticate users against an OpenLDAP directory via a webhook in minikube.

---

## Table of Contents

* [Prerequisites](#prerequisites)
* [1. Stand Up OpenLDAP & Add Entries](#1-stand-up-openldap--add-entries)
* [2. Run and Test the Authentication Service](#2-run-and-test-the-authentication-service)
* [3. Create kubeconfig for Webhook Authn](#3-create-kubeconfig-for-webhook-authn)
* [4. Enable Webhook on the API Server](#4-enable-webhook-on-the-api-server)
* [5. Verify Authentication & RBAC](#5-verify-authentication--rbac)

---

## Prerequisites

* Docker & Docker Compose
* Minikube
* `kubectl` CLI
* OpenLDAP LDIF file (e.g., `alice.ldif`)

---

## 1. Stand Up OpenLDAP & Add Entries

```bash
# Start OpenLDAP container
docker compose up -d

# Confirm it's running
docker ps

# Add a test user (alice) in bitnami use adminpassword
ldapadd -x -H ldap://localhost:1389 \
  -D "cn=admin,dc=example,dc=org" \
  -w adminpassword \
  -f ./ldap-bitnami/alice.ldif

# Verify the entry
ldapsearch -x -H ldap://localhost:1389 \
  -D "cn=admin,dc=example,dc=org" \
  -w adminpassword \
  -b "dc=example,dc=org" "(cn=alice)"
```

---

## 2. Run and Test the Authentication Service

1. **Start the Node.js auth service (If without docker run)**

   ```bash
   # From your project root
   npm install
   npm start
   ```
2. **Health check (Ngrok)**
   Visit: `http://localhost:4040`

3. **Test token review**

   ```bash
   curl -X POST http://localhost:7443/auth \
     -H "Content-Type: application/json" \
     -d '{"spec":{"token":"alice:alicepassword"}}'
   ```

   **Expected response:**

   ```json
   {
     "apiVersion": "authentication.k8s.io/v1",
     "kind": "TokenReview",
     "status": {
       "authenticated": true,
       "user": {
         "username": "alice",
         "uid": "alice",
         "groups": ["dev"]
       }
     }
   }
   ```

---

## 3. Create kubeconfig for Webhook Authn

In your Minikube VM, save a kubeconfig fragment for the API server:

```bash
minikube start
minikube ssh
sudo -i

cat <<EOF > /var/lib/minikube/certs/webhook.yaml
apiVersion: v1
kind: Config
clusters:
  - name: webhook-authn
    cluster:
      insecure-skip-tls-verify: true
      server: https://0175-223-190-86-215.ngrok-free.app/auth
users:
  - name: webhook-user
contexts:
  - name: webhook-context
    context:
      cluster: webhook-authn
      user: webhook-user
current-context: webhook-context
EOF

exit
exit
```

> **Tip:**
> To inspect it later:
>
> ```bash
> minikube ssh 'sudo cat /var/lib/minikube/certs/webhook.yaml'
> ```

---

## 4. Enable Webhook on the API Server

1. **Stop Minikube**

   ```bash
   minikube stop
   ```
2. **Restart with extra flags**

   ```bash
   minikube start \
     --extra-config=apiserver.authentication-token-webhook-config-file=/var/lib/minikube/certs/webhook.yaml \
     --extra-config=apiserver.authentication-token-webhook-version=v1
   ```
3. **Verify the API server manifest**

   ```bash
   minikube ssh \
     'sudo cat /etc/kubernetes/manifests/kube-apiserver.yaml | grep authentication-token-webhook'
   ```

   You should see:

   ```text
   --authentication-token-webhook-config-file=/var/lib/minikube/certs/webhook.yaml
   ```

---

## 5. Verify Authentication & RBAC

1. **Create an admin‐style kubeconfig**

   ```bash
   kubectl --kubeconfig admin.conf config set-credentials alice --token=alice:alicepassword
   kubectl --kubeconfig admin.conf config set-context alice-context --cluster=minikube --user=alice
   kubectl --kubeconfig admin.conf config use-context alice-context
   ```
2. **Test unauthorised access**

   ```bash
   kubectl --kubeconfig admin.conf get pods --all-namespaces
   # → Error (Forbidden) as expected
   ```
3. **Grant view permissions**

   ```bash
   kubectl create clusterrolebinding alice-view \
     --clusterrole=view --user=alice
   ```
4. **Re-test**

   ```bash
   kubectl --kubeconfig admin.conf get pods --all-namespaces
   # → Should now list pods
   ```