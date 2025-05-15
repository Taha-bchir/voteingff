"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface PhantomWallet {
  isPhantom?: boolean
  connect: () => Promise<{ publicKey: { toString: () => string } }>
  disconnect: () => Promise<void>
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>
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
  token: string | null
}

const WalletContext = createContext<WalletContextType>({
  wallet: null,
  connected: false,
  walletAddress: null,
  connecting: false,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  isAdmin: false,
  token: null,
})

export const useWallet = () => useContext(WalletContext)

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<PhantomWallet | null>(null)
  const [connected, setConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  // Check if token exists in localStorage on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem("votechain_token")
    const storedWallet = localStorage.getItem("votechain_wallet")
    const storedIsAdmin = localStorage.getItem("votechain_is_admin") === "true"

    if (storedToken && storedWallet) {
      setToken(storedToken)
      setWalletAddress(storedWallet)
      setConnected(true)
      setIsAdmin(storedIsAdmin)
    }
  }, [])

  useEffect(() => {
    const loadPhantom = async () => {
      // Check if Phantom is installed
      const solana = (window as any).solana

      if (solana?.isPhantom) {
        setWallet(solana)

        // Check if already connected
        if (solana.isConnected && solana.publicKey) {
          const address = solana.publicKey.toString()

          // If the wallet address has changed, update it
          if (walletAddress !== address) {
            setWalletAddress(address)

            // Clear previous authentication if wallet changed
            if (walletAddress && walletAddress !== address) {
              setToken(null)
              setIsAdmin(false)
              localStorage.removeItem("votechain_token")
              localStorage.removeItem("votechain_wallet")
              localStorage.removeItem("votechain_is_admin")
            }

            // If we have an address but no token, try to authenticate
            if (!token) {
              try {
                await authenticateWallet(solana, address)
              } catch (error) {
                console.error("Failed to authenticate wallet:", error)
              }
            }
          }
        }

        // Listen for connection events
        solana.on("connect", async (publicKey: any) => {
          const address = publicKey.toString()
          setWalletAddress(address)
          setConnecting(false)

          try {
            await authenticateWallet(solana, address)
          } catch (error) {
            console.error("Failed to authenticate wallet:", error)
          }
        })

        // Listen for disconnect events
        solana.on("disconnect", () => {
          setConnected(false)
          setWalletAddress(null)
          setIsAdmin(false)
          setToken(null)
          localStorage.removeItem("votechain_token")
          localStorage.removeItem("votechain_wallet")
          localStorage.removeItem("votechain_is_admin")
        })

        // Listen for account change events
        solana.on("accountChanged", async (publicKey: any) => {
          if (publicKey) {
            const newAddress = publicKey.toString()

            // If the wallet address has changed, update authentication
            if (walletAddress !== newAddress) {
              setWalletAddress(newAddress)
              setToken(null)
              setIsAdmin(false)
              localStorage.removeItem("votechain_token")
              localStorage.removeItem("votechain_wallet")
              localStorage.removeItem("votechain_is_admin")

              try {
                await authenticateWallet(solana, newAddress)
              } catch (error) {
                console.error("Failed to authenticate new wallet:", error)
              }
            }
          } else {
            // No public key means disconnected
            setConnected(false)
            setWalletAddress(null)
            setIsAdmin(false)
            setToken(null)
            localStorage.removeItem("votechain_token")
            localStorage.removeItem("votechain_wallet")
            localStorage.removeItem("votechain_is_admin")
          }
        })
      }
    }

    // Only run in browser environment
    if (typeof window !== "undefined") {
      loadPhantom()
    }

    return () => {
      // Cleanup listeners if needed
      const solana = (window as any).solana
      if (solana?.isPhantom) {
        solana.removeAllListeners("connect")
        solana.removeAllListeners("disconnect")
        solana.removeAllListeners("accountChanged")
      }
    }
  }, [walletAddress, token])

  const authenticateWallet = async (wallet: PhantomWallet, address: string) => {
    try {
      // Step 1: Get a nonce from the server
      const nonceResponse = await fetch(`${API_URL}/auth/nonce`)
      const nonceData = await nonceResponse.json()

      if (!nonceData.success) {
        throw new Error("Failed to get nonce")
      }

      const nonce = nonceData.nonce
      const message = `Sign this message to authenticate with VoteChain: ${nonce}`

      // Step 2: Sign the message with the wallet
      const encodedMessage = new TextEncoder().encode(message)
      const signedMessage = await wallet.signMessage(encodedMessage)

      // Step 3: Send the signature to the server to verify and get a token
      const verifyResponse = await fetch(`${API_URL}/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: address,
          signature: Array.from(signedMessage.signature),
          message,
        }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyData.success) {
        throw new Error("Failed to verify wallet signature")
      }

      // Step 4: Store the token and set the state
      setToken(verifyData.token)
      setIsAdmin(verifyData.isAdmin)
      setConnected(true)

      // Store in localStorage for persistence
      localStorage.setItem("votechain_token", verifyData.token)
      localStorage.setItem("votechain_wallet", address)
      localStorage.setItem("votechain_is_admin", verifyData.isAdmin.toString())

      return verifyData
    } catch (error) {
      console.error("Authentication error:", error)
      throw error
    }
  }

  const connectWallet = async () => {
    if (wallet) {
      try {
        setConnecting(true)
        await wallet.connect()
        // Authentication will be handled by the connect event listener
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
        setToken(null)
        localStorage.removeItem("votechain_token")
        localStorage.removeItem("votechain_wallet")
        localStorage.removeItem("votechain_is_admin")
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
        token,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
