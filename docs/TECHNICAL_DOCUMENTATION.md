# LazyCall - Technical Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Documentation](#api-documentation)
4. [Component Architecture](#component-architecture)
5. [Integration Guides](#integration-guides)
6. [Type System](#type-system)
7. [Error Handling](#error-handling)
8. [Testing](#testing)
9. [Development Workflow](#development-workflow)
10. [Deployment](#deployment)

---

## Architecture Overview

LazyCall is built using a modern, scalable architecture with clear separation of concerns:

### Tech Stack
- **Frontend**: Next.js 14 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: Prisma ORM with SQLite (development) / PostgreSQL (production)
- **AI Services**: Vapi AI for voice calls, OpenAI for analysis
- **State Management**: React hooks and server components
- **Testing**: Jest with comprehensive test coverage

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── calls/         # Call management endpoints
│   │   ├── assistants/    # Assistant management
│   │   ├── settings/      # Settings configuration
│   │   └── webhooks/      # Vapi webhook handlers
│   ├── history/           # Call history page
│   ├── settings/          # Settings page
│   └── page.tsx           # Main dashboard
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── CallForm.tsx      # Call creation form
│   ├── CallHistory.tsx   # Call history table
│   ├── CallStatus.tsx    # Real-time call status
│   ├── SettingsForm.tsx  # Settings configuration
│   └── TranscriptViewer.tsx # Transcript display
├── lib/                  # Utility libraries
│   ├── database.ts       # Database operations
│   ├── vapi.ts          # Vapi API client
│   ├── openai.ts        # OpenAI integration
│   ├── error-handling.ts # Error management
│   └── transcripts.ts   # Transcript processing
└── types/               # TypeScript definitions
    └── index.ts         # Core type definitions
```

---

## Database Schema

LazyCall uses Prisma ORM with four main entities:

### Calls Table
```typescript
interface Call {
  id: string                    // UUID primary key
  phoneNumber: string           // Destination phone number
  status: CallStatus           // Current call status
  assistantId?: string         // Associated assistant
  vapiCallId?: string          // Vapi call identifier
  startedAt?: Date             // Call start timestamp
  endedAt?: Date               // Call end timestamp
  duration?: number            // Call duration in seconds
  cost?: number                // Call cost in dollars
  metadata?: Record<string, unknown> // Additional call data
  createdAt: Date              // Record creation time
  updatedAt: Date              // Last update time
}
```

### Assistants Table
```typescript
interface Assistant {
  id: string                    // UUID primary key
  name: string                 // Assistant display name
  systemPrompt: string         // AI behavior instructions
  vapiAssistantId?: string     // Vapi assistant ID
  isActive: boolean            // Availability status
  voice?: string               // Voice configuration
  language: string             // Language code (e.g., 'en')
  model: string                // AI model (e.g., 'gpt-4')
  temperature?: number         // AI creativity (0-1)
  maxTokens?: number           // Response length limit
  description?: string         // Assistant description
  tags?: string[]              // Category tags
  usageCount: number           // Times used
  lastUsedAt?: Date            // Last usage timestamp
  createdAt: Date              // Creation timestamp
  updatedAt: Date              // Last update timestamp
}
```

### Transcripts Table
```typescript
interface Transcript {
  id: string                    // UUID primary key
  callId: string               // Foreign key to calls
  content: string              // Full transcript text
  summary?: string             // AI-generated summary
  analysis?: string            // AI analysis results
  processingStatus: TranscriptProcessingStatus
  wordCount?: number           // Transcript word count
  confidence?: number          // Transcription confidence (0-1)
  language?: string            // Detected language
  metadata?: Record<string, unknown> // Processing metadata
  createdAt: Date              // Creation timestamp
  updatedAt: Date              // Last update timestamp
}
```

### Settings Table
```typescript
interface Settings {
  id: string                    // UUID primary key
  systemPrompt: string         // Default system prompt
  defaultAssistantId?: string  // Default assistant ID
  openaiApiKey?: string        // OpenAI API key
  vapiApiKey?: string          // Vapi API key
  createdAt: Date              // Creation timestamp
  updatedAt: Date              // Last update timestamp
}
```

### Relationships
- `Call` → `Assistant` (many-to-one)
- `Call` → `Transcript` (one-to-many)
- `Settings` → `Assistant` (one-to-one for default)

---

## API Documentation

### Call Management

#### `POST /api/calls`
Create a new call with AI assistant.

**Request Body:**
```typescript
{
  phoneNumber: string;        // E.164 format (e.g., +1234567890)
  customPrompt?: string;      // Override system prompt
  assistantId?: string;       // Specific assistant ID
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: Call;
  error?: string;
}
```

#### `GET /api/calls`
Retrieve calls with optional filtering.

**Query Parameters:**
```typescript
{
  status?: CallStatus;        // Filter by status
  dateFrom?: string;          // Start date (ISO)
  dateTo?: string;            // End date (ISO)
  phoneNumber?: string;       // Phone number filter
  assistantId?: string;       // Assistant filter
  page?: number;              // Pagination (default: 1)
  limit?: number;             // Items per page (default: 20)
}
```

#### `GET /api/calls/[id]`
Get specific call details with transcripts.

#### `PUT /api/calls/[id]`
Update call status or metadata.

### Assistant Management

#### `POST /api/assistants`
Create a new AI assistant.

**Request Body:**
```typescript
{
  name: string;
  systemPrompt: string;
  voice?: string;
  language?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  description?: string;
  tags?: string[];
}
```

#### `GET /api/assistants`
List all assistants with filtering.

#### `PUT /api/assistants/[id]`
Update assistant configuration.

#### `DELETE /api/assistants/[id]`
Deactivate an assistant.

### Settings Management

#### `GET /api/settings`
Get current application settings.

#### `PUT /api/settings`
Update application settings.

### Webhook Endpoints

#### `POST /api/webhooks/vapi`
Handle Vapi webhook events for real-time updates.

**Supported Events:**
- `call.started` - Call initiation
- `call.ended` - Call completion
- `call.failed` - Call failure
- `transcript.ready` - Transcript available

---

## Component Architecture

### Core Components

#### `CallForm` - Call Creation Interface
```typescript
interface CallFormProps {
  onSubmit: (data: CallFormData) => Promise<void>;
  assistants: Assistant[];
  isLoading?: boolean;
}
```

**Features:**
- Phone number validation (E.164 format)
- Assistant selection dropdown
- Custom prompt override
- Real-time form validation
- Accessibility compliance

#### `CallStatus` - Real-time Call Monitoring
```typescript
interface CallStatusProps {
  call: Call;
  onUpdate?: (call: Call) => void;
}
```

**Features:**
- Live status updates via webhooks
- Progress indicators
- Duration tracking
- Cost estimation
- Error state handling

#### `CallHistory` - Historical Call Data
```typescript
interface CallHistoryProps {
  calls: Call[];
  onFilter: (filters: CallHistoryFilters) => void;
  pagination: PaginationInfo;
}
```

**Features:**
- Sortable columns
- Advanced filtering
- Pagination controls
- Bulk operations
- Export functionality

#### `TranscriptViewer` - Transcript Display
```typescript
interface TranscriptViewerProps {
  transcript: Transcript;
  call: Call;
  showAnalysis?: boolean;
}
```

**Features:**
- Syntax highlighting
- Search functionality
- Speaker identification
- Confidence indicators
- Analysis summaries

#### `SettingsForm` - Configuration Management
```typescript
interface SettingsFormProps {
  settings: Settings;
  onSave: (settings: SettingsFormData) => Promise<void>;
}
```

**Features:**
- API key management
- Default configurations
- Validation and testing
- Secure storage

### UI Components

#### `Button` - Base Button Component
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

---

## Integration Guides

### Vapi AI Integration

#### Setup
1. Create Vapi account and get API key
2. Configure phone number in Vapi dashboard
3. Set up webhook endpoint in Vapi settings
4. Add API key to environment variables

#### Call Creation Flow
```typescript
// 1. Create assistant in Vapi
const assistant = await vapiClient.assistants.create({
  name: "Customer Service",
  model: { provider: "openai", model: "gpt-4" },
  voice: { provider: "11labs", voiceId: "..." },
  firstMessage: "Hello, how can I help you today?"
});

// 2. Initiate call
const call = await vapiClient.calls.create({
  assistantId: assistant.id,
  phoneNumberId: process.env.VAPI_PHONE_ID,
  customer: { number: phoneNumber }
});
```

#### Webhook Handling
```typescript
export async function POST(request: Request) {
  const payload = await request.json();
  
  switch (payload.message.type) {
    case 'call-start':
      await updateCallStatus(payload.message.call.id, 'in-progress');
      break;
    case 'call-end':
      await updateCallStatus(payload.message.call.id, 'completed');
      await processTranscript(payload.message.call);
      break;
  }
  
  return Response.json({ received: true });
}
```

### OpenAI Integration

#### Transcript Analysis
```typescript
async function analyzeTranscript(transcript: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Analyze this call transcript and provide insights..."
      },
      {
        role: "user",
        content: transcript
      }
    ]
  });
  
  return response.choices[0].message.content;
}
```

#### Summary Generation
```typescript
async function generateSummary(transcript: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "Summarize this call transcript in 2-3 sentences..."
      },
      {
        role: "user",
        content: transcript
      }
    ],
    max_tokens: 150
  });
  
  return response.choices[0].message.content;
}
```

---

## Type System

LazyCall uses a comprehensive TypeScript type system with:

### Status Enums
```typescript
type CallStatus = 
  | 'idle' | 'creating' | 'dialing' | 'ringing' 
  | 'in-progress' | 'completed' | 'failed' | 'cancelled';

