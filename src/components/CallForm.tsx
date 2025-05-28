'use client'

import { Button } from '@/components/ui/Button'
import { CallFormData } from '@/types'
import { useState } from 'react'

interface CallFormProps {
  onSubmit: (data: CallFormData) => void
  isLoading?: boolean
}

export function CallForm({ onSubmit, isLoading = false }: CallFormProps) {
  const [formData, setFormData] = useState<CallFormData>({
    phoneNumber: '',
    customPrompt: '',
    assistantId: undefined,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="phoneNumber"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Phone Number
        </label>
        <input
          type="tel"
          id="phoneNumber"
          value={formData.phoneNumber}
          onChange={e =>
            setFormData({ ...formData, phoneNumber: e.target.value })
          }
          placeholder="+1 (555) 123-4567"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label
          htmlFor="customPrompt"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Custom Prompt (Optional)
        </label>
        <textarea
          id="customPrompt"
          value={formData.customPrompt}
          onChange={e =>
            setFormData({ ...formData, customPrompt: e.target.value })
          }
          placeholder="Enter a custom prompt for this call..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* TODO: Add assistant selection dropdown */}
      {/* This will be implemented when assistants are available */}

      <Button
        type="submit"
        disabled={isLoading || !formData.phoneNumber.trim()}
        className="w-full"
      >
        {isLoading ? 'Creating Call...' : 'Start Call'}
      </Button>
    </form>
  )
}
