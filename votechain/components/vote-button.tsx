"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/context/wallet-context"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/services/api"

interface VoteButtonProps {
  pollId: string
  optionIndex: number
  disabled?: boolean
  onVoteSuccess?: () => void
}

export function VoteButton({ pollId, optionIndex, disabled = false, onVoteSuccess }: VoteButtonProps) {
  const [isVoting, setIsVoting] = useState(false)
  const { connected, walletAddress } = useWallet()
  const { toast } = useToast()
  const api = useApi()

  const handleVote = async () => {
    if (!connected || !walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to vote",
        variant: "destructive",
      })
      return
    }

    setIsVoting(true)

    try {
      const result = await api.votes.cast(pollId, optionIndex)

      toast({
        title: "Vote submitted!",
        description: (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-1">Transaction Hash:</p>
            <p className="text-xs font-mono bg-secondary p-1 rounded overflow-x-auto">{result.data.txHash}</p>
          </div>
        ),
      })

      onVoteSuccess?.()
    } catch (error: any) {
  // Try to get the error message from backend response JSON
  const message =
    error?.response?.data?.error ||  // <-- This is the backend error string, e.g. "You have already voted in this poll"
    error?.message ||               // fallback to error.message
    "Please try again later"        // fallback default

  toast({
    title: "Error submitting vote",
    description: message,
    variant: "destructive",
  })
}
finally {
      setIsVoting(false)
    }
  }

  return (
    <Button
      onClick={handleVote}
      disabled={disabled || isVoting || !connected}
      className="w-full bg-accent hover:bg-accent/80 text-accent-foreground accent-border"
    >
      {isVoting ? "Processing..." : "Vote"}
    </Button>
  )
}
