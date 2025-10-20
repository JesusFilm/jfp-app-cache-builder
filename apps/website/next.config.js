/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: "/jfp-app-cache-builder",
  redirects: () => {
    return [
      {
        source: "/",
        destination: "/jfp-app-cache-builder",
        basePath: false,
        permanent: false,
      },
    ]
  },
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
