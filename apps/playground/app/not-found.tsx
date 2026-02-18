export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="card max-w-md text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist.
        </p>
        <div className="flex justify-center space-x-4">
          <a
            href="/"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            OAuth Flow
          </a>
          <a
            href="/webhook"
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-md"
          >
            Webhook Tester
          </a>
        </div>
      </div>
    </div>
  )
}
