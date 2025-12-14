

# 🎓 VertoPay - Campus Digital Payment System

<div align="center">

![VertoPay Logo](https://img.shields.io/badge/VertoPay-v1.0.0-6C63FF?style=for-the-badge)
![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?style=for-the-badge&logo=react)
![Expo](https://img.shields.io/badge/Expo-51.0-000020?style=for-the-badge&logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.1-3178C6?style=for-the-badge&logo=typescript)

**A secure, blockchain-inspired QR-based payment system for college campuses**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Installation](#-installation)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Security Features](#-security-features)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🎯 Overview

VertoPay is a **decentralized digital wallet system** designed specifically for college campuses. It enables students to make instant, secure payments to campus merchants (cafeterias, libraries, stores) using encrypted QR codes, eliminating the need for cash or cards.

### 🌟 Why VertoPay?

- 🚀 Fast: Pay in under 3 seconds
- 🔐 Secure: Ed25519 + AES-256
- 📱 Mobile-first
- 💰 Low fees (2%)
- 🎓 Campus ready

---

## ✨ Features

### Students 👨‍🎓
- Digital wallet
- QR payment generation
- Transaction history
- Wallet recharge
- Biometric authentication
- Real-time balance

### Merchants 🏪
- QR scanning
- Dashboard & reports
- Transaction tracking
- Auto settlement
- Low commission

### Security 🔒
- Ed25519 signatures
- AES-256 encryption
- QR expiry (60s)
- Nonce protection
- Secure key storage
- Biometric verification

---

## 🛠️ Tech Stack

### Frontend
 

React Native 0.74
Expo 51
TypeScript 5.1
Context API
AsyncStorage

 

### Security
 

@noble/ed25519
expo-secure-store
expo-local-authentication
AES-256

 

---

## 🏗️ System Architecture

 

Student App
↓ Generate QR (Encrypted)
Merchant App
↓ Verify Signature
Wallet Update
Transaction Log

 

---

## 📥 Installation

### Prerequisites
 

Node.js >= 18
npm >= 9
Expo Go

 

### Setup
 

git clone [https://github.com/yourusername/vertopay.git](https://github.com/yourusername/vertopay.git)
cd vertopay/frontend
npm install
npx expo start

 

---

## 🚀 Usage

### Student
- Register
- Recharge wallet
- Generate QR
- Pay merchant

### Merchant
- Register
- Scan QR
- Process payment

---

## 📁 Project Structure

 

vertopay-frontend/
├── app/
│   ├── (auth)/
│   ├── (student)/
│   ├── (merchant)/
├── components/
├── context/
├── hooks/
├── scripts/
├── constants/
├── app.json
├── package.json
└── tsconfig.json

 

---

## 🔐 Security Features

### Ed25519 Signature
 

sign(studentId + amount + merchantId + timestamp)



### AES Encryption


encrypt(payload) → QR
decrypt(QR) → payload


### QR Expiry

60 seconds



---

## 📊 API Documentation

### Auth


register()
login()
logout()


### Wallet


getBalance()
rechargeWallet()
addTransaction()
processPayment()



---

## 📸 Screenshots

Student App:
Dashboard | Pay | History | Profile

Merchant App:
Dashboard | Scan | Transactions | Profile

---

## 🗺️ Roadmap

### Phase 1 (MVP) ✅
- QR payments
- Wallets
- Transactions

### Phase 2 🚧
- Backend
- Blockchain
- Fraud detection

### Phase 3 🔮
- NFC
- Rewards
- Analytics

### Phase 4 🌍
- Multi-campus
- Admin panel
- Integrations

---

## 🔧 Configuration

### .env


APP_ENV=development
APP_VERSION=1.0.0
ENCRYPTION_KEY=32_char_key_here
QR_EXPIRY_TIME=60000
MERCHANT_COMMISSION=0.02



---

## 🧪 Testing


npm test
npm run test:e2e
npm run test:coverage



---

## 🤝 Contributing



git checkout -b feature/name
git commit -m "Add feature"
git push origin feature/name





## 📄 License

MIT License © 2025 VertoPay



## 👥 Team

Developer: Your Name  
University: CMR University  
Project: Final Year  
Year: 2025  


## 📞 Contact

Email: support@vertopay.dev  
GitHub Issues enabled  



<div align="center">

**Built with ❤️ by students, for students**

</div>
 
Say the word.
