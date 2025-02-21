import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "farcaster",
            name: "Farcaster",
            credentials: {
                message: {
                    label: "Message",
                    type: "text",
                },
                signature: {
                    label: "Signature",
                    type: "text",
                },
                fid: {
                    label: "FID",
                    type: "text",
                },
                username: {
                    label: "Username",
                    type: "text",
                },
                bio: {
                    label: "Bio",
                    type: "text",
                },
                displayName: {
                    label: "Display Name",
                    type: "text",
                },
                pfpUrl: {
                    label: "Profile Image URL",
                    type: "text",
                },
            },
            async authorize(credentials) {
                if (!credentials?.fid) return null;

                const fid = parseInt(credentials.fid);
                if (isNaN(fid)) return null;

                // Return the credentials as the user object
                return {
                    id: credentials.fid,
                    fid: fid,
                    username: credentials.username || '',
                    name: credentials.displayName || credentials.username || '',
                    image: credentials.pfpUrl || '',
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.fid = user.fid;
                token.username = user.username;
                token.image = user.image;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.fid = token.fid as number;
                session.user.username = token.username as string;
                session.user.image = token.image as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/", // We'll handle sign in through Farcaster Auth Kit
    },
}; 