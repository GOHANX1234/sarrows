import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-sarrows-darker flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-black text-sarrows-red mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-gray-500 mb-8">The page you're looking for doesn't exist.</p>
        <Link href="/home" className="btn-primary">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
