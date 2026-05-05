import React from 'react';
import { AlertCircle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(err) {
    let msg = err?.message || 'Unknown error';

    // More domain-aware error mapping (useful for PCA / metabolomics pipelines)
    if (msg.includes('NaN')) {
      msg = 'Numerical instability: NaN detected in dataset';
    } else if (msg.includes('undefined')) {
      msg = 'Data parsing error: missing or malformed values';
    } else if (msg.includes('toFixed')) {
      msg = 'Rendering error: invalid numeric value in chart';
    } else if (msg.includes('Cannot read')) {
      msg = 'Data structure error: incompatible dataset format';
    }

    return { hasError: true, message: msg };
  }

  componentDidCatch(err, info) {
    console.error('[ErrorBoundary]', {
      error: err,
      componentStack: info?.componentStack,
      time: new Date().toISOString()
    });
  }

  reset = () => {
    this.setState({ hasError: false, message: '' });
    this.props?.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col gap-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Analysis error</p>
              <p className="text-[10px] mt-0.5 opacity-80">
                {this.state.message}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <button onClick={this.reset} className="text-[10px] underline opacity-80">
              Retry
            </button>

            {this.props?.onLoadSample && (
              <button
                onClick={this.props.onLoadSample}
                className="text-[10px] underline opacity-80"
              >
                Load sample
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
