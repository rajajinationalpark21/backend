# Jungle Safari — Backend API

Express 4 + Mongoose 8 API for the Rajaji National Park safari website and its admin panel. It serves the CMS content, blogs and public forms (booking, contact, feedback), and handles admin sign-in and image uploads (Cloudinary).

- Production: `https://backend-hbkg.onrender.com/api` (Render, `render.yaml`)
- Website: `../frontend` · Admin panel: `../admin`

## Run locally

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev            # http://localhost:4000/api, restarts on change
```

Use a **local or separate** MongoDB for development (`MONGODB_URI=mongodb://127.0.0.1:27017/jungle_safari`). Don't point a laptop `.env` at the production cluster.

## Environment variables

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `production` on Render. In development, error responses include stack traces |
| `PORT` | Defaults to 4000 |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Required in production; signs admin tokens |
| `JWT_EXPIRES_IN` | Admin token lifetime (default `7d`) |
| `CLIENT_ORIGINS` | Comma-separated browser origins allowed by CORS (the website and admin URLs) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` | Image storage. Images are only ever deleted from under `CLOUDINARY_FOLDER/` |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | First admin account, created by `npm run seed` |
| `MAX_FILE_SIZE_MB`, `MAX_FILES_PER_REQUEST` | Upload limits |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `npm start` | Run the API (watch mode / plain) |
| `npm run seed` | Create the first admin and fill empty content sections (`seed:force` overwrites) |
| `node src/scripts/applyClientDocAdditions.js --dry-run` | Load the client's documents (`src/seed/clientDocPages.json`) into the CMS. **Writes unless `--dry-run` is given**; always dry-run first. `--local-media=<dir> --media-base=<url>` keeps photos local for previews |
| `python tools/extract_client_docs.py` | Regenerate `src/seed/clientDocPages.json` from the `.docx` files in `../documentation` (needs `python-docx`) |

Other scripts in `src/scripts/` and `src/seed/` are one-off data jobs. Read the header comment before running one, and check which database `.env` points at.

## Layout

```
src/
  app.js, server.js     Express app and startup
  config/               env, db, cloudinary (image optimise/upload/delete)
  routes/               URL → controller
  controllers/          request handling (keep thin)
  services/             audit log, ownership
  middleware/           auth (requireAdmin, requireOwner), uploads, rate limits, errors
  models/               Content (one document, one sub-schema per page), Blog, Booking, Contact,
                        Feedback, Admin, AuditLog, GalleryImage
  utils/                validation, spam trap, slugify, AppError
  seed/, scripts/       data seeding and content scripts
tools/                  document extractor (Python)
```

## API overview (`/api`)

| Area | Public | Admin (Bearer token) |
|---|---|---|
| Content | `GET content/get` (all pages) | `POST content/update` (`section` + changed fields as JSON; merged into the section) |
| Blogs | `GET blogs/get`, `GET blogs/detail/:idOrSlug` | `POST blogs/add`, `PATCH blogs/update`, `DELETE blogs/delete/:id` |
| Booking | `POST booking/submit` | `GET booking/get`, `PATCH booking/update`, `DELETE booking/delete` |
| Contact | `POST contact/submit` | `GET contact/get`, `DELETE contact/delete` |
| Feedback | `GET feedback/get`, `POST feedback/submit` | `GET feedback/admin/all`, `PATCH feedback/update`, `DELETE feedback/delete` |
| Uploads | — | `POST uploads/image` |
| Admin | `POST admin/login` | `GET admin/me`, `PATCH admin/update-profile`, `PATCH admin/change-password`, `GET admin/users` |
| Owner only | — | `POST admin/create-user`, `DELETE admin/delete-user`, `PATCH admin/transfer-ownership`, `GET admin/audit` |

Notes:
- **Owner role.** One admin owns the panel: the account with role `owner`, or the first account ever created if none has that role. Only the owner can add, remove or promote admins and read the activity log.
- **Activity log.** Every admin change (content, blogs, bookings, inquiries, reviews, uploads, admin accounts) is recorded in `AuditLog` and kept for a year.
- **Spam trap.** Public forms accept a hidden `website_hp` field. When it's filled, the request gets a normal success response but nothing is stored.
- **Blog slugs.** Every post stores a unique `slug`, made from the title on save. Posts are fetched by id or slug.
- **Cloudinary ids.** `*PublicId` fields are set only by the server. Values sent in content updates are ignored.

## Deploy

Render builds with `npm install` and runs `npm start` (`render.yaml`). Set the environment variables above in the Render dashboard. Pushing to `main` deploys.
