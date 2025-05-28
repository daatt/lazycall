const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Check if settings already exist
  const existingSettings = await prisma.settings.findFirst()

  if (!existingSettings) {
    // Create default settings
    const defaultSettings = await prisma.settings.create({
      data: {
        systemPrompt: `You are a helpful AI assistant making phone calls on behalf of the user. 

Key guidelines:
- Be polite, professional, and friendly
- Clearly state your purpose at the beginning of the call
- Listen carefully and respond appropriately
- Accomplish the requested task efficiently
- Take notes of important information
- End the call courteously

Always remember you are representing the user, so maintain their best interests throughout the conversation.`,
      },
    })

    console.log('✅ Created default settings:', defaultSettings.id)
  } else {
    console.log('ℹ️  Settings already exist, skipping seed')
  }

  // Check if sample calls already exist
  const existingCalls = await prisma.call.findFirst()

  if (!existingCalls) {
    // Create sample call data for development
    console.log('\n📞 Creating sample call data...')

    const sampleCall1 = await prisma.call.create({
      data: {
        phoneNumber: '+1-555-RESTAURANT',
        status: 'completed',
        startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        endedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 180000), // 3 minutes later
        duration: 180,
        cost: 0.25,
        metadata: JSON.stringify({
          customPrompt:
            'Make a dinner reservation for 2 people at 7 PM tonight',
          businessName: "Mario's Italian Restaurant",
          outcome: 'successful',
        }),
      },
    })

    const sampleCall2 = await prisma.call.create({
      data: {
        phoneNumber: '+1-555-DOCTOR',
        status: 'completed',
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        endedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 120000), // 2 minutes later
        duration: 120,
        cost: 0.18,
        metadata: JSON.stringify({
          customPrompt: 'Schedule a routine checkup appointment',
          businessName: "Dr. Smith's Medical Office",
          outcome: 'successful',
        }),
      },
    })

    // Add sample transcripts
    await prisma.transcript.create({
      data: {
        callId: sampleCall1.id,
        content:
          "Hello, I'd like to make a reservation for tonight at 7 PM for 2 people. Yes, that works perfectly. Thank you!",
        summary:
          "Successfully made dinner reservation for 2 people at 7 PM tonight at Mario's Italian Restaurant.",
        analysis:
          'Call completed successfully. Restaurant had availability and confirmed the reservation.',
        processingStatus: 'completed',
        wordCount: 23,
        confidence: 0.92,
        language: 'en',
        metadata: JSON.stringify({
          reservationDate: new Date().toISOString().split('T')[0],
          reservationTime: '19:00',
          partySize: 2,
          businessName: "Mario's Italian Restaurant",
          outcome: 'confirmed',
        }),
      },
    })

    await prisma.transcript.create({
      data: {
        callId: sampleCall2.id,
        content:
          "Hi, I'd like to schedule a routine checkup with Dr. Smith. Next Tuesday at 2 PM would be great. Thank you!",
        summary:
          'Scheduled routine checkup appointment with Dr. Smith for next Tuesday at 2 PM.',
        analysis:
          'Appointment successfully scheduled. Office staff was helpful and accommodating.',
        processingStatus: 'completed',
        wordCount: 21,
        confidence: 0.94,
        language: 'en',
        metadata: JSON.stringify({
          appointmentDate: '2024-01-16',
          appointmentTime: '14:00',
          doctorName: 'Dr. Smith',
          appointmentType: 'routine checkup',
          outcome: 'scheduled',
        }),
      },
    })

    console.log('✅ Created sample calls and transcripts')
  } else {
    console.log('ℹ️  Sample calls already exist, skipping seed')
  }

  // Check if sample assistants already exist
  const existingAssistants = await prisma.assistant.findFirst()

  if (!existingAssistants) {
    // Create sample assistants for development
    console.log('\n🤖 Creating sample assistants...')

    const restaurantAssistant = await prisma.assistant.create({
      data: {
        name: 'Restaurant Reservation Assistant',
        systemPrompt: `You are a professional assistant specialized in making restaurant reservations. 

Key responsibilities:
- Call restaurants to make, modify, or cancel reservations
- Confirm reservation details (date, time, party size, special requests)
- Handle dietary restrictions and special occasions
- Be polite and professional with restaurant staff
- Provide clear confirmation of reservation details

Always confirm the reservation details at the end of the call.`,
        voice: 'jennifer',
        language: 'en',
        model: 'gpt-4',
        temperature: 0.7,
        description:
          'Specialized assistant for restaurant reservations and dining inquiries',
        tags: JSON.stringify([
          'restaurant',
          'reservations',
          'dining',
          'hospitality',
        ]),
      },
    })

    const medicalAssistant = await prisma.assistant.create({
      data: {
        name: 'Medical Appointment Assistant',
        systemPrompt: `You are a professional assistant for scheduling medical appointments.

Key responsibilities:
- Schedule, reschedule, or cancel medical appointments
- Handle sensitive health information with care and confidentiality
- Confirm appointment details (date, time, doctor, reason for visit)
- Ask about insurance information when appropriate
- Be respectful and empathetic with medical office staff
- Provide clear confirmation of appointment details

Always maintain patient confidentiality and be professional.`,
        voice: 'mark',
        language: 'en',
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 600,
        description:
          'Assistant for medical appointment scheduling and healthcare inquiries',
        tags: JSON.stringify([
          'medical',
          'appointments',
          'healthcare',
          'professional',
        ]),
      },
    })

    const generalAssistant = await prisma.assistant.create({
      data: {
        name: 'General Purpose Assistant',
        systemPrompt: `You are a versatile assistant capable of handling various types of phone calls.

Key responsibilities:
- Handle general inquiries and information requests
- Make appointments for various services
- Conduct customer service calls
- Gather information and provide updates
- Be adaptable to different business contexts
- Maintain professionalism in all interactions

Adapt your approach based on the specific task and business context.`,
        voice: 'jennifer',
        language: 'en',
        model: 'gpt-3.5-turbo',
        temperature: 0.6,
        description:
          'Versatile assistant for general purpose phone calls and inquiries',
        tags: JSON.stringify([
          'general',
          'versatile',
          'customer-service',
          'inquiries',
        ]),
      },
    })

    // Update the sample calls to use these assistants
    await prisma.call.updateMany({
      where: { phoneNumber: '+1-555-RESTAURANT' },
      data: { assistantId: restaurantAssistant.id },
    })

    await prisma.call.updateMany({
      where: { phoneNumber: '+1-555-DOCTOR' },
      data: { assistantId: medicalAssistant.id },
    })

    // Update assistant usage statistics
    await prisma.assistant.update({
      where: { id: restaurantAssistant.id },
      data: {
        usageCount: 1,
        lastUsedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
    })

    await prisma.assistant.update({
      where: { id: medicalAssistant.id },
      data: {
        usageCount: 1,
        lastUsedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    })

    console.log('✅ Created sample assistants and linked to calls')
  } else {
    console.log('ℹ️  Sample assistants already exist, skipping seed')
  }

  console.log('🌱 Database seeding completed')
}

main()
  .catch(e => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
