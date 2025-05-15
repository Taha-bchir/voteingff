"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { PollCard } from "@/components/poll-card"
import { Starfield } from "@/components/ui/starfield"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"
import { useApi } from "@/services/api"
import { useWallet } from "@/context/wallet-context"
import { useToast } from "@/hooks/use-toast"

interface PollOption {
  text: string
  votes?: number
}

interface Poll {
  _id: string
  title: string
  options: PollOption[]
  totalVotes: number
  deadline: string
  isActive: boolean
  createdBy: string
}

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "active" | "ended">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const api = useApi()
  const { connected, walletAddress } = useWallet()
  const { toast } = useToast()

  useEffect(() => {
    fetchPolls()
  }, [connected, filter, searchTerm])

  const fetchPolls = async () => {
    setLoading(true)
    setError(null)

    try {
      // Prepare filters
      const filters: Record<string, string> = {}

      if (filter === "active") {
        filters.isActive = "true"
      } else if (filter === "ended") {
        filters.isActive = "false"
      }

      if (searchTerm) {
        filters.search = searchTerm
      }

      // Fetch polls
      const response = await api.polls.getAll(filters)

      if (response.success) {
        setPolls(response.data)
      } else {
        setError("Failed to fetch polls")
        toast({
          title: "Error",
          description: "Failed to fetch polls. Please try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error fetching polls:", err)
      setError("Failed to fetch polls")
      toast({
        title: "Error",
        description: "Failed to fetch polls. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPolls()
  }

  const activePolls = polls.filter((poll) => poll.isActive)
  const endedPolls = polls.filter((poll) => !poll.isActive)

  return (
    <main className="min-h-screen">
      <Starfield />
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-bold mb-8 neon-text">Active Polls</h1>

        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search polls..."
              className="pl-10 glassmorphism"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className={`border-primary ${filter === "all" ? "bg-primary/20" : ""} text-primary hover:bg-primary/10`}
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              type="button"
              variant="outline"
              className={`border-accent ${filter === "active" ? "bg-accent/20" : ""} text-accent hover:bg-accent/10`}
              onClick={() => setFilter("active")}
            >
              Active
            </Button>
            <Button
              type="button"
              variant="outline"
              className={`border-muted-foreground ${filter === "ended" ? "bg-muted/20" : ""} text-muted-foreground hover:bg-muted/10`}
              onClick={() => setFilter("ended")}
            >
              Ended
            </Button>
          </div>
        </form>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchPolls}>
              Try Again
            </Button>
          </div>
        ) : polls.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No polls found</p>
            {!connected && (
              <p className="mt-2 text-sm text-muted-foreground">
                Connect your wallet to create and participate in polls
              </p>
            )}
          </div>
        ) : (
          <>
            {activePolls.length > 0 && (
              <>
                <h2 className="text-2xl font-bold mb-6">Active Polls</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {activePolls.map((poll) => (
                    <PollCard
                      key={poll._id}
                      id={poll._id}
                      title={poll.title}
                      options={poll.options}
                      totalVotes={poll.totalVotes}
                      deadline={poll.deadline}
                      isActive={poll.isActive}
                    />
                  ))}
                </div>
              </>
            )}

            {endedPolls.length > 0 && (
              <>
                <h2 className="text-2xl font-bold mb-6">Ended Polls</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {endedPolls.map((poll) => (
                    <PollCard
                      key={poll._id}
                      id={poll._id}
                      title={poll.title}
                      options={poll.options}
                      totalVotes={poll.totalVotes}
                      deadline={poll.deadline}
                      isActive={poll.isActive}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}
