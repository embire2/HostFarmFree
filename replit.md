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
- July 3, 2025. CRITICAL SUCCESS: WHM API integration now working - accounts successfully created on server
- July 3, 2025. Fixed IP address allocation by using shared IPs instead of dedicated IPs
- July 3, 2025. Updated admin user password in database for successful login access
- July 3, 2025. MAJOR FEATURE: Added admin account creation functionality with dual-tab interface
- July 3, 2025. Implemented anonymous account creation directly from admin dashboard
- July 3, 2025. Added hosting account creation with WHM integration and package association
- July 3, 2025. Enhanced admin dashboard with comprehensive account management capabilities
- July 4, 2025. CRITICAL FIX: Fixed WHM username validation errors by implementing proper username generation
- July 4, 2025. Fixed hosting account creation for both admin and client endpoints - usernames now start with letters as required by WHM
- July 4, 2025. Added comprehensive error logging and debugging for WHM API integration
- July 4, 2025. Enhanced domain availability checking with proper timeout handling and error messages
- July 4, 2025. BREAKTHROUGH: Fixed WHM API success detection - system now correctly identifies successful account creation
- July 4, 2025. Updated success detection logic to handle multiple WHM response formats including status=1 in result arrays
- July 4, 2025. Applied consistent username generation and success detection across all hosting account creation endpoints
- July 4, 2025. Verified fixes work correctly - numeric subdomains now convert to valid WHM usernames (e.g., 44744 -> h44744)
- July 4, 2025. FEATURE: Implemented WHM API hosting package deletion with dual-system cleanup
- July 4, 2025. Added deletepackage WHM API integration for complete package removal from both WHM and local database
- July 4, 2025. MAJOR FEATURE: Implemented cPanel auto-login functionality using WHM create_user_session API
- July 4, 2025. Added secure cPanel access for both admin dashboard and client dashboard with automatic authentication
- July 4, 2025. Fixed frontend cPanel login integration with proper error handling and user feedback
- July 4, 2025. CRITICAL ISSUE IDENTIFIED: WHM account creation failing - accounts created locally with 'error' status, no cpanel_username/password
- July 4, 2025. Fixed WHM API format issues - converted from GET with query params to POST with form data (application/x-www-form-urlencoded)
- July 4, 2025. Updated account statistics API to use proper form data format, resolved "WHM API 0 does not support JSON input" errors
- July 4, 2025. ROOT CAUSE: Accounts show "Account does not exist" because WHM creation fails, leaving local db with error status and no WHM account
- July 5, 2025. CRITICAL FIX: Repaired broken hosting accounts (hello7, hello8) by recreating them on WHM server with proper usernames
- July 5, 2025. Fixed client dashboard hosting statistics to use proper username generation matching account creation logic
- July 5, 2025. Ensured client cPanel auto-login uses correct username format for WHM API create_user_session calls
- July 5, 2025. Client dashboard now has full parity with admin panel - live WHM stats and working cPanel auto-login
- July 5, 2025. MAJOR IMPROVEMENT: Created integrated domain registration endpoint that creates hosting accounts on WHM first, then user accounts
- July 5, 2025. Fixed domain search flow to use new consolidated registration for immediate dashboard visibility
- July 5, 2025. Added comprehensive error logging throughout registration process for automatic issue detection
- July 5, 2025. Implemented prominent red email collection banner for users without email addresses
- July 5, 2025. Updated domain registration to store credentials temporarily for immediate display to users
- July 5, 2025. CRITICAL FIX: Fixed /dashboard 404 error by adding dashboard routes to authentication routing system
- July 5, 2025. Implemented automatic user authentication after domain registration for seamless dashboard access
- July 5, 2025. Enhanced session management to properly authenticate newly created users without manual login
```

# User Preferences

```
Preferred communication style: Simple, everyday language.
```