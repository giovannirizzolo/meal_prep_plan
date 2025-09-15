export default function Layout({ children }) {
    return (
        <main className="min-h-screen bg-bat">
            <div className="container mx-auto px-6 py-8 grid gap-6">
                {children}
            </div>
        </main>
    )
}