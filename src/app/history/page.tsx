import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Call History - AI Agent Calling',
  description: 'View and manage your call history with search and filtering',
}

export default function HistoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Call History</h1>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Calls
            </h2>

            {/* TODO: Implement search and filter controls */}
            <div className="bg-gray-50 rounded-lg px-4 py-2">
              <p className="text-sm text-gray-500">
                Search & filters coming in task 4.4
              </p>
            </div>
          </div>

          {/* TODO: Implement CallHistory component */}
          {/* This will be implemented in task 4.4 */}
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-2">No calls found</p>
            <p className="text-sm text-gray-400">
              Call history component will be implemented in task 4.4
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
