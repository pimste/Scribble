import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="max-w-md w-full mx-4 space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Scribble
          </h1>
          <p className="text-xl text-muted-foreground">
            Chat safely with parental controls
          </p>
        </div>
        
        <div className="space-y-4 pt-8">
          <Link
            href="/login"
            className="block w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="block w-full py-3 px-4 rounded-lg border border-border hover:bg-accent transition-colors font-medium"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}

