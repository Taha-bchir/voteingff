"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Starfield } from "@/components/ui/starfield"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarClock, Plus, Trash2, Loader2, AlertCircle } from "lucide-react"
import { useWallet } from "@/context/wallet-context"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/services/api"

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

export default function AdminDashboard() {
  const router = useRouter()
  const { isAdmin, connected, walletAddress, token } = useWallet()
  const { toast } = useToast()
  const api = useApi()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  // Check if user is admin, if not redirect to home
  useEffect(() => {
    if (connected && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard",
        variant: "destructive",
      })
      router.push("/")
    }
  }, [connected, isAdmin, router, toast])

  // Fetch polls created by the connected wallet
  useEffect(() => {
    if (connected && isAdmin && token) {
      fetchMyPolls()
    } else {
      // Reset polls when wallet disconnects or changes
      setPolls([])
    }
  }, [connected, isAdmin, walletAddress, token])

  const fetchMyPolls = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("Fetching polls for wallet:", walletAddress)
      const response = await api.polls.getMine()

      if (response.success) {
        console.log("Polls fetched:", response.data)
        setPolls(response.data)
      } else {
        setError("Failed to fetch your polls")
        toast({
          title: "Error",
          description: "Failed to fetch your polls. Please try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error fetching polls:", err)
      setError("Failed to fetch your polls")
      toast({
        title: "Error",
        description: "Failed to fetch your polls. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClosePoll = async (id: string) => {
    setActionInProgress(id)

    try {
      const response = await api.polls.close(id)

      if (response.success) {
        toast({
          title: "Poll Closed",
          description: "The poll has been successfully closed",
        })

        // Update the poll in the local state
        setPolls(polls.map((poll) => (poll._id === id ? { ...poll, isActive: false } : poll)))
      } else {
        toast({
          title: "Error",
          description: "Failed to close the poll. Please try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error closing poll:", err)
      toast({
        title: "Error",
        description: "Failed to close the poll. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionInProgress(null)
    }
  }

  const handleDeletePoll = async (id: string) => {
    setActionInProgress(id)

    try {
      const response = await api.polls.delete(id)

      if (response.success) {
        toast({
          title: "Poll Deleted",
          description: "The poll has been successfully deleted",
        })

        // Remove the poll from the local state
        setPolls(polls.filter((poll) => poll._id !== id))
      } else {
        toast({
          title: "Error",
          description: "Failed to delete the poll. Please try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error deleting poll:", err)
      toast({
        title: "Error",
        description: "Failed to delete the poll. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionInProgress(null)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!connected || !isAdmin) {
    return (
      <main className="min-h-screen">
        <Starfield />
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center">
          <Card className="max-w-md w-full glassmorphism">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-bold">Admin Access Required</h2>
                <p className="text-muted-foreground">Please connect with an admin wallet to access this page.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <Starfield />
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold neon-text">Admin Dashboard</h1>
            {walletAddress && (
              <p className="text-sm text-muted-foreground mt-2">
                Wallet: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              </p>
            )}
          </div>
          <Button asChild className="bg-primary text-white hover:bg-primary/90 neon-border">
            <Link href="/admin/create">
              <Plus className="mr-2 h-4 w-4" /> Create New Poll
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Your Polls</h2>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
              <p className="text-destructive">{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchMyPolls}>
                Try Again
              </Button>
            </div>
          ) : polls.length === 0 ? (
            <div className="text-center py-10 glassmorphism rounded-lg p-8">
              <p className="text-muted-foreground mb-4">You haven't created any polls yet.</p>
              <Button asChild className="bg-primary text-white hover:bg-primary/90">
                <Link href="/admin/create">
                  <Plus className="mr-2 h-4 w-4" /> Create Your First Poll
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {polls.map((poll) => (
                <Card key={poll._id} className="glassmorphism">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{poll.title}</h3>
                          <Badge
                            variant={poll.isActive ? "default" : "secondary"}
                            className={poll.isActive ? "bg-accent text-accent-foreground" : ""}
                          >
                            {poll.isActive ? "Active" : "Ended"}
                          </Badge>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span>{poll.totalVotes} votes</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarClock className="h-4 w-4" />
                            <span>Ends: {formatDate(poll.deadline)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 self-end md:self-center">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/polls/${poll._id}`}>View</Link>
                        </Button>

                        {poll.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive text-destructive hover:bg-destructive/10"
                            onClick={() => handleClosePoll(poll._id)}
                            disabled={actionInProgress === poll._id}
                          >
                            {actionInProgress === poll._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Close Poll"
                            )}
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeletePoll(poll._id)}
                          disabled={actionInProgress === poll._id}
                        >
                          {actionInProgress === poll._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
