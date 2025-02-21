import { useState } from "react";
import { SignInButton } from "@farcaster/auth-kit";
import { useSession } from "next-auth/react";

interface PostBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PostBuildModal({ isOpen, onClose }: PostBuildModalProps) {
  const { data: session } = useSession();
  const [text, setText] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    // Create the Warpcast intent URL with channelKey
    const intentUrl = new URL('https://warpcast.com/~/compose');
    intentUrl.searchParams.set('text', text);
    intentUrl.searchParams.set('channelKey', 'someone-build');

    // Open Warpcast in a new tab
    window.open(intentUrl.toString(), '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-purple-900 rounded-xl p-6 max-w-lg w-full border border-purple-700/50 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-yellow-400 to-yellow-300 rounded-lg p-2 shadow-lg shadow-yellow-400/20">
              <svg
                className="w-5 h-5 text-purple-900"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">
              Post Your Build Request
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {!session?.user ? (
          <div className="text-center py-8">
            <p className="text-purple-200 mb-4">
              Please sign in with Farcaster to post a build request in the
              /someone-build channel.
            </p>
            <div className="flex justify-center">
              <SignInButton />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe what you'd like someone to build..."
              className="w-full bg-purple-900/50 text-white rounded-lg p-4 border border-purple-600/50 focus:border-yellow-400/50 focus:outline-none shadow-inner backdrop-blur-sm placeholder-purple-300/50 min-h-[120px]"
              required
            />

            <div className="flex justify-center mt-4">
              <button
                type="submit"
                disabled={!text.trim()}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                                         bg-gradient-to-r from-yellow-400 to-yellow-300 p-[2px] font-medium text-purple-900 
                                         shadow-xl shadow-yellow-400/20 transition-all duration-300 hover:shadow-yellow-400/40
                                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span
                  className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-yellow-400 
                                               to-yellow-300 px-6 py-2.5 transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                               group-hover:from-yellow-300 group-hover:to-yellow-200"
                >
                  <span className="font-medium">Someone Build It!</span>
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
