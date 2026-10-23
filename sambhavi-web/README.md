# Sambhavi Shiva – React frontend (Crimson Velvet)

React 18 + TypeScript + Vite + framer-motion. Talks to the **TarotCardAPI** (.NET 8) with JWT.

## Run
1. Start the .NET API (`dotnet run`). Note its https URL (Swagger shows it, e.g. `https://localhost:7194`).
2. Put that URL in `.env`  →  `VITE_API_URL=https://localhost:7194`
3. `npm install` then `npm run dev` → http://localhost:5173
4. Trust the dev certificate once, or the browser blocks calls to https://localhost: `dotnet dev-certs https --trust`
5. The API's CORS list (`Cors:AllowedOrigins` in appsettings.json) must contain `http://localhost:5173`.

## How it works
- **One login form** (Log in / Create account). The role inside the token decides what you see:
  an **Admin** account lands in the **Admin panel**; a **User** gets the website, "My account" and booking. There is no admin option anywhere in the login UI.
- Not logged in and you press **Book** → a login prompt opens, and after login the booking continues where you left off.
- **Booking**: 3 steps (reading → day & time → question) → `POST /api/bookings`.
- **Reviews**: only a message field; new user reviews wait for admin approval (admin reviews go live at once).
- **My account**: edit details, change password, see/cancel bookings, see/delete reviews.
- **Admin panel**: Overview (counts + revenue), Bookings (search, filter, change status, delete), Reviews (approve / delete), Users (search, change role, delete), Packages (add / edit / delete).

## Files
- `src/api.ts` – **every API call lives here** (base URL, JWT header, error messages, 401 → sign out).
- `src/types.ts` – types matching the API's DTOs.
- `src/components/` – site sections, modals, account page; `src/components/admin/` – admin panel.
- `src/styles.css` – Crimson Velvet theme tokens at the top (`:root`).
- `mock-server/` – optional stand-in API for trying the UI without SQL Server: `npm run mock`, then `VITE_API_URL=http://localhost:5000` in `.env.local`.
  (admin@sambhavishiva.com / Admin@123, ananya@example.com / Test@1234)
