import Layout from "@/components/Layout"
import Sidebar from "@/components/Sidebar"
import { androidSchemaData } from "@/data/android-schema"

export default function AndroidBrowser() {
  const sidebarItems = androidSchemaData.tables.map((table) => ({
    name: table.name,
    count: table.rowCount,
    href: `/android/${table.name}`,
  }))

  return (
    <Layout>
      <div className="h-full flex items-center justify-center">
        <div className="w-80 shrink-0 h-full">
          <Sidebar items={sidebarItems} title="Android DB" />
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
