"use client"

import Link from "next/link"
import Layout from "../components/Layout"

export default function Home() {
  // Use environment variables for build information
  const buildDate =
    process.env.NEXT_PUBLIC_BUILD_DATE || new Date().toLocaleString()
  const buildNumber =
    process.env.NEXT_PUBLIC_BUILD_NUMBER || "Development Build"
  const commitSha = process.env.NEXT_PUBLIC_COMMIT_SHA || "dev-commit"

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center p-5">
        <div className="p-10 max-w-[600px] w-full text-center">
          <div className="mb-[30px]">
            <h1 className="text-[#333] text-[2.5rem] font-bold mb-[10px]">
              App Cache
            </h1>
            <p className="text-[#666] text-[1.1rem] leading-[1.6]">
              Download the latest iOS and Android cache databases for offline
              access to Jesus Film content.
            </p>
          </div>

          <div className="my-10">
            <div className="grid gap-5 mt-[30px]">
              <Link
                href="/ios-cache.zip"
                className="inline-flex items-center justify-center p-[18px_30px] border-none rounded-xl text-[1.1rem] font-semibold no-underline transition-all duration-300 relative overflow-hidden cursor-pointer bg-gradient-to-br from-[#007aff] to-[#0051d5] text-white shadow-[0_8px_25px_rgba(0,122,255,0.3)] hover:transform hover:translate-y-[-2px] hover:shadow-[0_12px_35px_rgba(0,122,255,0.4)]"
              >
                <span className="mr-3 text-[1.3rem]">📱</span>
                Download iOS Cache
              </Link>
              <Link
                href="/android-cache.zip"
                className="inline-flex items-center justify-center p-[18px_30px] border-none rounded-xl text-[1.1rem] font-semibold no-underline transition-all duration-300 relative overflow-hidden cursor-pointer bg-gradient-to-br from-[#3ddc84] to-[#00c853] text-white shadow-[0_8px_25px_rgba(61,220,132,0.3)] hover:transform hover:translate-y-[-2px] hover:shadow-[0_12px_35px_rgba(61,220,132,0.4)]"
              >
                <span className="mr-3 text-[1.3rem]">🤖</span>
                Download Android Cache
              </Link>
            </div>
          </div>

          <div className="mt-10 pt-[30px] border-t border-[#eee]">
            <p className="text-[#666] text-[0.95rem] leading-[1.6] mb-5">
              These cache files contain offline data for the Jesus Film Project
              applications. The iOS cache uses Realm database format, while the
              Android cache uses SQLite.
            </p>

            <div className="bg-[#f8f9fa] rounded-lg p-5 mt-5">
              <h3 className="text-[#333] text-[1.1rem] mb-[15px]">
                📊 Latest Build Information
              </h3>
              <div className="grid gap-[10px] text-left">
                <div className="flex justify-between items-center py-2 border-b border-[#e9ecef]">
                  <span className="font-semibold text-[#495057]">
                    Build Date:
                  </span>
                  <span className="text-[#6c757d] font-mono text-[0.9rem]">
                    {buildDate}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#e9ecef]">
                  <span className="font-semibold text-[#495057]">
                    Build Number:
                  </span>
                  <span className="text-[#6c757d] font-mono text-[0.9rem]">
                    #{buildNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-semibold text-[#495057]">Commit:</span>
                  <span className="text-[#6c757d] font-mono text-[0.9rem]">
                    {commitSha.substring(0, 7)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center max-w-[600px] text-[#666] text-[0.9rem] leading-[1.6]">
          <p>
            <a
              href="https://jesusfilm.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ef343f] no-underline font-semibold hover:underline"
            >
              Jesus Film Project
            </a>{" "}
            believes everyone, everywhere should have access to the
            life‑changing story of Jesus in their own heart language and heart
            medium, equipping believers around the globe to share the gospel to
            people of every tribe, tongue and nation.
          </p>
        </div>
      </div>
    </Layout>
  )
}
