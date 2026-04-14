"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Dropzone, FileWithMetadata } from "@/components/ui/dropzone";
import { toast } from "sonner";
import { Loader2, Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateStudent } from "@/actions/students";

// ════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ════════════════════════════════════════════════════════════════════════════

const editStudentSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  otherNames: z.string().optional(),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  nationality: z.string().min(1, "Nationality is required"),
  NIN: z.string().optional(),
  bloodGroup: z.string().optional(),
  village: z.string().optional(),
  religion: z.string().optional(),
  parentId: z.string().min(1, "Parent/Guardian is required"),
  medicalConditions: z.string().optional(),
  disability: z.string().optional(),
  previousSchool: z.string().optional(),
});

type FormData = z.infer<typeof editStudentSchema>;

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  otherNames?: string | null;
  dob: Date;
  gender: string;
  nationality: string;
  imageUrl?: string | null;
  NIN?: string | null;
  bloodGroup?: string | null;
  village?: string | null;
  religion?: string | null;
  parentId: string;
  medicalConditions?: string | null;
  disability?: string | null;
  previousSchool?: string | null;
};

type Parent = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  parents: Parent[];
  schoolId: string;
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function EditStudentDialog({
  open,
  onOpenChange,
  student,
  parents,
  schoolId,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [photoFiles, setPhotoFiles] = useState<FileWithMetadata[]>();
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(
    student.imageUrl || null
  );
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);

  // Popover states
  const [genderOpen, setGenderOpen] = useState(false);
  const [bloodGroupOpen, setBloodGroupOpen] = useState(false);
  const [parentOpen, setParentOpen] = useState(false);

  // Options
  const genderOptions = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
  ] as const;

  const bloodGroupOptions = [
    { value: "A+", label: "A+" },
    { value: "A-", label: "A-" },
    { value: "B+", label: "B+" },
    { value: "B-", label: "B-" },
    { value: "AB+", label: "AB+" },
    { value: "AB-", label: "AB-" },
    { value: "O+", label: "O+" },
    { value: "O-", label: "O-" },
  ];

  const form = useForm<FormData>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      firstName: student.firstName,
      lastName: student.lastName,
      otherNames: student.otherNames || "",
      dob: new Date(student.dob).toISOString().split("T")[0],
      gender: student.gender as "MALE" | "FEMALE" | "OTHER",
      nationality: student.nationality,
      NIN: student.NIN || "",
      bloodGroup: student.bloodGroup || undefined,
      village: student.village || "",
      religion: student.religion || "",
      parentId: student.parentId,
      medicalConditions: student.medicalConditions || "",
      disability: student.disability || "",
      previousSchool: student.previousSchool || "",
    },
  });

  // Reset form when dialog opens with fresh student data
  useEffect(() => {
    if (open) {
      form.reset({
        firstName: student.firstName,
        lastName: student.lastName,
        otherNames: student.otherNames || "",
        dob: new Date(student.dob).toISOString().split("T")[0],
        gender: student.gender as "MALE" | "FEMALE" | "OTHER",
        nationality: student.nationality,
        NIN: student.NIN || "",
        bloodGroup: student.bloodGroup || undefined,
        village: student.village || "",
        religion: student.religion || "",
        parentId: student.parentId,
        medicalConditions: student.medicalConditions || "",
        disability: student.disability || "",
        previousSchool: student.previousSchool || "",
      });
      setCurrentImageUrl(student.imageUrl || null);
      setPhotoFiles(undefined);
      setRemoveCurrentImage(false);
    }
  }, [open, student, form]);

  const handleRemoveCurrentImage = () => {
    setCurrentImageUrl(null);
    setRemoveCurrentImage(true);
    setPhotoFiles(undefined);
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // Determine the new image URL
      let newImageUrl = currentImageUrl;

      // If user uploaded a new image via Cloudflare R2
      if (photoFiles && photoFiles.length > 0) {
        const uploadedFile = photoFiles[0];

        if (uploadedFile.uploading) {
          toast.error("Please wait for the photo to finish uploading.");
          setIsLoading(false);
          return;
        }

        newImageUrl = uploadedFile.publicUrl || null;

        if (!newImageUrl) {
          toast.error("Photo upload failed. Please try again.");
          setIsLoading(false);
          return;
        }
      }
      // If user removed the image
      else if (removeCurrentImage) {
        newImageUrl = null;
      }

      const updateData = {
        ...data,
        dob: new Date(data.dob),
        imageUrl: newImageUrl,
      };

      const result = await updateStudent({ studentId: student.id, ...updateData, schoolId });

      if (result.ok) {
        toast.success(result.message || "Student updated successfully");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.message || "Failed to update student");
      }
    } catch (error) {
      console.error("Update student error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update student information. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.error("Form validation errors:", errors);
              toast.error("Please fix the form errors before saving.");
            })} className="space-y-6">
            {/* Profile Photo */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Profile Photo</h3>
              
              {/* Show current image if exists and not removed */}
              {currentImageUrl && !removeCurrentImage && !photoFiles && (
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <img
                    src={currentImageUrl}
                    alt="Current profile"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Current Photo</p>
                    <p className="text-xs text-muted-foreground">
                      Upload a new photo to replace this one
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveCurrentImage}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              )}

              {/* Show dropzone if no current image or user removed it */}
              {(!currentImageUrl || removeCurrentImage || photoFiles) && (
                <>
                  <Dropzone
                    provider="cloudflare-r2"
                    variant="avatar"
                    maxFiles={1}
                    maxSize={1024 * 1024 * 5}
                    accept={{
                      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
                    }}
                    onFilesChange={(files) => {
                      console.log("Files changed:", files);
                      setPhotoFiles(files);
                      if (files && files.length > 0) {
                        setRemoveCurrentImage(false);
                      }
                    }}
                  />
                  
                  {/* Preview new uploaded image */}
                  {photoFiles && photoFiles.length > 0 && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                      {/* ✅ Only check for publicUrl or url */}
                      {(photoFiles[0].publicUrl) && (
                        <img 
                          src={photoFiles[0].publicUrl} 
                          alt="New preview" 
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1 text-sm">
                        <p className="font-medium">New Photo Uploaded ✓</p>
                        <p className="text-xs text-muted-foreground">
                          {photoFiles[0].file.name} ({(photoFiles[0].file.size / 1024).toFixed(2)} KB)
                        </p>
                        {photoFiles[0].publicUrl && (
                          <p className="text-xs text-green-600 mt-1">
                            Uploaded to Cloudflare R2
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPhotoFiles(undefined);
                          if (student.imageUrl) {
                            setCurrentImageUrl(student.imageUrl);
                            setRemoveCurrentImage(false);
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
              
              <p className="text-xs text-muted-foreground">
                Upload a new profile photo (optional, max 5MB). Images are stored in Cloudflare R2.
              </p>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="otherNames"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Names</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gender - Searchable */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Gender *</FormLabel>
                      <Popover open={genderOpen} onOpenChange={setGenderOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={isLoading}
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? genderOptions.find((g) => g.value === field.value)?.label
                                : "Select gender"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search gender..." />
                            <CommandList>
                              <CommandEmpty>No gender found.</CommandEmpty>
                              <CommandGroup>
                                {genderOptions.map((gender) => (
                                  <CommandItem
                                    value={gender.label}
                                    key={gender.value}
                                    onSelect={() => {
                                      form.setValue("gender", gender.value);
                                      setGenderOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        gender.value === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {gender.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="NIN"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>National ID (NIN)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Blood Group - Searchable */}
                <FormField
                  control={form.control}
                  name="bloodGroup"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Blood Group</FormLabel>
                      <Popover open={bloodGroupOpen} onOpenChange={setBloodGroupOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={isLoading}
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value || "Select blood group"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search blood group..." />
                            <CommandList>
                              <CommandEmpty>No blood group found.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="none"
                                  onSelect={() => {
                                    form.setValue("bloodGroup", undefined);
                                    setBloodGroupOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      !field.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  None
                                </CommandItem>
                                {bloodGroupOptions.map((bg) => (
                                  <CommandItem
                                    value={bg.label}
                                    key={bg.value}
                                    onSelect={() => {
                                      form.setValue("bloodGroup", bg.value);
                                      setBloodGroupOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        bg.value === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {bg.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="religion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Religion</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="village"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Village/Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Parent/Guardian - Searchable */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Parent/Guardian</h3>
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Parent/Guardian *</FormLabel>
                    <Popover open={parentOpen} onOpenChange={setParentOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={isLoading}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? (() => {
                                  const parent = parents.find((p) => p.id === field.value);
                                  return parent
                                    ? `${parent.firstName} ${parent.lastName} - ${parent.phone}`
                                    : "Select parent or guardian";
                                })()
                              : "Select parent or guardian"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search parent..." />
                          <CommandList>
                            <CommandEmpty>No parent found.</CommandEmpty>
                            <CommandGroup>
                              {parents.map((parent) => (
                                <CommandItem
                                  value={`${parent.firstName} ${parent.lastName} ${parent.phone}`}
                                  key={parent.id}
                                  onSelect={() => {
                                    form.setValue("parentId", parent.id);
                                    setParentOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      parent.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {parent.firstName} {parent.lastName} - {parent.phone}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Health Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Health Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="medicalConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Conditions</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="disability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disability</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="previousSchool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous School</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !!(photoFiles && photoFiles.some(f => f.uploading))}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {photoFiles && photoFiles.some(f => f.uploading) ? "Uploading photo..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}