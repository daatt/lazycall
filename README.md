# LazyCall - AI Agent Calling Tool

A personal web application that enables users to leverage AI agents to make phone calls on their behalf using the Vapi API.

## Features

- **Automate Personal Phone Tasks**: Delegate routine phone calls to an AI agent
- **Intuitive Call Configuration**: Set up calls with custom prompts through a clean web interface
- **Real-time Call Monitoring**: Track call progress and status updates
- **Complete Call History**: Searchable log of all calls with transcripts and summaries
- **AI-Generated Insights**: Automated summaries and analysis of call outcomes

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Prisma with SQLite (planned)
- **AI Integration**: Vapi API for calls, OpenAI for summaries (planned)
- **Styling**: Tailwind CSS with responsive design

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables (Coming Soon)

Create a `.env.local` file with:
```
VAPI_API_KEY=your_vapi_api_key
OPENAI_API_KEY=your_openai_api_key
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
├── lib/                # Utility functions and API clients
└── types/              # TypeScript type definitions
```

## License

This project is for personal use. # lazycall
# lazycall
