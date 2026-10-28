# BookLeaf API

Express REST API backed by MongoDB/Mongoose. Configure `.env` from `.env.example`, then run `npm install`, `npm run seed`, and `npm run dev`. `npm start` runs the production server. The seeder upserts source authors/books by stable IDs and creates author/admin login records. Set both seed passwords before seeding any shared environment.

The API listens on port 4000. See `../docs/API.md` for routes. Gemini classification and drafts use the server-only `GEMINI_API_KEY`; ticket classification falls back to a general category when it is absent.

## Source layout

- `src/routes/` maps HTTP endpoints to controllers.
- `src/controllers/` validates request input and shapes HTTP responses.
- `src/services/` contains authentication, ticket, and seeding workflows.
- `src/scripts/` contains executable maintenance entry points such as the database seeder.
- `src/models/` defines the Mongoose schemas.
- `src/middleware/` contains authentication, request checks, and centralized errors.
- `src/config/` and `src/utils/` hold shared configuration and helpers.
