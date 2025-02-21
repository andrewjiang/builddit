import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface ClaimBuildModalProps {
    isOpen: boolean;
    onClose: () => void;
    buildRequestHash: string;
    buildRequestText: string;
}

export default function ClaimBuildModal({
    isOpen,
    onClose,
    buildRequestHash,
    buildRequestText,
}: ClaimBuildModalProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [step, setStep] = useState<'form' | 'preview'>('form');
    const [projectUrl, setProjectUrl] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedClaim, setSubmittedClaim] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user?.fid || !session?.user?.username) {
            toast.error('Please sign in to submit a build claim');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/build-requests/${buildRequestHash}/claims`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectUrl,
                    description,
                    author: {
                        fid: session.user.fid,
                        username: session.user.username,
                        displayName: session.user.name || session.user.username,
                        pfpUrl: session.user.image,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit claim');
            }

            const data = await response.json();
            setSubmittedClaim(data.claim);
            setStep('preview');
            router.refresh();
        } catch (error) {
            console.error('Error submitting claim:', error);
            toast.error('Failed to submit build claim');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCast = () => {
        if (!submittedClaim) return;

        const text = encodeURIComponent(submittedClaim.text);
        const castUrl = `https://warpcast.com/~/compose?text=${text}&channelKey=someone-build`;
        window.open(castUrl, '_blank');
        onClose();
    };

    const handleClose = () => {
        setStep('form');
        setProjectUrl('');
        setDescription('');
        setSubmittedClaim(null);
        onClose();
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-gray-900 text-gray-400 hover:text-gray-500"
                                        onClick={handleClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                {step === 'form' ? (
                                    <>
                                        <div className="mt-3 text-center sm:mt-0 sm:text-left">
                                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-100">
                                                Submit Your Build
                                            </Dialog.Title>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-300">
                                                    Share your project details below. After submission, you'll have the option to share it on Warpcast.
                                                </p>
                                            </div>
                                        </div>

                                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                            <div>
                                                <label htmlFor="projectUrl" className="block text-sm font-medium text-gray-200">
                                                    Project URL
                                                </label>
                                                <input
                                                    type="url"
                                                    id="projectUrl"
                                                    value={projectUrl}
                                                    onChange={(e) => setProjectUrl(e.target.value)}
                                                    required
                                                    className="mt-1 block w-full rounded-md border-0 bg-gray-800 py-1.5 text-gray-100 shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6"
                                                    placeholder="https://your-project.com"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="description" className="block text-sm font-medium text-gray-200">
                                                    Description
                                                </label>
                                                <textarea
                                                    id="description"
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    required
                                                    rows={3}
                                                    className="mt-1 block w-full rounded-md border-0 bg-gray-800 py-1.5 text-gray-100 shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6"
                                                    placeholder="Describe what you built..."
                                                />
                                            </div>

                                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isSubmitting ? 'Submitting...' : 'Submit Build'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-700 sm:mt-0 sm:w-auto"
                                                    onClick={handleClose}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                ) : (
                                    <>
                                        <div className="mt-3 text-center sm:mt-0 sm:text-left">
                                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-100">
                                                Build Submitted!
                                            </Dialog.Title>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-300">
                                                    Your build has been recorded. Would you like to share it on Warpcast?
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 rounded-md bg-gray-800 p-4">
                                            <p className="text-sm text-gray-200 whitespace-pre-wrap">
                                                {submittedClaim?.text}
                                            </p>
                                        </div>

                                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                            <button
                                                type="button"
                                                onClick={handleCast}
                                                className="inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 sm:ml-3 sm:w-auto"
                                            >
                                                Share on Warpcast
                                            </button>
                                            <button
                                                type="button"
                                                className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-700 sm:mt-0 sm:w-auto"
                                                onClick={handleClose}
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
} 