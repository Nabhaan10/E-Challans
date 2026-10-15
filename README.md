<div align="center">
  <img src="public/favicon.png" width="80" height="80" alt="e-Challan Logo" />
  <h1>e-Challan</h1>
  <p><strong>Digital Traffic Fine & Automated Violation Management System</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-18-blue?style=flat-square" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Python-3.11-yellow?style=flat-square" alt="Python" />
    <img src="https://img.shields.io/badge/PostgreSQL-Supabase-3178C6?style=flat-square" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/YOLOv3-OpenCV%20DNN-green?style=flat-square" alt="YOLOv3" />
  </p>
</div>

---

## Overview

**e-Challan** is an end-to-end intelligent traffic enforcement platform. It integrates a real-time computer vision pipeline for automated vehicle detection, speed calculation, and license plate recognition (ANPR) with a role-based web platform handling citation issuance, idempotent fine payments, dispute adjudication, and spatial hotspot analytics.

---

## Key Modules

* **Automated Surveillance & AI:** YOLOv3 vehicle detection coupled with `dlib` correlation tracking (25+ FPS real-time throughput on CPU), physics-based speed calculation, and EasyOCR plate extraction.
* **Law Enforcement Portal:** Direct surveillance video ingestion with plate auto-fill, real-time vehicle RC/PUC/Insurance compliance checks, geospatial duplicate citation prevention, and client-side SHA-256 evidence hashing.
* **Citizen Self-Service:** Fine breakdown with statutory legal reasoning, simulated idempotent UPI/Card payments, dynamic PDF receipt generation with scannable QR verification, and online dispute/appeal filing.
* **Traffic Administration:** Dynamic rules and penalty governance, automated aging escalation (`Pending` → `Overdue` → `Escalated`), Leaflet GIS violation hotspot mapping, and a GenAI data assistant powered by GPT-4o-mini.
* **Accessibility:** Full multilingual localization for English, Malayalam (മലയാളം), and Hindi (हिंदी).

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, TanStack Router & Query, Tailwind CSS, shadcn/ui, Vite |
| **Backend & Database** | PostgreSQL (Supabase), Row-Level Security (RLS), Stored Procedures (RPCs) |
| **Computer Vision** | Python 3.11, OpenCV DNN, YOLOv3 (COCO), dlib, EasyOCR, NumPy |
| **Utilities & AI** | jsPDF, Leaflet GIS, Web Crypto (SHA-256), OpenRouter (GPT-4o-mini) |

---

## Getting Started

### Prerequisites
* **Node.js** (v18+) & **npm**
* **Python** 3.11 (64-bit recommended for precompiled `dlib` wheels)

---

### 1. Web Application

```bash
# Clone the repository
git clone https://github.com/Nabhaan10/E-Challans.git
cd E-Challans

# Install dependencies
npm install

# Start local development server
npm run dev
```
The application will launch on `http://localhost:3000` (or `http://localhost:5173`).

---

### 2. Computer Vision Microservice

```bash
cd Speed-Estimation-of-Vehicles-with-Plate-Detection

# Activate virtual environment
.venv\Scripts\activate   # On Windows
# source .venv/bin/activate  # On Linux/macOS

# Start the REST API bridge
python pipeline_api.py
```
The API server will listen on `http://127.0.0.1:8000`.

---

## Demo Credentials

All seeded demo accounts use the password: **`Demo@1234`**

| Role | Email | Scope |
|---|---|---|
| **Traffic Officer** | `officer1@demo.in` | Video AI ingestion, citation issuance, appeal review |
| **Citizen** | `citizen1@demo.in` | View citations, UPI payment, QR receipt, file disputes |
| **Administrator** | `admin@demo.in` | GIS hotspot map, rule governance, GenAI assistant |

---

## License

This project was developed for academic and demonstration purposes. All statutory provisions are modeled after the Motor Vehicles (Amendment) Act.
