# LazyCall - AI Agent Calling Tool

An intelligent AI-powered phone calling application built with Next.js 14, TypeScript, and Tailwind CSS. Automate your phone calls with AI agents for appointments, reservations, and routine tasks.

## 🚀 Features

- **AI-Powered Calls**: Create intelligent phone calls using Vapi AI
- **Real-time Monitoring**: Track call progress and status in real-time
- **Call History**: View transcripts, summaries, and analytics
- **Custom Prompts**: Configure AI agent behavior and personality
- **Modern UI**: Beautiful, responsive interface with dark mode support

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── calls/         # Call management endpoints
│   │   ├── assistants/    # Assistant management endpoints
│   │   ├── settings/      # Settings management endpoints
│   │   └── webhooks/      # Vapi webhook handlers
│   ├── history/           # Call history page
│   ├── settings/          # Settings configuration page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   │   └── Button.tsx    # Button component
│   ├── CallForm.tsx      # Call creation form
│   ├── CallStatus.tsx    # Call status display
│   ├── CallHistory.tsx   # Call history table
│   └── TranscriptViewer.tsx # Transcript viewer
├── lib/                  # Utility libraries
│   ├── database.ts       # Database operations
│   ├── env.ts           # Environment configuration
│   ├── openai.ts        # OpenAI client
│   ├── utils.ts         # Utility functions
│   └── vapi.ts          # Vapi API client
└── types/               # TypeScript definitions
    └── index.ts         # Core type definitions
```

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: Prisma with SQLite (local development)
- **AI Services**: 
  - Vapi AI for voice calls
  - OpenAI for call analysis and summaries
- **Development**: ESLint, Prettier, Git hooks

## 📋 Development Tasks

### ✅ Completed
- [x] 1.1 Next.js 14 project initialization
- [x] 1.2 Dependencies installation and configuration
- [x] 1.3 Environment variables setup
- [x] 1.4 Tailwind CSS configuration
- [x] 1.5 ESLint and Prettier setup
- [x] 1.6 Project structure organization

### 🚧 In Progress
- [ ] 2.0 Database Schema and Models
- [ ] 3.0 Vapi API Integration
- [ ] 4.0 Core Web Application Pages
- [ ] 5.0 Real-time Call Management

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Vapi API key
- OpenAI API key
- A phone number configured in Vapi (see [Phone Setup Guide](docs/PHONE_SETUP.md))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lazycall
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

Edit `.env` and add your API keys:
```env
VAPI_API_KEY=your_vapi_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL="file:./dev.db"
```

4. Set up a phone number in Vapi:
   - Follow the [Phone Setup Guide](docs/PHONE_SETUP.md)
   - You need at least one phone number to make outbound calls

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 API Routes

- `GET/POST /api/calls` - Call management
- `GET/POST /api/assistants` - Assistant management  
- `GET/PUT /api/settings` - Settings configuration
- `POST /api/webhooks` - Vapi webhook events

## 🎨 Design System

The application uses a custom design system built with Tailwind CSS:

- **Colors**: Primary, secondary, accent, success, warning, error
- **Components**: Cards, buttons, forms, status indicators
- **Animations**: Fade-in, slide-up, hover effects
- **Responsive**: Mobile-first design approach

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VAPI_API_KEY` | Vapi AI API key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `DATABASE_URL` | Database connection string | Yes |

### Customization

- **AI Prompts**: Configure in Settings page
- **Styling**: Modify `tailwind.config.js`
- **Components**: Extend in `src/components/`

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Vapi AI Documentation](https://docs.vapi.ai)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
