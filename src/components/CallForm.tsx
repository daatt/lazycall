'use client'

import { Button } from '@/components/ui/Button'
import { CallFormData } from '@/types'
import { useState } from 'react'

interface CallFormProps {
  onSubmit: (data: CallFormData) => void
  isLoading?: boolean
  assistants?: Array<{ id: string; name: string }>
}

interface FormErrors {
  phoneNumber?: string
  customPrompt?: string
}

export function CallForm({
  onSubmit,
  isLoading = false,
  assistants = [],
}: CallFormProps) {
  const [formData, setFormData] = useState<CallFormData>({
    phoneNumber: '',
    customPrompt: '',
    assistantId: undefined,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isValidating, setIsValidating] = useState(false)

  const validatePhoneNumber = (phone: string): string | undefined => {
    if (!phone.trim()) {
      return 'Phone number is required'
    }

    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '')

    // Check for valid length (10-15 digits is typical for international numbers)
    if (digitsOnly.length < 10) {
      return 'Phone number must be at least 10 digits'
    }

    if (digitsOnly.length > 15) {
      return 'Phone number cannot exceed 15 digits'
    }

    // Basic format check - should contain digits and common formatting characters
    const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)\.]{8,25}$/
    if (!phoneRegex.test(phone.trim())) {
      return 'Please enter a valid phone number'
    }

    return undefined
  }

  const validatePrompt = (prompt: string): string | undefined => {
    if (prompt && prompt.length > 2000) {
      return 'Prompt cannot exceed 2000 characters'
    }
    return undefined
  }

  const validateForm = (): boolean => {
    setIsValidating(true)
    const newErrors: FormErrors = {}

    const phoneError = validatePhoneNumber(formData.phoneNumber)
    if (phoneError) newErrors.phoneNumber = phoneError

    const promptError = validatePrompt(formData.customPrompt || '')
    if (promptError) newErrors.customPrompt = promptError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '')

    // If it starts with +, preserve it
    if (cleaned.startsWith('+')) {
      return cleaned
    }

    // For US numbers, add formatting
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
    }

    // For 11 digits starting with 1 (US country code)
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4')
    }

    return cleaned
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData({ ...formData, phoneNumber: formatted })

    // Clear error when user starts typing
    if (errors.phoneNumber) {
      setErrors({ ...errors, phoneNumber: undefined })
    }
  }

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, customPrompt: e.target.value })

    // Clear error when user starts typing
    if (errors.customPrompt) {
      setErrors({ ...errors, customPrompt: undefined })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      onSubmit(formData)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
          Create New Call
        </h2>
        <p className="text-secondary-600 dark:text-secondary-400 mt-1">
          Configure your AI agent call with a phone number and specific
          instructions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card-body space-y-6">
        {/* Phone Number Field */}
        <div>
          <label htmlFor="phoneNumber" className="label">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phoneNumber"
            value={formData.phoneNumber}
            onChange={handlePhoneNumberChange}
            placeholder="+1 (555) 123-4567"
            className={`input ${errors.phoneNumber ? 'border-error-500 focus:ring-error-500' : ''}`}
            required
            disabled={isLoading}
          />
          {errors.phoneNumber && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">
              {errors.phoneNumber}
            </p>
          )}
          <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
            Enter a phone number with country code (e.g., +1 for US/Canada)
          </p>
        </div>

        {/* Custom Prompt Field */}
        <div>
          <label htmlFor="customPrompt" className="label">
            Call Instructions
          </label>
          <textarea
            id="customPrompt"
            value={formData.customPrompt}
            onChange={handlePromptChange}
            placeholder="Tell the AI agent what to accomplish on this call...

Examples:
• Schedule an appointment for next week
• Ask about store hours and location
• Inquire about service pricing
• Request a callback for technical support"
            rows={6}
            className={`input resize-none ${errors.customPrompt ? 'border-error-500 focus:ring-error-500' : ''}`}
            disabled={isLoading}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.customPrompt ? (
              <p className="text-sm text-error-600 dark:text-error-400">
                {errors.customPrompt}
              </p>
            ) : (
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                Describe what you want the AI agent to accomplish during the
                call
              </p>
            )}
            <span className="text-xs text-secondary-400 dark:text-secondary-500">
              {formData.customPrompt?.length || 0}/2000
            </span>
          </div>
        </div>

        {/* Assistant Selection (if available) */}
        {assistants.length > 0 && (
          <div>
            <label htmlFor="assistantId" className="label">
              AI Assistant
            </label>
            <select
              id="assistantId"
              value={formData.assistantId || ''}
              onChange={e =>
                setFormData({
                  ...formData,
                  assistantId: e.target.value || undefined,
                })
              }
              className="input"
              disabled={isLoading}
            >
              <option value="">Use default assistant</option>
              {assistants.map(assistant => (
                <option key={assistant.id} value={assistant.id}>
                  {assistant.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
              Choose a specific AI assistant or use the default configuration
            </p>
          </div>
        )}

        {/* Call Preview */}
        {formData.phoneNumber && (
          <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2">
              Call Preview
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-600 dark:text-secondary-400">
                  Phone:
                </span>
                <span className="font-medium text-secondary-900 dark:text-secondary-100">
                  {formData.phoneNumber}
                </span>
              </div>
              {formData.customPrompt && (
                <div>
                  <span className="text-secondary-600 dark:text-secondary-400">
                    Instructions:
                  </span>
                  <p className="mt-1 text-secondary-900 dark:text-secondary-100 text-xs bg-white dark:bg-secondary-700 p-2 rounded border">
                    {formData.customPrompt.slice(0, 150)}
                    {formData.customPrompt.length > 150 && '...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            loading={isLoading}
            disabled={!formData.phoneNumber.trim() || isLoading || isValidating}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Initiating Call...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Start AI Call
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFormData({
                phoneNumber: '',
                customPrompt: '',
                assistantId: undefined,
              })
              setErrors({})
            }}
            disabled={isLoading}
            className="sm:w-auto"
          >
            Clear Form
          </Button>
        </div>
      </form>
    </div>
  )
}
