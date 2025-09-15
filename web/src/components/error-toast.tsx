import React from 'react';
import { useError, type ErrorInfo } from '@/src/contexts/error-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const getErrorIcon = (type: ErrorInfo['type']) => {
    switch (type) {
        case 'error':
            return <AlertCircle className="h-5 w-5 text-red-500" />;
        case 'warning':
            return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        case 'info':
            return <Info className="h-5 w-5 text-blue-500" />;
        default:
            return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
};

const getErrorStyles = (type: ErrorInfo['type']) => {
    switch (type) {
        case 'error':
            return 'border-red-200 bg-red-50';
        case 'warning':
            return 'border-yellow-200 bg-yellow-50';
        case 'info':
            return 'border-blue-200 bg-blue-50';
        default:
            return 'border-red-200 bg-red-50';
    }
};

export const ErrorToast: React.FC = () => {
    const { errors, removeError } = useError();

    if (errors.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
            {errors.map((error) => (
                <Card key={error.id} className={`${getErrorStyles(error.type)} shadow-lg`}>
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                                {getErrorIcon(error.type)}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">
                                        {error.message}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {error.timestamp.toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-gray-200"
                                onClick={() => removeError(error.id)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
