import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Users, Calendar, BarChart3, Settings, UserCheck, BookOpen, ClipboardCheck } from "lucide-react"
import Link from "next/link"

const actions = [
  {
    title: "Generate Reports",
    description: "Create new report cards",
    icon: FileText,
    color: "bg-primary text-primary-foreground hover:bg-primary/90",
    href: "/reports",
  },
  {
    title: "Add Student",
    description: "Register new student",
    icon: Plus,
    color: "bg-accent text-accent-foreground hover:bg-accent/90",
  },
  {
    title: "Schedule Exam",
    description: "Create new examination",
    icon: Calendar,
    color: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    href: "/assessments",
  },
  {
    title: "Academic Years",
    description: "Manage years and terms",
    icon: Calendar,
    color: "bg-muted text-muted-foreground hover:bg-muted/80",
    href: "/academic-years",
  },
  {
    title: "Manage Classes",
    description: "Edit class information",
    icon: Users,
    color: "bg-muted text-muted-foreground hover:bg-muted/80",
    href: "/classes",
  },
  {
    title: "Parent Registration",
    description: "Register and manage parents",
    icon: UserCheck,
    color: "bg-muted text-muted-foreground hover:bg-muted/80",
    href: "/parents",
  },
  {
    title: "Subject Assignment",
    description: "Assign subjects to classes",
    icon: BookOpen,
    color: "bg-muted text-muted-foreground hover:bg-muted/80",
    href: "/subjects",
  },
  {
    title: "Assessment Management",
    description: "Manage BOT/MID/END exams",
    icon: ClipboardCheck,
    color: "bg-muted text-muted-foreground hover:bg-muted/80",
    href: "/assessments",
  },
  {
    title: "View Analytics",
    description: "Detailed performance data",
    icon: BarChart3,
    color: "bg-muted text-muted-foreground hover:bg-muted/80",
  },
  {
    title: "System Settings",
    description: "Configure school settings",
    icon: Settings,
    color: "bg-muted text-muted-foreground hover:bg-muted/80",
  },
]

export function QuickActions() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) =>
          action.href ? (
            <Link href={action.href} key={action.title}>
              <Button variant="ghost" className={`w-full justify-start h-auto p-3 ${action.color}`}>
                <action.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm text-pretty">{action.title}</div>
                  <div className="text-xs opacity-80 text-pretty">{action.description}</div>
                </div>
              </Button>
            </Link>
          ) : (
            <Button key={action.title} variant="ghost" className={`w-full justify-start h-auto p-3 ${action.color}`}>
              <action.icon className="h-4 w-4 mr-3 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium text-sm text-pretty">{action.title}</div>
                <div className="text-xs opacity-80 text-pretty">{action.description}</div>
              </div>
            </Button>
          ),
        )}
      </CardContent>
    </Card>
  )
}