type TranscriptProcessingStatus = 
  | 'pending' | 'processing' | 'completed' | 'failed';
```

### Form Data Types
```typescript
interface CallFormData {
  phoneNumber: string;
  customPrompt?: string;
  assistantId?: string;
}
```

### API Response Types
```typescript
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### Type Conversion Utilities
```typescript
type CreateCallData = Omit<Call, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateCallData = Partial<CreateCallData>;
```

---

## Error Handling

LazyCall implements comprehensive error handling:

### Error Types
```typescript
class VapiError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'VapiError';
  }
}

class DatabaseError extends Error {
  constructor(message: string, public operation: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}
```

### Error Boundaries
```typescript
export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-boundary">
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### API Error Handling
```typescript
export async function handleApiError(error: unknown): Promise<ApiResponse> {
  if (error instanceof VapiError) {
    return {
      success: false,
      error: `Vapi Error: ${error.message}`,
    };
  }
  
  if (error instanceof DatabaseError) {
    return {
      success: false,
      error: `Database Error: ${error.message}`,
    };
  }
  
  return {
    success: false,
    error: 'An unexpected error occurred',
  };
}
```

---

## Testing

### Test Structure
```
src/lib/__tests__/
├── database.test.ts      # Database operations
├── vapi.test.ts         # Vapi integration
├── openai.test.ts       # OpenAI integration
└── utils.test.ts        # Utility functions
```

### Example Test
```typescript
describe('Call Management', () => {
  it('should create a new call', async () => {
    const callData: CreateCallData = {
      phoneNumber: '+1234567890',
      status: 'idle',
    };
    
    const call = await createCall(callData);
    
    expect(call).toMatchObject({
      phoneNumber: '+1234567890',
      status: 'idle',
    });
    expect(call.id).toBeDefined();
  });
});
```

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run Vapi integration tests
npm run test:vapi
```

