'use client'

import { Button } from '@/components/ui/Button'
import { SettingsFormData } from '@/types'
import { useEffect, useState } from 'react'

interface SettingsFormProps {
  onSubmit: (data: SettingsFormData) => void
  isLoading?: boolean
  initialData?: Partial<SettingsFormData>
  assistants?: Array<{ id: string; name: string }>
}

interface FormErrors {
  systemPrompt?: string
  openaiApiKey?: string
  vapiApiKey?: string
}

export function SettingsForm({
  onSubmit,
  isLoading = false,
  initialData = {},
  assistants = [],
}: SettingsFormProps) {
  const [formData, setFormData] = useState<SettingsFormData>({
    systemPrompt: '',
    defaultAssistantId: undefined,
    openaiApiKey: '',
    vapiApiKey: '',
    ...initialData,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isValidating, setIsValidating] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Update form when initial data changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  // Track changes
  useEffect(() => {
    const hasAnyChanges = Object.keys(formData).some(key => {
      const currentValue = formData[key as keyof SettingsFormData]
      const initialValue = initialData[key as keyof SettingsFormData]
      return currentValue !== initialValue
    })
    setHasChanges(hasAnyChanges)
  }, [formData, initialData])

  const validateSystemPrompt = (prompt: string): string | undefined => {
    if (!prompt.trim()) {
      return 'System prompt is required'
    }
    if (prompt.length < 10) {
      return 'System prompt must be at least 10 characters'
    }
    if (prompt.length > 5000) {
      return 'System prompt cannot exceed 5000 characters'
    }
    return undefined
  }

  const validateApiKey = (
    apiKey: string,
    keyType: string
  ): string | undefined => {
    if (apiKey && apiKey.length < 10) {
      return `${keyType} API key appears to be too short`
    }
    if (apiKey && apiKey.length > 200) {
      return `${keyType} API key appears to be too long`
    }
    return undefined
  }

  const validateForm = (): boolean => {
    setIsValidating(true)
    const newErrors: FormErrors = {}

    const promptError = validateSystemPrompt(formData.systemPrompt)
    if (promptError) newErrors.systemPrompt = promptError

    const openaiError = validateApiKey(formData.openaiApiKey || '', 'OpenAI')
    if (openaiError) newErrors.openaiApiKey = openaiError

    const vapiError = validateApiKey(formData.vapiApiKey || '', 'Vapi')
    if (vapiError) newErrors.vapiApiKey = vapiError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleReset = () => {
    setFormData({ ...initialData } as SettingsFormData)
    setErrors({})
    setHasChanges(false)
  }

  const getDefaultPrompt = () => {
    return "You are a helpful AI assistant making phone calls on behalf of the user. Be polite, professional, and accomplish the task efficiently. Always introduce yourself clearly, state the purpose of the call, and be respectful of the person's time. If you encounter any issues or the person seems confused, politely clarify and offer to call back at a better time."
  }

  const handleSystemPromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, systemPrompt: e.target.value })
    if (errors.systemPrompt) {
      setErrors({ ...errors, systemPrompt: undefined })
    }
  }

  return (
    <div className="space-y-8">
      {/* System Prompt Configuration */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            AI Assistant Behavior
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Configure how your AI agent behaves during phone calls
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-body space-y-6">
          <div>
            <label htmlFor="systemPrompt" className="label">
              System Prompt *
            </label>
            <textarea
              id="systemPrompt"
              value={formData.systemPrompt}
              onChange={handleSystemPromptChange}
              placeholder={getDefaultPrompt()}
              rows={8}
              className={`input resize-none ${errors.systemPrompt ? 'border-error-500 focus:ring-error-500' : ''}`}
              required
              disabled={isLoading}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.systemPrompt ? (
                <p className="text-sm text-error-600 dark:text-error-400">
                  {errors.systemPrompt}
                </p>
              ) : (
                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                  Define your AI agent's personality, tone, and behavior
                  patterns
                </p>
              )}
              <span className="text-xs text-secondary-400 dark:text-secondary-500">
                {formData.systemPrompt?.length || 0}/5000
              </span>
            </div>
            <div className="mt-2">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, systemPrompt: getDefaultPrompt() })
                }
                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline"
                disabled={isLoading}
              >
                Use default prompt
              </button>
            </div>
          </div>

          {/* Default Assistant Selection */}
          {assistants.length > 0 && (
            <div>
              <label htmlFor="defaultAssistantId" className="label">
                Default Assistant
              </label>
              <select
                id="defaultAssistantId"
                value={formData.defaultAssistantId || ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    defaultAssistantId: e.target.value || undefined,
                  })
                }
                className="input"
                disabled={isLoading}
              >
                <option value="">No default assistant</option>
                {assistants.map(assistant => (
                  <option key={assistant.id} value={assistant.id}>
                    {assistant.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                Choose an assistant to use as the default for new calls
              </p>
            </div>
          )}
        </form>
      </div>

      {/* API Configuration */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            API Configuration
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Configure API keys for enhanced functionality (optional)
          </p>
        </div>

        <div className="card-body space-y-6">
          <div>
            <label htmlFor="openaiApiKey" className="label">
              OpenAI API Key
            </label>
            <input
              type="password"
              id="openaiApiKey"
              value={formData.openaiApiKey || ''}
              onChange={e => {
                setFormData({ ...formData, openaiApiKey: e.target.value })
                if (errors.openaiApiKey) {
                  setErrors({ ...errors, openaiApiKey: undefined })
                }
              }}
              placeholder="sk-..."
              className={`input ${errors.openaiApiKey ? 'border-error-500 focus:ring-error-500' : ''}`}
              disabled={isLoading}
            />
            {errors.openaiApiKey ? (
              <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                {errors.openaiApiKey}
              </p>
            ) : (
              <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                Used for generating call summaries and analysis. Leave empty to
                use environment variable.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="vapiApiKey" className="label">
              Vapi API Key
            </label>
            <input
              type="password"
              id="vapiApiKey"
              value={formData.vapiApiKey || ''}
              onChange={e => {
                setFormData({ ...formData, vapiApiKey: e.target.value })
                if (errors.vapiApiKey) {
                  setErrors({ ...errors, vapiApiKey: undefined })
                }
              }}
              placeholder="vapi_..."
              className={`input ${errors.vapiApiKey ? 'border-error-500 focus:ring-error-500' : ''}`}
              disabled={isLoading}
            />
            {errors.vapiApiKey ? (
              <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                {errors.vapiApiKey}
              </p>
            ) : (
              <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                Used for making AI phone calls. Leave empty to use environment
                variable.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Settings Preview */}
      {hasChanges && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Settings Preview
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Review your changes before saving
            </p>
          </div>
          <div className="card-body">
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-secondary-600 dark:text-secondary-400">
                  System Prompt:
                </span>
                <p className="mt-1 text-secondary-900 dark:text-secondary-100 bg-white dark:bg-secondary-700 p-3 rounded border text-xs leading-relaxed">
                  {formData.systemPrompt.slice(0, 200)}
                  {formData.systemPrompt.length > 200 && '...'}
                </p>
              </div>
              {formData.defaultAssistantId && (
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">
                    Default Assistant:
                  </span>
                  <span className="font-medium text-secondary-900 dark:text-secondary-100">
                    {assistants.find(a => a.id === formData.defaultAssistantId)
                      ?.name || 'Unknown'}
                  </span>
                </div>
              )}
              {formData.openaiApiKey && (
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">
                    OpenAI API:
                  </span>
                  <span className="font-medium text-secondary-900 dark:text-secondary-100">
                    Configured (••••••••)
                  </span>
                </div>
              )}
              {formData.vapiApiKey && (
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">
                    Vapi API:
                  </span>
                  <span className="font-medium text-secondary-900 dark:text-secondary-100">
                    Configured (••••••••)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              loading={isLoading}
              disabled={!hasChanges || isLoading || isValidating}
              className="flex-1"
              onClick={handleSubmit}
            >
              {isLoading ? 'Saving Settings...' : 'Save Settings'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={!hasChanges || isLoading}
              className="sm:w-auto"
            >
              Reset Changes
            </Button>
          </div>

          {hasChanges && (
            <p className="mt-3 text-xs text-warning-600 dark:text-warning-400 text-center">
              You have unsaved changes. Don't forget to save your settings.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
