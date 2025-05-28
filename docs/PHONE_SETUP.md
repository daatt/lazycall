# Setting Up Phone Numbers in Vapi

To make outbound calls using the AI Agent Calling Tool, you need to configure at least one phone number in your Vapi account. This phone number will be used as the "from" number when making calls.

## Prerequisites

- A Vapi account with API access
- Either:
  - Funds to purchase a phone number through Vapi
  - A Twilio account with an existing phone number to import

## Option 1: Purchase a Phone Number from Vapi

1. Log into your [Vapi Dashboard](https://dashboard.vapi.ai)
2. Navigate to the **Phone Numbers** section in the left sidebar
3. Click **"Buy Number"**
4. Select your desired country and area code
5. Choose from the available numbers
6. Complete the purchase

## Option 2: Import a Phone Number from Twilio

If you already have a Twilio phone number, you can import it into Vapi:

1. Log into your [Vapi Dashboard](https://dashboard.vapi.ai)
2. Navigate to the **Phone Numbers** section
3. Click **"Import Number"**
4. Enter your Twilio credentials:
   - Account SID
   - Auth Token
   - Phone Number
5. Click **"Import"**

## Using Phone Numbers in the Application

Once you have at least one phone number configured:

### Automatic Selection
By default, the application will automatically use the first available phone number when making calls.

### Manual Selection
You can specify a phone number ID when creating calls:

```typescript
const call = await createOutboundCall({
  phoneNumber: '+1234567890',    // The number to call
  assistantId: 'assistant-id',
  phoneNumberId: 'phone-id'       // Your Vapi phone number ID
})
```

### Listing Available Phone Numbers
To see all configured phone numbers:

```typescript
const phoneNumbers = await vapi.listPhoneNumbers()
phoneNumbers.forEach(phone => {
  console.log(`ID: ${phone.id}, Number: ${phone.number}`)
})
```

## Testing Your Setup

Run the integration test to verify your phone number configuration:

```bash
# Test with a real phone number
TEST_PHONE_NUMBER="+1234567890" npm run test:vapi
```

The test will:
1. Check for configured phone numbers
2. Display detailed instructions if none are found
3. Use the first available number for test calls

## Troubleshooting

### Error: "Couldn't Get Phone Number"
This error means no phone number is configured in your Vapi account. Follow the setup instructions above.

### No Phone Numbers Listed
- Verify your API key has the correct permissions
- Check that your Vapi account is active
- Ensure any imported numbers are properly configured

### Call Creation Fails
- Verify the destination number is in the correct E.164 format (+1234567890)
- Check that your Vapi account has sufficient balance
- Ensure the phone number is active and not suspended

## Best Practices

1. **Dedicated Numbers**: Use dedicated phone numbers for different use cases (support, sales, etc.)
2. **Caller ID**: Configure meaningful names for your phone numbers in Vapi
3. **Compliance**: Ensure you comply with local regulations for automated calling
4. **Testing**: Always test with your own number before calling customers

## API Reference

### Phone Number Object

```typescript
interface VapiPhoneNumber {
  id: string                  // Unique identifier
  number: string              // E.164 formatted number
  name?: string               // Display name
  provider: string            // 'vapi' or 'twilio'
  createdAt: string          // ISO date string
  updatedAt: string          // ISO date string
  assistantId?: string       // Default assistant for inbound
  serverUrl?: string         // Webhook URL for events
}
```

### Available Methods

- `vapi.listPhoneNumbers()` - List all phone numbers
- `vapi.getPhoneNumber(id)` - Get a specific phone number
- `vapi.createPhoneNumber(config)` - Create a new number
- `vapi.updatePhoneNumber(id, config)` - Update number settings
- `vapi.deletePhoneNumber(id)` - Delete a phone number

## Webhook Configuration

To receive real-time call status updates, you need to configure a webhook URL in your Vapi account:

1. Log into your [Vapi Dashboard](https://dashboard.vapi.ai)
2. Navigate to the **Settings** section
3. Find the **Webhooks** configuration
4. Add your webhook URL: `https://your-domain.com/api/webhooks`
5. Save the configuration

### Local Development

For local development, you can use a service like [ngrok](https://ngrok.com) to expose your local server:

1. Install ngrok:
```bash
npm install -g ngrok
```

2. Start your Next.js development server:
```bash
npm run dev
```

3. In a separate terminal, start ngrok:
```bash
ngrok http 3000
```

4. Copy the HTTPS URL provided by ngrok (e.g., `https://abc123.ngrok.io`)
5. Configure your webhook URL in Vapi as: `https://abc123.ngrok.io/api/webhooks`

### Testing Webhooks

You can verify webhook functionality by:

1. Making a test call
2. Checking your server logs for incoming webhook events
3. Verifying that call status updates are reflected in the database

If webhooks aren't working:
- Verify the webhook URL is correct and accessible
- Check that your server is running and can receive POST requests
- Ensure your Vapi API key has the necessary permissions
- Try using the direct API status check as a fallback 