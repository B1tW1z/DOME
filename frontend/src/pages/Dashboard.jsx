import { useState, useEffect } from 'react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import { Shield, AlertTriangle, CheckCircle, Activity } from 'lucide-react'
import { getDashboardStats } from '../api'

// -- Mock dashboard data (replaced with real API data in production) --------
const detectionRateData = [
    { time: '00:00', detections: 12 }, { time: '02:00', detections: 19 },
    { time: '04:00', detections: 8 }, { time: '06:00', detections: 25 },
    { time: '08:00', detections: 42 }, { time: '10:00', detections: 38 },
    { time: '12:00', detections: 55 }, { time: '14:00', detections: 47 },
    { time: '16:00', detections: 63 }, { time: '18:00', detections: 51 },
    { time: '20:00', detections: 34 }, { time: '22:00', detections: 28 },
]

const entropyData = [
    { range: '0-1', count: 1200 }, { range: '1-2', count: 3400 },
    { range: '2-3', count: 8900 }, { range: '3-4', count: 15200 },
    { range: '4-5', count: 4300 },
]

const tldData = [
    { tld: '.xyz', count: 4520 }, { tld: '.top', count: 3890 },
    { tld: '.tk', count: 3210 }, { tld: '.ml', count: 2870 },
    { tld: '.ga', count: 2150 }, { tld: '.cf', count: 1920 },
    { tld: '.info', count: 1450 }, { tld: '.pw', count: 1100 },
]

const feedData = [
    { name: 'PhishTank', value: 35 },
    { name: 'URLHaus', value: 28 },
    { name: 'DGArchive', value: 37 },
]

const COLORS = ['#FFFFFF', '#9A9A9A', '#555555']

function StatCard({ icon: Icon, label, value, subtitle }) {
    return (
        <div className="bg-panel border border-border p-5 rounded">
            <div className="flex items-center justify-between mb-3">
                <span className="text-text-secondary text-xs uppercase tracking-wider">{label}</span>
                <Icon size={16} className="text-text-secondary" />
            </div>
            <p className="text-2xl font-semibold font-mono text-white">{value}</p>
            {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
        </div>
    )
}

function ChartCard({ title, children }) {
    return (
        <div className="bg-panel border border-border p-5 rounded">
            <h3 className="text-xs uppercase tracking-wider text-text-secondary mb-4">{title}</h3>
            {children}
        </div>
    )
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-panel border border-border px-3 py-2 rounded text-xs">
            <p className="text-text-secondary">{label}</p>
            <p className="text-white font-mono">{payload[0].value}</p>
        </div>
    )
}

export default function Dashboard() {
    const [stats, setStats] = useState(null)

    useEffect(() => {
        getDashboardStats()
            .then(setStats)
            .catch(console.error)
    }, [])

    const s = stats?.stats || { totalAnalyzed: '-', malicious: '-', benign: '-', detectionRate: '-' }
    const realTldData = stats?.topTLDs || tldData
    const realFeedData = stats?.feedDistribution || feedData
    const realDetectionData = stats?.detectionTrend || detectionRateData
    const realEntropyData = stats?.entropyData || entropyData

    return (
        <div>
            <h1 className="text-lg font-semibold mb-6">Dashboard</h1>

            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatCard icon={Activity} label="Total Analyzed" value={s.totalAnalyzed.toLocaleString()} subtitle="Domains processed" />
                <StatCard icon={AlertTriangle} label="Malicious" value={s.malicious.toLocaleString()} subtitle="Threats detected" />
                <StatCard icon={CheckCircle} label="Benign" value={s.benign.toLocaleString()} subtitle="Clean domains" />
                <StatCard icon={Shield} label="Detection Rate" value={`${s.detectionRate}%`} subtitle="Model accuracy" />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Detection Rate */}
                <ChartCard title="Detection Rate Over Time">
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={realDetectionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                            <XAxis dataKey="time" stroke="#555" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                            <YAxis stroke="#555" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="detections" stroke="#FFFFFF" strokeWidth={1.5} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Entropy Distribution */}
                <ChartCard title="Domain Entropy Distribution">
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={realEntropyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                            <XAxis dataKey="range" stroke="#555" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                            <YAxis stroke="#555" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill="#FFFFFF" radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Top Malicious TLDs */}
                <ChartCard title="Top Malicious TLDs">
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={realTldData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                            <XAxis type="number" stroke="#555" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                            <YAxis type="category" dataKey="tld" stroke="#555" tick={{ fontSize: 11, fill: '#9A9A9A' }} width={50} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill="#9A9A9A" radius={[0, 2, 2, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Threat Feed Distribution */}
                <ChartCard title="Threat Feed Distribution">
                    <div className="flex items-center justify-center h-[220px]">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={realFeedData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={75}
                                    dataKey="value"
                                    stroke="#0B0B0B"
                                    strokeWidth={2}
                                >
                                    {realFeedData.map((_, i) => (
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
                        <div className="space-y-2 ml-4">
                            {realFeedData.map((d, i) => (
                                <div key={d.name} className="flex items-center gap-2 text-xs">
                                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i] }} />
                                    <span className="text-text-secondary truncate w-28" title={d.name}>{d.name}</span>
                                    <span className="text-white font-mono ml-1 shrink-0">{d.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </ChartCard>
            </div>
        </div>
    )
}
