




// components/dialogs/teacher-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dropzone, FileWithMetadata } from "@/components/ui/dropzone";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { createTeacherWithUser, updateTeacher } from "@/actions/teachers";
import { toast } from "sonner";

type TeacherDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId?: string;
  initialData?: any;
  schoolId: string;
};

export default function TeacherDialog({
  open,
  onOpenChange,
  editingId,
  initialData,
  schoolId,
}: TeacherDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("personal");
  const [photoFiles, setPhotoFiles] = useState<FileWithMetadata[]>();
  const [docFiles, setDocFiles] = useState<FileWithMetadata[]>();

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    nationality: "",
    maritalStatus: "",
    nationalId: "",
    address: "",
    phone: "",
    email: "",
    password: "",
    emergencyContactName: "",
    emergencyRelationship: "",
    emergencyPhone: "",
    emergencyEmail: "",
    qualification: "",
    specialization: "",
    teachingLevel: "",
    experienceYears: "",
    role: "",
    dateOfHire: "",
    employmentType: "",
    status: "ACTIVE",
    highestQualification: "",
    institutionAttended: "",
    previousSchools: "",
    healthInfo: "",
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && initialData) {
      setFormData({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        gender: initialData.gender || "",
        dateOfBirth: initialData.dateOfBirth || "",
        nationality: initialData.nationality || "",
        maritalStatus: initialData.maritalStatus || "",
        nationalId: initialData.nationalId || "",
        address: initialData.address || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        password: "",
        emergencyContactName: initialData.emergencyContactName || "",
        emergencyRelationship: initialData.emergencyRelationship || "",
        emergencyPhone: initialData.emergencyPhone || "",
        emergencyEmail: initialData.emergencyEmail || "",
        qualification: initialData.qualification || "",
        specialization: initialData.specialization || "",
        teachingLevel: initialData.teachingLevel || "",
        experienceYears: initialData.experienceYears?.toString() || "",
        role: initialData.role || "",
        dateOfHire: initialData.dateOfHire || "",
        employmentType: initialData.employmentType || "",
        status: initialData.status || "ACTIVE",
        highestQualification: initialData.highestQualification || "",
        institutionAttended: initialData.institutionAttended || "",
        previousSchools: initialData.previousSchools || "",
        healthInfo: initialData.healthInfo || "",
      });
    } else if (open && !initialData) {
      setFormData({
        firstName: "",
        lastName: "",
        gender: "",
        dateOfBirth: "",
        nationality: "",
        maritalStatus: "",
        nationalId: "",
        address: "",
        phone: "",
        email: "",
        password: "",
        emergencyContactName: "",
        emergencyRelationship: "",
        emergencyPhone: "",
        emergencyEmail: "",
        qualification: "",
        specialization: "",
        teachingLevel: "",
        experienceYears: "",
        role: "",
        dateOfHire: "",
        employmentType: "",
        status: "ACTIVE",
        highestQualification: "",
        institutionAttended: "",
        previousSchools: "",
        healthInfo: "",
      });
      setPhotoFiles(undefined);
      setDocFiles(undefined);
    }
    setCurrentTab("personal");
  }, [open, initialData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    // Required fields validation
    if (!formData.firstName?.trim()) {
      toast.error("First name is required");
      setCurrentTab("personal");
      return false;
    }
    if (!formData.lastName?.trim()) {
      toast.error("Last name is required");
      setCurrentTab("personal");
      return false;
    }
    if (!formData.gender) {
      toast.error("Gender is required");
      setCurrentTab("personal");
      return false;
    }
    if (!formData.dateOfBirth) {
      toast.error("Date of birth is required");
      setCurrentTab("personal");
      return false;
    }
    if (!formData.phone?.trim()) {
      toast.error("Phone number is required");
      setCurrentTab("contact");
      return false;
    }
    if (!formData.email?.trim()) {
      toast.error("Email is required");
      setCurrentTab("contact");
      return false;
    }
    if (!editingId && !formData.password?.trim()) {
      toast.error("Password is required for new teachers");
      setCurrentTab("contact");
      return false;
    }
    if (!formData.role?.trim()) {
      toast.error("Role is required");
      setCurrentTab("professional");
      return false;
    }
    if (!formData.employmentType) {
      toast.error("Employment type is required");
      setCurrentTab("professional");
      return false;
    }
    return true;
  };

  async function handleSubmit() {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const data: any = { ...formData };

      // Assign files
      if (photoFiles && photoFiles.length > 0) {
        data.profilePhoto = photoFiles[0]?.publicUrl || null;
      }
      if (docFiles && docFiles.length > 0) {
        data.documents = docFiles[0]?.publicUrl || null;
      }

      data.schoolId = schoolId;

      // Convert experience years to Int or null (never send empty string)
      data.experienceYears = data.experienceYears
        ? parseInt(data.experienceYears, 10) || null
        : null;

      // Convert previousSchools to array (always, even when empty)
      if (typeof data.previousSchools === "string") {
        data.previousSchools = data.previousSchools
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      }

      console.log("Submitting data:", data);

      const result = editingId
        ? await updateTeacher(editingId, data)
        : await createTeacherWithUser(data);

      if (result.ok) {
        toast.success(result.message || "Teacher saved successfully!");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.message || "Failed to save teacher");
      }
    } catch (error) {
      console.error("❌ Error saving teacher:", error);
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  }

  const tabs = ["personal", "contact", "professional", "documents"];
  const tabLabels = {
    personal: "Personal",
    contact: "Contact",
    professional: "Professional",
    documents: "Documents",
  };

  const goToNextTab = () => {
    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex < tabs.length - 1) {
      setCurrentTab(tabs[currentIndex + 1]);
    }
  };

  const goToPreviousTab = () => {
    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex > 0) {
      setCurrentTab(tabs[currentIndex - 1]);
    }
  };

  const isLastTab = currentTab === tabs[tabs.length - 1];
  const isFirstTab = currentTab === tabs[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">
            {editingId ? "Edit Teacher" : "Add New Teacher"}
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            {editingId
              ? "Update teacher information below"
              : "Fill in the details to register a new teacher"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-slate-600 dark:text-slate-400"
              >
                {tabLabels[tab as keyof typeof tabLabels]}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-slate-700 dark:text-slate-300">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Enter first name"
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-slate-700 dark:text-slate-300">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Enter last name"
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-slate-700 dark:text-slate-300">
                  Gender <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectItem value="male" className="dark:text-white dark:focus:bg-slate-700">Male</SelectItem>
                    <SelectItem value="female" className="dark:text-white dark:focus:bg-slate-700">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-slate-700 dark:text-slate-300">
                  Date of Birth <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality" className="text-slate-700 dark:text-slate-300">
                  Nationality
                </Label>
                <Select value={formData.nationality} onValueChange={(value) => handleInputChange("nationality", value)}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectItem value="Uganda" className="dark:text-white dark:focus:bg-slate-700">Uganda</SelectItem>
                    <SelectItem value="Kenya" className="dark:text-white dark:focus:bg-slate-700">Kenya</SelectItem>
                    <SelectItem value="Tanzania" className="dark:text-white dark:focus:bg-slate-700">Tanzania</SelectItem>
                    <SelectItem value="Rwanda" className="dark:text-white dark:focus:bg-slate-700">Rwanda</SelectItem>
                    <SelectItem value="Burundi" className="dark:text-white dark:focus:bg-slate-700">Burundi</SelectItem>
                    <SelectItem value="South Sudan" className="dark:text-white dark:focus:bg-slate-700">South Sudan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maritalStatus" className="text-slate-700 dark:text-slate-300">
                  Marital Status
                </Label>
                <Select value={formData.maritalStatus} onValueChange={(value) => handleInputChange("maritalStatus", value)}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectItem value="Single" className="dark:text-white dark:focus:bg-slate-700">Single</SelectItem>
                    <SelectItem value="Married" className="dark:text-white dark:focus:bg-slate-700">Married</SelectItem>
                    <SelectItem value="Divorced" className="dark:text-white dark:focus:bg-slate-700">Divorced</SelectItem>
                    <SelectItem value="Widowed" className="dark:text-white dark:focus:bg-slate-700">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationalId" className="text-slate-700 dark:text-slate-300">
                  National ID / Passport
                </Label>
                <Input
                  id="nationalId"
                  value={formData.nationalId}
                  onChange={(e) => handleInputChange("nationalId", e.target.value)}
                  placeholder="Enter ID number"
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-slate-700 dark:text-slate-300">
                  Address
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter address"
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </TabsContent>

          {/* Contact Information */}
          <TabsContent value="contact" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>

              {!editingId && (
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">
                    Password (for staff portal) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Enter password"
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This password will be used to login to the staff portal
                  </p>
                </div>
              )}
            </div>

            <div className="border-t dark:border-slate-700 pt-6 mt-6">
              <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">
                Emergency Contact
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName" className="text-slate-700 dark:text-slate-300">
                    Contact Name
                  </Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                    placeholder="Enter contact name"
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyRelationship" className="text-slate-700 dark:text-slate-300">
                    Relationship
                  </Label>
                  <Input
                    id="emergencyRelationship"
                    value={formData.emergencyRelationship}
                    onChange={(e) => handleInputChange("emergencyRelationship", e.target.value)}
                    placeholder="Enter relationship"
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone" className="text-slate-700 dark:text-slate-300">
                    Phone
                  </Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                    placeholder="Enter phone number"
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyEmail" className="text-slate-700 dark:text-slate-300">
                    Email
                  </Label>
                  <Input
                    id="emergencyEmail"
                    type="email"
                    value={formData.emergencyEmail}
                    onChange={(e) => handleInputChange("emergencyEmail", e.target.value)}
                    placeholder="Enter email address"
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Professional Information */}
          <TabsContent value="professional" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qualification" className="text-slate-700 dark:text-slate-300">
                  Qualification
                </Label>
                <Input
                  id="qualification"
                  value={formData.qualification}
                  onChange={(e) => handleInputChange("qualification", e.target.value)}
                  placeholder="Enter qualification"
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization" className="text-slate-700 dark:text-slate-300">
                  Specialization
                </Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => handleInputChange("specialization", e.target.value)}
                  placeholder="Enter specialization"
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teachingLevel" className="text-slate-700 dark:text-slate-300">
                  Teaching Level
                </Label>
                <Select value={formData.teachingLevel} onValueChange={(value) => handleInputChange("teachingLevel", value)}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select teaching level" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectItem value="primary" className="dark:text-white dark:focus:bg-slate-700">Primary</SelectItem>
                    <SelectItem value="secondary" className="dark:text-white dark:focus:bg-slate-700">Secondary</SelectItem>
                    <SelectItem value="tertiary" className="dark:text-white dark:focus:bg-slate-700">Tertiary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experienceYears" className="text-slate-700 dark:text-slate-300">
                  Experience (Years)
                </Label>
                <Input
                  id="experienceYears"
                  type="number"
                  value={formData.experienceYears}
                  onChange={(e) => handleInputChange("experienceYears", e.target.value)}
                  placeholder="Enter years of experience"
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-700 dark:text-slate-300">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange("role", e.target.value)}
                  placeholder="e.g., Teacher, HOD, Department Head"
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfHire" className="text-slate-700 dark:text-slate-300">
                  Date of Hire
                </Label>
                <Input
                  id="dateOfHire"
                  type="date"
                  value={formData.dateOfHire}
                  onChange={(e) => handleInputChange("dateOfHire", e.target.value)}
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employmentType" className="text-slate-700 dark:text-slate-300">
                  Employment Type <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.employmentType} onValueChange={(value) => handleInputChange("employmentType", value)}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectItem value="fulltime" className="dark:text-white dark:focus:bg-slate-700">Full-time</SelectItem>
                    <SelectItem value="parttime" className="dark:text-white dark:focus:bg-slate-700">Part-time</SelectItem>
                    <SelectItem value="contract" className="dark:text-white dark:focus:bg-slate-700">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-slate-700 dark:text-slate-300">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    <SelectItem value="ACTIVE" className="dark:text-white dark:focus:bg-slate-700">Active</SelectItem>
                    <SelectItem value="ON_LEAVE" className="dark:text-white dark:focus:bg-slate-700">On Leave</SelectItem>
                    <SelectItem value="RESIGNED" className="dark:text-white dark:focus:bg-slate-700">Resigned</SelectItem>
                    <SelectItem value="RETIRED" className="dark:text-white dark:focus:bg-slate-700">Retired</SelectItem>
                    <SelectItem value="SUSPENDED" className="dark:text-white dark:focus:bg-slate-700">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="highestQualification" className="text-slate-700 dark:text-slate-300">
                  Highest Qualification
                </Label>
                <Input
                  id="highestQualification"
                  value={formData.highestQualification}
                  onChange={(e) => handleInputChange("highestQualification", e.target.value)}
                  placeholder="Enter highest qualification"
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="institutionAttended" className="text-slate-700 dark:text-slate-300">
                  Institution Attended
                </Label>
                <Input
                  id="institutionAttended"
                  value={formData.institutionAttended}
                  onChange={(e) => handleInputChange("institutionAttended", e.target.value)}
                  placeholder="Enter institution name"
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previousSchools" className="text-slate-700 dark:text-slate-300">
                  Previous Schools (comma-separated)
                </Label>
                <Textarea
                  id="previousSchools"
                  value={formData.previousSchools}
                  onChange={(e) => handleInputChange("previousSchools", e.target.value)}
                  placeholder="School A, School B, School C"
                  rows={3}
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="healthInfo" className="text-slate-700 dark:text-slate-300">
                  Health Information
                </Label>
                <Textarea
                  id="healthInfo"
                  value={formData.healthInfo}
                  onChange={(e) => handleInputChange("healthInfo", e.target.value)}
                  placeholder="Enter any relevant health information"
                  rows={3}
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-6 mt-6">
            <div>
              <Label className="text-slate-700 dark:text-slate-300 mb-2 block">
                Profile Photo
              </Label>
              {initialData?.profilePhoto && !photoFiles && (
                <div className="mb-3">
                  <img
                    src={initialData.profilePhoto}
                    alt="Current photo"
                    className="w-32 h-32 rounded-full object-cover border-2 border-slate-300 dark:border-slate-600"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Current photo (upload new to replace)
                  </p>
                </div>
              )}
              <Dropzone
                provider="cloudflare-r2"
                variant="avatar"
                maxFiles={1}
                maxSize={1024 * 1024 * 5}
                onFilesChange={setPhotoFiles}
              />
            </div>

            <div>
              <Label className="text-slate-700 dark:text-slate-300 mb-2 block">
                Academic Documents (PDF)
              </Label>
              {initialData?.documents && !docFiles && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  Current document uploaded (upload new to replace)
                </p>
              )}
              <Dropzone
                provider="cloudflare-r2"
                variant="compact"
                maxFiles={1}
                maxSize={1024 * 1024 * 10}
                onFilesChange={setDocFiles}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 border-t dark:border-slate-700">
          <Button
            type="button"
            variant="outline"
            onClick={goToPreviousTab}
            disabled={isFirstTab}
            className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancel
            </Button>

            {isLastTab ? (
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Update Teacher" : "Create Teacher"}
              </Button>
            ) : (
              <Button 
                onClick={goToNextTab}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}