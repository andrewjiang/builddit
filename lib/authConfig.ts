import { providers } from "ethers";

export const authConfig = {
  relay: "https://relay.farcaster.xyz",
  rpcUrl: "https://mainnet.optimism.io",
  domain: typeof window !== "undefined" ? window.location.host : "",
  siweUri: typeof window !== "undefined" ? `https://${window.location.host}/login` : "",
  // @ts-ignore - ethers version type incompatibility
  provider: new providers.JsonRpcProvider("https://mainnet.optimism.io", 10),
}; 