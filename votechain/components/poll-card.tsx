import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarClock, Users } from "lucide-react"

interface PollOption {
  text: string
  votes?: number
}

interface PollCardProps {
  id: string
  title: string
  options: PollOption[]
  totalVotes: number
  deadline: string
  isActive: boolean
}

export function PollCard({ id, title, options, totalVotes, deadline, isActive }: PollCardProps) {
  // Format the deadline date
  const formattedDeadline = new Date(deadline).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Link href={`/polls/${id}`}>
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] glassmorphism">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-bold line-clamp-2">{title}</CardTitle>
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={isActive ? "bg-accent text-accent-foreground" : ""}
            >
              {isActive ? "Active" : "Ended"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {options && options.length > 0
              ? `Options: ${options
                  .map((opt) => opt.text)
                  .join(", ")
                  .substring(0, 100)}${options.map((opt) => opt.text).join(", ").length > 100 ? "..." : ""}`
              : "No options available"}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between text-xs text-muted-foreground pt-2">
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{totalVotes} votes</span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            <span>{formattedDeadline}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
