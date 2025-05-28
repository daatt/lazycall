export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 dark:from-secondary-900 dark:to-primary-900">
      {/* Header */}
      <header className="glass-effect border-b border-secondary-200 dark:border-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LC</span>
              </div>
              <h1 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                LazyCall
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="status-idle">
                <div className="w-2 h-2 bg-secondary-400 rounded-full"></div>
                Ready
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
            AI Agent{' '}
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Calling Tool
            </span>
          </h1>
          <p className="text-lg text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto text-balance">
            Automate your phone calls with intelligent AI agents. Make
            appointments, reservations, and handle routine calls while you focus
            on what matters most.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card hover:shadow-medium transition-all duration-300 animate-slide-up group cursor-pointer">
            <div className="card-body">
              <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-5 h-5 text-white"
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
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                Make Calls
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm leading-relaxed">
                Configure and initiate AI-powered phone calls for your personal
                tasks.
              </p>
            </div>
          </div>

          <div
            className="card hover:shadow-medium transition-all duration-300 animate-slide-up group cursor-pointer"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="card-body">
              <div className="w-10 h-10 bg-accent-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                Settings
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm leading-relaxed">
                Configure your AI agent&apos;s personality and behavior
                patterns.
              </p>
            </div>
          </div>

          <div
            className="card hover:shadow-medium transition-all duration-300 animate-slide-up group cursor-pointer"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="card-body">
              <div className="w-10 h-10 bg-success-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-5 h-5 text-white"
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
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                History
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm leading-relaxed">
                View transcripts and summaries of your previous calls.
              </p>
            </div>
          </div>

          <div
            className="card hover:shadow-medium transition-all duration-300 animate-slide-up group cursor-pointer"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="card-body">
              <div className="w-10 h-10 bg-warning-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                Status
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm leading-relaxed">
                Monitor active calls and view real-time progress updates.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card max-w-2xl mx-auto">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
              Quick Start
            </h2>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Get started with your first AI call
            </p>
          </div>
          <div className="card-body space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="btn-primary flex-1">
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                New Call
              </button>
              <button className="btn-secondary flex-1">
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Configure Agent
              </button>
            </div>
            <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary-600 dark:text-secondary-400">
                  Recent Activity
                </span>
                <span className="badge-primary">0 calls today</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
