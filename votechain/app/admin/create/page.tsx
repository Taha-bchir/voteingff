"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Starfield } from "@/components/ui/starfield"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CalendarIcon, Plus, X, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useWallet } from "@/context/wallet-context"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/services/api"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export default function CreatePollPage() {
  const router = useRouter()
  const { isAdmin, connected } = useWallet()
  const { toast } = useToast()
  const api = useApi()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState<string[]>(["", ""])
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const addOption = () => {
    setOptions([...options, ""])
  }

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast({
        title: "Cannot Remove",
        description: "A poll must have at least two options",
        variant: "destructive",
      })
      return
    }

    const newOptions = [...options]
    newOptions.splice(index, 1)
    setOptions(newOptions)
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please provide a title for the poll",
        variant: "destructive",
      })
      return
    }

    if (!description.trim()) {
      toast({
        title: "Missing Description",
        description: "Please provide a description for the poll",
        variant: "destructive",
      })
      return
    }

    if (!date) {
      toast({
        title: "Missing Deadline",
        description: "Please select a deadline for the poll",
        variant: "destructive",
      })
      return
    }

    if (options.some((option) => !option.trim())) {
      toast({
        title: "Empty Options",
        description: "All options must have content",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Format options for API
      const formattedOptions = options.map((text) => ({ text }))

      // Create poll data
      const pollData = {
        title,
        description,
        options: formattedOptions,
        deadline: date.toISOString(),
      }

      // Submit to API
      const response = await api.polls.create(pollData)

      if (response.success) {
        toast({
          title: "Poll Created",
          description: "Your poll has been successfully created",
        })

        // Redirect to admin dashboard
        router.push("/admin")
      } else {
        toast({
          title: "Error",
          description: "Failed to create poll. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create poll. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
        <Card className="max-w-3xl mx-auto glassmorphism">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Create New Poll</CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Poll Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter poll title"
                  className="glassmorphism"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about this poll"
                  className="min-h-[100px] glassmorphism"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal glassmorphism",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Select deadline date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Poll Options</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="text-primary border-primary hover:bg-primary/10"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Option
                  </Button>
                </div>

                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="glassmorphism"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/admin")}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-white hover:bg-primary/90 neon-border"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Poll"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  )
}
