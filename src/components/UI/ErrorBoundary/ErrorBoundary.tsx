import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../Button/Button';
import { logger } from '@/utils/logger';
import './ErrorBoundary.scss';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Fallback UI to show when an error occurs */
  fallback?: ReactNode;
  /** Name of the component/section for error reporting */
  componentName?: string;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show a retry button */
  showRetry?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches JavaScript errors in child components.
 * Displays a fallback UI instead of crashing the entire application.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { componentName, onError } = this.props;

    // Log the error
    logger.error(`Error in ${componentName || 'component'}:`, error);
    logger.error('Error info:', errorInfo);

    // Store error info in state for display
    this.setState({ errorInfo });

    // Call optional error callback
    if (onError) {
      onError(error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, componentName, showRetry = true } = this.props;

    if (hasError) {
      // Return custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <AlertTriangle className="error-boundary__icon" size={48} />
            <h2 className="error-boundary__title">Something went wrong</h2>
            <p className="error-boundary__message">
              {componentName
                ? `An error occurred in the ${componentName}.`
                : 'An unexpected error occurred.'}
            </p>
            {error && (
              <details className="error-boundary__details">
                <summary>Error details</summary>
                <pre className="error-boundary__error-text">
                  {error.message}
                </pre>
              </details>
            )}
            {showRetry && (
              <Button
                onClick={this.handleRetry}
                variant="primary"
                className="error-boundary__retry-button"
              >
                <RefreshCw size={16} />
                Try again
              </Button>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}
