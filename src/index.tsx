import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import DashboardApp from './DashboardApp';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Lógica de Subdominio para separar productos (según Roadmap)
const hostname = window.location.hostname;
const isSaaSManagement = hostname.startsWith('kiosk') || hostname.startsWith('admin') || window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/kiosk');

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
        <div style={{ padding: '20px', color: 'white', background: '#222', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h1 style={{ color: '#13ec80' }}>Algo salió mal</h1>
          <p>{this.state.error?.message || "Error desconocido"}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: '#13ec80', border: 'none', color: 'black', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', marginTop: '20px' }}>
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {isSaaSManagement ? <DashboardApp /> : <App />}
    </ErrorBoundary>
  </React.StrictMode>
);