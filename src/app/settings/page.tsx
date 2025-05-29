'use client'

import { SettingsForm } from '@/components/SettingsForm'
import DashboardLayout from '@/components/ui/DashboardLayout'
import {
  ApiResponse,
  Assistant,
  PaginatedResponse,
  Settings,
  SettingsFormData,
} from '@/types'
import { useCallback, useEffect, useState } from 'react'

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
  const [assistants, setAssistants] = useState<
    Array<{ id: string; name: string }>
  >([])

  // Set document title
  useEffect(() => {
    document.title = 'Settings - AI Agent Calling'
  }, [])

  // Load settings and assistants on component mount
  const loadData = useCallback(async () => {
    setIsFetching(true)
    try {
      // Load settings and assistants in parallel
      const [settingsResponse, assistantsResponse] = await Promise.all([
        loadSettings(),
        loadAssistants(),
      ])

      if (!settingsResponse || !assistantsResponse) {
        throw new Error('Failed to load required data')
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setStatusMessage('Failed to load settings. Please refresh the page.')

      setTimeout(() => {
        setStatusMessage(null)
      }, 5000)
    } finally {
      setIsFetching(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const loadSettings = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/settings')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: ApiResponse<Settings> = await response.json()

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Invalid response format')
      }

      // Transform Settings to SettingsFormData
      const formData: SettingsFormData = {
        systemPrompt: data.data.systemPrompt,
        defaultAssistantId: data.data.defaultAssistantId,
        openaiApiKey: data.data.openaiApiKey || '',
        vapiApiKey: data.data.vapiApiKey || '',
      }

      setSettings(formData)
      return true
    } catch (error) {
      console.error('Failed to load settings:', error)
      return false
    }
  }

  const loadAssistants = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/assistants?isActive=true&limit=100')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: ApiResponse<PaginatedResponse<Assistant>> =
        await response.json()

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Invalid response format')
      }

      // Transform to simple format for the form
      const simpleAssistants = data.data.data.map(assistant => ({
        id: assistant.id,
        name: assistant.name,
      }))

      setAssistants(simpleAssistants)
      return true
    } catch (error) {
      console.error('Failed to load assistants:', error)
      return false
    }
  }

  const handleSaveSettings = async (formData: SettingsFormData) => {
    setIsLoading(true)
    setStatusMessage('Saving settings...')

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        )
      }

      const data: ApiResponse<Settings> = await response.json()

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Invalid response format')
      }

      // Update local state with saved data
      const updatedFormData: SettingsFormData = {
        systemPrompt: data.data.systemPrompt,
        defaultAssistantId: data.data.defaultAssistantId,
        openaiApiKey: data.data.openaiApiKey || '',
        vapiApiKey: data.data.vapiApiKey || '',
      }

      setSettings(updatedFormData)
      setStatusMessage('Settings saved successfully!')

      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatusMessage(null)
      }, 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      setStatusMessage(`Failed to save settings: ${errorMessage}`)

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
              Task 4.7 - Settings page with real API integration ✅
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
                  <li>• Real API integration</li>
                  <li>• Error handling & feedback</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                  ✅ Real API Calls
                </h4>
                <ul className="space-y-1 text-secondary-600 dark:text-secondary-400">
                  <li>• GET /api/settings (loading)</li>
                  <li>• PUT /api/settings (saving)</li>
                  <li>• GET /api/assistants (dropdown)</li>
                  <li>• Comprehensive error handling</li>
                  <li>• Status feedback & validation</li>
                  <li>• Parallel data loading</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-700 rounded-lg">
              <p className="text-xs text-success-700 dark:text-success-300">
                <strong>Status:</strong> Settings page now uses real API
                endpoints with comprehensive error handling and user feedback.
                All data is persisted to the database.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
