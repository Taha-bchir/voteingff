"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Starfield } from "@/components/ui/starfield"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarClock, Users, Loader2, ArrowLeft, RefreshCw } from "lucide-react"
import { useApi } from "@/services/api"
import { useWallet } from "@/context/wallet-context"
import { useToast } from "@/hooks/use-toast"

interface PollOption {
  text: string
  votes: number
}

interface Poll {
  _id: string
  title: string
  description: string
  options: PollOption[]
  totalVotes: number
  deadline: string
  createdBy: string
  createdAt: string
  isActive: boolean
  userVote?: number | null
}

export default function PollDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [votingOption, setVotingOption] = useState<number | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const api = useApi()
  const { connected, walletAddress, token } = useWallet()
  const { toast } = useToast()

  useEffect(() => {
    if (id) {
      fetchPoll()
    }
  }, [id, connected, token])

  const fetchPoll = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.polls.getOne(id as string)

      if (response.success) {
        setPoll(response.data)
      } else {
        setError("Failed to fetch poll details")
        toast({
          title: "Error",
          description: "Failed to fetch poll details. Please try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error fetching poll:", err)
      setError("Failed to fetch poll details")
      toast({
        title: "Error",
        description: "Failed to fetch poll details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshPoll = () => {
    setRefreshing(true)
    fetchPoll()
  }

  const handleVote = async (optionIndex: number) => {
    if (!connected || !walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to vote",
        variant: "destructive",
      })
      return
    }

    if (!poll || !poll.isActive) {
      toast({
        title: "Cannot vote",
        description: "This poll is no longer active",
        variant: "destructive",
      })
      return
    }

    setVotingOption(optionIndex)
    setIsVoting(true)

    try {
      console.log("Submitting vote:", { pollId: poll._id, optionIndex, token })

      const response = await api.votes.cast(poll._id, optionIndex)

      if (response.success) {
        toast({
          title: "Vote submitted!",
          description: (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Transaction Hash:</p>
              <p className="text-xs font-mono bg-secondary p-1 rounded overflow-x-auto">{response.data.txHash}</p>
            </div>
          ),
        })

        // Immediately update the local poll data to reflect the new vote
        if (poll) {
          const updatedPoll = { ...poll }

          // Increment the vote count for the selected option
          if (updatedPoll.options[optionIndex]) {
            updatedPoll.options[optionIndex].votes += 1
          }

          // Increment total votes
          updatedPoll.totalVotes += 1

          // Mark that the user has voted
          updatedPoll.userVote = optionIndex

          // Update the poll state
          setPoll(updatedPoll)

          // Also refresh from the server to ensure data consistency
          setTimeout(() => {
            fetchPoll()
          }, 1000)
        }
      } else {
        toast({
          title: "Error submitting vote",
          description: response.message || "Please try again later",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error("Vote error:", err)

      // Check if the error is because the user has already voted
      if (err.message && err.message.includes("already voted")) {
        toast({
          title: "Already Voted",
          description: "You have already cast a vote in this poll",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error submitting vote",
          description: err.message || "Please try again later",
          variant: "destructive",
        })
      }

      // Refresh the poll to get the latest data
      fetchPoll()
    } finally {
      setIsVoting(false)
      setVotingOption(null)
    }
  }

  // Calculate percentages for the progress bars
  const calculatePercentage = (votes: number) => {
    return poll && poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <Starfield />
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </main>
    )
  }

  if (error || !poll) {
    return (
      <main className="min-h-screen">
        <Starfield />
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="text-center py-10">
            <p className="text-destructive">{error || "Poll not found"}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/polls")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Polls
            </Button>
          </div>
        </div>
      </main>
    )
  }

  // Format dates
  const formattedDeadline = new Date(poll.deadline).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const formattedCreatedAt = new Date(poll.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const hasVoted = poll.userVote !== undefined && poll.userVote !== null

  return (
    <main className="min-h-screen">
      <Starfield />
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => router.push("/polls")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Polls
          </Button>

          <Button
            variant="outline"
            onClick={refreshPoll}
            disabled={refreshing}
            className="text-primary border-primary hover:bg-primary/10"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>

        <Card className="max-w-4xl mx-auto glassmorphism">
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <CardTitle className="text-2xl font-bold">{poll.title}</CardTitle>
              <Badge
                variant={poll.isActive ? "default" : "secondary"}
                className={poll.isActive ? "bg-accent text-accent-foreground self-start" : "self-start"}
              >
                {poll.isActive ? "Active" : "Ended"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between text-sm text-muted-foreground gap-2">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{poll.totalVotes} votes</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarClock className="h-4 w-4" />
                <span>Ends on {formattedDeadline}</span>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground mb-4">{poll.description}</p>
              <p className="text-xs text-muted-foreground">Created on {formattedCreatedAt}</p>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold">Cast Your Vote</h3>

              {poll.options.map((option, index) => {
                const percentage = calculatePercentage(option.votes)
                const isUserVote = poll.userVote === index

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{option.text}</span>
                      <span className="text-sm text-muted-foreground">
                        {option.votes} votes ({percentage}%)
                      </span>
                    </div>

                    <div className="relative h-10 w-full overflow-hidden rounded-md border">
                      <div
                        className={`absolute inset-0 ${isUserVote ? "bg-primary/30" : "bg-accent/20"} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />

                      <div className="absolute inset-0 flex items-center justify-between px-3">
                        <span className="text-sm font-medium">{option.text}</span>
                        {isVoting && votingOption === index ? (
                          <Button disabled className="w-20 h-8">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleVote(index)}
                            disabled={!poll.isActive || hasVoted || !connected}
                            className={`w-20 h-8 ${isUserVote ? "bg-primary" : "bg-accent"} text-white hover:bg-accent/80`}
                          >
                            {isUserVote ? "Voted" : "Vote"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {!poll.isActive && (
                <div className="bg-muted p-4 rounded-md text-center">
                  <p className="text-muted-foreground">This poll has ended and voting is no longer available.</p>
                </div>
              )}

              {hasVoted && poll.isActive && (
                <div className="bg-primary/10 p-4 rounded-md text-center border border-primary/20">
                  <p className="text-primary">You have already voted in this poll.</p>
                </div>
              )}

              {!connected && poll.isActive && (
                <div className="bg-muted p-4 rounded-md text-center">
                  <p className="text-muted-foreground">Connect your wallet to vote in this poll.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
