import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, AlertTriangle, CheckCircle } from 'lucide-react'
import { predictDomain } from '../api'

export default function Analyzer() {
    const [searchParams] = useSearchParams()
    const [domain, setDomain] = useState(searchParams.get('domain') || '')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        const d = searchParams.get('domain')
        if (d) {
            setDomain(d)
            handleAnalyze(d)
        }
    }, [searchParams])

    const handleAnalyze = async (d) => {
        const target = d || domain
        if (!target.trim()) return
        setLoading(true)
        setError(null)
        try {
            const data = await predictDomain(target.trim())
            setResult(data)
        } catch (e) {
            setError('Failed to analyze domain. Is the backend running?')
            // Show demo result for offline mode
            setResult({
                domain: target.trim(),
                prediction: target.includes('-') || target.length > 20 ? 'malicious' : 'benign',
                confidence: target.includes('-') ? 0.93 : 0.12,
                features: {
                    domain_length: target.length,
                    entropy: 3.42,
                    num_digits: (target.match(/\d/g) || []).length,
                    num_hyphens: (target.match(/-/g) || []).length,
                    vowel_ratio: 0.35,
                    tld_risk_score: 0.8,
                    blacklist_score: 0.0,
                    subdomain_count: Math.max(0, (target.match(/\./g) || []).length - 1),
                },
            })
        } finally {
            setLoading(false)
        }
    }

    const isMalicious = result?.prediction === 'malicious'

    return (
        <div>
            <h1 className="text-lg font-semibold mb-6">Domain Analyzer</h1>

            {/* Input */}
            <div className="bg-panel border border-border rounded p-5 mb-6">
                <label className="text-xs text-text-secondary uppercase tracking-wider block mb-3">
                    Enter domain to analyze
                </label>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                        placeholder="example.com"
                        className="flex-1 bg-bg border border-border rounded px-4 py-2.5 text-sm text-white placeholder:text-text-secondary outline-none focus:border-border-hover font-mono"
                    />
                    <button
                        onClick={() => handleAnalyze()}
                        disabled={loading}
                        className="px-6 py-2.5 border border-[#333] bg-black text-white text-sm rounded hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Analyzing...' : 'Analyze'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="text-xs text-text-secondary mb-4 bg-panel border border-border rounded p-3">
                    ⚠ {error} — Showing offline demo result.
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="grid grid-cols-3 gap-4">
                    {/* Prediction Card */}
                    <div className="bg-panel border border-border rounded p-5">
                        <h3 className="text-xs uppercase tracking-wider text-text-secondary mb-4">Prediction</h3>
                        <div className="flex items-center gap-3 mb-3">
                            {isMalicious ? (
                                <AlertTriangle size={24} className="text-white" />
                            ) : (
                                <CheckCircle size={24} className="text-text-secondary" />
                            )}
                            <span className={`text-lg font-semibold font-mono uppercase ${isMalicious ? 'text-white' : 'text-text-secondary'}`}>
                                {result.prediction}
                            </span>
                        </div>
                        <p className="text-xs text-text-secondary font-mono">{result.domain}</p>
                    </div>

                    {/* Confidence Card */}
                    <div className="bg-panel border border-border rounded p-5">
                        <h3 className="text-xs uppercase tracking-wider text-text-secondary mb-4">Confidence Score</h3>
                        <p className="text-3xl font-semibold font-mono text-white">
                            {(result.confidence * 100).toFixed(1)}%
                        </p>
                        <div className="mt-3 h-1.5 bg-bg rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${result.confidence * 100}%`,
                                    backgroundColor: isMalicious ? '#FFFFFF' : '#555',
                                }}
                            />
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-panel border border-border rounded p-5">
                        <h3 className="text-xs uppercase tracking-wider text-text-secondary mb-4">Risk Assessment</h3>
                        <div className="space-y-2">
                            <div className={`text-sm font-mono ${isMalicious ? 'text-white' : 'text-text-secondary'}`}>
                                {isMalicious ? '● HIGH RISK' : '○ LOW RISK'}
                            </div>
                            <p className="text-xs text-text-secondary">
                                {isMalicious
                                    ? 'This domain exhibits patterns associated with malicious activity.'
                                    : 'This domain appears to be legitimate.'}
                            </p>
                        </div>
                    </div>

                    {/* Feature Breakdown */}
                    <div className="col-span-3 bg-panel border border-border rounded p-5">
                        <h3 className="text-xs uppercase tracking-wider text-text-secondary mb-4">Feature Breakdown</h3>
                        <div className="grid grid-cols-4 gap-4">
                            {Object.entries(result.features).map(([key, val]) => (
                                <div key={key} className="border border-border rounded p-3">
                                    <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">
                                        {key.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-sm font-mono text-white">
                                        {typeof val === 'number' ? val.toFixed?.(4) ?? val : val}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
