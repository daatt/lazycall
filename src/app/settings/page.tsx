import DashboardLayout from '@/components/ui/DashboardLayout'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings - AI Agent Calling',
  description: 'Configure system prompts and application settings',
}

export default function SettingsPage() {
  return (
    <DashboardLayout maxWidth="2xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            Settings
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Configure your AI assistant&apos;s behavior and system settings.
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
              System Configuration
            </h2>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Set up your AI agent&apos;s default behavior and personality.
            </p>
          </div>
          <div className="card-body">
            {/* TODO: Implement settings form component */}
            {/* This will be implemented in task 4.3 */}
            <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-secondary-200 dark:bg-secondary-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-secondary-500 dark:text-secondary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                Settings Configuration
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                Settings form will be implemented in task 4.3
              </p>
              <div className="text-sm text-secondary-500 dark:text-secondary-400">
                Coming soon: System prompt configuration, AI behavior settings,
                and more.
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
