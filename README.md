# BillBook Frontend

Invoicing, billing, and inventory management app for small businesses.

## Tech Stack

- **React 18** + **TypeScript** — UI framework
- **Vite** — build tool & dev server
- **Tailwind CSS** + **shadcn/ui** — styling & component library
- **Axios** — HTTP client with interceptors
- **TanStack React Query** — server state management
- **React Router v6** — client-side routing
- **React Hook Form** + **Zod** — form handling & validation
- **Recharts** — dashboard charts

## Getting Started

```sh
# Install dependencies
bun install

# Copy env file and configure
cp .env.example .env

# Start dev server (http://localhost:5173)
bun dev
```

## Scripts

| Script          | Description                      |
| --------------- | -------------------------------- |
| `bun dev`       | Start development server         |
| `bun run build` | Type-check & production build    |
| `bun lint`      | ESLint + TypeScript type-check   |
| `bun lint:fix`  | Auto-fix ESLint issues           |
| `bun fmt`       | Format all files with Prettier   |
| `bun fmt:check` | Check formatting without writing |
| `bun typecheck` | TypeScript type-check only       |

## Project Structure

```
src/
├── api/            # Axios client, interceptors, token management
├── components/     # Shared & layout components
│   ├── ui/         # shadcn/ui primitives
│   └── layout/     # AppLayout, Sidebar, TopBar
├── contexts/       # React context providers (Auth)
├── hooks/          # Custom hooks (data fetching, business logic)
├── lib/            # Env validation, utilities
├── pages/          # Route-level page components
└── types/          # Domain-specific TypeScript types
```
