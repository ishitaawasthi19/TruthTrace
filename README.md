# 🔍 TruthTrace

> A full-stack digital forensic investigation platform for managing investigation cases, securely handling digital evidence, verifying file integrity, performing automated forensic analysis, and generating investigation reports.

## 🚀 Live Demo

🔗 **Frontend:** Coming Soon  
🔗 **Backend API:** Coming Soon  

---

## 📌 Overview

TruthTrace is a digital forensic investigation platform designed to simplify the process of managing forensic cases and analyzing digital evidence.

The platform allows investigators to:

- Create and manage investigation cases
- Upload digital evidence files
- Generate SHA-256 hashes for evidence integrity
- Verify whether uploaded evidence has been modified
- Perform automated evidence analysis
- Detect suspicious indicators
- Assign a risk level to evidence
- Generate forensic investigation reports
- View investigation statistics through an interactive dashboard

---

## ✨ Features

### 📊 Investigation Dashboard

The dashboard provides a quick overview of the forensic investigation system, including:

- Total investigation cases
- Total evidence files
- Number of analyzed files
- Active investigations
- Recent investigation cases
- Recent uploaded evidence
- System status and evidence integrity overview

---

### 📁 Case Management

Users can create and manage digital forensic investigation cases.

Each case contains:

- Investigation case name
- Case description
- Case status
- Creation timestamp
- Associated evidence files

---

### 📄 Digital Evidence Management

Evidence files can be uploaded and associated with a specific investigation case.

The system stores important metadata such as:

- File name
- File type
- File size
- SHA-256 hash
- Upload information
- Associated investigation case

---

### 🔐 Evidence Integrity Verification

TruthTrace uses **SHA-256 hashing** to maintain evidence integrity.

When a file is uploaded:

1. A SHA-256 hash of the original evidence is generated and stored.
2. During analysis, the current SHA-256 hash is calculated again.
3. Both hashes are compared.

If the hashes match:

```text
Integrity Status: Verified
