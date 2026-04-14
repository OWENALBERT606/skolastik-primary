import { GraduationCap, Bell, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

export function DashboardHeader({school}:{school:any}) {
  return (
    <header className="bg-primary text-primary-foreground shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
           {/* <Image src={school.logo} width={40} alt='schoolLogo' height={40}/> */}
            <div>
              <h1 className="text-xl font-bold text-balance">{school.name}</h1>
              <p className="text-sm opacity-90">Academic Year 2024/2025 • Term 1</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
              <Badge variant="secondary" className="ml-2 bg-accent text-accent-foreground">
                3
              </Badge>
            </Button>
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
              <User className="h-4 w-4 mr-2" />
              Admin Profile
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
