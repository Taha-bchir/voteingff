"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/context/wallet-context"
import { useToast } from "@/hooks/use-toast"

interface VoteButtonProps {
  pollId: string
  optionId: string
  disabled?: boolean
}

export function VoteButton({ pollId, optionId, disabled = false }: VoteButtonProps) {
  const [isVoting, setIsVoting] = useState(false)
  const { connected, walletAddress } = useWallet()
  const { toast } = useToast()

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
      // Simulate API call to vote
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulate transaction hash
      const txHash = Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")

      toast({
        title: "Vote submitted!",
        description: (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-1">Transaction Hash:</p>
            <p className="text-xs font-mono bg-secondary p-1 rounded overflow-x-auto">{txHash}</p>
          </div>
        ),
      })

      // Reload the page to reflect the new vote
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      toast({
        title: "Error submitting vote",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
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
