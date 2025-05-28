# LazyCall - AI Agent Calling Tool

Automate your phone calls with intelligent AI agents. Make appointments, reservations, and handle routine calls while you focus on what matters most.

## Features

- **AI-Powered Calls**: Use Vapi to create intelligent phone agents
- **Custom Prompts**: Configure your AI agent's personality and behavior
- **Call History**: Track and review all your automated calls
- **Real-time Status**: Monitor call progress with live updates
- **Beautiful UI**: Modern, responsive design with Tailwind CSS

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp env.example .env
   ```

4. Fill in your API keys in `.env`:
   - `VAPI_API_KEY`: Your Vapi API key
   - `OPENAI_API_KEY`: Your OpenAI API key

5. Start the development server:
   ```bash
   npm run dev
   ```

### Code Quality

This project uses ESLint and Prettier for code quality and formatting:

#### Available Scripts

- `npm run lint` - Run ESLint to check for code issues
- `npm run lint:fix` - Automatically fix ESLint issues
- `npm run lint:strict` - Run ESLint with zero warnings allowed
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is properly formatted
- `npm run type-check` - Run TypeScript type checking
- `npm run check-all` - Run all quality checks (types, linting, formatting)
- `npm run fix-all` - Automatically fix linting and formatting issues

#### VS Code Integration

The project includes VS Code settings for automatic formatting and linting:

- Install recommended extensions when prompted
- Code will be automatically formatted on save
- ESLint issues will be highlighted in real-time
- Tailwind CSS IntelliSense for better styling experience

#### Code Quality Rules

- **TypeScript**: Strict type checking with helpful warnings
- **React**: Best practices for React and hooks usage
- **Accessibility**: JSX accessibility rules for better UX
- **Code Style**: Consistent formatting with Prettier
- **Import Organization**: Automatic import sorting and organization

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: Prisma with SQLite
- **AI Integration**: Vapi for voice AI, OpenAI for summaries
- **Code Quality**: ESLint + Prettier + TypeScript

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable React components
├── lib/                # Utility functions and configurations
└── types/              # TypeScript type definitions
```

## License

This project is for personal use. # lazycall
# lazycall
