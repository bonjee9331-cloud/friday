'use client';
import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unknown error'
    };
  }

  componentDidCatch(error, info) {
    console.error('FRIDAY app crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#050810',
          color: '#cfe6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: 640,
            width: '100%',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(0,180,255,0.25)',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 0 40px rgba(0,180,255,0.08)'
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#00b4ff' }}>FRIDAY hit a startup snag</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.92, marginBottom: 16 }}>
              The app crashed while loading. Refresh first. If it still breaks, the line below tells us what actually failed.
            </div>
            <div style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 13,
              lineHeight: 1.5,
              color: '#ffb3b3',
              background: 'rgba(255,80,80,0.06)',
              border: '1px solid rgba(255,80,80,0.2)',
              borderRadius: 10,
              padding: 14,
              marginBottom: 16,
              wordBreak: 'break-word'
            }}>
              {this.state.errorMessage}
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#00b4ff',
                color: '#001018',
                border: 'none',
                borderRadius: 10,
                padding: '10px 16px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Reload FRIDAY
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
