// Regex patterns for detecting build claims
export const BUILD_PATTERNS = [
    /@ibuiltit/i,                          // Official tag
    /i built this/i,                       // Common phrases
    /here'?s my build/i,
    /i made this/i,
    /just shipped/i,
    /just launched/i,
    /built it/i,
    /finished building/i,
    /completed this/i,
    /here'?s what i built/i,
];

export function detectBuildClaim(text: string): boolean {
    // Check for @ibuiltit tag first
    if (/@ibuiltit/i.test(text)) {
        return true;
    }

    // Check other patterns
    return BUILD_PATTERNS.some(pattern => pattern.test(text));
}

export function isTaggedBuild(text: string): boolean {
    return /@ibuiltit/i.test(text);
}

// Helper to extract URLs from text
export function extractUrls(text: string): string[] {
    const urlPattern = /https?:\/\/[^\s]+/g;
    return text.match(urlPattern) || [];
} 