"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface PhantomWallet {
  isPhantom?: boolean
  connect: () => Promise<{ publicKey: { toString: () => string } }>
  disconnect: () => Promise<void>
  on: (event: string, callback: (...args: any[]) => void) => void
  isConnected: boolean
  publicKey?: { toString: () => string }
}

interface WalletContextType {
  wallet: PhantomWallet | null
  connected: boolean
  walletAddress: string | null
  connecting: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => Promise<void>
  isAdmin: boolean
}

const WalletContext = createContext<WalletContextType>({
  wallet: null,
  connected: false,
  walletAddress: null,
  connecting: false,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  isAdmin: false,
})

export const useWallet = () => useContext(WalletContext)

// Admin wallet address for testing
const ADMIN_WALLET_ADDRESS = "8YLKoCu7NwqHNS8GzuvA2ibsvLrsg22YMfMDafxh1B7P"

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<PhantomWallet | null>(null)
  const [connected, setConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const loadPhantom = async () => {
      // Check if Phantom is installed
      const solana = (window as any).solana

      if (solana?.isPhantom) {
        setWallet(solana)

        // Check if already connected
        if (solana.isConnected) {
          const address = solana.publicKey.toString()
          setConnected(true)
          setWalletAddress(address)
          setIsAdmin(address === ADMIN_WALLET_ADDRESS)
        }

        // Listen for connection events
        solana.on("connect", () => {
          const address = solana.publicKey.toString()
          setConnected(true)
          setWalletAddress(address)
          setIsAdmin(address === ADMIN_WALLET_ADDRESS)
          setConnecting(false)
        })

        // Listen for disconnect events
        solana.on("disconnect", () => {
          setConnected(false)
          setWalletAddress(null)
          setIsAdmin(false)
        })
      }
    }

    // Only run in browser environment
    if (typeof window !== "undefined") {
      loadPhantom()
    }

    return () => {
      // Cleanup listeners if needed
    }
  }, [])

  const connectWallet = async () => {
    if (wallet) {
      try {
        setConnecting(true)
        await wallet.connect()
      } catch (error) {
        console.error("Failed to connect wallet:", error)
        setConnecting(false)
      }
    } else {
      // Phantom is not installed
      window.open("https://phantom.app/", "_blank")
    }
  }

  const disconnectWallet = async () => {
    if (wallet) {
      try {
        await wallet.disconnect()
        setConnected(false)
        setWalletAddress(null)
        setIsAdmin(false)
      } catch (error) {
        console.error("Failed to disconnect wallet:", error)
      }
    }
  }

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connected,
        walletAddress,
        connecting,
        connectWallet,
        disconnectWallet,
        isAdmin,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
