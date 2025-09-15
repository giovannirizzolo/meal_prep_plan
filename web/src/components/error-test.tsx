import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useError } from '@/src/contexts/error-context';
import { apiClient, useApiCall } from '@/src/lib/api-client';
import { reportError } from '@/src/lib/error-handling';

export const ErrorTestComponent: React.FC = () => {
    const { addError } = useError();
    const { callApi } = useApiCall();

    const testRenderError = () => {
        throw new Error('This is a test render error');
    };

    const testApiError = async () => {
        await callApi(
            () => apiClient.get('http://localhost:8000/non-existent-endpoint'),
            { errorMessage: 'Custom API error message' }
        );
    };

    const testNetworkError = async () => {
        await callApi(
            () => apiClient.get('http://invalid-domain-12345.com/test'),
            { errorMessage: 'Network error occurred' }
        );
    };

    const testManualError = () => {
        addError('This is a manual error message', 'error');
    };

    const testManualWarning = () => {
        addError('This is a warning message', 'warning');
    };

    const testManualInfo = () => {
        addError('This is an info message', 'info');
    };

    const testUnhandledPromise = () => {
        Promise.reject(new Error('Unhandled promise rejection test'));
    };

    const testReportError = () => {
        reportError('Manually reported error', { context: 'test component' });
    };

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle className="text-red-600">Error Testing (Development Only)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
                <Button variant="destructive" onClick={testRenderError}>
                    Test Render Error
                </Button>
                <Button variant="destructive" onClick={testApiError}>
                    Test API Error
                </Button>
                <Button variant="destructive" onClick={testNetworkError}>
                    Test Network Error
                </Button>
                <Button variant="destructive" onClick={testManualError}>
                    Test Manual Error
                </Button>
                <Button variant="outline" onClick={testManualWarning}>
                    Test Warning
                </Button>
                <Button variant="outline" onClick={testManualInfo}>
                    Test Info Message
                </Button>
                <Button variant="destructive" onClick={testUnhandledPromise}>
                    Test Unhandled Promise
                </Button>
                <Button variant="secondary" onClick={testReportError}>
                    Test Report Error
                </Button>
            </CardContent>
        </Card>
    );
};
