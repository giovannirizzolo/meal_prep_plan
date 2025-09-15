import { useError } from '@/src/contexts/error-context';

export class ApiError extends Error {
    public status: number;
    public statusText: string;
    public data?: any;

    constructor(message: string, status: number, statusText: string, data?: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.statusText = statusText;
        this.data = data;
    }
}

export class NetworkError extends Error {
    constructor(message: string = 'Network request failed') {
        super(message);
        this.name = 'NetworkError';
    }
}

interface ApiOptions extends RequestInit {
    timeout?: number;
}

export const apiClient = {
    async request<T = any>(url: string, options: ApiOptions = {}): Promise<T> {
        const { timeout = 10000, ...requestOptions } = options;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...requestOptions,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...requestOptions.headers,
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                let errorData;
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        errorData = await response.json();
                        errorMessage = errorData?.message || errorData?.detail || errorMessage;
                    } else {
                        errorData = await response.text();
                        errorMessage = errorData || errorMessage;
                    }
                } catch (parseError) {
                    console.warn('Failed to parse error response:', parseError);
                    // Keep the default errorMessage
                }

                throw new ApiError(
                    errorMessage,
                    response.status,
                    response.statusText,
                    errorData
                );
            }

            const contentType = response.headers.get('content-type');
            try {
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                } else {
                    return (await response.text()) as unknown as T;
                }
            } catch (parseError) {
                console.error('Error parsing response:', parseError);
                if (parseError instanceof TypeError) {
                    throw new ApiError(
                        'Invalid response format from server',
                        response.status,
                        response.statusText,
                        parseError.message
                    );
                }
                throw parseError;
            }
        } catch (error) {
            clearTimeout(timeoutId);

            // If it's an ApiError from our parsing logic above, just re-throw it
            if (error instanceof ApiError) {
                throw error;
            }

            // Handle abort/timeout
            if (error.name === 'AbortError') {
                throw new NetworkError('Request timeout');
            }

            // Handle network-level fetch errors
            if (error instanceof TypeError) {
                const message = error.message.toLowerCase();

                if (message.includes('fetch') ||
                    message.includes('network') ||
                    message.includes('failed to fetch') ||
                    message.includes('load failed')) {
                    // This is a genuine network connectivity issue
                    throw new NetworkError(`Network error: ${error.message}`);
                }

                // Other TypeErrors (unexpected)
                throw new ApiError(
                    `Request processing error: ${error.message}`,
                    0,
                    'Processing Error',
                    error
                );
            }

            // Any other unexpected errors
            throw error;
        }
    },

    get<T = any>(url: string, options: ApiOptions = {}): Promise<T> {
        return this.request(url, { ...options, method: 'GET' });
    },

    post<T = any>(url: string, data?: any, options: ApiOptions = {}): Promise<T> {
        return this.request(url, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    put<T = any>(url: string, data?: any, options: ApiOptions = {}): Promise<T> {
        return this.request(url, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    delete<T = any>(url: string, options: ApiOptions = {}): Promise<T> {
        return this.request(url, { ...options, method: 'DELETE' });
    },
};

// Hook for API calls with error handling
export const useApiCall = () => {
    const { addError } = useError();

    const callApi = async <T = any>(
        apiCall: () => Promise<T>,
        options: {
            errorMessage?: string;
            showSuccess?: boolean;
            successMessage?: string;
        } = {}
    ): Promise<T | null> => {
        try {
            const result = await apiCall();

            if (options.showSuccess && options.successMessage) {
                addError(options.successMessage, 'info');
            }

            return result;
        } catch (error) {
            let errorMessage = options.errorMessage || 'An error occurred';

            console.log('API Error caught:', error); // Debug log

            if (error instanceof ApiError) {
                errorMessage = error.message;
                console.log(`API Error ${error.status}: ${error.message}`);
            } else if (error instanceof NetworkError) {
                errorMessage = 'Network connection failed. Please check your internet connection.';
                console.log('Network Error:', error.message);
            } else if (error instanceof Error) {
                errorMessage = error.message;
                console.log('Generic Error:', error.message);
            } else {
                console.log('Unknown error type:', error);
            }

            addError(errorMessage, 'error', error);
            return null;
        }
    };

    return { callApi };
};
