import { composePlugins, withNx } from "@nx/next"

/** @type {import('@nx/next/plugins/with-nx').WithNxOptions} */
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
  nx: {
    svgr: false,
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

export default composePlugins(withNx)(nextConfig)
