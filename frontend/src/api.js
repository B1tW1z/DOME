const API = '/api'

export async function predictDomain(domain) {
    const res = await fetch(`${API}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
    })
    if (!res.ok) throw new Error('Prediction failed')
    return res.json()
}

export async function batchPredict(file) {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API}/batch_predict`, {
        method: 'POST',
        body: form,
    })
    if (!res.ok) throw new Error('Batch prediction failed')
    return res.json()
}

export async function getMetrics() {
    const res = await fetch(`${API}/metrics`)
    if (!res.ok) throw new Error('Failed to fetch metrics')
    return res.json()
}

export async function healthCheck() {
    const res = await fetch(`${API}/health`)
    return res.json()
}
