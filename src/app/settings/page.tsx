'use client'

import { SettingsForm } from '@/components/SettingsForm'
import DashboardLayout from '@/components/ui/DashboardLayout'
import { SettingsFormData } from '@/types'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [settings, setSettings] = useState<SettingsFormData>({
    systemPrompt: '',
    defaultAssistantId: undefined,
    openaiApiKey: '',
    vapiApiKey: '',
  })

  // Set document title
  useEffect(() => {
    document.title = 'Settings - AI Agent Calling'
  }, [])

  // Mock assistants data - this will be replaced with real API call in task 4.6
  const [assistants] = useState([
    { id: 'assistant-1', name: 'Professional Assistant' },
    { id: 'assistant-2', name: 'Friendly Assistant' },
    { id: 'assistant-3', name: 'Business Assistant' },
  ])

  // Load settings on component mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsFetching(true)
    try {
      // TODO: Implement actual API call when task 4.6 is completed
      console.log('Loading settings...')

      // Simulate API call with default settings
      await new Promise(resolve => setTimeout(resolve, 1000))

      const defaultSettings: SettingsFormData = {
        systemPrompt:
          "You are a helpful AI assistant making phone calls on behalf of the user. Be polite, professional, and accomplish the task efficiently. Always introduce yourself clearly, state the purpose of the call, and be respectful of the person's time. If you encounter any issues or the person seems confused, politely clarify and offer to call back at a better time.",
        defaultAssistantId: undefined,
        openaiApiKey: '',
        vapiApiKey: '',
      }

      setSettings(defaultSettings)
    } catch (error) {
      console.error('Failed to load settings:', error)
      setStatusMessage('Failed to load settings. Using defaults.')

      setTimeout(() => {
        setStatusMessage(null)
      }, 5000)
    } finally {
      setIsFetching(false)
    }
  }

  const handleSaveSettings = async (formData: SettingsFormData) => {
    setIsLoading(true)
    setStatusMessage('Saving settings...')

    try {
      // TODO: Implement actual API call when task 4.6 is completed
      console.log('Saving settings:', formData)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      setSettings(formData)
      setStatusMessage('Settings saved successfully!')

      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatusMessage(null)
      }, 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setStatusMessage('Failed to save settings. Please try again.')

      // Clear error message after 5 seconds
      setTimeout(() => {
        setStatusMessage(null)
      }, 5000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout maxWidth="2xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            Settings
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mb-6">
            Configure your AI agent&apos;s behavior and API settings.
          </p>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`card max-w-2xl mx-auto ${
              statusMessage.includes('success')
                ? 'border-success-200 bg-success-50 dark:bg-success-900/20'
                : statusMessage.includes('Failed')
                  ? 'border-error-200 bg-error-50 dark:bg-error-900/20'
                  : 'border-primary-200 bg-primary-50 dark:bg-primary-900/20'
            }`}
          >
            <div className="card-body text-center">
              <p
                className={`font-medium ${
                  statusMessage.includes('success')
                    ? 'text-success-700 dark:text-success-300'
                    : statusMessage.includes('Failed')
                      ? 'text-error-700 dark:text-error-300'
                      : 'text-primary-700 dark:text-primary-300'
                }`}
              >
                {statusMessage}
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isFetching ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-secondary-600 dark:text-secondary-400">
                Loading settings...
              </p>
            </div>
          </div>
        ) : (
          /* Settings Form */
          <SettingsForm
            onSubmit={handleSaveSettings}
            isLoading={isLoading}
            initialData={settings}
            assistants={assistants}
          />
        )}

        {/* Development Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Development Progress
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Task 4.3 - Settings page configuration ✅
            </p>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                  ✅ Implemented
                </h4>
                <ul className="space-y-1 text-secondary-600 dark:text-secondary-400">
                  <li>• System prompt configuration</li>
                  <li>• API key management</li>
                  <li>• Default assistant selection</li>
                  <li>• Form validation & UX</li>
                  <li>• Settings preview</li>
                  <li>• Change tracking</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                  🔄 Simulated
                </h4>
                <ul className="space-y-1 text-secondary-600 dark:text-secondary-400">
                  <li>• Settings loading (API call)</li>
                  <li>• Settings saving (API call)</li>
                  <li>• Assistant list (mock data)</li>
                  <li>• Status feedback</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
              <p className="text-xs text-secondary-600 dark:text-secondary-400">
                <strong>Note:</strong> Settings are currently simulated. Real
                database integration will be implemented in Task 4.6 (API
                routes).
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
