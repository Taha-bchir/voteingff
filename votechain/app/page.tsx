import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { AnimatedGradientBackground } from "@/components/ui/animated-gradient-background"
import { ArrowRight, ShieldCheck, Vote, Wallet } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <AnimatedGradientBackground />
      <Navbar />

      <div className="flex-1 container mx-auto px-4 pt-24 pb-12">
        <section className="py-12 md:py-24 lg:py-32 flex flex-col items-center text-center">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-6">
              Decentralized Voting Platform
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight neon-text">
              Secure, Transparent, <br /> Decentralized Voting
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              VoteChain leverages blockchain technology to create a secure and transparent voting system. Connect your
              wallet and participate in decentralized decision-making.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary text-white hover:bg-primary/90 neon-border">
                <Link href="/polls">
                  View Active Polls <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10">
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 glassmorphism rounded-xl">
                <Wallet className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Connect Wallet</h3>
                <p className="text-muted-foreground">
                  Connect your Phantom wallet to authenticate and participate in the voting process.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 glassmorphism rounded-xl">
                <Vote className="h-12 w-12 text-accent mb-4" />
                <h3 className="text-xl font-bold mb-2">Cast Your Vote</h3>
                <p className="text-muted-foreground">
                  Browse active polls and cast your vote securely on the blockchain.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 glassmorphism rounded-xl">
                <ShieldCheck className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Verify Results</h3>
                <p className="text-muted-foreground">
                  All votes are recorded on the blockchain, ensuring transparency and integrity.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="py-6 border-t border-border">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Vote className="h-5 w-5 text-primary" />
            <span className="font-bold">VoteChain</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} VoteChain. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
