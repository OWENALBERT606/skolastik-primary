"use client";

import { useState, useEffect } from "react";
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
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getTermsByAcademicYear, promoteStudent } from "@/actions/students";

// ════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ════════════════════════════════════════════════════════════════════════════

const promoteSchema = z.object({
  nextAcademicYearId: z.string().min(1, "Academic year is required"),
  nextTermId: z.string().min(1, "Term is required"),
  nextClassYearId: z.string().min(1, "Next class is required"),
  nextStreamId: z.string().optional(),
});

type FormData = z.infer<typeof promoteSchema>;

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type Enrollment = {
  id: string;
  classYear: {
    classTemplate: {
      name: string;
    };
  };
  stream?: {
    name: string;
  } | null;
  term: {
    name: string;
  };
  academicYear: {
    year: string;
  };
};

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
};

type AcademicYear = {
  id: string;
  year: string;
  isActive: boolean;
};

type Term = {
  id: string;
  name: string;
  isActive: boolean;
};

type ClassYear = {
  id: string;
  academicYearId: string;
  classTemplate: {
    id: string;
    name: string;
    code?: string | null;
  };
  streams: Array<{
    id: string;
    name: string;
  }>;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEnrollment: Enrollment;
  student: Student;
  academicYears: AcademicYear[];
  classYears: ClassYear[];
  schoolId: string;
  userId: string;
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function PromoteStudentDialog({
  open,
  onOpenChange,
  currentEnrollment,
  student,
  academicYears,
  classYears,
  schoolId,
  userId
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableTerms, setAvailableTerms] = useState<Term[]>([]);
  const [filteredClassYears, setFilteredClassYears] = useState<ClassYear[]>([]);
  const [selectedClassYear, setSelectedClassYear] = useState<ClassYear | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(promoteSchema),
    defaultValues: {
      nextAcademicYearId: "",
      nextTermId: "",
      nextClassYearId: "",
      nextStreamId: "",
    },
  });

  const selectedAcademicYearId = form.watch("nextAcademicYearId");
  const selectedClassYearId = form.watch("nextClassYearId");

  // Fetch terms when academic year changes
  useEffect(() => {
    const fetchTerms = async () => {
      if (selectedAcademicYearId) {
        try {
          const result = await getTermsByAcademicYear(selectedAcademicYearId);
          if (result.ok && result.data) {
            setAvailableTerms(result.data);

            // Set first term as default
            if (result.data.length > 0) {
              form.setValue("nextTermId", result.data[0].id);
            }
          }
        } catch (error) {
          console.error("Error fetching terms:", error);
          toast.error("Failed to load terms");
        }
      }
    };

    fetchTerms();
  }, [selectedAcademicYearId, form]);

  // Filter class years when academic year changes
  useEffect(() => {
    if (selectedAcademicYearId) {
      const filtered = classYears.filter(
        (cy) => cy.academicYearId === selectedAcademicYearId
      );
      setFilteredClassYears(filtered);

      // Reset selections if not valid
      const currentClassYearId = form.getValues("nextClassYearId");
      if (currentClassYearId && !filtered.find(cy => cy.id === currentClassYearId)) {
        form.setValue("nextClassYearId", "");
        form.setValue("nextStreamId", "");
      }
    } else {
      setFilteredClassYears([]);
    }
  }, [selectedAcademicYearId, classYears, form]);

  // Update selected class year
  useEffect(() => {
    if (selectedClassYearId) {
      const classYear = filteredClassYears.find(
        (cy) => cy.id === selectedClassYearId
      );
      setSelectedClassYear(classYear || null);

      // Reset stream if not valid
      const currentStreamId = form.getValues("nextStreamId");
      if (currentStreamId && classYear && !classYear.streams.find(s => s.id === currentStreamId)) {
        form.setValue("nextStreamId", "");
      }
    } else {
      setSelectedClassYear(null);
    }
  }, [selectedClassYearId, filteredClassYears, form]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const result = await promoteStudent({
  studentId: student.id,
  fromEnrollmentId: currentEnrollment.id,
  toClassYearId: data.nextClassYearId,
  toStreamId: data.nextStreamId || null,
  toTermId: data.nextTermId,
  toAcademicYearId: data.nextAcademicYearId,
  schoolId: schoolId,
  promotedById: userId, // replace with session user id
});

      if (result.ok) {
        toast.success("Student promoted successfully");
        form.reset();
        onOpenChange(false);
        window.location.reload();
      } else {
        toast.error("Failed to promote Student:something went wrong");
      }
    } catch (error) {
      console.error("Promote student error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Promote Student
          </DialogTitle>
          <DialogDescription>
            Promote {student.firstName} {student.lastName} to the next class for a
            new academic year.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Current Enrollment:</p>
              <ul className="text-sm space-y-1">
                <li>
                  <strong>Class:</strong>{" "}
                  {currentEnrollment.classYear.classTemplate.name}
                  {currentEnrollment.stream && ` - ${currentEnrollment.stream.name}`}
                </li>
                <li>
                  <strong>Term:</strong> {currentEnrollment.term.name},{" "}
                  {currentEnrollment.academicYear.year}
                </li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Next Academic Year */}
              <FormField
                control={form.control}
                name="nextAcademicYearId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Academic Year *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select next academic year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicYears.map((year) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.year} {year.isActive && "(Current)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the academic year for promotion
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Term */}
              <FormField
                control={form.control}
                name="nextTermId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedAcademicYearId || availableTerms.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTerms.map((term) => (
                          <SelectItem key={term.id} value={term.id}>
                            {term.name} {term.isActive && "(Active)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Next Class */}
              <FormField
                control={form.control}
                name="nextClassYearId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Class *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={filteredClassYears.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select next class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredClassYears.map((classYear) => (
                          <SelectItem key={classYear.id} value={classYear.id}>
                            {classYear.classTemplate.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the class to promote the student to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Stream */}
              {selectedClassYear && selectedClassYear.streams.length > 0 && (
                <FormField
                  control={form.control}
                  name="nextStreamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stream (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stream" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No Stream</SelectItem>
                          {selectedClassYear.streams.map((stream) => (
                            <SelectItem key={stream.id} value={stream.id}>
                              {stream.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Promote Student
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}