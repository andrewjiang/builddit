import { SignInButton, useProfile } from "@farcaster/auth-kit";
import "@farcaster/auth-kit/styles.css";

interface Profile {
  fid: number;
  displayName: string;
  custody: string;
}

interface ProfileState {
  isAuthenticated: boolean;
  profile: Profile;
}

export function AuthButton() {
  const { isAuthenticated, profile } = useProfile() as ProfileState;

  return (
    <div className="relative">
      {isAuthenticated ? (
        <button className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-300 p-[2px] font-medium text-purple-900 shadow-xl shadow-yellow-400/20 transition-all duration-300 hover:shadow-yellow-400/40">
          <span className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-300 px-6 py-2.5 transition-all duration-200 ease-out group-hover:bg-opacity-0 group-hover:from-yellow-300 group-hover:to-yellow-200">
            <img
              src="https://www.warpcast.com/favicon.ico"
              alt="Warpcast"
              className="w-4 h-4"
            />
            <span className="font-medium">
              {profile.displayName || `fid:${profile.fid}`}
            </span>
          </span>
        </button>
      ) : (
        <SignInButton />
      )}
    </div>
  );
} 