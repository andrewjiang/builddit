/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'imagedelivery.net',
            },
            {
                protocol: 'https',
                hostname: 'i.imgur.com',
            },
            {
                protocol: 'https',
                hostname: '*.cloudfront.net',
            },
            {
                protocol: 'https',
                hostname: '*.amazonaws.com',
            },
        ],
    },
};

export default nextConfig; 