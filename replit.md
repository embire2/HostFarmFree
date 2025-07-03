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

## External API Integrations
- **WHM API 1**: Hosting package management and server administration
  - Endpoint: `https://server:2087/json-api/listpkgs?api.version=1`
  - Authentication: `whm root:API_TOKEN` header format
  - Successfully integrated for package synchronization
- **cPanel API**: Direct client access to hosting account management
  - Auto-login functionality for seamless user experience

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
- July 1, 2025. BREAKTHROUGH: Successfully resolved WHM API integration using official cPanel documentation
- July 1, 2025. Fixed persistent 404 errors by implementing correct WHM API 1 endpoint structure
- July 1, 2025. Achieved working WHM package synchronization with listpkgs endpoint
- July 1, 2025. Applied official authentication pattern: whm root:API_TOKEN for WHM server communication
- July 1, 2025. Enhanced plugin storage system for production deployment reliability
- July 1, 2025. Implemented dedicated plugins directory with proper file path tracking
- July 1, 2025. Added secure plugin download endpoints with stream handling
- July 1, 2025. Created deployment-ready file structure with .gitkeep preservation
- July 2, 2025. Implemented complete User Management system for admin dashboard
- July 2, 2025. Added WHM Panel automatic authentication with API token for seamless admin access
- July 2, 2025. Created admin "View Site" button for quick navigation to public website
- July 2, 2025. Built comprehensive public plugin system with individual landing pages
- July 2, 2025. Integrated Stripe payment system for $5 plugin donations
- July 2, 2025. Created beautiful plugin detail pages with download and donation functionality
- July 2, 2025. Added public plugin API endpoints for non-authenticated access
- July 2, 2025. Fixed routing conflicts between dynamic and static API endpoints
- July 2, 2025. Implemented comprehensive Hosting Accounts Management system for admin dashboard
- July 2, 2025. Added client hosting accounts grouped by user with detailed WHM API statistics
- July 2, 2025. Created complete hosting account deletion with WHM integration - removes from both systems
- July 2, 2025. Built comprehensive hosting account editing capabilities for admin management
- July 2, 2025. Enhanced admin dashboard with new "Hosting Accounts" tab as primary management interface
- July 2, 2025. CRITICAL FIX: Resolved PostgreSQL integer overflow in hosting account creation
- July 2, 2025. Fixed WHM-integrated domain search using listaccts API endpoint for accurate availability checking
- July 2, 2025. Enhanced domain registration flow with automatic post-authentication account creation
- July 3, 2025. CRITICAL UX FIX: Anonymous registration now displays credentials prominently with recovery instructions
- July 3, 2025. Added activation timing system - informs users accounts may take 2 minutes to activate with countdown
- July 3, 2025. Implemented auto-refresh dashboard functionality for new hosting account activation
- July 3, 2025. Created comprehensive credential backup screen for anonymous registration security
- July 3, 2025. MAJOR FIX: Completely removed defunct /auth page and fixed anonymous registration flow
- July 3, 2025. Fixed WHM API integration for actual hosting account creation on server
- July 3, 2025. Implemented prominent credential display with 5-minute temporary storage
- July 3, 2025. Added real-time credential alerts in dashboard with copy functionality
- July 3, 2025. Enhanced anonymous registration to show username/password immediately after account creation
- July 3, 2025. CRITICAL WHM FIX: Removed deprecated "paper_lantern" cpmod parameter from WHM API calls
- July 3, 2025. Fixed hosting account creation failures by updating WHM createacct API to use modern cPanel settings
- July 3, 2025. NAVIGATION FIX: Replaced defunct /auth page links with proper login modal system
- July 3, 2025. Created LoginModal component for better user experience instead of browser prompts
- July 3, 2025. Updated WHM API to use shared IPs (ip: 'n') to resolve IP address allocation errors
- July 3, 2025. AUTHENTICATION FIX: Updated login system to accept both username and email address
- July 3, 2025. Modified passport LocalStrategy to check email if username lookup fails
- July 3, 2025. Updated login modal interface to clearly indicate users can enter username OR email
```

# User Preferences

```
Preferred communication style: Simple, everyday language.
```