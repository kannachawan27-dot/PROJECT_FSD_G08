G8 BAKERY — CRUMBCRAFT FESTIVAL CAKE CUSTOMIZER
Version 2.1.0 | Full-stack JavaScript, HTML, CSS and SQLite

PROJECT HIGHLIGHTS
- Responsive customer website with live cake customization and server-calculated pricing.
- Dynamic SVG cake specification with downloadable vector artwork.
- Festival booking API with server-side validation and atomic daily capacity enforcement (25 active cakes per date).
- SQLite persistence using WAL mode and prepared SQL statements.
- Admin dashboard with protected order management, legal status transitions, search, filters, CSV export, printable receipts and supplier purchase orders.
- Flavor-specific sample ingredient BOM forecasting with a clearly disclosed 5% preparation buffer.
- Admin authentication with scrypt password hashes, random session tokens, HttpOnly/SameSite cookies and configurable Secure cookies.
- Login throttling (5 failed attempts per IP per 15-minute window), structured JSON event logs and security response headers.
- Automated integration and security tests using Node.js native test runner.

REQUIREMENTS
- Node.js 22.5 or newer (Node.js 22 LTS+ recommended).
- npm (included with Node.js).

FIRST-TIME SETUP
1. Extract the ZIP file.
2. Open the inner FSD_PROJECT_G8 folder in VS Code (the folder containing package.json and server.js).
3. Open Terminal > New Terminal.
4. Run: npm run create-admin
5. Create a unique admin username and a strong password of at least 12 characters.
6. Run: npm test
7. Run: npm start
8. Open http://localhost:3000 in your browser.

IMPORTANT: Do not open HTML/index.html directly and do not use VS Code Live Server. The customer booking form needs the Node.js API.

ADMIN ACCESS
- Open http://localhost:3000/G8owner-login.html
- Sign in with the credentials created using npm run create-admin.
- There is no default password in the source code.

DEPLOYMENT CHECKLIST
- Set COOKIE_SECURE=true when deployed behind HTTPS. Do not enable it for plain HTTP localhost.
- Use HTTPS, a trusted reverse proxy and a persistent disk for data/g8-bakery.sqlite.
- Set PORT using the hosting provider's environment variable.
- Back up the SQLite database regularly. Never commit the database, admin credentials, .env files or secrets.
- The in-memory session store and login throttle reset when the process restarts. For multi-instance production deployments, replace them with a shared session/rate-limit store.
- Configure a persistent database volume on hosting platforms; ephemeral filesystems can erase bookings after redeployment.

BUSINESS ASSUMPTIONS
- The daily limit is 25 non-cancelled bookings per pickup date.
- Early-bird discount: 10% for bookings at least 7 calendar days ahead.
- Ingredient BOM figures are sample estimates, not verified bakery recipes. Confirm them with actual recipes before buying stock.
- Cake inspiration uploads are local previews only and are not stored on the server.
- SVG design export is a visual specification; it is not a photorealistic cake rendering.

TESTING
Run: npm test
The suite covers login, protected dashboard access, booking creation, order status transitions, capacity limits, sanitization, password hashing, calendar dates and cake option validation.

PROJECT STRUCTURE
HTML/       Customer, admin dashboard and admin login pages
CSS/        Responsive shared stylesheet
JS/         Customer and admin browser logic
server.js   Node.js HTTP API and SQLite persistence
scripts/    Admin account creation utility
tests/      Integration and security tests
data/       Runtime SQLite database (created automatically)
