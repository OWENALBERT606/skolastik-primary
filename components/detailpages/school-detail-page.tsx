import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  UserCheck,
  Building2,
  Clock,
  ExternalLink,
} from "lucide-react"

interface SchoolData {
  id: string
  name: string
  motto?: string
  slug: string
  address?: string
  contact?: string
  contact2?: string
  contact3?: string
  email?: string
  email2?: string
  website?: string
  logo?: string
  isActive: boolean
  adminId: string
  createdAt: Date
  updatedAt: Date
  stats: {
    totalStudents: number
    totalTeachers: number
    totalClasses: number
    totalParents: number
    activeAcademicYears: number
  }
  academicYears: Array<{
    id: string
    year: string
    isActive: boolean
    terms: Array<{
      id: string
      name: string
      startDate: Date
      endDate: Date
      isActive: boolean
    }>
  }>
}

interface SchoolDetailsPageProps {
  school: SchoolData
}

export function SchoolDetailsPage({ school }: {school:any}) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  const currentAcademicYear = school.academicYears.find((year:any) => year.isActive)
  const activeTerm = currentAcademicYear?.terms.find((term:any) => term.isActive)

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-20 w-20 md:h-24 md:w-24">
              <AvatarImage src={school.logo || "/placeholder.svg"} alt={`${school.name} logo`} />
              <AvatarFallback className="text-2xl font-bold">
                {school.name
                  .split(" ")
                  .map((word:any) => word[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-balance">{school.name}</h1>
                <Badge variant={school.isActive ? "default" : "secondary"}>
                  {school.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              {school.motto && (
                <p className="text-lg text-muted-foreground italic mb-4 text-pretty">"{school.motto}"</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span>Est. {formatDate(school.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Updated {formatDate(school.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Statistics Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  School Statistics
                </CardTitle>
                <CardDescription>Overview of current enrollment and staff</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {school.students.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{school.teachers.length}</div>
                    <div className="text-sm text-muted-foreground">Teachers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{school.classes.length}</div>
                    <div className="text-sm text-muted-foreground">Classes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {school.parents.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Parents</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Year Information */}
            {/* <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Academic Year {currentAcademicYear?.year}
                </CardTitle>
                <CardDescription>Current academic year and term information</CardDescription>
              </CardHeader>
              <CardContent>
                {currentAcademicYear ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Academic Year:</span>
                      <Badge variant="outline">{currentAcademicYear.year}</Badge>
                    </div>

                    {activeTerm && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-3">Current Term: {activeTerm.name}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Start Date:</span>
                              <div className="font-medium">{formatDate(activeTerm.startDate)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">End Date:</span>
                              <div className="font-medium">{formatDate(activeTerm.endDate)}</div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">All Terms</h4>
                      <div className="space-y-2">
                        {currentAcademicYear.terms.map((term:any) => (
                          <div key={term.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <div className="font-medium">{term.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(term.startDate)} - {formatDate(term.endDate)}
                              </div>
                            </div>
                            <Badge variant={term.isActive ? "default" : "secondary"}>
                              {term.isActive ? "Active" : "Upcoming"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No active academic year found.</p>
                )}
              </CardContent>
            </Card> */}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start bg-transparent">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Manage Students
                  </Button>
                  <Button variant="outline" className="justify-start bg-transparent">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Teachers
                  </Button>
                  <Button variant="outline" className="justify-start bg-transparent">
                    <BookOpen className="h-4 w-4 mr-2" />
                    View Classes
                  </Button>
                  <Button variant="outline" className="justify-start bg-transparent">
                    <Calendar className="h-4 w-4 mr-2" />
                    Academic Calendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {school.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="font-medium">Address</div>
                      <div className="text-muted-foreground text-pretty">{school.address}</div>
                    </div>
                  </div>
                )}

                {(school.contact || school.contact2 || school.contact3) && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="font-medium">Phone Numbers</div>
                      <div className="space-y-1">
                        {school.contact && <div className="text-muted-foreground">{school.contact}</div>}
                        {school.contact2 && <div className="text-muted-foreground">{school.contact2}</div>}
                        {school.contact3 && <div className="text-muted-foreground">{school.contact3}</div>}
                      </div>
                    </div>
                  </div>
                )}

                {(school.email || school.email2) && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="font-medium">Email Addresses</div>
                      <div className="space-y-1">
                        {school.email && <div className="text-muted-foreground">{school.email}</div>}
                        {school.email2 && <div className="text-muted-foreground">{school.email2}</div>}
                      </div>
                    </div>
                  </div>
                )}

                {school.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="font-medium">Website</div>
                      <a
                        href={school.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {school.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* School Information */}
            <Card>
              <CardHeader>
                <CardTitle>School Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">School ID:</span>
                  <span className="text-sm font-mono">{school.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Slug:</span>
                  <span className="text-sm font-mono">{school.slug}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={school.isActive ? "default" : "secondary"} className="text-xs">
                    {school.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Admin ID:</span>
                  <span className="text-sm font-mono">{school.adminId}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
