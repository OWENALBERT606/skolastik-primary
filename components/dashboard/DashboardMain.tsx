import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, BookOpen, Download, Eye, FileText, MessageCircle, PenTool } from "lucide-react"

const metrics = [
  {
    title: "Total Site Visits",
    value: "45,892",
    change: {
      value: "18.2%",
      trend: "up" as const,
      today: "+2,341 today",
    },
    color: "bg-blue-500",
  },
  {
    title: "Total Users",
    value: "12,456",
    change: {
      value: "15.3%",
      trend: "up" as const,
      today: "+189 today",
    },
    color: "bg-green-500",
  },
  {
    title: "Total Comments",
    value: "8,234",
    change: {
      value: "7.8%",
      trend: "up" as const,
      today: "+67 today",
    },
    color: "bg-blue-500",
  },
  {
    title: "Engagement Rate",
    value: "24.7%",
    change: {
      value: "3.2%",
      trend: "up" as const,
      today: "+0.8% today",
    },
    color: "bg-orange-500",
  },
]

const recentActivity = [
  {
    reader: "Alexandra Smith",
    email: "alex.smith@example.com",
    action: "Commented on",
    content: "Political Reform Article",
    time: "5 min ago",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    reader: "David Johnson",
    email: "d.johnson@example.com",
    action: "Liked",
    content: "Nosigaki: Leadership Insights",
    time: "12 min ago",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    reader: "Maria Garcia",
    email: "maria.g@example.com",
    action: "Shared",
    content: "Mpomurro: Economic Policy",
    time: "18 min ago",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

const topContent = [
  {
    title: "The Future of Digital Governance",
    type: "Blog Post",
    views: 12340,
    comments: 89,
    image: "/governance-article-thumbnail.png",
  },
  {
    title: "Leadership in Crisis",
    type: "Nosigaki",
    views: 9876,
    comments: 67,
    image: "/leadership-article-thumbnail.png",
  },
  {
    title: "Economic Recovery Strategies",
    type: "Mpomurro",
    views: 8543,
    comments: 54,
    image: "/economics-article-thumbnail.png",
  },
]

const bigCards = [
  {
    title: "Total Blog Posts",
    value: "127",
    change: "+8 this month",
    trend: "up",
    icon: BookOpen,
  },
  {
    title: "Total Nosigaki Articles",
    value: "43",
    change: "+3 this month",
    trend: "up",
    icon: PenTool,
  },
  {
    title: "Total Mpomurro Articles",
    value: "38",
    change: "+2 this month",
    trend: "up",
    icon: FileText,
  },
  {
    title: "Total Site Visits",
    value: "45,892",
    change: "+18.2%",
    trend: "up",
    icon: Eye,
  },
]

export default function DashboardMain() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Content Dashboard</h1>
            <p className="text-muted-foreground">Track your content performance and audience engagement.</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select defaultValue="7d">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Analytics
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-6">
          {/* Big Cards - 4 cards in a row */}
          {bigCards.map((card, index) => (
            <Card key={index} className="col-span-3 relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className={`flex items-center text-sm ${card.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                  {card.change}
                  <ArrowRight className="mr-1 h-4 w-4" />
                </div>
              </CardContent>
              <div className="absolute right-0 bottom-0 opacity-5">
                <card.icon className="h-24 w-24 text-primary" />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Recent Activity Table */}
          <Card className="col-span-8">
            <CardHeader>
              <CardTitle>Recent Reader Activity</CardTitle>
              <CardDescription>Latest interactions with your content</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reader</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.map((activity) => (
                    <TableRow key={activity.email}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={activity.avatar || "/placeholder.svg"} alt={activity.reader} />
                            <AvatarFallback>
                              {activity.reader
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{activity.reader}</div>
                            <div className="text-sm text-muted-foreground">{activity.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                          ${
                            activity.action === "Commented on"
                              ? "bg-blue-100 text-blue-800"
                              : activity.action === "Liked"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {activity.action}
                        </div>
                      </TableCell>
                      <TableCell>{activity.content}</TableCell>
                      <TableCell className="text-right">{activity.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Performing Content */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <CardDescription>Most viewed articles and posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {topContent.map((content, index) => (
                  <div key={index} className="flex items-center">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={content.image || "/placeholder.svg"} alt={content.title} />
                      <AvatarFallback>
                        {content.type === "Blog Post" ? "B" : content.type === "Nosigaki" ? "N" : "M"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{content.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {content.type} • {content.views.toLocaleString()} views
                      </p>
                    </div>
                    <div className="ml-auto text-sm font-medium flex items-center">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      {content.comments}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
