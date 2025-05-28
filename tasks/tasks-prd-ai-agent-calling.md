## Relevant Files

- `src/app/page.tsx` - Main dashboard page for initiating calls and viewing status
- `src/app/settings/page.tsx` - Settings page for system prompt configuration
- `src/app/history/page.tsx` - Call history page with search and filtering
- `src/app/api/calls/route.ts` - API route for creating and managing calls
- `src/app/api/assistants/route.ts` - API route for creating and managing assistants
- `src/app/api/settings/route.ts` - API route for managing system settings
- `src/app/api/webhooks/route.ts` - Webhook endpoint for Vapi call events
- `src/components/CallForm.tsx` - Form component for entering call details
- `src/components/CallStatus.tsx` - Component for displaying call progress
- `src/components/CallHistory.tsx` - Component for displaying call history
- `src/components/TranscriptViewer.tsx` - Component for viewing transcripts and summaries
- `src/components/ui/Button.tsx` - Reusable button component with design system
- `src/lib/vapi.ts` - Vapi API client and helper functions
- `src/lib/database.ts` - Database operations for storing calls and settings
- `src/lib/openai.ts` - OpenAI client for generating call summaries
- `src/lib/env.ts` - Environment variable configuration and validation
- `src/lib/utils.ts` - Utility functions for CSS class merging
- `src/types/index.ts` - TypeScript type definitions
- `package.json` - Project dependencies and scripts
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration with custom design system
- `postcss.config.js` - PostCSS configuration
- `src/app/globals.css` - Global styles with custom component classes
- `prisma/schema.prisma` - Database schema definition
- `.env` - Environment variables (created)
- `env.example` - Environment variables template
- `.prettierrc` - Prettier configuration
- `.gitignore` - Git ignore rules

### Notes

- Using Next.js 14 with App Router for the web application
- Prisma with SQLite for local database storage
- Tailwind CSS for styling with custom design system
- Real-time updates using WebSocket or Server-Sent Events
- Unit tests should be placed alongside components (e.g., `CallForm.test.tsx`)

## Tasks

- [ ] 1.0 Project Setup and Configuration
  - [x] 1.1 Initialize Next.js 14 project with TypeScript and App Router ✅ COMPLETED
  - [x] 1.2 Install and configure required dependencies (Prisma, Tailwind CSS, etc.) ✅ COMPLETED
  - [x] 1.3 Set up environment variables for Vapi API key and OpenAI API key ✅ COMPLETED
  - [x] 1.4 Configure Tailwind CSS with custom styling for the application ✅ COMPLETED
  - [x] 1.5 Set up ESLint and Prettier for code formatting ✅ COMPLETED
  - [x] 1.6 Create basic project structure with src/ directory organization ✅ COMPLETED

- [ ] 2.0 Database Schema and Models
  - [x] 2.1 Initialize Prisma with SQLite database configuration ✅ COMPLETED
  - [x] 2.2 Create Settings model for storing system prompt and configuration ✅ COMPLETED
  - [x] 2.3 Create Call model with fields for status, timestamps, phone number, and metadata ✅ COMPLETED
  - [x] 2.4 Create Transcript model linked to Call for storing conversation data ✅ COMPLETED
  - [ ] 2.5 Create Assistant model for storing Vapi assistant configurations
  - [ ] 2.6 Run initial database migration and generate Prisma client
  - [ ] 2.7 Create database utility functions for common operations

- [ ] 3.0 Vapi API Integration
  - [ ] 3.1 Create Vapi client wrapper with authentication and error handling
  - [ ] 3.2 Implement assistant creation function with system prompt integration
  - [ ] 3.3 Implement outbound call creation function with customer details
  - [ ] 3.4 Create webhook handler for receiving call status updates from Vapi
  - [ ] 3.5 Implement call transcript retrieval and processing
  - [ ] 3.6 Add OpenAI integration for generating call summaries and analysis
  - [ ] 3.7 Create error handling and retry logic for API failures

- [ ] 4.0 Core Web Application Pages
  - [ ] 4.1 Create main dashboard layout with navigation and responsive design
  - [ ] 4.2 Build CallForm component for entering phone number and call prompt
  - [ ] 4.3 Implement settings page for configuring system prompt
  - [ ] 4.4 Create call history page with search, filtering, and pagination
  - [ ] 4.5 Build TranscriptViewer component for displaying call results
  - [ ] 4.6 Implement API routes for calls, settings, and assistants management
  - [ ] 4.7 Add form validation and user feedback for all interactions
  - [ ] 4.8 Create loading states and error handling for all pages

- [ ] 5.0 Real-time Call Management and Status Updates
  - [ ] 5.1 Implement CallStatus component with real-time progress indicator
  - [ ] 5.2 Set up Server-Sent Events or WebSocket for live call status updates
  - [ ] 5.3 Create call state management system (idle, dialing, in-progress, completed)
  - [ ] 5.4 Implement automatic transcript fetching and summary generation post-call
  - [ ] 5.5 Add call completion notifications and result display
  - [ ] 5.6 Create call cancellation functionality for active calls
  - [ ] 5.7 Implement call history auto-refresh when new calls complete 