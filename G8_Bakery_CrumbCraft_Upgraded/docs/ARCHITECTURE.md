# G8 Bakery — Architecture Notes

## Three-tier structure

```text
Customer browser / Admin browser
        | HTML, CSS, JavaScript + JSON fetch
        v
Node.js HTTP API (server.js)
  | validation and price calculation
  | authentication and session checks
  | atomic capacity enforcement
  | structured operational events
        v
SQLite database (WAL mode)
  | admins
  | bookings
```

## Important engineering decisions

- The browser may show an estimate, but the server independently validates the cake choices and calculates the final price.
- Prepared SQL statements are used for database reads and writes.
- The daily booking limit is checked inside an immediate SQLite transaction so concurrent requests cannot both consume the final slot.
- Passwords are stored as scrypt hashes with unique salts. Raw passwords are never logged or stored.
- Admin routes require a valid server-side session. Session cookies use HttpOnly and SameSite=Strict; enable `COOKIE_SECURE=true` behind HTTPS.
- Order status changes follow the workflow `Confirmed -> Accepted -> Completed` or `Confirmed/Accepted -> Cancelled`.
- The frontend uses DOM text APIs for customer-controlled content and escapes content inserted into receipt templates.
- SVG output is generated from allow-listed cake options. User-provided cake messages are XML-escaped before being inserted into the SVG.

## Operational limitations

The current session and login-throttle stores are in-memory. They are appropriate for a single-process student deployment but should be replaced with shared storage before horizontal scaling. SQLite needs a persistent disk on the hosting platform. The sample ingredient BOMs are estimates and must be checked against real bakery recipes.
