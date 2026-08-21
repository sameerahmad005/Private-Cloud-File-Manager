# Private Cloud File Manager

A self-hosted personal cloud storage and file management web application backed by Google Drive API v3.

Made by **Sameer** &middot; GitHub: [https://github.com/sameerahmad005/Private-Cloud-File-Manager](https://github.com/sameerahmad005/Private-Cloud-File-Manager)

Private Cloud File Manager allows you to run your own web-based file management dashboard on your server while leveraging your own Google Drive storage for file persistence.

---

## Features

- 📁 **File & Folder Management:** Upload, download, rename, move, and soft-delete files and folders.
- 👁️ **Inline Media Previews:** Stream PDFs, images, videos, and text files directly inside the browser.
- 📝 **Markdown Notes Editor:** Create, edit, and organize markdown notes directly stored in your Google Drive.
- ⭐ **Favorites & Recents:** Quick access to starred items and recently accessed files.
- 🔍 **Full-Text Search:** Instantly search across files and folders in your storage workspace.
- 🛡️ **Strict Root Hierarchy Boundary:** Enforces server-side boundary checks so operations cannot access files outside your chosen root folder.
- 🔒 **Security & Privacy:** Server-side sessions, anti-CSRF token protection, bcrypt password hashing, IP brute-force lockout protection, and security headers (Helmet).
- 🚀 **First-Run Setup Wizard:** Interactive setup flow (`/setup`) to create admin credentials, configure Google OAuth, and select or create your storage root folder.

---

## System Architecture

```
                                +-----------------------------------+
                                |   Client Single Page App (React)  |
                                +-----------------------------------+
                                                  |
                                                  | REST API Requests (Axios + CSRF Header)
                                                  v
                                +-----------------------------------+
                                |    Express REST API Backend       |
                                |  (Session, Auth, Rate Limiter)    |
                                +-----------------------------------+
                                     /                         \
                                    /                           \
                                   v                             v
            +----------------------------------+     +-------------------------------+
            | Google Drive Service (API v3)    |     | Local App Metadata Database   |
            | (OAuth2 Auth, Boundary Check)    |     | (JSON store: Users, Settings) |
            +----------------------------------+     +-------------------------------+
                           |
                           v
            +----------------------------------+
            |      User's Google Drive         |
            |   (Configured Root Folder)       |
            +----------------------------------+
```

---

## Requirements

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Google Account & Google Cloud Console Project** with Google Drive API v3 enabled.

---

## Installation & First-Run Setup

### 1. Clone the Repository

```bash
git clone https://github.com/sameerahmad005/Private-Cloud-File-Manager.git
cd Private-Cloud-File-Manager
```

### 2. Install Dependencies & Build

```bash
# Install root dependencies
npm install

# Build client and server
npm run build
```

### 3. Configure Environment File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` if you need custom port or session settings:

```env
APP_ENV=production
APP_URL=http://localhost:5000
PORT=5000
AUTH_ENABLED=true
SESSION_SECRET=your_32_character_random_session_secret
```

### 4. Google Cloud Setup (OAuth Credentials)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. `My Cloud Storage`).
3. Enable the **Google Drive API** in *APIs & Services > Library*.
4. Configure the **OAuth Consent Screen** (*External* or *Internal*).
5. Create credentials under *APIs & Services > Credentials*:
   - Type: **Web application**
   - Authorized redirect URIs: `http://localhost:5000/api/setup/oauth/callback` (or `https://your-domain.com/api/setup/oauth/callback`)
6. Copy your **Client ID** and **Client Secret**.

### 5. Launch Application & Run Setup Wizard

Start the application:

```bash
npm start
```

Open your browser and navigate to:

```
http://localhost:5000/setup
```

Follow the 6-step setup wizard:
1. **Welcome:** System architecture and prerequisites check.
2. **Administrator Account:** Create your admin username and secure password (hashed via bcrypt).
3. **OAuth Client Credentials:** Enter your own Google Client ID & Client Secret (or view the in-app setup guide at `/setup/google-oauth-guide`).
4. **Connect Google Account:** Authorize Google Drive storage access.
5. **Root Storage Folder:** Choose an existing Google Drive folder or create a new dedicated folder (e.g., `Private Cloud`).
6. **Review & Complete:** Confirm setup parameters and complete first-run installation.

Once setup is finalized, the `/setup` route is permanently locked, and you will be redirected to log in.

---

## NPM Scripts

- `npm run dev:server` — Run Express backend in watch mode (Development).
- `npm run dev:client` — Run Vite React frontend in dev mode.
- `npm run build` — Compile server TypeScript and bundle client frontend.
- `npm start` — Start production server.
- `npm test` — Run server automated unit tests.

---

## Security Considerations

- **Server-Side Token Storage:** Refresh tokens and client secrets are stored exclusively server-side in your app database/environment and are never sent to the browser.
- **Root Boundary Protection:** Server verifies parent pointers to ensure no requested file ID escapes the configured root folder.
- **Session Security:** Cookies use HTTP-only, SameSite lax, and production secure flags with auto-generated session secrets.
