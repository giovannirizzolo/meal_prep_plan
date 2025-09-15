// Global error handling for unhandled errors and promise rejections
export const setupGlobalErrorHandling = (onError: (error: string, details?: any) => void) => {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        onError(
            event.error?.message || 'An unexpected error occurred',
            {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            }
        );
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);

        let message = 'An unexpected error occurred';
        if (event.reason instanceof Error) {
            message = event.reason.message;
        } else if (typeof event.reason === 'string') {
            message = event.reason;
        }

        onError(message, { reason: event.reason });

        // Prevent the default browser behavior (logging to console)
        event.preventDefault();
    });

    // Handle Next.js router errors
    if (typeof window !== 'undefined') {
        const handleRouteError = (err: Error) => {
            console.error('Router error:', err);
            onError('Navigation error occurred', { error: err });
        };

        // Listen for Next.js router events if available
        // You can import and use Next.js router directly in components if needed
    }
};

export const removeGlobalErrorHandling = () => {
    if (typeof window === 'undefined') return;

    window.removeEventListener('error', () => { });
    window.removeEventListener('unhandledrejection', () => { });
};

// Utility to manually report errors
export const reportError = (error: Error | string, context?: any) => {
    const errorInfo = {
        message: typeof error === 'string' ? error : error.message,
        stack: typeof error === 'string' ? undefined : error.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
    };

    console.error('Manual error report:', errorInfo);

    // Here you can send to your error reporting service
    // Example: sendToSentry(errorInfo) or sendToLogRocket(errorInfo)
};
