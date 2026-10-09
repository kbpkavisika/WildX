# WildX frontend

Next.js application with TypeScript and Tailwind CSS.

Run commands from the `frontend` directory:

```sh
npm install
npm run dev
```

Open http://localhost:3000. The home page is in `app/page.tsx`.

```sh
npm run lint
npm run build
npm start
```

`npm start` serves the production build after `npm run build`.

Run the unit tests once, watch tests during development, or measure coverage:

```sh
npm test
npm run test:watch
npm run test:coverage
```

Coverage requires at least 80% statements, branches, functions and lines across `app`, `components`, `hooks` and `lib`. Only declaration files (`.d.ts`) are excluded; types have no executable code to measure. Open `coverage/index.html` for the detailed report. Tests mock network requests and browser infrastructure, so no backend is needed.
