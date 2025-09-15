import "../../styles/globals.css";
import type { AppProps } from "next/app";
import { ErrorProvider } from "@/src/contexts/error-context";
import { ErrorBoundary } from "@/src/components/error-boundary";
import { ErrorToast } from "@/src/components/error-toast";

export default function App({ Component, pageProps }: AppProps) {
    return (
        <ErrorProvider>
            <ErrorBoundary>
                <Component {...pageProps} />
                <ErrorToast />
            </ErrorBoundary>
        </ErrorProvider>
    );
}
