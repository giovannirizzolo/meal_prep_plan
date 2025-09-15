import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  // Forziamo il tema dark su tutto il sito
  return (
    <Html lang="it" className="dark">
      <Head />
      <body className="bg-background text-foreground antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
