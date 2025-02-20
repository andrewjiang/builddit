import { BuildRequest } from '@/lib/api/types';
import { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/hooks/useAuth';

interface ClaimBuildModalProps {
    buildRequest: BuildRequest;
    isOpen: boolean;
    onClose: () => void;
}

export function ClaimBuildModal({ buildRequest, isOpen, onClose }: ClaimBuildModalProps) {
    const { isAuthenticated, profile } = useAuth();
    const [projectUrl, setProjectUrl] = useState('');
    const [description, setDescription] = useState('');
    const [urlError, setUrlError] = useState('');

    if (!isOpen) return null;

    const validateUrl = (url: string) => {
        try {
            new URL(url);
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) return;

        if (!validateUrl(projectUrl)) {
            setUrlError('Please enter a valid URL');
            return;
        }

        // Construct the cast text
        const castText = `🏗️ I built this!\n\n${description}\n\nProject: ${projectUrl}`;

        // Create the Warpcast intent URL
        const intentUrl = new URL('https://warpcast.com/~/compose');
        intentUrl.searchParams.set('text', castText);
        intentUrl.searchParams.set(
            'embeds[]',
            `https://warpcast.com/${buildRequest.author.username}/${buildRequest.hash}`,
        );

        // Open Warpcast in a new tab
        window.open(intentUrl.toString(), '_blank');
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                                        Claim Build
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-purple-300 hover:text-white transition-colors"
                                    >
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
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
                                            onClick={onClose}
                                            className="px-4 py-2 text-purple-200 hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                                                     bg-gradient-to-r from-emerald-400 to-emerald-300 p-[2px] font-medium text-emerald-900 
                                                     shadow-xl shadow-emerald-400/20 transition-all duration-300 hover:shadow-emerald-400/40
                                                     hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={!isAuthenticated || !!urlError}
                                        >
                                            <span
                                                className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-emerald-400 
                                                           to-emerald-300 px-6 py-2.5 transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                                           group-hover:from-emerald-300 group-hover:to-emerald-200"
                                            >
                                                <svg
                                                    className="w-4 h-4 transform transition-transform duration-200 group-hover:translate-x-1"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                                <span className="font-medium">Submit on Warpcast</span>
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
