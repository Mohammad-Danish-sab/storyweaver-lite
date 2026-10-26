# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Child reading profiles

Use the **Child profiles** button in the library navigation to open child spaces inside the app; child profile selection does not change the URL. A parent/guardian creates a family account with an email address and password, then signs in to manage child nicknames, unique user IDs, age groups, avatars, and each profile's maximum reading level. Reading progress, likes, and saved stories are stored on the server under that family account and are not exposed to the librarian review dashboard. The parent profile chooser shows completed and in-progress story counts. **My stories** is intentionally stored only in this browser on this device and is never uploaded; it does not follow the family account to another device.

Signed-in family accounts also sync saved stories and the Story Studio draft across devices. The Story Studio draft remains local to the browser when signed out. Story Studio submissions are held for librarian approval before publication. Reader comments are stored only in the current browser and are not public or synchronized. Readers can report catalogue stories; librarians review and resolve reports in the staff dashboard.

The library includes title/topic/level search and reader accessibility options for larger text, higher contrast, and an easy-reading font. These settings are saved in the current browser.

The frontend API defaults to `http://localhost:8000/api/v1`; set `VITE_API_URL` at build time when the backend is hosted elsewhere. The backend must use HTTPS in production and set `COOKIE_SECURE=true`. Configure `CORS_ORIGINS` as a comma-separated list of exact frontend origins. For password recovery email, set `FRONTEND_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, and (when required) `SMTP_USER` and `SMTP_PASSWORD`. SMTP uses STARTTLS except on port 465, which uses implicit TLS. Password reset links expire after 30 minutes and can only be used once. Passwords require at least 12 characters.
