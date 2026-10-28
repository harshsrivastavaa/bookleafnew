# BookLeaf Publishing Portal

BookLeaf is a full-stack publishing support portal for authors and the BookLeaf support team. It contains a Next.js frontend and a separate Express API backed by MongoDB. Authors can view their books and royalties and raise support tickets. Support admins can review tickets, reply, add private notes, update ticket fields, and request an editable Gemini response draft.

This guide covers installing and running the project locally. It does not claim that the app has been deployed.

> **Current state:** The backend and frontend can be installed and started using the steps below. The current Next.js route files render `null`, however, so the portal UI is not visible yet. The portal components exist but need to be mounted by the route files. See [Current limitations](#current-limitations).



### Author workspace

- Sign in with an author email and the password used when seeding.
- View the author's books, publication status, sales and royalty values.
- Open support tickets for a specific book or as a general/account question.
- Attach one PDF, Word, text, JPEG, or PNG file up to 5 MB to a ticket.
- Reply to a ticket and see status updates through periodic refresh.

Authors are restricted to their own books and tickets. Private admin notes are removed from author-facing ticket responses.

### Admin workspace

- Review tickets across authors and filter by status, category, priority, date, or search text.
- Assign tickets to an admin and update status, category, and priority.
- Send author-visible replies or add internal notes for staff.
- Ask Gemini to draft a reply, edit it, and send it manually.

Ticket categories are Royalties & Payments, ISBN & Metadata Issues, Printing & Quality, Distribution & Availability, Book Status & Production Updates, and General Inquiry. Priority values are Critical, High, Medium, and Low.

### Gemini assistance

When `GEMINI_API_KEY` is configured, ticket classification runs in the background after a ticket is saved, so a Gemini timeout does not prevent ticket submission. Admins can also request an editable reply draft. If Gemini is not configured or temporarily unavailable, ticket creation and manual replies remain available.

## Technology and folders

- `frontend/`: Next.js App Router, React, TypeScript, Tailwind CSS, Formik/Yup, Axios, and Lucide icons.
- `backend/`: Node.js, Express, MongoDB/Mongoose, JWT cookies, bcrypt, Yup validation, uploads, and Google's `@google/genai` SDK.
- `frontend/bookleaf_sample_data.json`: the source records used by the database seeder.
- `frontend/BookLeaf_Technical_Assignment_1.pdf`: assignment reference.
- `backend/README.md`: backend-specific notes.

The frontend and backend have separate package files and must be installed and run separately.

## Prerequisites

Install the following before setup:

1. **Node.js 20 or newer** (and npm). The Gemini SDK requires a supported modern Node runtime.
2. **MongoDB**, either MongoDB Community Server running locally or a MongoDB Atlas cluster.
3. **Git** if you are cloning the project.
4. A **Gemini API key** only if you want AI classification and response drafts. The rest of the portal can run without it.

Check the tools from PowerShell:

```powershell
node --version
npm --version
```

The local MongoDB URI in the example configuration assumes MongoDB is accepting connections on `127.0.0.1:27017`.

## First-time setup

Open PowerShell in the repository root (the folder containing this README).

### 1. Create the local environment files

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

Open `backend/.env` and replace the example JWT secret and seed passwords. A random JWT secret can be generated with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Paste that value into `JWT_SECRET`. Do not use the example secret or example passwords for a shared or deployed environment. Keep `.env` and `.env.local` private; never paste API keys into frontend environment variables.

### 2. Configure MongoDB

For a local database, start MongoDB Community Server and keep the example value:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/bookleaf_portal
```

For MongoDB Atlas, create a database user, allow network access from your development machine, and copy the cluster connection URI into `MONGODB_URI`. Replace the username, password, and database name in the URI with your own values. If the password contains reserved URL characters, URL-encode it. Do not commit this URI.

### 3. Install backend dependencies

```powershell
Set-Location backend
npm ci
Set-Location ..
```

`npm ci` installs the versions recorded in `backend/package-lock.json`.

### 4. Install frontend dependencies

```powershell
Set-Location frontend
npm ci
Set-Location ..
```

### 5. Seed the database

Make sure MongoDB is running and the `MONGODB_URI` in `backend/.env` is correct. Then run:

```powershell
Set-Location backend
npm run seed
Set-Location ..
```

The seeder reads `frontend/bookleaf_sample_data.json`, creates or updates the 10 author profiles and 18 books, then creates their login users and one admin user. It uses upserts, so running it again does not create duplicate authors or books. It will refresh the seeded author/book fields and set the account passwords to the current values in `.env`.

## Environment variables

### Backend: `backend/.env`

| Variable | Required | Purpose |
|---|---:|---|
| `NODE_ENV` | No | Use `development` locally and `production` on the deployed API. |
| `PORT` | No | API port; defaults to `4000`. |
| `MONGODB_URI` | Recommended | Local MongoDB or Atlas connection string. If omitted, the backend defaults to the local URI shown above. |
| `CLIENT_ORIGIN` | Yes | Exact frontend origin allowed by CORS; local default is `http://localhost:3000`. |
| `JWT_SECRET` | Yes for login | Random secret of at least 32 characters used to sign login tokens. |
| `COOKIE_NAME` | No | HTTP-only session cookie name; defaults to `bookleaf_token`. |
| `COOKIE_SAME_SITE` | No | Cookie policy. Defaults to `lax`; production cross-site hosting may require `none` over HTTPS. |
| `GEMINI_API_KEY` | No | Server-only Google Gemini API key. Leave empty to disable AI features. |
| `GEMINI_MODEL` | No | Gemini model name; example default: `gemini-3.8-flash`. |
| `AI_TIMEOUT_MS` | No | Gemini request timeout in milliseconds; default in the service is 45,000 and it is capped at 90,000. |
| `AI_DEBUG` | No | Set to `true` for additional AI diagnostics during development. Avoid enabling it in production because debug output may include generated content. |
| `SEED_ADMIN_EMAIL` | No | Admin email created by the seeder; defaults to `admin@example.com`. |
| `SEED_ADMIN_PASSWORD` | Yes for shared use | Password assigned to the seeded admin account. |
| `SEED_AUTHOR_PASSWORD` | Yes for shared use | Password assigned to the seeded author accounts. |

For local convenience, if seed passwords are not set the seeder uses `BookLeafAdmin-123!` and `BookLeafDemo-123!`. Set your own values before seeding and do not use those defaults in production.

### Frontend: `frontend/.env.local`

| Variable | Required | Purpose |
|---|---:|---|
| `NEXT_PUBLIC_API_URL` | No | Backend API URL. Defaults to `http://localhost:4000/api`. |

Only values safe to expose in a browser belong in `NEXT_PUBLIC_*` variables. Never put `GEMINI_API_KEY`, `JWT_SECRET`, MongoDB credentials, or seed passwords in the frontend environment.

## Seed data and demo accounts

Seeded author emails come from the provided JSON file. For example:

```text
priya.sharma@email.com
rohit.kapoor@email.com
```

The author password is the value of `SEED_AUTHOR_PASSWORD`. The admin signs in with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`. With the development fallback values, the admin email is `admin@example.com`; use the passwords listed above only when you left the sample values unchanged.

If you change either seed password, run `npm run seed` again from `backend/`. The seeder resets the seeded accounts to the configured password values.

## Run the app

Run the backend and frontend in two separate PowerShell windows. MongoDB must be running first.

### Terminal 1: API

```powershell
Set-Location .\backend
npm run dev
```

The API starts on `http://localhost:4000` by default. Verify that it is responding by opening `http://localhost:4000/api/health`; it should return:

```json
{"ok":true}
```

### Terminal 2: frontend

```powershell
Set-Location .\frontend
npm run dev
```

Open `http://localhost:3000` in your browser. Sign in with a seeded author account or the configured admin account.

## Useful commands

Run these commands from the appropriate application folder.

| Task | Folder | Command |
|---|---|---|
| Start backend in watch mode | `backend/` | `npm run dev` |
| Start backend normally | `backend/` | `npm start` |
| Seed or refresh sample records | `backend/` | `npm run seed` |
| Run backend tests | `backend/` | `npm test` |
| Start frontend in development | `frontend/` | `npm run dev` |
| Check frontend TypeScript | `frontend/` | `npm run lint` |
| Build frontend for production | `frontend/` | `npm run build` |
| Start built frontend | `frontend/` | `npm start` |

## Gemini setup

1. Create or select a Gemini API key using Google AI Studio.
2. Put it in `backend/.env` as `GEMINI_API_KEY=...`.
3. Choose a supported Gemini model in `GEMINI_MODEL` if you do not want the configured default.
4. Restart the backend after changing the environment.

The frontend never receives the Gemini key. Classification uses a constrained JSON response and runs after ticket creation. Admin reply drafts use Gemini too, but are returned to the editor and must be reviewed and sent manually. Provider timeouts and errors are handled by the API; an AI failure does not prevent manual ticket replies.

## API overview

The API base URL is `http://localhost:4000/api` by default. Mutating requests require the `X-Requested-With: XMLHttpRequest` request header; the frontend API client sets it automatically. The session is an HTTP-only cookie, so browser requests include credentials.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | API health check. |
| `POST` | `/auth/login` | Public | Sign in and create the session cookie. |
| `POST` | `/auth/logout` | Public | Clear the session cookie. |
| `GET` | `/auth/me` | Signed in | Return the current user. |
| `GET` | `/dashboard` | Signed in | Return role-specific dashboard totals. |
| `GET` | `/books` | Signed in | Return the author's books; admins can see the catalog. |
| `GET` | `/admins` | Admin | Return support admins for ticket assignment. |
| `GET` | `/tickets` | Signed in | List tickets with pagination; admins can filter the queue. |
| `POST` | `/tickets` | Author | Create a ticket, optionally with one file attachment. |
| `GET` | `/tickets/:id` | Signed in | Read a ticket the user is authorized to access. |
| `GET` | `/tickets/:id/attachment` | Signed in | Download an authorized ticket attachment. |
| `POST` | `/tickets/:id/replies` | Signed in | Add a public conversation message. |
| `PATCH` | `/tickets/:id` | Admin | Change ticket status, category, priority, or assignee. |
| `POST` | `/tickets/:id/notes` | Admin | Add a private internal note. |
| `POST` | `/tickets/:id/ai-draft` | Admin | Generate a Gemini draft reply. |

For request/response details, see the route controllers under `backend/src/controllers/` and ticket workflow code under `backend/src/services/`. The API returns JSON errors with an `error` message and, for AI failures, a machine-readable `code` and `retryable` flag.

## Security notes

- Passwords are hashed before storage. Session JWTs are stored in HTTP-only cookies, not browser local storage.
- The API applies role checks and author ownership checks on book and ticket operations.
- Mutating requests require the custom request header as an additional CSRF mitigation; CORS is restricted to `CLIENT_ORIGIN`.
- In production use HTTPS, a long random JWT secret, strong database credentials, a private network policy for MongoDB, and an exact frontend origin.
- If the frontend and API are truly cross-site, configure `COOKIE_SAME_SITE=none` and HTTPS so the browser will send the cookie. For same-site deployments, `lax` is the safer default.
- Ticket uploads are limited to one allowed file of 5 MB. Files are currently held in MongoDB; for a larger production deployment, move attachments to private object storage.
- Never commit `.env` files or publish this assignment solution publicly.

## Troubleshooting

### `MongoDB connection failed`

Confirm MongoDB is running, the URI is correct, and Atlas allows your current IP. Check that special characters in an Atlas password are URL-encoded.

### Browser reports a network or CORS error

Make sure the API is running, `NEXT_PUBLIC_API_URL` points to the API's `/api` base, and `CLIENT_ORIGIN` exactly matches the browser origin (including scheme and port). Restart both servers after changing environment values.

### Login returns an error

Run the seed command and use an author email from the JSON data with `SEED_AUTHOR_PASSWORD`, or use `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`. If you changed password variables after seeding, run the seeder again.

### Gemini features are unavailable

Confirm `GEMINI_API_KEY` is set in `backend/.env`, the model name is supported for your API key, and restart the backend. Ticket creation and manual replies should still work without Gemini.

### Port is already in use

Stop the process using port 3000 or 4000, or change the backend `PORT`. To run Next.js on another port, use `npm run dev -- --port 3001` from `frontend/`. If changing ports, update `CLIENT_ORIGIN` and `NEXT_PUBLIC_API_URL` accordingly.

## Deployment outline

1. Provision MongoDB Atlas and configure a restricted database user and network access.
2. Deploy the Express API to a Node.js host. Set all backend environment values in the host's secret manager. Run `npm ci`, then run `npm run seed` once against the intended database if the supplied sample users/books are required.
3. Deploy the Next.js frontend to a host that supports Next.js. Set `NEXT_PUBLIC_API_URL` to the deployed API's `/api` base URL.
4. Set the API's `CLIENT_ORIGIN` to the exact deployed frontend origin. Configure HTTPS and cookie settings for the actual frontend/API domain relationship.
5. Confirm health, login, author ownership, admin access, ticket replies, and file downloads against the deployed services before sharing the application.

No deployment has been performed from this repository.

## Current limitations

- The current Next.js route entry files (`frontend/src/app/page.tsx`, `frontend/src/app/books/page.tsx`, and `frontend/src/app/tickets/page.tsx`) currently render `null`. The portal UI components exist under `frontend/src/components/portal/`, but those routes need to mount the page component before the browser displays the portal.
- The frontend currently uses the Next.js 14 dependency line. Run `npm audit` and upgrade to a supported patched release before production deployment.
- Full live Gemini behavior requires a valid API key and available Gemini service. No live Gemini request or hosted deployment is implied by these setup instructions.
