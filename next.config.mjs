/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,  // 👈 add this
    },
}
module.exports = nextConfig
