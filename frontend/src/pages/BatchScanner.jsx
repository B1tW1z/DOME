import { useState } from 'react'
import { Upload, Download, FileSpreadsheet } from 'lucide-react'
import { batchPredict } from '../api'

export default function BatchScanner() {
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [fileName, setFileName] = useState('')

    const handleUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setFileName(file.name)
        setLoading(true)
        setError(null)

        try {
            const data = await batchPredict(file)
            setResults(data.results)
        } catch (err) {
            setError('Failed to process batch. Is the backend running?')
            // Demo results for offline mode
            const text = await file.text()
            const lines = text.trim().split('\n').slice(1)
            setResults(
                lines.map((line) => {
                    const domain = line.trim().replace(/"/g, '')
                    return {
                        domain,
                        prediction: domain.includes('-') || domain.length > 20 ? 'malicious' : 'benign',
                        confidence: domain.includes('-') ? 0.91 : 0.08,
                    }
                })
            )
        } finally {
            setLoading(false)
        }
    }

    const exportCSV = () => {
        if (!results.length) return
        const header = 'domain,prediction,confidence\n'
        const rows = results.map((r) => `${r.domain},${r.prediction},${r.confidence}`).join('\n')
        const blob = new Blob([header + rows], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'scan_results.csv'
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div>
            <h1 className="text-lg font-semibold mb-6">Batch Scanner</h1>

            {/* Upload */}
            <div className="bg-panel border border-border rounded p-5 mb-6">
                <label className="text-xs text-text-secondary uppercase tracking-wider block mb-3">
                    Upload CSV file
                </label>
                <div className="flex gap-3 items-center">
                    <label className="flex items-center gap-2 px-5 py-2.5 border border-[#333] bg-black text-white text-sm rounded cursor-pointer hover:bg-white hover:text-black transition-colors">
                        <Upload size={14} />
                        Choose File
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleUpload}
                            className="hidden"
                        />
                    </label>
                    {fileName && (
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                            <FileSpreadsheet size={14} />
                            {fileName}
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-text-secondary mt-3">
                    CSV must have a &quot;domain&quot; column header.
                </p>
            </div>

            {error && (
                <div className="text-xs text-text-secondary mb-4 bg-panel border border-border rounded p-3">
                    ⚠ {error} — Showing offline demo results.
                </div>
            )}

            {loading && (
                <div className="text-sm text-text-secondary mb-4">Processing...</div>
            )}

            {/* Results Table */}
            {results.length > 0 && (
                <div className="bg-panel border border-border rounded overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                        <span className="text-xs text-text-secondary uppercase tracking-wider">
                            Results — {results.length} domains
                        </span>
                        <button
                            onClick={exportCSV}
                            className="flex items-center gap-2 px-4 py-1.5 border border-[#333] bg-black text-white text-xs rounded hover:bg-white hover:text-black transition-colors"
                        >
                            <Download size={12} />
                            Export CSV
                        </button>
                    </div>
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left">
                                    <th className="px-5 py-3 text-xs text-text-secondary uppercase tracking-wider font-medium">#</th>
                                    <th className="px-5 py-3 text-xs text-text-secondary uppercase tracking-wider font-medium">Domain</th>
                                    <th className="px-5 py-3 text-xs text-text-secondary uppercase tracking-wider font-medium">Prediction</th>
                                    <th className="px-5 py-3 text-xs text-text-secondary uppercase tracking-wider font-medium">Confidence</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, i) => (
                                    <tr key={i} className="border-b border-border/50 hover:bg-white/[0.02]">
                                        <td className="px-5 py-2.5 text-text-secondary font-mono text-xs">{i + 1}</td>
                                        <td className="px-5 py-2.5 font-mono text-xs">{r.domain}</td>
                                        <td className="px-5 py-2.5">
                                            <span
                                                className={`text-xs font-mono uppercase ${r.prediction === 'malicious' ? 'text-white' : 'text-text-secondary'
                                                    }`}
                                            >
                                                {r.prediction}
                                            </span>
                                        </td>
                                        <td className="px-5 py-2.5 font-mono text-xs">
                                            {(r.confidence * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
