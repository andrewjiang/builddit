import { SignInButton, useProfile } from "@farcaster/auth-kit";
import "@farcaster/auth-kit/styles.css";
import { useEffect, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { signIn, signOut, useSession } from "next-auth/react";

interface Profile {
  fid?: number;
  username?: string;
  displayName?: string;
  pfp?: {
    url: string;
    verified: boolean;
  };
}

interface ProfileState {
  isAuthenticated: boolean;
  profile: Profile;
  signOut?: () => void;
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

const DEFAULT_PROFILE_IMAGE = "https://warpcast.com/favicon.ico";

// Loading state component
const LoadingButton = () => (
  <div
    className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                 font-medium text-purple-900 
                 shadow-xl shadow-purple-400/20 transition-all duration-300 hover:shadow-purple-400/40"
  >
    <div
      className="relative flex items-center space-x-2 rounded-lg transition-all duration-200 ease-out 
                     group-hover:bg-opacity-0 group-hover:from-purple-300 group-hover:to-purple-200"
    >
      <div className="h-10 w-[120px] bg-purple-500/20 rounded-lg animate-pulse" />
    </div>
  </div>
);

export function AuthButton() {
  const { data: session } = useSession();
  const {
    isAuthenticated,
    profile,
    signOut: farcasterSignOut,
  } = useProfile() as ProfileState;
  const [storedUser, setStoredUser] = useState<StoredUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          console.error("Error fetching stored user data:", error);
        }
      }
    }

    fetchStoredUser();
  }, [isAuthenticated, profile?.fid]);

  // Handle Farcaster sign in success
  useEffect(() => {
    if (isAuthenticated && profile && !session && profile.fid) {
      // Sign in to Next-Auth with Farcaster credentials
      signIn("farcaster", {
        message: "",
        signature: "",
        fid: profile.fid.toString(),
        username: profile.username || "",
        displayName: profile.displayName || profile.username || "",
        pfpUrl: profile.pfp?.url || DEFAULT_PROFILE_IMAGE,
        redirect: false,
      });
    }
  }, [isAuthenticated, profile, session]);

  const handleSignOut = async () => {
    try {
      // Clear local state first
      setStoredUser(null);

      // Sign out from Next-Auth first and wait for it
      await signOut({ redirect: false });

      // Then sign out from Farcaster and reload the page to ensure clean state
      if (farcasterSignOut) {
        await farcasterSignOut();
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Error during sign out:", error);
      // Force reload on error to ensure clean state
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
  };

  const getProfileImage = () => {
    if (imageError) return DEFAULT_PROFILE_IMAGE;
    return (
      storedUser?.pfp?.url || session?.user?.image || DEFAULT_PROFILE_IMAGE
    );
  };

  // Show nothing until mounted to prevent hydration mismatch
  if (!mounted) {
    return <LoadingButton />;
  }

  // Show loading state while authentication is being established
  if (
    typeof window !== "undefined" &&
    (session === undefined ||
      (isAuthenticated && !session?.user?.fid) ||
      (session?.user?.fid && !session?.user?.username))
  ) {
    return <LoadingButton />;
  }

  // Check if user is authenticated through either method
  const isLoggedIn = Boolean(session?.user?.fid && session?.user?.username);
  const displayName =
    storedUser?.displayName || session?.user?.name || session?.user?.username;
  const username = storedUser?.username || session?.user?.username || "Profile";

  return (
    <div className="relative">
      {isLoggedIn ? (
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
                src={getProfileImage()}
                alt={username}
                className="w-5 h-5 rounded-full object-cover"
                onError={() => setImageError(true)}
              />
              <span className="font-medium">{displayName}</span>
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
                      onClick={handleSignOut}
                      className={`${
                        active ? "bg-purple-800" : ""
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
                             bg-gradient-to-r from-yellow-400 to-yellow-300 font-medium text-purple-900 
                             shadow-xl shadow-yellow-400/20 transition-all duration-300 hover:shadow-yellow-400/40"
        >
          <div
            className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-yellow-400 
                                 to-yellow-300 transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                 group-hover:from-yellow-300 group-hover:to-yellow-200"
          >
            <SignInButton />
          </div>
        </div>
      )}
    </div>
  );
}
