"use client"

interface SidebarItem {
  name: string
  count?: number
}

interface SidebarProps {
  items: SidebarItem[]
  selectedItem: string | null
  onItemSelect: (itemName: string) => void
  title: string
}

export default function Sidebar({
  items,
  selectedItem,
  onItemSelect,
  title,
}: SidebarProps) {
  return (
    <div className="bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{items.length} items</p>
      </div>

      <nav className="p-2">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => onItemSelect(item.name)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  selectedItem === item.name
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-transparent"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="truncate">{item.name}</span>
                  {item.count !== undefined && (
                    <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {item.count.toLocaleString()}
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
