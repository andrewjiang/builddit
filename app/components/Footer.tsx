'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Get the commit hash from environment variable or use a placeholder
const COMMIT_HASH = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development';

export function Footer() {
  const [shortCommitHash, setShortCommitHash] = useState<string>('loading...');
  
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      // Get the first 7 characters of the commit hash
      setShortCommitHash(COMMIT_HASH.substring(0, 7));
    }
  }, []);

  return (
    <footer className="w-full py-4 mt-8 border-t border-purple-800/30 bg-purple-950">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-purple-300">
          <div className="mb-2 md:mb-0">
            <span>© {new Date().getFullYear()} Someone Build</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="https://github.com/andrewjiang/builddit" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-purple-100 transition-colors flex items-center"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-1"
              >
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
              Open Source
            </Link>
            
            <Link 
              href={`https://github.com/andrewjiang/builddit/commit/${COMMIT_HASH}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-purple-100 transition-colors"
            >
              Commit: {shortCommitHash}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 