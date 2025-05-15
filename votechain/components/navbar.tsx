"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Vote, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useWallet } from "@/context/wallet-context"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { connected, walletAddress, connectWallet, disconnectWallet, connecting, isAdmin } = useWallet()

  // Ensure theme toggle only renders after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const formatWalletAddress = (address: string) => {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`
  }

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Active Polls", path: "/polls" },
    ...(isAdmin ? [{ name: "Admin Dashboard", path: "/admin" }] : []),
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glassmorphism bg-opacity-30 backdrop-blur-md border-b border-primary/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Vote className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold neon-text">VoteChain</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.path ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={closeMobileMenu}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}

            {/* Wallet Connection */}
            {connected ? (
              <div className="flex items-center space-x-2">
                <span className="hidden md:inline text-sm text-muted-foreground">
                  {walletAddress && formatWalletAddress(walletAddress)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnectWallet}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                disabled={connecting}
                className="bg-primary text-white hover:bg-primary/90 neon-border"
              >
                {connecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden glassmorphism">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.path ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={closeMobileMenu}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
