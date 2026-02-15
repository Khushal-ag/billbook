# BillBook Frontend

Invoicing, billing, and inventory management app for small businesses.

## Tech Stack

- **React 18** + **TypeScript** — UI framework
- **Vite** — build tool & dev server
- **Tailwind CSS** + **shadcn/ui** — styling & component library
- **TanStack React Query** — server state management
- **React Router v6** — client-side routing
- **React Hook Form** + **Zod** — form handling & validation
- **Recharts** — dashboard charts

## Getting Started

```sh
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev
```

## Scripts

| Script               | Description                      |
| -------------------- | -------------------------------- |
| `npm run dev`        | Start development server         |
| `npm run build`      | Type-check & production build    |
| `npm run lint`       | ESLint + TypeScript type-check   |
| `npm run lint:fix`   | Auto-fix ESLint issues           |
| `npm run fmt`        | Format all files with Prettier   |
| `npm run fmt:check`  | Check formatting without writing |
| `npm run typecheck`  | TypeScript type-check only       |
| `npm test`           | Run tests                        |
| `npm run test:watch` | Run tests in watch mode          |

## Project Structure

```
src/
├── components/     # Shared & layout components
│   ├── ui/         # shadcn/ui primitives
│   └── layout/     # AppLayout, Sidebar, TopBar
├── contexts/       # React context providers (Auth)
├── hooks/          # Custom hooks (data fetching, business logic)
├── lib/            # API client, utilities
├── pages/          # Route-level page components
└── types/          # Domain-specific TypeScript types
```
