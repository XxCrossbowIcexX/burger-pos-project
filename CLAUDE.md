# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Point of Sale (POS) system for burger restaurants built as a monorepo with separate backend (Express + TypeScript + Prisma) and frontend (React + TypeScript + Vite) applications.

## Commands

### Backend Development
```bash
cd backend
npm run dev                 # Start development server with nodemon
npm run build              # Build TypeScript to JavaScript
npm run lint               # Lint TypeScript files
npm run lint:fix           # Fix linting issues
npm test                   # Run Jest tests
npm run test:watch         # Run tests in watch mode
```

### Frontend Development
```bash
cd frontend
npm run dev                # Start Vite development server
npm run build              # Build for production
npm run preview            # Preview production build
npm run lint               # Lint code with ESLint
```

### Database Management (Prisma)
```bash
cd backend
npm run prisma:generate    # Generate Prisma client (run after schema changes)
npm run prisma:migrate     # Run database migrations
npm run prisma:studio      # Open Prisma Studio database GUI
npm run prisma:seed        # Seed database with initial data
npm run prisma:reset       # Reset database (destructive)
```

## Architecture

### Backend Structure
- **MVC Pattern**: Controllers (`src/controllers/`) handle business logic, routes (`src/routes/`) define endpoints
- **Middleware Chain**: Security (helmet, CORS), rate limiting, validation, error handling
- **Validation**: Zod schemas in `src/validators/` for type-safe request validation
- **Database**: SQLite with Prisma ORM for type-safe database access
- **Error Handling**: Centralized error handler in `src/middlewares/errorHandler.ts`

### Frontend Structure
- **React + TypeScript**: Functional components with hooks
- **Custom Hooks**: `useFetch` hook in `src/hooks/` for API data fetching with loading states
- **Components**: Organized in `src/components/` with admin panel pages in `src/pages/admin/`
- **Styling**: TailwindCSS with mobile-first responsive design

### Database Schema
Key entities: Usuario (role-based), Categoria, Ingrediente (typed: pan, carne, queso, vegetal, salsa), Producto, Venta, ItemVenta, Caja

## Development Workflow

### Making Database Changes
1. Edit `backend/prisma/schema.prisma`
2. Run `npm run prisma:migrate` to create migration
3. Run `npm run prisma:generate` to update Prisma client
4. Update TypeScript types if needed

### API Development
- Controllers follow pattern: validation → business logic → response
- All routes use Zod validators from `src/validators/`
- Error handling through centralized middleware
- Base API URL: `http://localhost:3000/api`

### Frontend Development
- Use `useFetch` hook for API calls with proper loading/error states
- Follow existing component patterns in `src/components/`
- TailwindCSS classes follow mobile-first responsive design
- TypeScript strictly enforced

## Environment Setup

### Backend (.env)
```
DATABASE_URL="file:./dev.db"
PORT=3000
NODE_ENV=development
```

### Development Servers
- Backend: http://localhost:3000
- Frontend: http://localhost:5173 (Vite default)
- Prisma Studio: http://localhost:5555

## Security & Rate Limiting
- Rate limiting: 100 requests/15min (prod), 1000 requests/15min (dev)
- CORS configured for localhost development
- Helmet security headers enabled
- Input validation with Zod schemas required for all endpoints