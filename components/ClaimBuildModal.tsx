import { BuildRequest } from '@/lib/api/types';
import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'react-hot-toast';

interface ClaimBuildModalProps {
    buildRequest: BuildRequest;
    isOpen: boolean;
    onClose: () => void;
}

export function ClaimBuildModal({ buildRequest, isOpen, onClose }: ClaimBuildModalProps) {
    const { isAuthenticated, profile } = useAuth();
    const [step, setStep] = useState<'form' | 'preview'>('form');
    const [projectUrl, setProjectUrl] = useState('');
    const [description, setDescription] = useState('');
    const [urlError, setUrlError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedClaim, setSubmittedClaim] = useState<any>(null);
    const [storedUser, setStoredUser] = useState<{
        fid: number;
        username: string;
        displayName: string;
        pfp: {
            url: string;
            verified: boolean;
        };
    } | null>(null);

    useEffect(() => {
        async function fetchStoredUser() {
            if (isAuthenticated && profile?.fid) {
                try {
                    const response = await fetch(`/api/users/${profile.fid}`);
                    if (response.ok) {
                        const userData = await response.json();
                        setStoredUser(userData);
                    }
                } catch (error) {
                    console.error('Error fetching stored user data:', error);
                }
            }
        }

        if (isOpen) {
            fetchStoredUser();
        }
    }, [isAuthenticated, profile?.fid, isOpen]);

    if (!isOpen) return null;

    const validateUrl = (url: string) => {
        if (!url) return false;
        
        // Add http:// if no protocol is specified
        const urlWithProtocol = url.match(/^[a-zA-Z]+:\/\//) ? url : `http://${url}`;
        
        try {
            new URL(urlWithProtocol);
            return true;
        } catch {
            return false;
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setProjectUrl(url);

        if (!url) {
            setUrlError('Project URL is required');
        } else if (!validateUrl(url)) {
            setUrlError('Please enter a valid URL');
        } else {
            setUrlError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated || !profile) return;

        if (!validateUrl(projectUrl)) {
            setUrlError('Please enter a valid URL');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/build-requests/${buildRequest.hash}/claims`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectUrl,
                    description,
                    author: {
                        fid: profile.fid,
                        username: profile.username,
                        displayName: profile.displayName || profile.username,
                        pfpUrl: profile.pfp?.url,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit claim');
            }

            const data = await response.json();
            setSubmittedClaim(data.claim);
            setStep('preview');
        } catch (error) {
            console.error('Error submitting claim:', error);
            toast.error('Failed to submit build claim');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCast = () => {
        if (!submittedClaim) return;

        // Create the Warpcast intent URL with channelKey
        const intentUrl = new URL('https://warpcast.com/~/compose');
        intentUrl.searchParams.set('text', submittedClaim.text);
        intentUrl.searchParams.set('channelKey', 'someone-build');
        intentUrl.searchParams.set(
            'embeds[]',
            `https://warpcast.com/${buildRequest.author.username}/${buildRequest.hash}`
        );

        window.open(intentUrl.toString(), '_blank');
        handleClose();
    };

    const handleClose = () => {
        setStep('form');
        setProjectUrl('');
        setDescription('');
        setSubmittedClaim(null);
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                {/* Background overlay */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                {/* Modal */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-purple-900/90 p-6 text-left align-middle shadow-xl transition-all border border-purple-400/20">
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-xl font-medium leading-6 text-purple-100"
                                    >
                                        {step === 'form' ? 'Submit Your Build' : 'Build Submitted!'}
                                    </Dialog.Title>
                                    <button
                                        onClick={handleClose}
                                        className="text-purple-300 hover:text-white transition-colors"
                                    >
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                {step === 'form' ? (
                                    <>
                                        <div className="mb-6">
                                            <p className="text-sm text-purple-200">
                                                Share your project details below. After submission, you'll have the option to share it on Warpcast.
                                            </p>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div>
                                                <label
                                                    htmlFor="description"
                                                    className="block text-sm font-medium text-purple-200 mb-2"
                                                >
                                                    Description
                                                </label>
                                                <textarea
                                                    id="description"
                                                    rows={4}
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    placeholder="Tell us about what you built..."
                                                    className="w-full px-4 py-2 bg-purple-800/50 border border-purple-700 rounded-lg 
                                                             text-purple-100 placeholder-purple-400 focus:outline-none focus:ring-2 
                                                             focus:ring-purple-500 focus:border-transparent"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="projectUrl"
                                                    className="block text-sm font-medium text-purple-200 mb-2"
                                                >
                                                    Project URL
                                                </label>
                                                <input
                                                    type="url"
                                                    id="projectUrl"
                                                    value={projectUrl}
                                                    onChange={handleUrlChange}
                                                    placeholder="https://..."
                                                    className={`w-full px-4 py-2 bg-purple-800/50 border rounded-lg text-purple-100 
                                                              placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 
                                                              focus:border-transparent ${
                                                                  urlError
                                                                      ? 'border-red-500'
                                                                      : 'border-purple-700'
                                                              }`}
                                                    required
                                                />
                                                {urlError && (
                                                    <p className="mt-1 text-sm text-red-500">
                                                        {urlError}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex justify-end space-x-4">
                                                <button
                                                    type="button"
                                                    onClick={handleClose}
                                                    className="px-4 py-2 text-purple-200 hover:text-white transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting || !!urlError}
                                                    className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                                                             bg-gradient-to-r from-emerald-400 to-emerald-300 p-[2px] font-medium text-emerald-900 
                                                             shadow-xl shadow-emerald-400/20 transition-all duration-300 hover:shadow-emerald-400/40
                                                             hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <span
                                                        className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-emerald-400 
                                                                   to-emerald-300 px-6 py-2.5 transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                                                   group-hover:from-emerald-300 group-hover:to-emerald-200"
                                                    >
                                                        {isSubmitting ? 'Submitting...' : 'Submit Build'}
                                                    </span>
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                ) : (
                                    <>
                                        <div className="mb-6">
                                            <p className="text-sm text-purple-200">
                                                Your build has been recorded. Would you like to share it on Warpcast?
                                            </p>
                                        </div>

                                        <div className="bg-purple-800/30 rounded-lg p-4 border border-purple-700">
                                            <div className="flex items-center space-x-2 mb-3">
                                                {storedUser?.pfp?.url ? (
                                                    <img
                                                        src={storedUser.pfp.url}
                                                        alt={storedUser.username || 'Profile'}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-purple-700" />
                                                )}
                                                <div>
                                                    <div className="text-purple-100 font-medium">
                                                        {storedUser?.displayName || profile?.displayName || profile?.username || 'You'}
                                                    </div>
                                                    <div className="text-purple-400 text-sm">
                                                        @{storedUser?.username || profile?.username || 'username'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-purple-100 whitespace-pre-wrap">
                                                {submittedClaim?.text}
                                            </div>
                                            <div className="mt-3 p-3 bg-purple-900/50 rounded border border-purple-600/30">
                                                <div className="flex items-center space-x-2 text-sm">
                                                    <img
                                                        src={buildRequest.author.pfp_url || 'https://warpcast.com/favicon.ico'}
                                                        alt={buildRequest.author.username}
                                                        className="w-4 h-4 rounded-full"
                                                    />
                                                    <span className="text-purple-300">@{buildRequest.author.username}</span>
                                                </div>
                                                <div className="mt-1 text-purple-400 text-sm line-clamp-2">
                                                    {buildRequest.text}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end space-x-4 mt-6">
                                            <button
                                                type="button"
                                                onClick={handleClose}
                                                className="px-4 py-2 text-purple-200 hover:text-white transition-colors"
                                            >
                                                Close
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCast}
                                                className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                                                         bg-gradient-to-r from-emerald-400 to-emerald-300 p-[2px] font-medium text-emerald-900 
                                                         shadow-xl shadow-emerald-400/20 transition-all duration-300 hover:shadow-emerald-400/40
                                                         hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <span
                                                    className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-emerald-400 
                                                               to-emerald-300 px-6 py-2.5 transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                                               group-hover:from-emerald-300 group-hover:to-emerald-200"
                                                >
                                                    Share on Warpcast
                                                </span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
