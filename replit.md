# SehatSaathi AI

## Overview

SehatSaathi AI is a mobile-first health companion web app built for elderly and non-technical Indian users. It features phone OTP login, AI-powered medical scanning, medicine reminders with alarms, SOS emergency alerts, and emergency contact management.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (390px centered mobile-first)
- **Backend**: Node.js + Express 5
- **Database**: MongoDB Atlas (Mongoose ODM)
- **AI**: Google Gemini 2.5 Flash (via Replit AI Integrations)
- **Auth**: Custom JWT-based Phone OTP (dev bypass: 8446530525/12345)
- **API codegen**: Orval (from OpenAPI spec)

## Key Environment Variables

- `MONGODB_URI` — MongoDB Atlas connection string (must whitelist 0.0.0.0/0 in Atlas Network Access)
- `SESSION_SECRET` — JWT signing secret
- `AI_INTEGRATIONS_GEMINI_BASE_URL` — Replit AI Gemini proxy URL (auto-set)
- `AI_INTEGRATIONS_GEMINI_API_KEY` — Replit AI Gemini key (auto-set)

## App Structure

### Frontend (artifacts/sehat-saathi)
- `/` — Language select (first screen)
- `/login` — Phone OTP login (dev: 8446530525 / 12345)
- `/home` — Dashboard with due meds, recent scans, low stock alerts
- `/scan` — AI Scanner (medicine/prescription/report with camera)
- `/reminders` — Medicine reminders with alarm + stock management
- `/profile` — User profile + emergency contacts
- `/sos` — Emergency SOS page with location + contacts

### Backend (artifacts/api-server)
Routes under `/api`:
- `/auth/send-otp` + `/auth/verify-otp` — Phone OTP auth
- `/users/me` — Get/update user profile (syncs to MongoDB)
- `/reminders` — CRUD reminders + mark taken (decrements stock)
- `/scans` — AI scanning with Gemini vision
- `/sos` — SOS trigger with geolocation
- `/contacts` — Emergency contacts CRUD
- `/home/summary` — Dashboard data (due meds + recent scans)

## MongoDB Schemas

- **User**: name, phone (unique), age, language, bloodGroup, address, otp, otpExpiry, profileComplete
- **Reminder**: userId, medName, dosage, frequency, times[], stockCount, autoReminder
- **Scan**: userId, type, imageBase64, aiInsight, summary, createdAt
- **Contact**: userId, name, phone, relation, isPrimary

## Key Commands

- `pnpm --filter @workspace/sehat-saathi run dev` — run frontend
- `pnpm --filter @workspace/api-server run dev` — run backend
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec

## Dev Notes

- JWT token stored in localStorage under `sehat_token`
- Camera scanning uses `navigator.mediaDevices.getUserMedia`
- Medicine alarms use `setInterval` + `SpeechSynthesis` + `AudioContext`
- SOS uses `navigator.geolocation`
- MongoDB Atlas must have 0.0.0.0/0 in Network Access for Replit to connect
