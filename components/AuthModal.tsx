import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { SignInButton } from '@farcaster/auth-kit';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
}

export function AuthModal({ isOpen, onClose, message }: AuthModalProps) {
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-purple-900/90 p-6 text-left align-middle shadow-xl transition-all border border-purple-400/20">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-purple-100 mb-4"
                                >
                                    Sign in with Farcaster
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-purple-200 mb-6">
                                        {message}
                                    </p>
                                    <div className="flex justify-center">
                                        <SignInButton />
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
} 