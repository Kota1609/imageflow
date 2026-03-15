# ImageFlow — Image Transformation Service

Upload an image, remove its background, flip it horizontally, and get a hosted URL — all in seconds.

## Live Demo

- **Frontend:** [https://imageflow-theta.vercel.app](https://imageflow-theta.vercel.app)
- **Backend API:** [https://imageflow-api-3ch0.onrender.com](https://imageflow-api-3ch0.onrender.com)

## Architecture

```
┌─────────────┐       ┌─────────────────────────────────────────┐
│   Browser    │──────▶│  React + Vite (Vercel)                  │
│              │◀──────│  - Drag & drop upload                   │
│              │       │  - Before/after comparison slider       │
│              │       │  - Dark mode, toast notifications       │
└─────────────┘       └────────────────┬────────────────────────┘
                                       │ REST API
                      ┌────────────────▼────────────────────────┐
                      │  Express + TypeScript (Render)           │
                      │  - Zod-validated environment config      │
                      │  - Request ID tracing + structured logs  │
                      │  - Global error handler                  │
                      └───┬──────────┬──────────┬───────────────┘
                          │          │          │
                   ┌──────▼──┐ ┌────▼────┐ ┌──▼──────────┐
                   │remove.bg│ │  Sharp  │ │ Cloudinary  │
                   │  API    │ │ (.flop) │ │  (CDN host) │
                   └─────────┘ └─────────┘ └─────────────┘
```

## Features

- **Drag & drop** image upload with local preview
- **Background removal** via remove.bg API
- **Horizontal flip** using Sharp
- **Cloud hosting** on Cloudinary with unique URLs
- **Before/after comparison** slider (drag to compare original vs processed)
- **Dark mode** with system preference detection and localStorage persistence
- **Toast notifications** for all user actions
- **Skeleton loading** states while fetching gallery
- **Download** processed images directly
- **Copy URL** with visual feedback
- **Delete** images from cloud storage
- **Persistent gallery** — images survive page refreshes
- **Responsive design** — works on mobile, tablet, and desktop
- **Keyboard accessible** upload zone

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Backend | Express 4, TypeScript, Sharp, Multer |
| Background Removal | remove.bg API |
| Cloud Storage | Cloudinary |
| Deployment | Vercel (frontend), Render (backend) |

## Quick Start

### Prerequisites

- Node.js 18+
- API keys (free tiers):
  - [remove.bg](https://www.remove.bg/api) — 50 free calls/month
  - [Cloudinary](https://cloudinary.com) — free tier

### Setup

```bash
# Clone
git clone https://github.com/Kota1609/imageflow.git
cd imageflow

# Backend
cd backend
npm install
cp .env.example .env    # Fill in your API keys
npm run dev             # Starts on http://localhost:3001

# Frontend (new terminal)
cd frontend
npm install
npm run dev             # Starts on http://localhost:3000
```

Visit `http://localhost:3000` — the frontend proxies API calls to the backend automatically.

## API Reference

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/health` | Health check | `{ status, timestamp, uptime }` |
| `POST` | `/api/images/upload` | Upload & process image | `{ success, data: { imageId, url, originalUrl, processingTimeMs, fileSize } }` |
| `GET` | `/api/images` | List all processed images | `{ success, data: [{ imageId, url, originalUrl, createdAt, bytes }] }` |
| `GET` | `/api/images/:imageId` | Get single image | `{ success, data: { imageId, url, originalUrl, createdAt, bytes } }` |
| `DELETE` | `/api/images/:imageId` | Delete image | `{ success }` |

All responses include a `requestId` for tracing.

## Key Technical Decisions

### Why Zod for Environment Validation?

The server exits immediately on startup with clear error messages if any required key is missing. No more runtime crashes when a user hits an endpoint — fail fast, fail loud.

### Why Controller/Service Separation?

Controllers handle HTTP concerns (request parsing, response formatting). Services handle business logic (image processing pipeline). This makes the service layer testable independently of Express.

### Why `app.ts` Separate from `index.ts`?

Standard practice for testability — you can import the Express app in tests without starting the server.

### Why No CSS Framework?

Hand-crafted CSS with CSS variables demonstrates frontend proficiency. The design system uses semantic tokens for colors, spacing, radii, and shadows — making dark mode a simple variable swap with zero JS runtime cost.

### Why XHR Instead of Fetch for Upload?

`XMLHttpRequest` exposes `upload.onprogress` events, enabling the real-time upload progress indicator. The Fetch API does not support upload progress tracking.

### Why Multer Memory Storage?

No disk I/O overhead. Images are processed in-memory through the pipeline (remove bg → flip → upload to cloud) and never written to disk. Clean for containerized deployments.

## Project Structure

```
imageflow/
├── backend/
│   └── src/
│       ├── index.ts                 # Server entry point
│       ├── app.ts                   # Express app setup + routes
│       ├── config/env.ts            # Zod-validated environment
│       ├── types/index.ts           # Shared interfaces + constants
│       ├── errors/AppError.ts       # Custom error class
│       ├── middleware/
│       │   ├── requestId.ts         # UUID per request
│       │   ├── errorHandler.ts      # Global error handler
│       │   └── validate.ts          # File upload validation
│       ├── controllers/
│       │   └── imageController.ts   # Route handlers
│       └── services/
│           └── imageService.ts      # Image processing pipeline
├── frontend/
│   └── src/
│       ├── App.tsx                  # App assembly
│       ├── main.tsx                 # React entry
│       ├── types/index.ts           # Frontend interfaces
│       ├── styles/index.css         # Design system + dark mode
│       ├── utils/api.ts             # Typed API client
│       ├── hooks/
│       │   ├── useToast.ts          # Toast notifications
│       │   └── useImageUpload.ts    # Upload flow + progress
│       └── components/
│           ├── Header.tsx           # Branding + theme toggle
│           ├── Toast.tsx            # Toast container
│           ├── ImageUpload.tsx      # Upload zone
│           ├── ImageGallery.tsx     # Responsive grid
│           ├── ImageCard.tsx        # Card with actions
│           ├── CompareSlider.tsx    # Before/after slider
│           └── LoadingSkeleton.tsx  # Shimmer placeholder
└── README.md
```

## What I'd Do With More Time

- **WebSocket/SSE** for real-time processing step updates instead of simulated progress
- **Job queue** (BullMQ) for handling concurrent uploads without blocking
- **Redis caching** for the image list endpoint
- **Comprehensive tests** — Jest for backend services, React Testing Library for components
- **CI/CD pipeline** with GitHub Actions (lint → typecheck → test → deploy)
- **Rate limiting** middleware to prevent API abuse
- **Image compression** on the client before upload
- **Batch upload** support for multiple images at once
- **Admin dashboard** with usage analytics
