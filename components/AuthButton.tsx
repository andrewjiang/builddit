import { SignInButton, useProfile } from '@farcaster/auth-kit';
import '@farcaster/auth-kit/styles.css';
import { useEffect, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface Profile {
    fid: number;
    username: string;
    displayName?: string;
    pfp?: {
        url: string;
        verified: boolean;
    };
}

interface ProfileState {
    isAuthenticated: boolean;
    profile: Profile | null;
    signOut: () => void;
}

interface StoredUser {
    fid: number;
    username: string;
    displayName: string;
    pfp: {
        url: string;
        verified: boolean;
    };
}

export function AuthButton() {
    const { isAuthenticated, profile, signOut } = useProfile() as ProfileState;
    const [storedUser, setStoredUser] = useState<StoredUser | null>(null);

    useEffect(() => {
        async function fetchStoredUser() {
            if (isAuthenticated && profile) {
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

        fetchStoredUser();
    }, [isAuthenticated, profile]);

    return (
        <div className="relative">
            {isAuthenticated && profile ? (
                <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button
                        className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                                 bg-gradient-to-r from-yellow-400 to-yellow-300 p-[2px] font-medium text-purple-900 
                                 shadow-xl shadow-yellow-400/20 transition-all duration-300 hover:shadow-yellow-400/40"
                    >
                        <span
                            className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-yellow-400 
                                     to-yellow-300 px-4 py-3 transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                     group-hover:from-yellow-300 group-hover:to-yellow-200"
                        >
                            <img
                                src={storedUser?.pfp.url || 'https://www.warpcast.com/favicon.ico'}
                                alt={storedUser?.username || profile.username || 'Warpcast'}
                                className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="font-medium">
                                {storedUser?.displayName || profile.displayName || profile.username || `fid:${profile.fid}`}
                            </span>
                            <ChevronDownIcon className="w-4 h-4 transition-transform duration-200 ui-open:rotate-180" />
                        </span>
                    </Menu.Button>

                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-purple-900 shadow-lg border border-purple-400/20 focus:outline-none">
                            <div className="py-1">
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={signOut}
                                            className={`${
                                                active ? 'bg-purple-800' : ''
                                            } w-full px-4 py-2 text-left text-purple-100 hover:bg-purple-800 first:rounded-t-lg last:rounded-b-lg`}
                                        >
                                            Sign Out
                                        </button>
                                    )}
                                </Menu.Item>
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>
            ) : (
                <div
                    className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                             font-medium text-purple-900 
                             shadow-xl shadow-purple-400/20 transition-all duration-300 hover:shadow-purple-400/40"
                >
                    <div
                        className="relative flex items-center space-x-2 rounded-lg transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                 group-hover:from-purple-300 group-hover:to-purple-200"
                    >
                        <SignInButton />
                    </div>
                </div>
            )}
        </div>
    );
}
