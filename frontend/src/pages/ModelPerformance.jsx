import { useState, useEffect } from 'react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { getMetrics } from '../api'

// Default metrics for offline / demo mode
const defaultMetrics = {
    lstm: { accuracy: 0.9721, precision: 0.9685, recall: 0.9758, f1_score: 0.9721, roc_auc: 0.9952 },
    random_forest: { accuracy: 0.9834, precision: 0.9812, recall: 0.9857, f1_score: 0.9834, roc_auc: 0.9981 },
    xgboost: { accuracy: 0.9867, precision: 0.9845, recall: 0.9890, f1_score: 0.9867, roc_auc: 0.9988 },
}

// Simulated ROC curve data
const rocData = [
    { fpr: 0, tpr: 0 },
    { fpr: 0.01, tpr: 0.45 },
    { fpr: 0.02, tpr: 0.72 },
    { fpr: 0.05, tpr: 0.88 },
    { fpr: 0.1, tpr: 0.94 },
    { fpr: 0.15, tpr: 0.965 },
    { fpr: 0.2, tpr: 0.975 },
    { fpr: 0.3, tpr: 0.985 },
    { fpr: 0.5, tpr: 0.993 },
    { fpr: 0.7, tpr: 0.997 },
    { fpr: 1.0, tpr: 1.0 },
]

const confusionMatrix = {
    lstm: { tp: 19516, tn: 19342, fp: 658, fn: 484 },
    random_forest: { tp: 19714, tn: 19554, fp: 446, fn: 286 },
    xgboost: { tp: 19780, tn: 19588, fp: 412, fn: 220 },
}

function MetricCard({ label, value }) {
    return (
        <div className="border border-border rounded p-4">
            <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-semibold font-mono text-white">{(value * 100).toFixed(2)}%</p>
        </div>
    )
}

function ConfusionMatrixGrid({ data, title }) {
    const { tp, tn, fp, fn } = data
    return (
        <div className="bg-panel border border-border rounded p-5">
            <h3 className="text-xs uppercase tracking-wider text-text-secondary mb-4">{title}</h3>
            <div className="grid grid-cols-2 gap-1 max-w-[240px] mx-auto">
                <div className="bg-white/10 border border-border rounded p-3 text-center">
                    <p className="text-[9px] text-text-secondary uppercase mb-1">True Neg</p>
                    <p className="text-sm font-mono text-white">{tn.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 border border-border rounded p-3 text-center">
                    <p className="text-[9px] text-text-secondary uppercase mb-1">False Pos</p>
                    <p className="text-sm font-mono text-text-secondary">{fp.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 border border-border rounded p-3 text-center">
                    <p className="text-[9px] text-text-secondary uppercase mb-1">False Neg</p>
                    <p className="text-sm font-mono text-text-secondary">{fn.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 border border-border rounded p-3 text-center">
                    <p className="text-[9px] text-text-secondary uppercase mb-1">True Pos</p>
                    <p className="text-sm font-mono text-white">{tp.toLocaleString()}</p>
                </div>
            </div>
            <div className="flex justify-center mt-2 gap-4 text-[9px] text-text-secondary">
                <span>← Predicted →</span>
            </div>
        </div>
    )
}

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-panel border border-border px-3 py-2 rounded text-xs">
            <p className="text-white font-mono">FPR: {payload[0].payload.fpr}</p>
            <p className="text-white font-mono">TPR: {payload[0].payload.tpr}</p>
        </div>
    )
}

export default function ModelPerformance() {
    const [metrics, setMetrics] = useState(defaultMetrics)
    const [activeModel, setActiveModel] = useState('xgboost')

    useEffect(() => {
        getMetrics()
            .then(setMetrics)
            .catch(() => setMetrics(defaultMetrics))
    }, [])

    const models = Object.keys(metrics)
    const current = metrics[activeModel] || metrics[models[0]]

    return (
        <div>
            <h1 className="text-lg font-semibold mb-6">Model Performance</h1>

            {/* Model Selector */}
            <div className="flex gap-2 mb-6">
                {models.map((m) => (
                    <button
                        key={m}
                        onClick={() => setActiveModel(m)}
                        className={`px-4 py-2 text-xs rounded border transition-colors ${activeModel === m
                                ? 'bg-white text-black border-white'
                                : 'bg-black text-white border-[#333] hover:bg-white hover:text-black'
                            }`}
                    >
                        {m.replace(/_/g, ' ').toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Metrics */}
            {current && (
                <div className="grid grid-cols-5 gap-4 mb-6">
                    <MetricCard label="Accuracy" value={current.accuracy} />
                    <MetricCard label="Precision" value={current.precision} />
                    <MetricCard label="Recall" value={current.recall} />
                    <MetricCard label="F1 Score" value={current.f1_score} />
                    <MetricCard label="ROC AUC" value={current.roc_auc} />
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                {/* ROC Curve */}
                <div className="bg-panel border border-border rounded p-5">
                    <h3 className="text-xs uppercase tracking-wider text-text-secondary mb-4">ROC Curve</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={rocData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                            <XAxis
                                dataKey="fpr"
                                stroke="#555"
                                tick={{ fontSize: 11, fill: '#9A9A9A' }}
                                label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, fill: '#555', fontSize: 11 }}
                            />
                            <YAxis
                                stroke="#555"
                                tick={{ fontSize: 11, fill: '#9A9A9A' }}
                                label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', offset: 10, fill: '#555', fontSize: 11 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="tpr" stroke="#FFFFFF" strokeWidth={1.5} dot={false} />
                            {/* Diagonal reference */}
                            <Line
                                data={[{ fpr: 0, tpr: 0 }, { fpr: 1, tpr: 1 }]}
                                type="linear"
                                dataKey="tpr"
                                stroke="#333"
                                strokeWidth={1}
                                strokeDasharray="4 4"
                                dot={false}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Confusion Matrices */}
                <div className="space-y-4">
                    <ConfusionMatrixGrid
                        data={confusionMatrix[activeModel] || confusionMatrix.xgboost}
                        title={`${activeModel.replace(/_/g, ' ').toUpperCase()} — Confusion Matrix`}
                    />

                    {/* Model Comparison Table */}
                    <div className="bg-panel border border-border rounded p-5">
                        <h3 className="text-xs uppercase tracking-wider text-text-secondary mb-4">Model Comparison</h3>
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="py-2 text-left text-text-secondary font-medium">Model</th>
                                    <th className="py-2 text-right text-text-secondary font-medium">Acc</th>
                                    <th className="py-2 text-right text-text-secondary font-medium">F1</th>
                                    <th className="py-2 text-right text-text-secondary font-medium">AUC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {models.map((m) => (
                                    <tr key={m} className={`border-b border-border/50 ${m === activeModel ? 'bg-white/[0.03]' : ''}`}>
                                        <td className="py-2 font-mono uppercase">{m.replace(/_/g, ' ')}</td>
                                        <td className="py-2 text-right font-mono">{(metrics[m].accuracy * 100).toFixed(2)}%</td>
                                        <td className="py-2 text-right font-mono">{(metrics[m].f1_score * 100).toFixed(2)}%</td>
                                        <td className="py-2 text-right font-mono">{(metrics[m].roc_auc * 100).toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