---

## Development Workflow

### Setup Development Environment
```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env

# Initialize database
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

### Code Quality
```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check

# Run all checks
npm run check-all
```

### Database Operations
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Create migration
npm run db:migrate

# Reset database
npm run db:reset

# Open Prisma Studio
npm run db:studio
```

### Git Workflow
1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes and commit: `git commit -m "feat: add new feature"`
3. Run quality checks: `npm run check-all`
4. Push and create PR: `git push origin feature/new-feature`

---

## Deployment

### Environment Variables
```env
# Required
VAPI_API_KEY=your_vapi_api_key
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_database_connection_string

# Optional
NEXTAUTH_SECRET=your_auth_secret
NEXTAUTH_URL=your_app_url
```

### Build Process
```bash
# Install dependencies
npm ci

# Generate Prisma client
npm run db:generate

# Build application
npm run build

# Start production server
npm start
```

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Vapi webhooks configured
- [ ] Phone numbers set up in Vapi
- [ ] SSL certificates installed
- [ ] Monitoring and logging configured

### Monitoring
- Application logs via console/file output
- Database performance metrics
- API response times and error rates
- Call success/failure rates
- Cost tracking and alerts

---

## Contributing

### Code Style
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Write tests for new functionality
- Document public APIs with JSDoc
- Use semantic commit messages

### Pull Request Process
1. Fork repository and create feature branch
2. Implement changes with tests
3. Run quality checks: `npm run check-all`
4. Update documentation if needed
5. Submit PR with clear description

### Issue Reporting
- Use issue templates
- Include reproduction steps
- Provide error logs and screenshots
- Specify environment details

---

For additional questions or support, please refer to the main [README.md](../README.md) or create an issue in the repository.