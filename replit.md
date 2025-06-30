# Overview

HostFarm.org is a full-stack web application built with modern web technologies that provides free WordPress hosting and a premium plugin library. The application features a React frontend with a Node.js/Express backend, PostgreSQL database with Drizzle ORM, and integrates with Replit's authentication system.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for development and production builds
- **Forms**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: express-session with PostgreSQL store
- **File Uploads**: Multer for handling plugin ZIP files
- **API Design**: RESTful API with JSON responses

## Database Architecture
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM with type-safe queries
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Connection pooling with @neondatabase/serverless

# Key Components

## Authentication System
- Replit Auth integration with OIDC
- Session-based authentication using PostgreSQL storage
- Role-based access control (admin/client roles)
- Automatic user creation and profile management

## Hosting Management
- Subdomain-based hosting accounts
- Resource usage tracking (disk space, bandwidth)
- Domain availability checking
- Account status management (active/suspended/pending)

## Plugin Library
- File upload system for ZIP plugins
- Category-based organization
- Search and filtering capabilities
- Download tracking and analytics
- Version management

## User Interface
- Responsive design with mobile-first approach
- Role-specific dashboards (admin vs client)
- Real-time statistics and metrics
- Toast notifications for user feedback

# Data Flow

1. **Authentication Flow**: Users authenticate through Replit Auth → Session created → User profile retrieved/created
2. **Hosting Account Creation**: User searches domain → Availability check → Account creation → Resource allocation
3. **Plugin Management**: Admin uploads ZIP → File validation → Database entry → Public availability
4. **Download Tracking**: User downloads plugin → Download recorded → Statistics updated

# External Dependencies

## Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **@radix-ui/***: Headless UI components
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe ORM
- **express**: Web server framework
- **multer**: File upload handling
- **openid-client**: Authentication
- **tailwindcss**: CSS framework

## Development Tools
- **vite**: Build tool and dev server
- **typescript**: Type checking
- **esbuild**: Production bundling
- **tsx**: TypeScript execution

# Deployment Strategy

## Environment Configuration
- **Development**: Local development with Vite dev server
- **Production**: Built static files served by Express
- **Database**: Neon PostgreSQL with connection pooling
- **File Storage**: Local uploads directory (temporary solution)

## Build Process
1. Frontend build with Vite (client → dist/public)
2. Backend bundle with esbuild (server → dist/index.js)
3. Static file serving in production
4. Database migrations with Drizzle Kit

## Replit Integration
- Autoscale deployment target
- PostgreSQL module for database
- Environment variables for configuration
- Session-based authentication

# Changelog

```
Changelog:
- June 27, 2025. Initial setup
- June 30, 2025. Added API Settings system for admin configuration of WHM/cPanel credentials
- June 30, 2025. Implemented cPanel auto-login functionality for client dashboard
- June 30, 2025. Updated admin user role and added API Settings navigation link
- June 30, 2025. Enhanced WHM API testing with comprehensive error logging and multiple authentication methods
- June 30, 2025. Fixed URL path duplication issues and added support for multiple WHM API response formats
- June 30, 2025. Implemented comprehensive package management system with WHM integration
- June 30, 2025. Added hosting packages with pricing, quotas, and WHM package association
- June 30, 2025. Created package usage tracking and cPanel direct access functionality
- June 30, 2025. Enhanced client dashboard with package statistics and usage monitoring
- June 30, 2025. Integrated subdomain hosting with *.hostme.today domain system
```

# User Preferences

```
Preferred communication style: Simple, everyday language.
```