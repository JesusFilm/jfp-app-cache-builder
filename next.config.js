/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // Exclude better-sqlite3 and realm from client bundle
    config.externals = config.externals || []
    config.externals.push({
      "better-sqlite3": "commonjs better-sqlite3",
      realm: "commonjs realm",
    })

    return config
  },
}

export default nextConfig
