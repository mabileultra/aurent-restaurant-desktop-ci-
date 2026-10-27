import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Sentry } from '../../observability/initSentry';
import PlatformErrorState from '../ui/PlatformErrorState';

/**
 * Granular Section Error Boundary.
 * Catches UI runtime exceptions inside isolated widgets, tables, or cards
 * without taking down the entire page or layout.
 */
export default class SectionErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env?.VITE_SENTRY_DSN) {
      Sentry.captureException(error, {
        tags: { section: this.props.sectionName || 'unknown_section' },
        extra: { componentStack: errorInfo?.componentStack },
      });
    }
    console.error(`[SectionErrorBoundary:${this.props.sectionName || 'section'}]`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && this.props.resetKeys) {
      const hasChanged = this.props.resetKeys.some(
        (key, idx) => key !== prevProps.resetKeys?.[idx]
      );
      if (hasChanged) {
        this.reset();
      }
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback({ error: this.state.error, reset: this.reset });
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={`w-full rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm ${this.props.className || ''}`}>
          <PlatformErrorState
            error={this.state.error}
            title={this.props.title}
            description={this.props.description}
            size={this.props.size || 'md'}
            onRetry={this.reset}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

SectionErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  sectionName: PropTypes.string,
  title: PropTypes.node,
  description: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  resetKeys: PropTypes.array,
  onError: PropTypes.func,
  onReset: PropTypes.func,
  className: PropTypes.string,
};
