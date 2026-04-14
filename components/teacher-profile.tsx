"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Briefcase,
  FileText,
  Heart,
  Edit,
  Download,
  BookOpen,
  Award,
  Clock,
} from "lucide-react"

interface Teacher {
  id: string
  staffNo: string
  firstName: string
  lastName: string
  gender: string
  dateOfBirth: Date
  nationality?: string
  nationalId?: string
  maritalStatus?: string
  phone: string
  email: string
  address?: string
  emergencyContactName?: string
  emergencyRelationship: string
  emergencyPhone?: string
  emergencyEmail?: string
  qualification?: string
  specialization?: string
  teachingLevel?: string
  experienceYears?: number
  previousSchools: string[]
  dateOfHire: Date
  employmentType: string
  role: string
  status: string
  highestQualification?: string
  institutionAttended?: string
  professionalTraining?: string
  ongoingStudies?: string
  profilePhoto?: string
  documents?: string
  healthInfo?: string
  schoolId: string
  subjects: string[]
  createdAt: Date
  updatedAt: Date
}

interface TeacherProfileProps {
  teacher: Teacher
}

export function TeacherProfile({ teacher }: TeacherProfileProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-primary text-primary-foreground"
      case "LEAVE":
        return "bg-secondary text-secondary-foreground"
      case "RESIGNED":
        return "bg-destructive text-destructive-foreground"
      case "RETIRED":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calculateAge = (birthDate: Date) => {
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1
    }
    return age
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-muted rounded-lg p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
            <AvatarImage
              src={teacher.profilePhoto || "/placeholder.svg"}
              alt={`${teacher.firstName} ${teacher.lastName}`}
            />
            <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
              {teacher.firstName[0]}
              {teacher.lastName[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-balance">
                {teacher.firstName} {teacher.lastName}
              </h1>
              <p className="text-xl text-muted-foreground">{teacher.role}</p>
              <p className="text-sm text-muted-foreground">Staff ID: {teacher.staffNo}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={getStatusColor(teacher.status)}>{teacher.status}</Badge>
              <Badge variant="outline">{teacher.employmentType}</Badge>
              <Badge variant="outline">{teacher.experienceYears} years experience</Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="font-medium">
                    {teacher.firstName} {teacher.lastName}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Gender</p>
                  <p className="font-medium">{teacher.gender}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {formatDate(teacher.dateOfBirth)} (Age {calculateAge(teacher.dateOfBirth)})
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Nationality</p>
                  <p className="font-medium">{teacher.nationality || "Not specified"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">National ID</p>
                  <p className="font-medium">{teacher.nationalId || "Not specified"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Marital Status</p>
                  <p className="font-medium">{teacher.maritalStatus || "Not specified"}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{teacher.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{teacher.email}</span>
                </div>
                {teacher.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <span className="font-medium">{teacher.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Professional Qualifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Professional Qualifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Highest Qualification</p>
                  <p className="font-medium">{teacher.highestQualification || "Not specified"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Institution</p>
                  <p className="font-medium">{teacher.institutionAttended || "Not specified"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Specialization</p>
                  <p className="font-medium">{teacher.specialization || "Not specified"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Teaching Level</p>
                  <p className="font-medium">{teacher.teachingLevel || "Not specified"}</p>
                </div>
              </div>

              {teacher.professionalTraining && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Professional Training</p>
                    <p className="font-medium">{teacher.professionalTraining}</p>
                  </div>
                </>
              )}

              {teacher.ongoingStudies && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Ongoing Studies</p>
                    <p className="font-medium">{teacher.ongoingStudies}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Current Role</p>
                  <p className="font-medium">{teacher.role}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Employment Type</p>
                  <p className="font-medium">{teacher.employmentType}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Date of Hire</p>
                  <p className="font-medium">{formatDate(teacher.dateOfHire)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Experience</p>
                  <p className="font-medium">{teacher.experienceYears} years</p>
                </div>
              </div>

              {teacher.previousSchools.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Previous Schools</p>
                    <div className="flex flex-wrap gap-2">
                      {teacher.previousSchools.map((school, index) => (
                        <Badge key={index} variant="secondary">
                          {school}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Subjects Taught */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Subjects Taught
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {teacher.subjects.map((subject, index) => (
                  <Badge key={index} className="bg-primary text-primary-foreground">
                    {subject}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <Heart className="h-5 w-5" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {teacher.emergencyContactName && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Name</p>
                  <p className="font-medium">{teacher.emergencyContactName}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Relationship</p>
                <p className="font-medium">{teacher.emergencyRelationship}</p>
              </div>
              {teacher.emergencyPhone && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Phone</p>
                  <p className="font-medium">{teacher.emergencyPhone}</p>
                </div>
              )}
              {teacher.emergencyEmail && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Email</p>
                  <p className="font-medium">{teacher.emergencyEmail}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {teacher.documents && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Available Documents</p>
                  <p className="font-medium">{teacher.documents}</p>
                </div>
              )}

              {teacher.healthInfo && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Health Information</p>
                    <p className="font-medium">{teacher.healthInfo}</p>
                  </div>
                </>
              )}

              <Button variant="outline" className="w-full bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Download All Documents
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Years at School</span>
                <span className="font-bold text-lg">{new Date().getFullYear() - teacher.dateOfHire.getFullYear()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Experience</span>
                <span className="font-bold text-lg">{teacher.experienceYears}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subjects</span>
                <span className="font-bold text-lg">{teacher.subjects.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Age</span>
                <span className="font-bold text-lg">{calculateAge(teacher.dateOfBirth)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Record Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Record Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(teacher.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-sm">{formatDate(teacher.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
