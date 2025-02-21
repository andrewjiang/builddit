const WHITELISTED_DOMAINS = [
  "imagedelivery.net",
  "i.imgur.com",
  ".cloudfront.net",
  ".amazonaws.com",
  "openseauserdata.com",
  ".googleusercontent.com",
  "docs.google.com",
  "media.firefly.land",
  "empirebuilder.world",
  "i.seadn.io",
];

export function isWhitelistedImageDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return WHITELISTED_DOMAINS.some((domain) => {
      if (domain.startsWith(".")) {
        // Handle wildcard subdomains
        return parsedUrl.hostname.endsWith(domain);
      }
      return (
        parsedUrl.hostname === domain ||
        parsedUrl.hostname.endsWith("." + domain)
      );
    });
  } catch {
    return false;
  }
}

export function getOptimizedImageUrl(url: string): string | null {
  if (!isWhitelistedImageDomain(url)) {
    return null;
  }
  return url;
}
