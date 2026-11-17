# Aurix Frontend

Aurix Frontend is a React + Vite application for the Aurix business workflow. It runs under the `/aurixapp/` base path, talks to the Aurix backend through Axios, and can be packaged as `aurixapp.war` for Tomcat deployment.

## What This App Includes

Business modules:

- Cash Marking
- Daily Visiting Customer
- Easy Total
- Item Details
- Sales Entry

Admin and account pages:

- Sign In
- Change Password
- Register User
- Update User Frames
- Delete User

## Stack

- React 19
- Vite 7
- React Router
- Axios
- Tailwind CSS
- ESLint
- `bestzip` for WAR packaging

## Project Layout

Important files and folders:

- `src/App.jsx` - app routes, protected routes, and inactivity logout
- `src/api/axiosConfig.js` - shared Axios instances and auth header interceptor
- `src/api/ShopAPI.js` - shop, user, and CRM-related API helpers
- `src/api/SalesEntryApi.js` - Sales Entry related backend calls
- `src/api/DailyCustomerApi.js` - Daily Customer module API layer
- `src/components/layout/MainPageFrame.jsx` - shared app frame
- `src/components/layout/ModulePageLayout.jsx` - shared module page wrapper with menu/title
- `src/components/pages/` - page-level screens and lookup dialogs
- `src/utils/session.js` - session helpers, frame normalization, and module mapping
- `src/utils/shopSwitch.js` - branch/shop switch handling
- `vite.config.js` - Vite base path, output folder, proxy config, and dev port
- `aurixapp/WEB-INF/web.xml` - Tomcat deployment descriptor

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_HOST=192.168.1.6
VITE_API_PORT=8080
VITE_API_PROJECT=aurixwebapi
VITE_IDLE_TIMEOUT_MINUTES=30
```

The frontend builds the API base URL like this:

```txt
http://<VITE_API_HOST>:<VITE_API_PORT>/<VITE_API_PROJECT>/
```

Example:

```txt
http://192.168.1.6:8080/aurixwebapi/
```

## Local Development

Install dependencies:

```bash
npm install
```

Start the Vite dev server:

```bash
npm run dev
```

Local app URL:

```txt
http://localhost:3000/aurixapp/
```

### Dev Proxy

The Vite dev server currently proxies:

- `/aurixweb` -> `http://localhost:8080`
- `/TTDScheme` -> `http://192.168.1.100:8080`

## Scripts

```bash
npm run dev
npm run lint
npm run build:web
npm run build:war
npm run build
npm run preview
```

Script behavior:

- `npm run dev` - starts the Vite dev server
- `npm run lint` - runs ESLint across the project
- `npm run build:web` - builds frontend assets into `aurixapp/`
- `npm run build:war` - packages `aurixapp/` into `aurixapp.war`
- `npm run build` - runs the full production build and WAR packaging flow
- `npm run preview` - previews the Vite production build locally

Before building, `prebuild` removes old generated assets and any previous `aurixapp.war`.

## Routing And Access Control

The router is mounted with:

```jsx
<Router basename="/aurixapp/">
```

Protected business routes:

- `/cashmarking`
- `/dailycustomer`
- `/easytotal`
- `/itemdetails`
- `/salesentry`

Protected admin routes:

- `/changepassword`
- `/updateframes`
- `/deleteuser`
- `/updateuser`

Frame-to-route mapping is maintained in `src/utils/session.js`.

Current module frame mapping:

- `CASH MARKING` -> `/cashmarking`
- `DAILY VISITING CUSTOMER` -> `/dailycustomer`
- `EASY TOTAL` -> `/easytotal`
- `ITEM DETAILS` -> `/itemdetails`
- `SALES ENTRY` -> `/salesentry`

## Session Model

The app stores login and navigation state in `sessionStorage`.

Common keys include:

- `currentUser`
- `isLoggedIn`
- `currentShopCode`
- `currentModule`
- `originalLoginUsername`
- `originalLoginFrames`
- `pendingShopCode`
- `pendingShopSwitch`
- `pendingReturnPath`
- `pendingSigninMessage`

## Authentication Flow

Key behavior:

- login uses the backend shop-aware authentication flow
- authenticated API requests automatically attach `username` and `password` headers through the Axios interceptor
- route access is checked against the user’s assigned frames
- the app remembers the last allowed module and redirects users back to it when possible

## Shop Switching

Shop switching is handled centrally in `src/utils/shopSwitch.js`.

Current behavior:

- verifies whether the current/original login user exists in the target shop
- updates session state if the user is valid for that shop
- redirects to sign-in if the new shop requires re-authentication
- preserves pending route information so the user can continue after login

## UI Layout Pattern

Module pages should use the shared layout components:

- `MainPageFrame` for the overall app shell
- `ModulePageLayout` for title, menu, and module content framing

This keeps pages visually consistent across modules such as Daily Customer, Cash Marking, Item Details, Easy Total, and Sales Entry.

## Build And Deployment

Build the app:

```bash
npm run build
```

This produces:

- `aurixapp/index.html`
- `aurixapp/assets/`
- `aurixapp/WEB-INF/`
- `aurixapp.war`

### Tomcat Deployment

Typical deployment flow:

1. Run `npm run build`
2. Copy `aurixapp.war` to Tomcat `webapps/`
3. Remove any stale exploded `aurixapp/` folder if needed
4. Restart Tomcat or allow auto-deploy
5. Open `http://<server>:<port>/aurixapp/`

## Backend Integration Notes

The frontend currently relies on shop-aware backend APIs for:

- login and user existence checks
- CRM phone and customer lookups
- sales entry create, update, and search flows
- daily customer operations
- module-specific reporting and lookup endpoints

Sales Entry-specific API calls are grouped in:

- `src/api/SalesEntryApi.js`

## Troubleshooting

### App opens but API calls fail

Check:

- `.env` values
- backend server availability
- `src/api/axiosConfig.js`

### User is redirected away from a module

Check:

- assigned frames returned by the backend
- `src/utils/session.js`
- `ProtectedRoute` behavior in `src/App.jsx`

### Shop switch forces sign-in

That usually means:

- the user does not exist in the target shop
- the frame set differs for the new shop
- the current route is not allowed after the switch

### Tomcat shows `404` for `/aurixapp/`

Check:

- the latest `aurixapp.war` is deployed
- the app is deployed under the `aurixapp` context
- the WAR contains `index.html`, `assets/`, and `WEB-INF/`

## Recommended Starting Points

If you are new to the project, read these first:

1. `src/App.jsx`
2. `src/api/axiosConfig.js`
3. `src/utils/session.js`
4. `src/utils/shopSwitch.js`
5. `src/components/layout/ModulePageLayout.jsx`
6. `src/api/SalesEntryApi.js`
