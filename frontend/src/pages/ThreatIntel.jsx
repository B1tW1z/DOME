import { useState, useEffect } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import { getDashboardStats } from '../api'

const tldData = [
    { tld: '.xyz', count: 4520 }, { tld: '.top', count: 3890 },
    { tld: '.tk', count: 3210 }, { tld: '.ml', count: 2870 },
    { tld: '.ga', count: 2150 }, { tld: '.cf', count: 1920 },
    { tld: '.info', count: 1450 }, { tld: '.pw', count: 1100 },
    { tld: '.ru', count: 980 }, { tld: '.cn', count: 870 },
]

const feedSourceData = [
    { source: 'PhishTank', domains: 35200 },
    { source: 'URLHaus', domains: 28400 },
    { source: 'DGArchive', domains: 36400 },
]

const feedPieData = [
    { name: 'PhishTank', value: 35 },
    { name: 'URLHaus', value: 28 },
    { name: 'DGArchive', value: 37 },
]

const entropyDistribution = [
    { entropy: '0.5', benign: 850, malicious: 20 },
    { entropy: '1.0', benign: 2100, malicious: 120 },
    { entropy: '1.5', benign: 5600, malicious: 380 },
    { entropy: '2.0', benign: 12400, malicious: 1200 },
    { entropy: '2.5', benign: 18500, malicious: 3800 },
    { entropy: '3.0', benign: 22000, malicious: 8900 },
    { entropy: '3.5', benign: 15800, malicious: 18200 },
    { entropy: '4.0', benign: 6200, malicious: 32400 },
    { entropy: '4.5', benign: 1800, malicious: 25100 },
    { entropy: '5.0', benign: 400, malicious: 8600 },
]

const COLORS = ['#FFFFFF', '#9A9A9A', '#555555']

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-panel border border-border px-3 py-2 rounded text-xs">
            <p className="text-text-secondary mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="text-white font-mono">
                    {p.name}: {p.value?.toLocaleString()}
                </p>
            ))}
        </div>
    )
}

function ChartCard({ title, children, className = '' }) {
    return (
        <div className={`bg-panel border border-border p-5 rounded ${className}`}>
            <h3 className="text-xs uppercase tracking-wider text-text-secondary mb-4">{title}</h3>
            {children}
        </div>
    )
}

export default function ThreatIntel() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getDashboardStats()
            .then(data => {
                setStats(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading Threat Intelligence data...</div>

    const realTldData = stats?.topTLDs || tldData
    const mappedFeedData = stats?.feedDistribution?.map(f => ({
        source: f.name.split(' ')[0],
        domains: f.value,
        name: f.name,
        value: f.value
    })) || feedSourceData
    const realFeedPieData = stats?.feedDistribution || feedPieData

    return (
        <div>
            <h1 className="text-lg font-semibold mb-6">Threat Intelligence</h1>

            {/* Feed stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {mappedFeedData.slice(0, 2).map((f) => (
                    <div key={f.source} className="bg-panel border border-border rounded p-6 flex flex-col items-center justify-center text-center min-h-[120px]">
                        <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">{f.source}</p>
                        <p className="text-3xl font-semibold font-mono text-white mb-1">{f.domains.toLocaleString()}</p>
                        <p className="text-xs text-text-secondary">Domains</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Top Malicious TLDs */}
                <ChartCard title="Top Malicious TLDs">
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={realTldData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                            <XAxis type="number" stroke="#555" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                            <YAxis type="category" dataKey="tld" stroke="#555" tick={{ fontSize: 11, fill: '#9A9A9A' }} width={50} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill="#FFFFFF" radius={[0, 2, 2, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Feed Distribution Pie */}
                <ChartCard title="Domains per Feed Component">
                    <div className="flex items-center justify-center h-[280px]">
                        <ResponsiveContainer width="60%" height={240}>
                            <PieChart>
                                <Pie
                                    data={realFeedPieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    dataKey="value"
                                    stroke="#0B0B0B"
                                    strokeWidth={2}
                                >
                                    {realFeedPieData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#141414',
                                        border: '1px solid #2A2A2A',
                                        borderRadius: 4,
                                        fontSize: 12,
                                    }}
                                    itemStyle={{ color: '#FFFFFF' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-3">
                            {realFeedPieData.slice(0, 3).map((d, i) => (
                                <div key={d.name} className="flex items-center gap-3 text-xs justify-between w-full pr-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i] }} />
                                        <span className="text-text-secondary truncate w-24" title={d.name}>{d.name}</span>
                                    </div>
                                    <span className="text-white font-mono shrink-0">{d.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </ChartCard>

                {/* Entropy Distribution */}
                <ChartCard title="Entropy Distribution (Benign vs Malicious)" className="col-span-2">
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={entropyDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                            <XAxis dataKey="entropy" stroke="#555" tick={{ fontSize: 11, fill: '#9A9A9A' }} label={{ value: 'Shannon Entropy', position: 'insideBottom', offset: -5, fill: '#555', fontSize: 11 }} />
                            <YAxis stroke="#555" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="benign" stroke="#9A9A9A" fill="#9A9A9A" fillOpacity={0.15} strokeWidth={1.5} />
                            <Area type="monotone" dataKey="malicious" stroke="#FFFFFF" fill="#FFFFFF" fillOpacity={0.1} strokeWidth={1.5} />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex gap-6 mt-3">
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-6 h-0.5 bg-text-secondary" />
                            <span className="text-text-secondary">Benign</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-6 h-0.5 bg-white" />
                            <span className="text-text-secondary">Malicious</span>
                        </div>
                    </div>
                </ChartCard>
            </div>
        </div>
    )
}
