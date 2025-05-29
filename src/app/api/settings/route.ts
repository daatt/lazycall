import {
  createDefaultSettings,
  getSettings,
  updateSettings,
} from '@/lib/database'
import { ApiResponse, Settings, SettingsFormData } from '@/types'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/settings - Retrieve application settings
export async function GET(_request: NextRequest) {
  try {
    let settings = await getSettings()

    // If no settings exist, create default settings
    if (!settings) {
      settings = await createDefaultSettings()
    }

    const response: ApiResponse<Settings> = {
      success: true,
      data: settings,
      message: 'Settings retrieved successfully',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error retrieving settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve settings' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update application settings
export async function PUT(request: NextRequest) {
  try {
    const body: SettingsFormData = await request.json()

    // Validate required fields
    if (!body.systemPrompt || body.systemPrompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'System prompt is required' },
        { status: 400 }
      )
    }

    // Update settings using the database utility function
    const settings = await updateSettings({
      systemPrompt: body.systemPrompt.trim(),
      defaultAssistantId: body.defaultAssistantId,
      openaiApiKey: body.openaiApiKey,
      vapiApiKey: body.vapiApiKey,
    })

    const response: ApiResponse<Settings> = {
      success: true,
      data: settings,
      message: 'Settings updated successfully',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
