// src/pages/NotFound.tsx
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F5F7FA] px-4">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
          <Compass className="h-8 w-8 text-[#2F5BEA]" />
        </div>
        <p className="text-5xl font-black text-[#1F2A44]">404</p>
        <h1 className="mt-2 text-lg font-bold text-[#1F2A44]">Page not found</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
          The page you are looking for was moved, removed, or never existed.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/"
            className="flex items-center gap-2 rounded-xl bg-[#2F5BEA] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a3fc7]">
            <Home className="h-4 w-4" /> Back to home
          </Link>
          <Link to="/events"
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50">
            Browse events
          </Link>
        </div>
      </div>
    </div>
  );
}
