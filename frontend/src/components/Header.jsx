import { useState } from 'react'
import { Search, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Header() {
    const [query, setQuery] = useState('')
    const navigate = useNavigate()

    const handleSearch = (e) => {
        e.preventDefault()
        if (query.trim()) {
            navigate(`/analyzer?domain=${encodeURIComponent(query.trim())}`)
            setQuery('')
        }
    }

    return (
        <header className="h-14 bg-panel border-b border-border flex items-center justify-between px-6 shrink-0">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Search size={14} className="text-text-secondary" />
                <input
                    type="text"
                    placeholder="Search domain..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-white placeholder:text-text-secondary w-64"
                />
            </form>

            {/* User menu */}
            <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary">SOC Analyst</span>
                <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center">
                    <User size={14} className="text-text-secondary" />
                </div>
            </div>
        </header>
    )
}
