import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { SignInButton } from "@farcaster/auth-kit";
import { useSession } from "next-auth/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export function AuthModal({ isOpen, onClose, message }: AuthModalProps) {
  const { data: session } = useSession();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500); // Close after 1.5 seconds
      return () => clearTimeout(timer);
    }
  }, [session, onClose]);

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
                  {showSuccess
                    ? "Successfully Connected!"
                    : "Sign in with Farcaster"}
                </Dialog.Title>
                <div className="mt-2">
                  {showSuccess ? (
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-400/20 flex items-center justify-center mb-4">
                        <svg
                          className="w-6 h-6 text-emerald-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <p className="text-emerald-400 text-center">
                        Your Farcaster account has been connected successfully!
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-purple-200 mb-6">{message}</p>
                      <div className="flex justify-center">
                        <SignInButton />
                      </div>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
