import "next-auth";

declare module "next-auth" {
  interface User {
    fid: number;
    username: string;
    name?: string;
    image?: string;
  }

  interface Session {
    user: {
      fid: number;
      username: string;
      name?: string;
      image?: string;
    };
  }
}
