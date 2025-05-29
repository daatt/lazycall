import DashboardLayout from '@/components/ui/DashboardLayout'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Call History - AI Agent Calling',
  description: 'View and manage your call history with search and filtering',
}

export default function HistoryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            Call History
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            View and manage your previous AI agent calls with detailed
            transcripts and summaries.
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                  Recent Calls
                </h2>
                <p className="text-secondary-600 dark:text-secondary-400 mt-1">
                  Search, filter, and review your call history
                </p>
              </div>

              {/* TODO: Implement search and filter controls */}
              <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg px-4 py-2">
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Search & filters coming in task 4.4
                </p>
              </div>
            </div>
          </div>

          <div className="card-body">
            {/* TODO: Implement CallHistory component */}
            {/* This will be implemented in task 4.4 */}
            <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-secondary-200 dark:bg-secondary-700 rounded-lg flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-secondary-500 dark:text-secondary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-secondary-900 dark:text-secondary-100 mb-3">
                No calls found
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-md mx-auto">
                You haven&apos;t made any calls yet. Start by creating your
                first AI call from the dashboard.
              </p>
              <div className="text-sm text-secondary-500 dark:text-secondary-400 space-y-2">
                <p>Call history component will be implemented in task 4.4</p>
                <p className="text-xs">
                  Features coming soon: Search, filtering, pagination, and
                  detailed call views
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview of upcoming features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="card-body">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-primary-600 dark:text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-secondary-900 dark:text-secondary-100 mb-1">
                Advanced Search
              </h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Search calls by content, date, phone number, and outcome.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900 rounded-lg flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-accent-600 dark:text-accent-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-secondary-900 dark:text-secondary-100 mb-1">
                Smart Filtering
              </h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Filter by call status, duration, success rate, and more.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="w-10 h-10 bg-success-100 dark:bg-success-900 rounded-lg flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-success-600 dark:text-success-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-secondary-900 dark:text-secondary-100 mb-1">
                Call Analytics
              </h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                View insights and analytics about your call patterns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
