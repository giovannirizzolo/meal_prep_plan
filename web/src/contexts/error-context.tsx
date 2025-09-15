import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { setupGlobalErrorHandling, removeGlobalErrorHandling } from '@/src/lib/error-handling';

export interface ErrorInfo {
    id: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    timestamp: Date;
    details?: any;
}

interface ErrorContextType {
    errors: ErrorInfo[];
    addError: (message: string, type?: ErrorInfo['type'], details?: any) => string;
    removeError: (id: string) => void;
    clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useError = () => {
    const context = useContext(ErrorContext);
    if (context === undefined) {
        throw new Error('useError must be used within an ErrorProvider');
    }
    return context;
};

interface ErrorProviderProps {
    children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
    const [errors, setErrors] = useState<ErrorInfo[]>([]);

    const addError = useCallback((message: string, type: ErrorInfo['type'] = 'error', details?: any) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const newError: ErrorInfo = {
            id,
            message,
            type,
            timestamp: new Date(),
            details,
        };

        setErrors(prev => [...prev, newError]);

        // Auto-remove after 5 seconds for non-error types
        if (type !== 'error') {
            setTimeout(() => {
                setErrors(prev => prev.filter(error => error.id !== id));
            }, 5000);
        }

        return id;
    }, []);

    const removeError = useCallback((id: string) => {
        setErrors(prev => prev.filter(error => error.id !== id));
    }, []);

    const clearErrors = useCallback(() => {
        setErrors([]);
    }, []);

    // Set up global error handling
    useEffect(() => {
        setupGlobalErrorHandling((message, details) => {
            addError(message, 'error', details);
        });

        return () => {
            removeGlobalErrorHandling();
        };
    }, [addError]);

    return (
        <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
            {children}
        </ErrorContext.Provider>
    );
};
