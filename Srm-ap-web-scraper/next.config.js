/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    // Allow functions to timeout
    serverRuntimeConfig: {
        maxDuration: 60,
    },
};

export default nextConfig;
