"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarItem {
  name: string
  count: number
  platform: "ios" | "android"
}

interface SidebarProps {
  items: SidebarItem[]
  selectedItem?: string | null
  title: string
}

export default function Sidebar({ items, selectedItem, title }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{items.length} items</p>
      </div>

      <nav className="p-2">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive =
              selectedItem === item.name ||
              pathname === `/${item.platform}/${item.name}`

            return (
              <li key={item.name}>
                <Link
                  href={`/${item.platform}/${item.name}`}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer block ${
                    isActive
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate">{item.name}</span>
                    <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
