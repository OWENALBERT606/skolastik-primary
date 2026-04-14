import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, FileText, UserCheck, AlertCircle } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "report",
    title: "Term 1 Report Cards Generated",
    description: "Report cards for P.1 - P.3 classes have been generated and are ready for review.",
    time: "2 hours ago",
    status: "completed",
    icon: FileText,
  },
  {
    id: 2,
    type: "attendance",
    title: "Attendance Alert",
    description: "Low attendance detected in S.2 Mathematics class (68% today).",
    time: "4 hours ago",
    status: "warning",
    icon: AlertCircle,
  },
  {
    id: 3,
    type: "exam",
    title: "Midterm Exams Scheduled",
    description: "Midterm examinations for all classes scheduled for next week.",
    time: "1 day ago",
    status: "pending",
    icon: UserCheck,
  },
  {
    id: 4,
    type: "system",
    title: "New Teacher Registration",
    description: "Ms. Sarah Johnson has been added as English teacher for S.1 and S.2.",
    time: "2 days ago",
    status: "completed",
    icon: UserCheck,
  },
]

const statusColors = {
  completed: "bg-chart-1 text-white",
  warning: "bg-chart-3 text-white",
  pending: "bg-chart-2 text-white",
}

export function RecentActivity() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="flex-shrink-0">
              <activity.icon className="h-5 w-5 text-muted-foreground mt-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-card-foreground text-pretty">{activity.title}</h4>
                <Badge className={`text-xs ${statusColors[activity.status as keyof typeof statusColors]}`}>
                  {activity.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground text-pretty mb-2">{activity.description}</p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
