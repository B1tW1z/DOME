import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Analyzer from './pages/Analyzer'
import BatchScanner from './pages/BatchScanner'
import ThreatIntel from './pages/ThreatIntel'
import ModelPerformance from './pages/ModelPerformance'

export default function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/analyzer" element={<Analyzer />} />
                <Route path="/batch" element={<BatchScanner />} />
                <Route path="/threat-intel" element={<ThreatIntel />} />
                <Route path="/performance" element={<ModelPerformance />} />
            </Routes>
        </Layout>
    )
}
