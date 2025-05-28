// Environment variable configuration and validation
// This file ensures all required environment variables are present and properly typed

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',

  // Vapi API Configuration
  VAPI_API_KEY: process.env.VAPI_API_KEY || '',
  VAPI_BASE_URL: process.env.VAPI_BASE_URL || 'https://api.vapi.ai',

  // OpenAI API Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',

  // Next.js Configuration
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',

  // Node Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
}

// Validation function to check if required environment variables are set
export function validateEnv() {
  const requiredVars = ['VAPI_API_KEY', 'OPENAI_API_KEY']

  const missingVars = requiredVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    console.warn(
      `⚠️  Missing environment variables: ${missingVars.join(', ')}\n` +
        `Please copy env.example to .env and fill in the required values.`
    )
  }

  return missingVars.length === 0
}

// Type definitions for environment variables
export type EnvConfig = typeof env
