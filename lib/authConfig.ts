import { providers } from "ethers";

const getConfig = () => {
  const isClient = typeof window !== "undefined";
  const domain = isClient ? window.location.host : "";
  const siweUri = isClient ? `https://${window.location.host}/login` : "";

  return {
    relay: "https://relay.farcaster.xyz",
    rpcUrl: "https://mainnet.optimism.io",
    domain,
    siweUri,
    // @ts-ignore - ethers version type incompatibility
    provider: isClient ? new providers.JsonRpcProvider("https://mainnet.optimism.io", 10) : null,
    persist: true,
    timeoutInMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};

export const authConfig = getConfig(); 