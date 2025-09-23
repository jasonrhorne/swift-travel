import Link from 'next/link';

export default function HomePage() {
  // Development mode notice
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Swift Travel
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-powered travel itinerary generator with multi-agent system
        </p>
        
        {isDevelopment && (
          <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-lg max-w-md mx-auto">
            <p className="text-sm font-medium">
              🚧 Development Mode: Authentication bypassed
            </p>
          </div>
        )}
        
        <div className="space-x-4">
          <Link
            href="/requirements"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isDevelopment ? 'Create Itinerary' : 'Get Started'}
          </Link>
          <Link
            href="/itinerary"
            className="inline-block px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
          >
            View Sample Itinerary
          </Link>
        </div>
      </div>
    </div>
  );
}