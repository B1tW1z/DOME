import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard,
    Search,
    FileSpreadsheet,
    Shield,
    BarChart3,
} from 'lucide-react'

const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/analyzer', label: 'Domain Analyzer', icon: Search },
    { to: '/batch', label: 'Batch Scanner', icon: FileSpreadsheet },
    { to: '/threat-intel', label: 'Threat Intelligence', icon: Shield },
    { to: '/performance', label: 'Model Performance', icon: BarChart3 },
]

export default function Sidebar() {
    return (
        <aside className="w-[240px] h-screen bg-panel border-r border-border flex flex-col shrink-0">
            {/* Logo */}
            <div className="h-14 flex items-center px-5 border-b border-border">
                <Shield size={20} className="text-white mr-2.5" />
                <span className="font-semibold text-sm tracking-wide text-white">
                    DOMAIN DETECTOR
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-0.5">
                {links.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${isActive
                                ? 'bg-white text-black font-medium'
                                : 'text-text-secondary hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        <Icon size={16} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border">
                <p className="text-[10px] text-text-secondary leading-relaxed">
                    Threat Intelligence Fusion<br />
                    v1.0.0
                </p>
            </div>
        </aside>
    )
}
