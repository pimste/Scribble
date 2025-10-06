import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="max-w-md w-full mx-4 space-y-8 text-center">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Image 
              src="/scribble_logo.png" 
              alt="Scribble Logo" 
              width={80} 
              height={80}
              className="object-contain"
            />
            <h1 className="text-6xl font-bold text-black dark:text-white">
              SCRIBBLE
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Where friendships grow safely! 🌟
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

