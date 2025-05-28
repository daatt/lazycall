import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings - AI Agent Calling',
  description: 'Configure system prompts and application settings',
}

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            System Configuration
          </h2>

          <p className="text-gray-600 mb-4">
            Configure your AI assistant&apos;s behavior and system settings.
          </p>

          {/* TODO: Implement settings form component */}
          {/* This will be implemented in task 4.3 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">
              Settings form will be implemented in task 4.3
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
