import Layout from "@/components/Layout"
import Sidebar from "@/components/Sidebar"
import { iosSchemaData } from "@/data/ios-schema"

export default function IOSBrowser() {
  const sidebarItems = iosSchemaData.schemas.map((schema) => ({
    name: schema.name,
    count: schema.objectCount,
    href: `/ios/${schema.name}`,
  }))

  return (
    <Layout>
      <div className="h-full flex items-center justify-center">
        <div className="w-80 shrink-0 h-full">
          <Sidebar items={sidebarItems} title="iOS DB" />
        </div>
        <div className="w-[calc(100%-var(--spacing)*80)] h-full flex flex-col items-center justify-center">
          <div className="text-gray-400 text-6xl mb-4">🗄️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select Table
          </h3>
          <p className="text-gray-500">
            Choose a table from the sidebar to view its contents
          </p>
        </div>
      </div>
    </Layout>
  )
}
