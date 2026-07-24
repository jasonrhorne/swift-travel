/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for now to avoid dynamic route issues
  // output: 'export',
  trailingSlash: true,
  // Skip prerendering problematic pages for now
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig
