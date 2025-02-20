import { useState } from 'react';
import { SignInButton, useProfile } from '@farcaster/auth-kit';

interface PostBuildModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PostBuildModal({ isOpen, onClose }: PostBuildModalProps) {
    const { isAuthenticated } = useProfile();
    const [text, setText] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement post submission
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            data-oid="owctc5-"
        >
            <div
                className="bg-purple-900 rounded-xl p-6 max-w-lg w-full border border-purple-700/50 shadow-xl"
                data-oid="pdav494"
            >
                <div className="flex items-center justify-between mb-4" data-oid="u04mnzo">
                    <div className="flex items-center space-x-3" data-oid="q:n7o:x">
                        <div
                            className="bg-gradient-to-tr from-yellow-400 to-yellow-300 rounded-lg p-2 shadow-lg shadow-yellow-400/20"
                            data-oid="sn6ukkc"
                        >
                            <svg
                                className="w-5 h-5 text-purple-900"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                data-oid="t7qdn7b"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    data-oid="qyj8ajs"
                                />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-white" data-oid="k3i-w_o">
                            Post Your Build Idea
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-purple-300 hover:text-white transition-colors"
                        data-oid="e.ldt36"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            data-oid="l4rflk6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                                data-oid="gh:txei"
                            />
                        </svg>
                    </button>
                </div>

                {!isAuthenticated ? (
                    <div className="text-center py-8" data-oid="uig:ldr">
                        <p className="text-purple-200 mb-4" data-oid="lq6js_r">
                            Please sign in with Farcaster to post a build idea.
                        </p>
                        <SignInButton data-oid="a1kvwkg" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} data-oid="ku6y0rw">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Describe what you'd like someone to build..."
                            className="w-full bg-purple-900/50 text-white rounded-lg p-4 border border-purple-600/50 focus:border-yellow-400/50 focus:outline-none shadow-inner backdrop-blur-sm placeholder-purple-300/50 min-h-[120px]"
                            required
                            data-oid="m38:vw5"
                        />

                        <div className="flex justify-end mt-4" data-oid="22-4lxo">
                            <button
                                type="submit"
                                disabled={!text.trim()}
                                className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                                         bg-gradient-to-r from-yellow-400 to-yellow-300 p-[2px] font-medium text-purple-900 
                                         shadow-xl shadow-yellow-400/20 transition-all duration-300 hover:shadow-yellow-400/40
                                         disabled:opacity-50 disabled:cursor-not-allowed"
                                data-oid="pf1mjsm"
                            >
                                <span
                                    className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-yellow-400 
                                               to-yellow-300 px-6 py-2.5 transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                               group-hover:from-yellow-300 group-hover:to-yellow-200"
                                    data-oid="jr:mf8x"
                                >
                                    <span className="font-medium" data-oid="1o:kmoi">
                                        Post Idea
                                    </span>
                                </span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
