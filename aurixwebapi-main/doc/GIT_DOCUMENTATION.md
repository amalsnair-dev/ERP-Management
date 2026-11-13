# Git & Version Control Documentation - Aurix Web API

This document provides guidelines, commands, and workflow standards for managing the `aurixwebapi` repository.

---

## 📌 Repository Information

- **Remote URL**: `https://github.com/BLOGTEC-SOFTWARE-LLP/aurixwebapi.git`
- **Default Branch**: `main`
- **Tech Stack**: Spring Boot (Java 17 / 21), Maven, PostgreSQL / MS SQL

---

## 🚀 Quick Setup & Workflow Commands

### 1. Initializing & Connecting Remote
```bash
# Initialize local repository
git init

# Add remote origin
git remote add origin https://github.com/BLOGTEC-SOFTWARE-LLP/aurixwebapi.git

# Set main branch
git branch -M main
```

### 2. Daily Development Workflow

```bash
# Check status of changed files
git status

# Stage all changes
git add .

# Commit changes with a descriptive message
git commit -m "feat: updated cash summary logic for todayCollectionCash"

# Push changes to remote repository
git push -u origin main
```

### 3. Pulling Latest Changes
```bash
# Fetch and merge updates from remote main
git pull origin main
```

---

## 📁 Repository Directory Structure

```text
aurixwebapi/
├── doc/                                 # Project Documentation & Postman Collections
│   ├── PROJECT_DOCUMENTATION.md         # Comprehensive System Architecture & Modules
│   ├── MASTER_API_GUIDE.md              # Master API Endpoints List
│   ├── PROJECT_MASTER_GUIDE.md          # Technical Setup & Dev Instructions
│   ├── GIT_DOCUMENTATION.md             # Git Workflow & Repo Guidelines
│   ├── AURIX_FULL_SUITE.postman_collection.json
│   └── GIFT_MASTER_FULL_POSTMAN.json
├── src/
│   ├── main/
│   │   ├── java/com/blogtec/aurixwebapi/   # Spring Boot Source Code
│   │   └── resources/                     # Application properties & configs
│   └── test/                              # Unit & Integration Tests
├── .gitignore                             # Ignored build & log artifacts
├── pom.xml                                # Maven Dependencies & Build Configuration
└── README.md                              # Main Repository Entry Point
```

---

## 🛡️ Git Ignore Guidelines (`.gitignore`)

The following files are automatically ignored from Git version control:
- **Build Output**: `target/`, `bin/`
- **Runtime Logs**: `*.log`, `hs_err_pid*.log`, `replay_pid*.log`
- **IDE Settings**: `.vscode/`, `.idea/`, `.classpath`, `.project`, `.settings/`
