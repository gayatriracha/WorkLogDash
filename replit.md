# Overview

This is a work logging application built with React and Express that allows users to track their daily work activities with customizable work hours and time slots. The application features a modern, responsive interface built with shadcn/ui components, real-time audio notifications for work hour reminders, and comprehensive progress tracking. Users can log their work descriptions for each time slot, mark days as holidays, and view their productivity metrics through an intuitive dashboard.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Framework**: shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS custom properties for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management with caching and optimistic updates
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **API Design**: RESTful API with JSON responses
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Storage Implementation**: Abstracted storage interface supporting both in-memory and database implementations
- **Development Setup**: Hot module replacement with Vite integration for seamless development experience

## Data Storage
- **Database**: PostgreSQL with Neon serverless database hosting
- **ORM**: Drizzle ORM providing type-safe database queries and migrations
- **Schema**: Single work_logs table with composite unique constraints on date and time_slot
- **Session Management**: PostgreSQL session store using connect-pg-simple
- **Migration Strategy**: Database schema versioning through Drizzle Kit

## Time Management System
- **Time Zone**: India Standard Time (IST) as the primary timezone
- **Work Hours**: Customizable schedule with user-defined start/end times and slot durations
- **Audio Notifications**: Web Audio API implementation with browser permission handling
- **Real-time Updates**: Client-side time tracking with IST conversion utilities

## Development Workflow
- **Build System**: Vite for frontend bundling with esbuild for server-side compilation
- **Type Safety**: Full TypeScript coverage across frontend, backend, and shared schemas
- **Development Server**: Concurrent frontend and backend development with proxy configuration
- **Error Handling**: Comprehensive error boundaries and API error responses

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **@neondatabase/serverless**: Neon's serverless database driver for edge compatibility

## UI Component Libraries
- **Radix UI**: Headless component primitives for accessibility and customization
- **Lucide React**: Icon library providing consistent iconography
- **Tailwind CSS**: Utility-first CSS framework for responsive design

## Development Tools
- **TanStack Query**: Server state management with caching, background updates, and optimistic UI
- **React Hook Form**: Performance-focused form library with minimal re-renders
- **Zod**: Schema validation for runtime type checking and form validation
- **date-fns**: Lightweight date manipulation library for time zone handling

## Audio and Notifications
- **Web Audio API**: Native browser API for notification sound generation
- **HTML5 Audio**: Fallback audio implementation for unsupported browsers

## Build and Development
- **Vite**: Next-generation frontend tooling with hot module replacement
- **esbuild**: Fast JavaScript bundler for server-side code compilation
- **TypeScript**: Static type checking across the entire application stack