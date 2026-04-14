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
import { toast } from "sonner";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  enrollStudent,
  enrollALevelStudent,
  getTermsByAcademicYear,
  getStreamsByClassYear,
  getALevelSubjectsForStream,
} from "@/actions/students";

// ════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ════════════════════════════════════════════════════════════════════════════

const enrollSchema = z.object({
  academicYearId: z.string().min(1, "Academic year is required"),
  termId: z.string().min(1, "Term is required"),
  classYearId: z.string().min(1, "Class is required"),
  streamId: z.string().optional(),
  enrollmentType: z.enum(["NEW", "CONTINUING", "TRANSFER", "PROMOTED", "REPEAT"]),
});

type FormData = z.infer<typeof enrollSchema>;

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

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
  termNumber?: number;
};

type ClassYearUI = {
  id: string;
  name: string;
  academicYearId: string;
  classLevel?: string;
};

type ALevelSubject = {
  id: string;
  name: string;
  code: string | null;
  aLevelCategory: "MAJOR" | "SUBSIDIARY" | null;
  isGeneralPaper: boolean;
};

type Stream = {
  id: string;
  name: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  academicYears: AcademicYear[];
  classYears: ClassYearUI[];
  schoolId: string;
  userId: string;
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function EnrollStudentDialog({
  open,
  onOpenChange,
  student,
  academicYears,
  classYears,
  schoolId,
  userId,
}: Props) {
  // ══════════════════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════════════════
  const [isLoading, setIsLoading] = useState(false);
  const [availableTerms, setAvailableTerms] = useState<Term[]>([]);
  const [filteredClassYears, setFilteredClassYears] = useState<ClassYearUI[]>([]);
  const [availableStreams, setAvailableStreams] = useState<Stream[]>([]);
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);
  const [isLoadingStreams, setIsLoadingStreams] = useState(false);

  // A-level subject selection state
  const [aLevelSubjects,     setALevelSubjects]     = useState<ALevelSubject[]>([]);
  const [selectedMajorIds,   setSelectedMajorIds]   = useState<string[]>([]);
  const [selectedSubIds,     setSelectedSubIds]      = useState<string[]>([]);
  const [isLoadingSubjects,  setIsLoadingSubjects]  = useState(false);
  const [showSubjectStep,    setShowSubjectStep]    = useState(false);

  // Popover states
  const [academicYearOpen, setAcademicYearOpen] = useState(false);
  const [termOpen, setTermOpen] = useState(false);
  const [classYearOpen, setClassYearOpen] = useState(false);
  const [streamOpen, setStreamOpen] = useState(false);
  const [enrollmentTypeOpen, setEnrollmentTypeOpen] = useState(false);

  // ══════════════════════════════════════════════════════════════════════════
  // CONSTANTS
  // ══════════════════════════════════════════════════════════════════════════
  const enrollmentTypes = [
    { value: "NEW",        label: "New Student" },
    { value: "CONTINUING", label: "Continuing Student" },
    { value: "TRANSFER",   label: "Transfer Student" },
    { value: "PROMOTED",   label: "Promoted" },
    { value: "REPEAT",     label: "Repeating Class" },
  ] as const;

  // ══════════════════════════════════════════════════════════════════════════
  // FORM
  // ══════════════════════════════════════════════════════════════════════════
  const form = useForm<FormData>({
    resolver: zodResolver(enrollSchema),
    defaultValues: {
      academicYearId: academicYears.find((y) => y.isActive)?.id || "",
      termId: "",
      classYearId: "",
      streamId: undefined,
      enrollmentType: "CONTINUING",
    },
  });

  const selectedAcademicYearId = form.watch("academicYearId");
  const selectedClassYearId    = form.watch("classYearId");

  // ══════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ══════════════════════════════════════════════════════════════════════════

  // Reset on close
  useEffect(() => {
    if (!open) {
      form.reset({
        academicYearId: academicYears.find((y) => y.isActive)?.id || "",
        termId: "",
        classYearId: "",
        streamId: undefined,
        enrollmentType: "CONTINUING",
      });
      setAvailableTerms([]);
      setFilteredClassYears([]);
      setAvailableStreams([]);
      setALevelSubjects([]);
      setSelectedMajorIds([]);
      setSelectedSubIds([]);
      setShowSubjectStep(false);
    }
  }, [open, form, academicYears]);

  // Fetch terms when academic year changes
  useEffect(() => {
    const fetchTerms = async () => {
      if (!selectedAcademicYearId) {
        setAvailableTerms([]);
        form.setValue("termId", "");
        return;
      }
      setIsLoadingTerms(true);
      try {
        const result = await getTermsByAcademicYear(selectedAcademicYearId);
        if (result.ok && result.data) {
          setAvailableTerms(result.data);
          const defaultTerm =
            result.data.find((t) => t.isActive) || result.data[0];
          form.setValue("termId", defaultTerm?.id || "");
        } else {
          setAvailableTerms([]);
          form.setValue("termId", "");
          if (result.message) toast.error(result.message);
        }
      } catch {
        toast.error("Failed to load terms");
        setAvailableTerms([]);
        form.setValue("termId", "");
      } finally {
        setIsLoadingTerms(false);
      }
    };
    fetchTerms();
  }, [selectedAcademicYearId, form]);

  // Filter class years when academic year changes
  useEffect(() => {
    if (!selectedAcademicYearId) {
      setFilteredClassYears([]);
      form.setValue("classYearId", "");
      form.setValue("streamId", undefined);
      setAvailableStreams([]);
      return;
    }
    const filtered = classYears.filter(
      (cy) => cy.academicYearId === selectedAcademicYearId
    );
    setFilteredClassYears(filtered);
    const current = form.getValues("classYearId");
    if (current && !filtered.find((cy) => cy.id === current)) {
      form.setValue("classYearId", "");
      form.setValue("streamId", undefined);
      setAvailableStreams([]);
    }
  }, [selectedAcademicYearId, classYears, form]);

  // Fetch streams when class year changes
  useEffect(() => {
    const fetchStreams = async () => {
      if (!selectedClassYearId) {
        setAvailableStreams([]);
        form.setValue("streamId", undefined);
        return;
      }
      setIsLoadingStreams(true);
      try {
        const result = await getStreamsByClassYear(selectedClassYearId);
        setAvailableStreams(result.ok && result.data ? result.data : []);
      } catch {
        setAvailableStreams([]);
      } finally {
        setIsLoadingStreams(false);
      }
    };
    fetchStreams();
  }, [selectedClassYearId, form]);

  // ══════════════════════════════════════════════════════════════════════════
  // SUBMIT
  // ══════════════════════════════════════════════════════════════════════════

  const onSubmit = async (data: FormData) => {
    const selectedClassYear = filteredClassYears.find((cy) => cy.id === data.classYearId);
    const isALevel = selectedClassYear?.classLevel === "A_LEVEL";

    // For A-level with a stream: show subject selection step first
    if (isALevel && data.streamId && !showSubjectStep) {
      setIsLoadingSubjects(true);
      try {
        const result = await getALevelSubjectsForStream(data.streamId, data.termId);
        if (result.ok && result.data.length > 0) {
          setALevelSubjects(result.data as ALevelSubject[]);
          // Auto-select General Paper as subsidiary
          const gp = result.data.find(s => s.isGeneralPaper);
          if (gp) setSelectedSubIds([gp.id]);
          setShowSubjectStep(true);
        } else {
          toast.error("No subjects found for this stream/term.");
        }
      } catch {
        toast.error("Failed to load subjects.");
      } finally {
        setIsLoadingSubjects(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const allSelectedIds = isALevel
        ? [...selectedMajorIds, ...selectedSubIds]
        : [];

      const result = isALevel && allSelectedIds.length > 0
        ? await enrollALevelStudent({
            studentId:          student.id,
            classYearId:        data.classYearId,
            streamId:           data.streamId || undefined,
            academicYearId:     data.academicYearId,
            termId:             data.termId,
            enrollmentType:     data.enrollmentType,
            schoolId,
            enrolledById:       userId,
            selectedSubjectIds: allSelectedIds,
          })
        : await enrollStudent({
            studentId:      student.id,
            classYearId:    data.classYearId,
            streamId:       data.streamId || undefined,
            academicYearId: data.academicYearId,
            termId:         data.termId,
            enrollmentType: data.enrollmentType,
            schoolId,
            enrolledById:   userId,
          });

      if (result.ok) {
        toast.success(result.message || "Student enrolled successfully!");
        form.reset();
        onOpenChange(false);
        window.location.reload();
      } else {
        toast.error(result.message || "Failed to enroll student");
      }
    } catch (error) {
      console.error("Enroll student error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enroll Student in Class</DialogTitle>
          <DialogDescription>
            Enroll {student.firstName} {student.lastName} ({student.admissionNo})
            into a class for the selected term.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">

              {/* Academic Year */}
              <FormField
                control={form.control}
                name="academicYearId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Academic Year *</FormLabel>
                    <Popover open={academicYearOpen} onOpenChange={setAcademicYearOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={isLoading}
                            className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                          >
                            {field.value
                              ? (() => {
                                  const y = academicYears.find((a) => a.id === field.value);
                                  return y ? `${y.year}${y.isActive ? " (Current)" : ""}` : "Select academic year";
                                })()
                              : "Select academic year"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search academic year..." />
                          <CommandList>
                            <CommandEmpty>No academic year found.</CommandEmpty>
                            <CommandGroup>
                              {academicYears.filter((y) => y.id && y.year).map((year) => (
                                <CommandItem
                                  value={year.year}
                                  key={year.id}
                                  onSelect={() => {
                                    form.setValue("academicYearId", year.id);
                                    setAcademicYearOpen(false);
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", year.id === field.value ? "opacity-100" : "opacity-0")} />
                                  {year.year} {year.isActive && "(Current)"}
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

              {/* Term */}
              <FormField
                control={form.control}
                name="termId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Term *</FormLabel>
                    <Popover open={termOpen} onOpenChange={setTermOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={!selectedAcademicYearId || availableTerms.length === 0 || isLoadingTerms || isLoading}
                            className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                          >
                            {isLoadingTerms
                              ? "Loading terms..."
                              : field.value
                              ? (() => {
                                  const t = availableTerms.find((x) => x.id === field.value);
                                  return t ? `${t.name}${t.isActive ? " (Active)" : ""}` : "Select term";
                                })()
                              : "Select term"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search term..." />
                          <CommandList>
                            <CommandEmpty>No term found.</CommandEmpty>
                            <CommandGroup>
                              {availableTerms.filter((t) => t.id && t.name).map((term) => (
                                <CommandItem
                                  value={term.name}
                                  key={term.id}
                                  onSelect={() => {
                                    form.setValue("termId", term.id);
                                    setTermOpen(false);
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", term.id === field.value ? "opacity-100" : "opacity-0")} />
                                  {term.name} {term.isActive && "(Active)"}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {!selectedAcademicYearId ? (
                      <FormDescription>Please select an academic year first</FormDescription>
                    ) : availableTerms.length === 0 && !isLoadingTerms ? (
                      <FormDescription className="text-destructive">No terms available for this academic year</FormDescription>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Class */}
              <FormField
                control={form.control}
                name="classYearId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Class *</FormLabel>
                    <Popover open={classYearOpen} onOpenChange={setClassYearOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={!selectedAcademicYearId || filteredClassYears.length === 0 || isLoading}
                            className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                          >
                            {field.value
                              ? filteredClassYears.find((cy) => cy.id === field.value)?.name ?? "Select class"
                              : "Select class"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search class..." />
                          <CommandList>
                            <CommandEmpty>No class found.</CommandEmpty>
                            <CommandGroup>
                              {filteredClassYears.map((classYear) => (
                                <CommandItem
                                  value={classYear.name}
                                  key={classYear.id}
                                  onSelect={() => {
                                    form.setValue("classYearId", classYear.id);
                                    setClassYearOpen(false);
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", classYear.id === field.value ? "opacity-100" : "opacity-0")} />
                                  {classYear.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Only classes for the selected academic year are shown</FormDescription>
                    {filteredClassYears.length === 0 && selectedAcademicYearId && (
                      <FormDescription className="text-destructive">No classes available for this academic year</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Stream */}
              {availableStreams.length > 0 && (
                <FormField
                  control={form.control}
                  name="streamId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Stream (Optional)</FormLabel>
                      <Popover open={streamOpen} onOpenChange={setStreamOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={isLoading || isLoadingStreams}
                              className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                            >
                              {isLoadingStreams
                                ? "Loading streams..."
                                : field.value
                                ? availableStreams.find((s) => s.id === field.value)?.name
                                : "Select stream (optional)"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search stream..." />
                            <CommandList>
                              <CommandEmpty>No stream found.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="no-stream"
                                  onSelect={() => {
                                    form.setValue("streamId", undefined);
                                    setStreamOpen(false);
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", !field.value ? "opacity-100" : "opacity-0")} />
                                  No Stream
                                </CommandItem>
                                {availableStreams.filter((s) => s.id && s.name).map((stream) => (
                                  <CommandItem
                                    value={stream.name}
                                    key={stream.id}
                                    onSelect={() => {
                                      form.setValue("streamId", stream.id);
                                      setStreamOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", stream.id === field.value ? "opacity-100" : "opacity-0")} />
                                    {stream.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>Select a stream if this class has divisions</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Enrollment Type */}
              <FormField
                control={form.control}
                name="enrollmentType"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Enrollment Type *</FormLabel>
                    <Popover open={enrollmentTypeOpen} onOpenChange={setEnrollmentTypeOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={isLoading}
                            className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                          >
                            {field.value
                              ? enrollmentTypes.find((t) => t.value === field.value)?.label
                              : "Select enrollment type"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search enrollment type..." />
                          <CommandList>
                            <CommandEmpty>No enrollment type found.</CommandEmpty>
                            <CommandGroup>
                              {enrollmentTypes.map((type) => (
                                <CommandItem
                                  value={type.label}
                                  key={type.value}
                                  onSelect={() => {
                                    form.setValue("enrollmentType", type.value);
                                    setEnrollmentTypeOpen(false);
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", type.value === field.value ? "opacity-100" : "opacity-0")} />
                                  {type.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Specify the type of enrollment for this student</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* A-Level Subject Selection Step */}
            {showSubjectStep && (
              <div className="space-y-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Select Subject Combination
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Choose exactly 3 main subjects. General Paper is compulsory.
                  </p>
                </div>

                {/* Major subjects */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                    Main Subjects (select 3)
                  </p>
                  <div className="space-y-1.5">
                    {aLevelSubjects
                      .filter(s => s.aLevelCategory === "MAJOR")
                      .map(s => {
                        const checked = selectedMajorIds.includes(s.id);
                        return (
                          <label key={s.id} className={`flex items-center gap-2.5 p-2 rounded-md border cursor-pointer transition-colors ${
                            checked
                              ? "border-primary/50 bg-primary/5"
                              : "border-slate-200 dark:border-slate-700 hover:border-primary/30"
                          }`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!checked && selectedMajorIds.length >= 3}
                              onChange={() => {
                                setSelectedMajorIds(prev =>
                                  checked ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                );
                              }}
                              className="w-4 h-4 rounded text-primary"
                            />
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                              {s.name}
                            </span>
                            {s.code && (
                              <span className="text-xs text-slate-400 ml-auto">{s.code}</span>
                            )}
                          </label>
                        );
                      })}
                    {aLevelSubjects.filter(s => s.aLevelCategory === "MAJOR").length === 0 && (
                      <p className="text-xs text-slate-400 italic">No major subjects configured for this stream.</p>
                    )}
                  </div>
                  {selectedMajorIds.length > 0 && selectedMajorIds.length !== 3 && (
                    <p className="text-xs text-amber-600 mt-1">{selectedMajorIds.length}/3 selected</p>
                  )}
                  {selectedMajorIds.length === 3 && (
                    <p className="text-xs text-green-600 mt-1">✓ 3 subjects selected</p>
                  )}
                </div>

                {/* Subsidiary subjects */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                    Subsidiary Subjects (select 1 + General Paper is compulsory)
                  </p>
                  <div className="space-y-1.5">
                    {aLevelSubjects
                      .filter(s => s.aLevelCategory === "SUBSIDIARY")
                      .map(s => {
                        const isGP      = s.isGeneralPaper;
                        const checked   = selectedSubIds.includes(s.id);
                        const optCount  = selectedSubIds.filter(id => !aLevelSubjects.find(x => x.id === id && x.isGeneralPaper)).length;
                        return (
                          <label key={s.id} className={`flex items-center gap-2.5 p-2 rounded-md border ${
                            isGP
                              ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 cursor-default"
                              : checked
                              ? "border-primary/50 bg-primary/5 cursor-pointer"
                              : "border-slate-200 dark:border-slate-700 hover:border-primary/30 cursor-pointer"
                          } transition-colors`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={isGP || (!checked && !isGP && optCount >= 1)}
                              onChange={() => {
                                if (isGP) return;
                                setSelectedSubIds(prev =>
                                  checked ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                );
                              }}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                              {s.name}
                            </span>
                            {isGP && (
                              <span className="text-xs text-emerald-600 ml-auto">Compulsory</span>
                            )}
                            {!isGP && s.code && (
                              <span className="text-xs text-slate-400 ml-auto">{s.code}</span>
                            )}
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (showSubjectStep) {
                    setShowSubjectStep(false);
                    setSelectedMajorIds([]);
                    setSelectedSubIds([]);
                  } else {
                    onOpenChange(false);
                  }
                }}
                disabled={isLoading || isLoadingSubjects}
              >
                {showSubjectStep ? "Back" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading || isLoadingSubjects ||
                  (showSubjectStep && selectedMajorIds.length !== 3)
                }
              >
                {(isLoading || isLoadingSubjects) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {showSubjectStep ? "Confirm Enrollment" : "Enroll Student"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}