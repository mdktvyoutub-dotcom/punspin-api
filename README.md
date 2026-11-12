# PunSpin API

## Render settings
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`

## Environment variables
- `SUPABASE_URL`: your Supabase Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: server-side Supabase service role/secret key (never put this in HTML or publish it)
- `ADMIN_TOKEN`: a long private admin password/token

The API implements the endpoints used by the current PunSpin HTML:
- GET `/challenges`
- POST `/challenges`
- GET `/admin/challenges`
- PATCH `/admin/challenges/:id`
- DELETE `/admin/challenges/:id`

Public submissions are stored as `pending`. Only approved challenges are returned publicly.
