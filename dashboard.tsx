import React from 'react';
import { createRoot } from 'react-dom/client';
import DashboardApp from './DashboardApp';
import './index.css';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', color: 'white', background: '#0a0c0b', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <h1 style={{ color: '#ff5500', fontSize: '24px', marginBottom: '10px' }}>Algo salió mal en el Dashboard</h1>
                    <p style={{ color: '#ccc', marginBottom: '20px' }}>{this.state.error?.message || "Error desconocido"}</p>
                    <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: '#13ec80', border: 'none', color: 'black', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}>
                        Reintentar
                    </button>
                    <pre style={{ marginTop: '20px', textAlign: 'left', background: '#111', padding: '10px', borderRadius: '5px', overflow: 'auto', maxWidth: '80%' }}>
                        {this.state.error?.stack}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

const container = document.getElementById('dashboard-root');
if (container) {
    const root = createRoot(container);
    root.render(
        <ErrorBoundary>
            <DashboardApp />
        </ErrorBoundary>
    );
}
