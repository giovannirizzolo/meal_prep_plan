import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error boundary caught an error:', error, errorInfo);

        // Log error to external service (e.g., Sentry, LogRocket, etc.)
        this.logErrorToService(error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });
    }

    private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
        // TODO: Integrate with your error logging service
        console.error('Logging error to service:', {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
        });
    };

    private handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    public render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <Card className="max-w-md w-full mx-4">
                        <CardHeader>
                            <CardTitle className="text-red-600">Something went wrong</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600">
                                We encountered an unexpected error. Please try refreshing the page.
                            </p>

                            <div className="flex gap-2">
                                <Button onClick={this.handleRetry} variant="outline">
                                    Try Again
                                </Button>
                                <Button
                                    onClick={() => window.location.reload()}
                                    variant="default"
                                >
                                    Refresh Page
                                </Button>
                            </div>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="mt-4 p-3 bg-gray-100 rounded text-sm">
                                    <summary className="cursor-pointer font-medium">
                                        Error Details (Development)
                                    </summary>
                                    <div className="mt-2 space-y-2">
                                        <div>
                                            <strong>Error:</strong> {this.state.error.message}
                                        </div>
                                        <div>
                                            <strong>Stack:</strong>
                                            <pre className="whitespace-pre-wrap text-xs mt-1">
                                                {this.state.error.stack}
                                            </pre>
                                        </div>
                                    </div>
                                </details>
                            )}
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
