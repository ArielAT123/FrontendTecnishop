# Tecnishop - Frontend Desktop (React 19 + TypeScript + Vite + Electron)

Modern desktop management system for technical service workshops, repair tracking, customer devices, inventory, and technical report invoicing.

## Architecture & Stack

- **UI Framework:** React 19 + TypeScript
- **Bundler:** Vite 6
- **Desktop Runtime:** Electron 34 with secure context bridge (`contextIsolation: true`, `nodeIntegration: false`)
- **Styling:** Tailwind CSS + custom dark/light design tokens & print styles
- **State & Caching:** TanStack React Query v5
- **Icons:** Lucide React
- **HTTP & Auth:** Axios with automated JWT token refresh interceptor

## Setup & Running

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
```bash
npm install
```

### Development (Desktop App with Hot Reload)
```bash
npm run dev
```

### Web-only Preview (Browser Mode)
```bash
npm run build:web
npm run preview
```

### Package Desktop Executables
```bash
# Windows Portable .exe
npm run dist

# Linux AppImage
npm run dist:linux
```

## Environment Configuration
Edit `.env`:
```env
# Local Backend
VITE_API_URL=http://127.0.0.1:8000/api

# Or Render Cloud Backend
# VITE_API_URL=https://backendtecnishop.onrender.com/api
```
