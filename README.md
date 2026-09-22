# 💳 Fintech Cloud Infrastructure & Platform Engineering Challenge
## Automated E-Commerce & Payment Orchestration with Hyperswitch on AWS EKS

---

## 📌 Executive Summary & Scenario

Welcome to the **Fintech Cloud Infrastructure & Platform Engineering Challenge**.

In this challenge, you are provided with the source code for an enterprise-grade **Fintech E-Commerce & Payment Orchestration Platform**. The application is built using a modern decoupled microservices architecture with a multi-client frontend, using **[Juspay Hyperswitch](https://github.com/juspay/hyperswitch)**—an open-source, high-performance financial payment router—as its central transaction processing backbone.

Your objective is to design, architect, and fully automate the production-ready AWS cloud infrastructure, container orchestration, asynchronous messaging pipelines, and observability stack required to deploy and run this entire platform with zero manual intervention.

---

## 🏗️ Application Architecture & Codebase Overview

This repository contains two primary software domains:

### 1. Frontend Applications (`frontend/`)
- **`ecommerce-store/`**: Modern customer-facing e-commerce storefront (Vite + React / TypeScript) enabling users to browse catalog items, manage shopping carts, and trigger payment checkouts.
- **`control-center/`**: Merchant analytics, operational back-office, and administration dashboard for tracking transaction volumes, dispute states, and routing metrics.
- **`web/`**: Hyperswitch client-side payment SDK and checkout web application for unified payment method rendering and redirection handling.

### 2. Backend Microservices (`services/`)
- **`auth-service/`**: User identity, role-based access control (RBAC), and JWT authentication backed by PostgreSQL.
- **`product-service/`**: Product catalog and inventory metadata service.
- **`cart-service/`**: High-throughput session-based shopping cart management service backed by Redis.
- **`order-service/`**: Transaction management and order state machine. Communicates with Hyperswitch Core Router for payment intent creation and publishes transaction outcomes to an event fanout topic.
- **`inventory-service/`**: Worker microservice consuming asynchronous checkout events to reserve and deduct stock levels.
- **`notification-service/`**: Worker microservice consuming asynchronous order events to dispatch customer transaction notifications.

### 3. Hyperswitch Payment Router Core
- Deployed via the upstream Juspay Helm chart (`juspay/hyperswitch-app`), orchestrating core routing pods, asynchronous scheduler consumers, producers, and drainers connected to managed databases and caches.

---

## 🎯 The Core Assignment & Mandatory Requirements

Your mission is to build the complete, automated Infrastructure-as-Code (IaC) and deployment ecosystem on AWS.

> [!IMPORTANT]
> ### 🚨 Mandatory Rule: Single Infrastructure Repository
> You must create **only ONE dedicated infrastructure repository** (e.g. `fintech-hyperswitch-infra` or `hyperswitch-solution`) that encapsulates **both Terraform and all Kubernetes / Helm manifests**.
> 
> Furthermore, **Kubernetes workloads and Helm releases must be driven and orchestrated directly by Terraform itself** (e.g. using the Terraform `kubernetes`, `helm`, and `null_resource` providers). The entire platform—from raw VPC networking to fully operational Kubernetes microservices—must deploy through a single unified Terraform lifecycle. Separate, disconnected manual `kubectl` pipelines are not permitted.

---

## 📋 Detailed Infrastructure Specifications

You are required to engineer the following AWS and Kubernetes components:

### 1. Networking & VPC Architecture
- **VPC Design**: Multi-AZ Virtual Private Cloud with segregated subnets:
  - **Public Subnets**: Ingress traffic via AWS Application Load Balancer (ALB) and NAT Gateways.
  - **Private Application Subnets**: Dedicated to EKS worker nodes and internal services (no public IPs).
  - **Private Database Subnets**: Completely isolated tier for relational databases and caching clusters.
- **Security Group Isolation**: Strict least-privilege network policies between ALB $\rightarrow$ EKS nodes $\rightarrow$ RDS & ElastiCache tiers.

### 2. Kubernetes Cluster (Amazon EKS)
- **Cluster Version**: EKS v1.30+ managed control plane with OIDC provider integration.
- **Node Groups**: AWS managed node group in private subnets with auto-scaling capabilities and proper memory/CPU sizing.
- **IRSA (IAM Roles for Service Accounts)**: Every Kubernetes workload that requires AWS access (ALB Controller, External Secrets Operator, EBS CSI Driver) must use fine-grained IAM roles bound to K8s ServiceAccounts. **Hardcoded AWS access keys in Kubernetes secrets are strictly prohibited.**
- **AWS Load Balancer Controller**: Deployed via Helm to provision native AWS Application Load Balancers for routing external ingress traffic.

### 3. Managed Persistence & Caching
- **Amazon RDS (PostgreSQL)**: Multi-AZ or single-instance engine (PostgreSQL 15+) for relational microservices and Hyperswitch core transaction logs.
- **Amazon ElastiCache (Redis)**: Redis cluster (v7+) providing high-speed distributed cache for `cart-service` and Hyperswitch idempotent lock storage.
- **Cluster DNS Integration**: Robust internal DNS or Kubernetes `ExternalName` service abstractions (e.g., `hyperswitch-redis`, `hyperswitch-postgres`) enabling clean, decoupled service discovery without brittle hardcoded IP configurations.

### 4. Asynchronous Messaging & Event-Driven Pipelines
- **Amazon SNS (Simple Notification Service)**:
  - Create a transactional payment topic (e.g. `hyperswitch-payment-success`) where `order-service` publishes confirmed payment events.
- **Amazon SQS (Simple Queue Service)**:
  - Create dedicated queues:
    1. **Inventory Queue**: Subscribed to the SNS topic for stock deduction by `inventory-service`.
    2. **Notification Queue**: Subscribed to the SNS topic for automated customer receipts by `notification-service`.
  - Include Dead-Letter Queues (DLQ) for resilient failure handling.

### 5. Frontend Hosting & Global Edge Delivery
- **Amazon S3**: Secure private bucket hosting pre-compiled, optimized static assets for the frontend applications.
- **Amazon CloudFront**: Global Content Delivery Network (CDN) distribution serving assets via HTTPS with Origin Access Control (OAC), custom error page routing for Single-Page Applications (SPA), and low-latency edge caching.

### 6. Dynamic Secrets Management
- **AWS Secrets Manager**: Single source of truth holding centralized infrastructure credentials (RDS passwords, Redis hosts, JWT secrets, Hyperswitch API keys).
- **External Secrets Operator (ESO)**: Installed in the cluster, synchronizing Secrets Manager parameters into native Kubernetes `Secret` resources automatically and securely.

### 7. Observability & Monitoring Stack
A production fintech platform requires full observability. You must provision an integrated monitoring stack inside the cluster:
- **Metrics (Prometheus & Node Exporter)**: Node, container, and application metrics collection with custom `ServiceMonitor` discovery.
- **Logs (Grafana Loki & Promtail / Loki-Logs)**: Centralized cluster-wide log aggregation and querying.
- **Traces (Grafana Tempo)**: Distributed tracing pipeline with OpenTelemetry compatibility.
- **Dashboards (Grafana)**: Preconfigured datasources (Prometheus, Loki, Tempo) accessible via web console.

---

## 🛠️ Note on Application Code Flexibility

> [!TIP]
> **Flexibility on Application Code**:
> While this challenge evaluates your **Cloud Infrastructure, Terraform, Kubernetes, and Platform Engineering skills**, you have full liberty to modify or adjust the frontend and backend microservices code (inside `frontend/` and `services/`) if required to suit your containerization strategy, environment variable schemes, health check endpoints, or Docker configurations.
> 
> The core evaluation is strictly based on the robustness, reliability, security, and automation of your **infrastructure implementation**.

---

## 📦 Required Deliverables

When completing this challenge, your single infrastructure repository must contain:

1. **Modular Terraform Codebase (`terraform/`)**:
   - Networking (`vpc.tf`)
   - EKS Cluster & Node Groups (`eks.tf`)
   - Persistence (`rds.tf`, `redis.tf`)
   - Asynchronous Messaging (`messaging.tf` for SQS & SNS)
   - Storage & CDN (`s3.tf`, `cloudfront.tf`)
   - Security & IRSA (`iam.tf`, `irsa.tf`)
   - Secrets (`secrets.tf`)
   - Kubernetes Workloads & Helm (`k8s_deploy.tf`)
   - No hardcoded secrets or environment-specific credentials in git.

2. **Kubernetes Manifests & Helm Configurations (`k8s/`)**:
   - `k8s/hyperswitch/`: Helm values and ExternalSecret manifests for Hyperswitch.
   - `k8s/monitoring/`: Values for Prometheus, Loki, and Tempo.
   - `k8s/services/`: Deployment and Service manifests for the custom microservices.
   - `k8s/ingress/`: ALB Ingress controller routing rules.

3. **Automated CI/CD Pipeline (`.github/workflows/`)**:
   - GitHub Actions workflow deploying the infrastructure via GitHub OIDC role assumption without static AWS credentials.
   - Clean, idempotent execution (`terraform init` $\rightarrow$ `terraform apply` with zero manual state manipulation).

4. **Architecture Documentation & Runbook**:
   - Detailed architectural topology diagram.
   - Step-by-step verification commands proving all pods, services, datasources, and queues are healthy.

---

## 🏆 Evaluation & Grading Criteria

Your submission will be evaluated on the following engineering dimensions:

| Dimension | Weight | Criteria |
|:---|:---:|:---|
| **IaC Automation & Single-Repo Design** | 25% | Single repository; all AWS and K8s layers orchestrated through Terraform; zero manual steps. |
| **Architectural Completeness** | 25% | Proper integration of EKS, RDS, Redis, SQS, SNS, S3, CloudFront, and Hyperswitch Core. |
| **Security & Best Practices** | 20% | Least-privilege IAM with IRSA; private subnets; security group isolation; no plain-text secrets in git. |
| **Resilience & High Availability** | 15% | Multi-AZ placement; decoupled async event queues; proper Pod probes; clean DNS resolution. |
| **Observability & Operational Readiness** | 15% | Working Prometheus, Grafana, Loki, and Tempo stack with verifiable datasources and logs. |

---

**Good luck! We look forward to reviewing your cloud architecture and implementation.**
