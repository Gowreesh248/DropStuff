# DropStuff — Temporary, QR-First File Sharing Service

DropStuff is a full-stack, temporary file-sharing application designed for fast, frictionless file transfer between devices. Senders drag-and-drop files, select an expiration timeframe, and receive a secure, unique URL and QR code. Recipients scan the QR code from mobile or open the link to download files individually or as a single ZIP archive.

---

## Architecture Diagram

```mermaid
flowchart TD
    subgraph Client ["Frontend (React + Vite + Tailwind CSS)"]
        UI[HomePage / Upload Dropzone] -->|Files + Expiration| API_Client[Axios API Client]
        SenderPage[DropCreatedPage] -->|Displays| QR[QRCodeSVG Recipient Link]
        RecipientPage[RecipientDropPage] -->|Requests| DownloadZip[Download All ZIP / Single File]
    end

    subgraph Server ["Backend (Express + Node.js + TypeScript)"]
        UploadMW[Multer Upload Middleware] -->|Validates size & counts| Controller[DropController]
        Controller -->|Creates records| DropService[DropService]
        Controller -->|Streams ZIP| ZipService[Archiver ZIP Service]
        CleanupJob[Cron Expiration Sweeper] -->|Purges expired| StorageEngine[Local Disk Storage & SQLite DB]
    end

    subgraph Database ["Prisma ORM (SQLite)"]
        DB[(dev.db)]
    end

    subgraph Storage ["Local Disk Directory"]
        FS[uploads/{dropId}/]
    end

    API_Client -->|POST /api/drops| UploadMW
    API_Client -->|GET /api/drops/:token| Controller
    API_Client -->|GET /api/drops/:token/download-all| ZipService
    DropService --> DB
    DropService --> FS
    ZipService --> FS
    CleanupJob --> DB
    CleanupJob --> FS
```

---

## Features

- **QR-First Transfer Workflow**: Instantly generate scannable QR codes encoding secure recipient URLs.
- **Multiple File Uploads**: Drag and drop up to 20 files with real-time total count and total size tracking.
- **Configurable Expiration**: Choose retention periods from 1 hour, 6 hours, 24 hours (default), 3 days, or 7 days.
- **Streaming ZIP Download**: Download all files in a drop with one click as a dynamically created ZIP archive using streaming (`archiver`) to avoid memory bottlenecks.
- **Filename Deduplication**: Automatically renames duplicate filenames inside ZIP archives (e.g. `document.pdf`, `document (1).pdf`).
- **Instant Revocation**: Senders can manually revoke active drops at any time.
- **Automated Expired Drop Purging**: Background job cleans expired DB entries and recursively deletes physical storage directories.
- **Strict SaaS Visual Design**: Clean light theme with slate grays, sharp borders, royal blue accents, and responsive mobile-optimized layouts.

---

## Tech Stack

### Frontend
- **React 18** with **TypeScript**
- **Vite** bundler & proxy dev server
- **Tailwind CSS** with custom SaaS design system tokens
- **Lucide React** icon library
- **qrcode.react** SVG generator
- **React Router DOM v6**

### Backend
- **Node.js** & **Express** (TypeScript)
- **Prisma ORM** with **SQLite** (`dev.db`)
- **Multer** for multipart file handling
- **Archiver** for streaming ZIP archives
- **Node-Cron** for automated cleanup jobs
- **Helmet** & **CORS** for HTTP security

---

## Database Schema

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Drop {
  id            String   @id @default(uuid())
  token         String   @unique
  createdAt     DateTime @default(now())
  expiresAt     DateTime
  totalSize     BigInt   @default(0)
  fileCount     Int      @default(0)
  downloadCount Int      @default(0)
  status        String   @default("ACTIVE") // ACTIVE, REVOKED, EXPIRED
  files         File[]

  @@index([token])
  @@index([expiresAt])
}

model File {
  id           String   @id @default(uuid())
  dropId       String
  drop         Drop     @relation(fields: [dropId], references: [id], onDelete: Cascade)
  originalName String
  storedName   String
  size         BigInt
  mimeType     String
  createdAt    DateTime @default(now())
  storagePath  String
}
```

---

## API Endpoints

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/api/drops` | Create drop & upload files (multipart) | `201`, `400`, `413`, `500` |
| `GET` | `/api/drops/:token` | Fetch drop metadata & file list | `200`, `404`, `410`, `500` |
| `GET` | `/api/drops/:token/files/:fileId` | Download single file attachment | `200`, `404`, `410`, `500` |
| `GET` | `/api/drops/:token/download-all` | Download all files as streamed ZIP archive | `200`, `404`, `410`, `500` |
| `DELETE` | `/api/drops/:token` | Revoke a drop immediately | `200`, `404`, `500` |
| `GET` | `/api/health` | System health status check | `200` |

---

## Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation & Launch

1. **Clone repository and install dependencies**:
   ```bash
   # Install root dependencies
   npm install

   # Install server dependencies
   npm install --prefix server

   # Install client dependencies
   npm install --prefix client
   ```

2. **Initialize SQLite Database with Prisma**:
   ```bash
   npm run db:push --prefix server
   ```

3. **Start Development Servers**:
   ```bash
   npm run dev
   ```
   - **Frontend App**: `http://localhost:5173`
   - **Backend Express API**: `http://localhost:5000`

---

## Environment Variables

Server configuration file: `server/.env`

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
STORAGE_PATH="./uploads"
MAX_FILE_SIZE=104857600       # 100 MB per file limit
MAX_FILES_PER_DROP=20         # Max 20 files per drop
MAX_TOTAL_DROP_SIZE=524288000 # 500 MB total drop size
BASE_URL="http://localhost:5173"
```

---

## File Storage & Security Considerations

1. **Cryptographic Access Tokens**: Drops use 24-character cryptographically random hexadecimal strings (`crypto.randomBytes(12)`). Sequential database UUIDs are never exposed in public recipient links.
2. **Directory Isolation**: Uploaded files are grouped under dedicated directories (`uploads/<dropId>/`).
3. **Path Traversal Protection**: Uploaded filenames are sanitized using standard `path.basename` and null-byte filtering before file operations.
4. **Backend Expiration Enforcement**: The Express server checks `expiresAt < new Date()` on every API interaction before serving file streams.
5. **Disk Purging**: When a drop expires or is revoked, physical folders and DB records are deleted recursively.

---

## Future Roadmap

### Phase 2
- Password-protected drops with bcrypt hashing
- Maximum download count limits (e.g. self-destruct after 1 download)
- Detailed recipient download analytics

### Phase 3
- S3 / R2 compatible cloud object storage adapter
- Chunked resumable file uploads (Tus protocol)

### Phase 4
- WebRTC peer-to-peer direct file transfer option
- Cross-device transfer history tab with local storage
