// "use client";

// import { useState, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
//   FormDescription,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Textarea } from "@/components/ui/textarea";
// import { Dropzone, FileWithMetadata } from "@/components/ui/dropzone";
// import { toast } from "sonner";
// import {
//   Loader2,
//   RefreshCw,
//   Check,
//   ChevronsUpDown,
//   KeyRound,
//   Eye,
//   EyeOff,
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { createStudentSmart } from "@/actions/student-create";


// // ════════════════════════════════════════════════════════════════════════════
// // SCHEMA
// // ════════════════════════════════════════════════════════════════════════════

// const studentSchema = z.object({
//   firstName: z.string().min(2, "First name must be at least 2 characters"),
//   lastName: z.string().min(2, "Last name must be at least 2 characters"),
//   otherNames: z.string().optional(),
//   admissionNo: z
//     .string()
//     .min(1, "Admission number is required")
//     .regex(/^STD\d{6}$/, "Admission number must be in format STD000001"),
//   dob: z.string().min(1, "Date of birth is required"),
//   gender: z.enum(["MALE", "FEMALE", "OTHER"]),
//   nationality: z.string().min(1, "Nationality is required"),
//   NIN: z.string().optional(),
//   bloodGroup: z.string().optional(),
//   village: z.string().optional(),
//   religion: z.string().optional(),
//   parentId: z.string().min(1, "Parent/Guardian is required"),
//   medicalConditions: z.string().optional(),
//   disability: z.string().optional(),
//   previousSchool: z.string().optional(),
//   classYearId: z.string().min(1, "Class is required"),
//   streamId: z.string().optional(),
//   // ── Login credentials (all optional — defaults applied server-side) ──
//   studentPhone: z.string().optional(),
//   studentEmail: z
//     .string()
//     .email("Invalid email address")
//     .optional()
//     .or(z.literal("")),
//   studentPassword: z
//     .string()
//     .min(8, "Password must be at least 8 characters")
//     .optional()
//     .or(z.literal("")),
// });

// type FormData = z.infer<typeof studentSchema>;

// // ════════════════════════════════════════════════════════════════════════════
// // TYPES
// // ════════════════════════════════════════════════════════════════════════════

// type Parent = {
//   id: string;
//   firstName: string;
//   lastName: string;
//   phone: string;
//   email?: string | null;
// };

// type ClassYear = {
//   id: string;
//   name: string;
//   academicYearId: string;
// };

// type Stream = {
//   id: string;
//   name: string;
//   classYearId: string;
// };

// type Props = {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   parents: Parent[];
//   classYears: ClassYear[];
//   streams: Stream[];
//   schoolId: string;
//   enrolledById: string;
// };

// // ════════════════════════════════════════════════════════════════════════════
// // HELPERS
// // ════════════════════════════════════════════════════════════════════════════

// function SectionHeader({ children }: { children: React.ReactNode }) {
//   return (
//     <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-slate-500 border-b border-zinc-100 dark:border-slate-700/60 pb-2 mb-4">
//       {children}
//     </h3>
//   );
// }

// const inputCls =
//   "bg-white dark:bg-[#1a2236] border-zinc-200 dark:border-slate-700/60 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-slate-500";

// const labelCls = "text-zinc-700 dark:text-slate-300";
// const descCls = "text-zinc-400 dark:text-slate-500 text-xs";

// // ════════════════════════════════════════════════════════════════════════════
// // COMPONENT
// // ════════════════════════════════════════════════════════════════════════════

// export default function AddStudentDialog({
//   open,
//   onOpenChange,
//   parents,
//   classYears,
//   streams,
//   schoolId,
//   enrolledById,
// }: Props) {
//   const [isLoading, setIsLoading] = useState(false);
//   const [photoFiles, setPhotoFiles] = useState<FileWithMetadata[]>();
//   const [availableStreams, setAvailableStreams] = useState<Stream[]>([]);
//   const [showPassword, setShowPassword] = useState(false);

//   // Popover open states
//   const [genderOpen, setGenderOpen] = useState(false);
//   const [bloodGroupOpen, setBloodGroupOpen] = useState(false);
//   const [parentOpen, setParentOpen] = useState(false);
//   const [classYearOpen, setClassYearOpen] = useState(false);
//   const [streamOpen, setStreamOpen] = useState(false);

//   const genderOptions = [
//     { value: "MALE", label: "Male" },
//     { value: "FEMALE", label: "Female" },
//     { value: "OTHER", label: "Other" },
//   ] as const;

//   const bloodGroupOptions = [
//     "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
//   ];

//   const form = useForm<FormData>({
//     resolver: zodResolver(studentSchema),
//     defaultValues: {
//       firstName: "",
//       lastName: "",
//       otherNames: "",
//       admissionNo: "",
//       dob: "",
//       gender: "MALE",
//       nationality: "Ugandan",
//       NIN: "",
//       bloodGroup: undefined,
//       village: "",
//       religion: "",
//       parentId: "",
//       medicalConditions: "",
//       disability: "",
//       previousSchool: "",
//       classYearId: "",
//       streamId: undefined,
//       studentPhone: "",
//       studentEmail: "",
//       studentPassword: "",
//     },
//   });

//   const selectedClassYearId = form.watch("classYearId");

//   // Auto-generate admission number when dialog opens
//   useEffect(() => {
//     if (open) generateAdmissionNumber();
//   }, [open]);

//   // Filter streams when class changes
//   useEffect(() => {
//     if (selectedClassYearId) {
//       const filtered = streams.filter(
//         (s) => s.classYearId === selectedClassYearId
//       );
//       setAvailableStreams(filtered);
//       const cur = form.getValues("streamId");
//       if (cur && !filtered.find((s) => s.id === cur)) {
//         form.setValue("streamId", undefined);
//       }
//     } else {
//       setAvailableStreams([]);
//       form.setValue("streamId", undefined);
//     }
//   }, [selectedClassYearId, streams, form]);

//   const generateAdmissionNumber = () => {
//     const n = Math.floor(100000 + Math.random() * 900000);
//     form.setValue("admissionNo", `STD${n}`);
//   };

//   const popoverContentCls =
//     "w-full p-0 bg-white dark:bg-[#111827] border-zinc-200 dark:border-slate-700/60";
//   const commandItemCls =
//     "text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-[#1a2236] cursor-pointer";

//   const comboTrigger = (hasValue: boolean) =>
//     cn(
//       "w-full justify-between bg-white dark:bg-[#1a2236]",
//       "border-zinc-200 dark:border-slate-700/60",
//       "text-zinc-900 dark:text-white",
//       "hover:bg-zinc-50 dark:hover:bg-[#1e2a42]",
//       !hasValue && "text-zinc-400 dark:text-slate-500"
//     );

//   const onSubmit = async (data: FormData) => {
//     setIsLoading(true);
//     try {
//       const payload = {
//         firstName: data.firstName,
//         lastName: data.lastName,
//         otherNames: data.otherNames,
//         admissionNo: data.admissionNo,
//         dob: new Date(data.dob),
//         gender: data.gender,
//         nationality: data.nationality,
//         enrolledById,
//         NIN: data.NIN,
//         bloodGroup: data.bloodGroup,
//         village: data.village,
//         religion: data.religion,
//         parentId: data.parentId,
//         medicalConditions: data.medicalConditions,
//         disability: data.disability,
//         previousSchool: data.previousSchool,
//         schoolId,
//         imageUrl: photoFiles?.[0]?.publicUrl ?? null,
//         classYearId: data.classYearId,
//         streamId: data.streamId || null,
//         studentPhone: data.studentPhone || undefined,
//         studentEmail: data.studentEmail || undefined,
//         studentPassword: data.studentPassword || undefined,
//       };
//       const result = await createStudentSmart(payload);

//       if (result.ok === true) {
//         toast.success(
//           `Student created}`
//         );
//         form.reset();
//         setPhotoFiles(undefined);
//         onOpenChange(false);
//         window.location.reload();
//       } else {
//         toast.error(result.message ?? "Failed to create student");
//       }
//     } catch (err: unknown) {
//       toast.error(
//         err instanceof Error ? err.message : "Something went wrong. Please try again."
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111827] border-zinc-200 dark:border-slate-700/60">
//         <DialogHeader>
//           <DialogTitle className="text-zinc-900 dark:text-white text-xl font-semibold">
//             Add New Student
//           </DialogTitle>
//           <DialogDescription className="text-zinc-500 dark:text-slate-400">
//             Register a new student and enrol them in a class. Fields marked * are required.
//           </DialogDescription>
//         </DialogHeader>

//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-2">

//             {/* ── Profile Photo ─────────────────────────────────── */}
//             <div>
//               <SectionHeader>Profile Photo</SectionHeader>
//               <Dropzone
//                 provider="cloudflare-r2"
//                 variant="avatar"
//                 maxFiles={1}
//                 maxSize={1024 * 1024 * 5}
//                 onFilesChange={setPhotoFiles}
//               />
//               <p className={cn(descCls, "mt-2")}>Optional · Max 5 MB</p>
//             </div>

//             {/* ── Personal Information ───────────────────────── */}
//             <div>
//               <SectionHeader>Personal Information</SectionHeader>
//               <div className="grid grid-cols-2 gap-4">

//                 <FormField control={form.control} name="firstName" render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className={labelCls}>First Name *</FormLabel>
//                     <FormControl><Input placeholder="John" className={inputCls} {...field} /></FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )} />

//                 <FormField control={form.control} name="lastName" render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className={labelCls}>Last Name *</FormLabel>
//                     <FormControl><Input placeholder="Doe" className={inputCls} {...field} /></FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )} />

//                 <FormField control={form.control} name="otherNames" render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className={labelCls}>Other Names</FormLabel>
//                     <FormControl><Input placeholder="Middle names" className={inputCls} {...field} /></FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )} />

//                 {/* Admission No */}
//                 <FormField control={form.control} name="admissionNo" render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className={labelCls}>Admission Number *</FormLabel>
//                     <div className="flex gap-2">
//                       <FormControl>
//                         <Input
//                           placeholder="STD000001"
//                           readOnly
//                           className={cn(inputCls, "flex-1 font-mono bg-zinc-50 dark:bg-[#0d1117]")}
//                           {...field}
//                         />
//                       </FormControl>
//                       <Button
//                         type="button" variant="outline" size="icon"
//                         onClick={generateAdmissionNumber}
//                         className="border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#1a2236] text-zinc-600 dark:text-slate-400 hover:bg-zinc-50 dark:hover:bg-[#1e2a42]"
//                         title="Generate new admission number"
//                       >
//                         <RefreshCw className="h-4 w-4" />
//                       </Button>
//                     </div>
//                     <FormDescription className={descCls}>Format: STD followed by 6 digits</FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )} />

//                 <FormField control={form.control} name="dob" render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className={labelCls}>Date of Birth *</FormLabel>
//                     <FormControl><Input type="date" className={inputCls} {...field} /></FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )} />

//                 {/* Gender */}
//                 <FormField control={form.control} name="gender" render={({ field }) => (
//                   <FormItem className="flex flex-col">
//                     <FormLabel className={labelCls}>Gender *</FormLabel>
//                     <Popover open={genderOpen} onOpenChange={setGenderOpen}>
//                       <PopoverTrigger asChild>
//                         <FormControl>
//                           <Button variant="outline" role="combobox" disabled={isLoading} className={comboTrigger(!!field.value)}>
//                             {field.value ? genderOptions.find((g) => g.value === field.value)?.label : "Select gender"}
//                             <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                           </Button>
//                         </FormControl>
//                       </PopoverTrigger>
//                       <PopoverContent className={popoverContentCls} align="start">
//                         <Command className="bg-transparent">
//                           <CommandInput placeholder="Search gender..." className="text-zinc-900 dark:text-white" />
//                           <CommandList>
//                             <CommandEmpty className="text-zinc-500 dark:text-slate-400 py-3 text-center text-sm">No option found.</CommandEmpty>
//                             <CommandGroup>
//                               {genderOptions.map((g) => (
//                                 <CommandItem key={g.value} value={g.label} onSelect={() => { form.setValue("gender", g.value); setGenderOpen(false); }} className={commandItemCls}>
//                                   <Check className={cn("mr-2 h-4 w-4", g.value === field.value ? "opacity-100" : "opacity-0")} />
//                                   {g.label}
//                                 </CommandItem>
//                               ))}
//                             </CommandGroup>
//                           </CommandList>
//                         </Command>
//                       </PopoverContent>
//                     </Popover>
//                     <FormMessage />
//                   </FormItem>
//                 )} />

//                 <FormField control={form.control} name="nationality" render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className={labelCls}>Nationality *</FormLabel>
//                     <FormControl><Input placeholder="Ugandan" className={inputCls} {...field} /></FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )} />

//                 <FormField control={form.control} name="NIN" render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className={labelCls}>National ID (NIN)</FormLabel>
//                     <FormControl><Input placeholder="CM12345678901234" className={inputCls} {...field} /></FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )} />

//                 {/* Blood Group */}
//                 <FormField control={form.control} name="bloodGroup" render={({ field }) => (
//                   <FormItem className="flex flex-col">
//                     <FormLabel className={labelCls}>Blood Group</FormLabel>
//                     <Popover open={bloodGroupOpen} onOpenChange={setBloodGroupOpen}>
//                       <PopoverTrigger asChild>
//                         <FormControl>
//                           <Button variant="outline" role="combobox" disabled={isLoading} className={comboTrigger(!!field.value)}>
//                             {field.value || "Select blood group"}
//                             <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                           </Button>
//                         </FormControl>
//                       </PopoverTrigger>
//                       <PopoverContent className={popoverContentCls} align="start">
//                         <Command className="bg-transparent">
//                           <CommandInput placeholder="Search blood group..." className="text-zinc-900 dark:text-white" />
//                           <CommandList>
//                             <CommandEmpty className="text-zinc-500 dark:text-slate-400 py-3 text-center text-sm">No option found.</CommandEmpty>
//                             <CommandGroup>
//                               <CommandItem value="not-specified" onSelect={() => { form.setValue("bloodGroup", undefined); setBloodGroupOpen(false); }} className={commandItemCls}>
//                                 <Check className={cn("mr-2 h-4 w-4", !field.value ? "opacity-100" : "opacity-0")} />
//                                 Not specified
//                               </CommandItem>
//                               {bloodGroupOptions.map((bg) => (
//                                 <CommandItem key={bg} value={bg} onSelect={() => { form.setValue("bloodGroup", bg); setBloodGroupOpen(false); }} className={commandItemCls}>
//                                   <Check className={cn("mr-2 h-4 w-4", bg === field.value ? "opacity-100" : "opacity-0")} />
//                                   {bg}
//                                 </CommandItem>
//                               ))}
//                             </CommandGroup>
//                           </CommandList>
//                         </Command>
//                       </PopoverContent>
//                     </Popover>
//                     <FormMessage />
//                   </FormItem>
//                 )} />

//                 <FormField control={form.control} name="religion" render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className={labelCls}>Religion</FormLabel>
//                     <FormControl><Input placeholder="Christian, Muslim, etc." className={inputCls} {...field} /></FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )} />

//                 <FormField control={form.control} name="village" render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className={labelCls}>Village/Location</FormLabel>
//                     <FormControl><Input placeholder="Village or area" className={inputCls} {...field} /></FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )} />
//               </div>
//             </div>

//             {/* ── Parent / Guardian ──────────────────────────── */}
//             <div>
//               <SectionHeader>Parent / Guardian</SectionHeader>
//               <FormField control={form.control} name="parentId" render={({ field }) => (
//                 <FormItem className="flex flex-col">
//                   <FormLabel className={labelCls}>Select Parent/Guardian *</FormLabel>
//                   <Popover open={parentOpen} onOpenChange={setParentOpen}>
//                     <PopoverTrigger asChild>
//                       <FormControl>
//                         <Button variant="outline" role="combobox" disabled={isLoading} className={comboTrigger(!!field.value)}>
//                           {field.value
//                             ? (() => { const p = parents.find((p) => p.id === field.value); return p ? `${p.firstName} ${p.lastName} — ${p.phone}` : "Select parent or guardian"; })()
//                             : "Select parent or guardian"}
//                           <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                         </Button>
//                       </FormControl>
//                     </PopoverTrigger>
//                     <PopoverContent className={popoverContentCls} align="start">
//                       <Command className="bg-transparent">
//                         <CommandInput placeholder="Search parent..." className="text-zinc-900 dark:text-white" />
//                         <CommandList>
//                           <CommandEmpty className="text-zinc-500 dark:text-slate-400 py-3 text-center text-sm">No parent found.</CommandEmpty>
//                           <CommandGroup>
//                             {parents.map((p) => (
//                               <CommandItem key={p.id} value={`${p.firstName} ${p.lastName} ${p.phone}`} onSelect={() => { form.setValue("parentId", p.id); setParentOpen(false); }} className={commandItemCls}>
//                                 <Check className={cn("mr-2 h-4 w-4", p.id === field.value ? "opacity-100" : "opacity-0")} />
//                                 {p.firstName} {p.lastName} — {p.phone}
//                               </CommandItem>
//                             ))}
//                           </CommandGroup>
//                         </CommandList>
//                       </Command>
//                     </PopoverContent>
//                   </Popover>
//                   <FormDescription className={descCls}>
//                     If the parent is not listed, add them in the Parents section first.
//                   </FormDescription>
//                   <FormMessage />
//                 </FormItem>
//               )} />
//             </div>

//             {/* ── Class Enrolment ────────────────────────────── */}
//             <div>
//               <SectionHeader>Class Enrolment</SectionHeader>
//               <div className="grid grid-cols-2 gap-4">
//                 {/* Class Year */}
//                 <FormField control={form.control} name="classYearId" render={({ field }) => (
//                   <FormItem className="flex flex-col">
//                     <FormLabel className={labelCls}>Class *</FormLabel>
//                     <Popover open={classYearOpen} onOpenChange={setClassYearOpen}>
//                       <PopoverTrigger asChild>
//                         <FormControl>
//                           <Button variant="outline" role="combobox" disabled={isLoading} className={comboTrigger(!!field.value)}>
//                             {field.value ? classYears.find((c) => c.id === field.value)?.name : "Select class"}
//                             <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                           </Button>
//                         </FormControl>
//                       </PopoverTrigger>
//                       <PopoverContent className={popoverContentCls} align="start">
//                         <Command className="bg-transparent">
//                           <CommandInput placeholder="Search class..." className="text-zinc-900 dark:text-white" />
//                           <CommandList>
//                             <CommandEmpty className="text-zinc-500 dark:text-slate-400 py-3 text-center text-sm">No class found.</CommandEmpty>
//                             <CommandGroup>
//                               {classYears.map((c) => (
//                                 <CommandItem key={c.id} value={c.name} onSelect={() => { form.setValue("classYearId", c.id); setClassYearOpen(false); }} className={commandItemCls}>
//                                   <Check className={cn("mr-2 h-4 w-4", c.id === field.value ? "opacity-100" : "opacity-0")} />
//                                   {c.name}
//                                 </CommandItem>
//                               ))}
//                             </CommandGroup>
//                           </CommandList>
//                         </Command>
//                       </PopoverContent>
//                     </Popover>
//                     <FormDescription className={descCls}>Student will be enrolled in the active term.</FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )} />

//                 {/* Stream */}
//                 {availableStreams.length > 0 && (
//                   <FormField control={form.control} name="streamId" render={({ field }) => (
//                     <FormItem className="flex flex-col">
//                       <FormLabel className={labelCls}>Stream (Optional)</FormLabel>
//                       <Popover open={streamOpen} onOpenChange={setStreamOpen}>
//                         <PopoverTrigger asChild>
//                           <FormControl>
//                             <Button variant="outline" role="combobox" disabled={isLoading} className={comboTrigger(!!field.value)}>
//                               {field.value ? availableStreams.find((s) => s.id === field.value)?.name : "Select stream (optional)"}
//                               <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                             </Button>
//                           </FormControl>
//                         </PopoverTrigger>
//                         <PopoverContent className={popoverContentCls} align="start">
//                           <Command className="bg-transparent">
//                             <CommandInput placeholder="Search stream..." className="text-zinc-900 dark:text-white" />
//                             <CommandList>
//                               <CommandEmpty className="text-zinc-500 dark:text-slate-400 py-3 text-center text-sm">No stream found.</CommandEmpty>
//                               <CommandGroup>
//                                 <CommandItem value="no-stream" onSelect={() => { form.setValue("streamId", undefined); setStreamOpen(false); }} className={commandItemCls}>
//                                   <Check className={cn("mr-2 h-4 w-4", !field.value ? "opacity-100" : "opacity-0")} />
//                                   No Stream
//                                 </CommandItem>
//                                 {availableStreams.map((s) => (
//                                   <CommandItem key={s.id} value={s.name} onSelect={() => { form.setValue("streamId", s.id); setStreamOpen(false); }} className={commandItemCls}>
//                                     <Check className={cn("mr-2 h-4 w-4", s.id === field.value ? "opacity-100" : "opacity-0")} />
//                                     {s.name}
//                                   </CommandItem>
//                                 ))}
//                               </CommandGroup>
//                             </CommandList>
//                           </Command>
//                         </PopoverContent>
//                       </Popover>
//                       <FormMessage />
//                     </FormItem>
//                   )} />
//                 )}
//               </div>
//             </div>

//             {/* ── Student Login Credentials ──────────────────── */}
//             <div>
//               <SectionHeader>
//                 <KeyRound className="h-3.5 w-3.5" />
//                 Student Login Credentials
//               </SectionHeader>
//               <p className={cn(descCls, "mb-4 -mt-2")}>
//                 All fields optional. Defaults: login ID = admission number, password ={" "}
//                 <span className="font-mono">Student@&lt;admissionNo&gt;</span>.
//               </p>
//               <div className="grid grid-cols-2 gap-4">

//                 <FormField control={form.control} name="studentPhone" render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className={labelCls}>Student Phone</FormLabel>
//                     <FormControl>
//                       <Input placeholder="+256 700 000000" className={inputCls} {...field} />
//                     </FormControl>
//                     <FormDescription className={descCls}>Used for student account login</FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )} />

//                 <FormField control={form.control} name="studentEmail" render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className={labelCls}>Student Email</FormLabel>
//                     <FormControl>
//                       <Input type="email" placeholder="student@school.ac.ug" className={inputCls} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )} />

//                 <FormField control={form.control} name="studentPassword" render={({ field }) => (
//                   <FormItem className="col-span-2">
//                     <FormLabel className={labelCls}>Initial Password</FormLabel>
//                     <div className="relative">
//                       <FormControl>
//                         <Input
//                           type={showPassword ? "text" : "password"}
//                           placeholder="Min. 8 characters"
//                           className={cn(inputCls, "pr-10")}
//                           {...field}
//                         />
//                       </FormControl>
//                       <button
//                         type="button"
//                         onClick={() => setShowPassword((v) => !v)}
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-slate-500 hover:text-zinc-600 dark:hover:text-slate-300 transition-colors"
//                       >
//                         {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                       </button>
//                     </div>
//                     <FormDescription className={descCls}>
//                       Leave blank to auto-generate as{" "}
//                       <span className="font-mono">Student@&lt;admissionNo&gt;</span>
//                     </FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )} />
//               </div>
//             </div>

//             {/* ── Health & Additional ────────────────────────── */}
//             <div>
//               <SectionHeader>Health &amp; Additional Information</SectionHeader>
//               <div className="grid grid-cols-1 gap-4">

//                 <FormField control={form.control} name="medicalConditions" render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className={labelCls}>Medical Conditions</FormLabel>
//                     <FormControl>
//                       <Textarea placeholder="Any medical conditions or allergies..." className={inputCls} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )} />

//                 <FormField control={form.control} name="disability" render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className={labelCls}>Disability (if any)</FormLabel>
//                     <FormControl>
//                       <Textarea placeholder="Any physical or learning disabilities..." className={inputCls} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )} />

//                 <FormField control={form.control} name="previousSchool" render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className={labelCls}>Previous School</FormLabel>
//                     <FormControl>
//                       <Input placeholder="Name of previous school" className={inputCls} {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )} />
//               </div>
//             </div>

//             {/* ── Footer Actions ─────────────────────────────── */}
//             <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-slate-700/60">
//               <Button
//                 type="button" variant="outline"
//                 onClick={() => onOpenChange(false)}
//                 disabled={isLoading}
//                 className="border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#1a2236] text-zinc-700 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-[#1e2a42]"
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit" disabled={isLoading}
//                 className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600"
//               >
//                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//                 Add Student
//               </Button>
//             </div>

//           </form>
//         </Form>
//       </DialogContent>
//     </Dialog>
//   );
// }




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
  FormDescription,
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
import {
  Loader2,
  RefreshCw,
  Check,
  ChevronsUpDown,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createStudentSmart } from "@/actions/student-create";
import { getALevelSubjectsForRegistration } from "@/actions/students";

// ════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ════════════════════════════════════════════════════════════════════════════

const studentSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  otherNames: z.string().optional(),
  admissionNo: z
    .string()
    .min(1, "Admission number is required"),
  linNumber: z.string().optional(),
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
  classYearId: z.string().min(1, "Class is required"),
  streamId: z.string().optional(),

  // ── Login credentials ────────────────────────────────────────────────────
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\+?[\d\s\-()]+$/, "Enter a valid phone number"),

  // Optional — defaults to admissionNo on the server side if omitted
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
});

type FormData = z.infer<typeof studentSchema>;

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type Parent = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
};

type ClassYear = {
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
  subjectLevel: string;
  isGeneralPaper: boolean;
};

type Stream = {
  id: string;
  name: string;
  classYearId: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parents: Parent[];
  classYears: ClassYear[];
  streams: Stream[];
  schoolId: string;
  schoolCode: string;
  enrolledById: string;
};

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-slate-500 border-b border-zinc-100 dark:border-slate-700/60 pb-2 mb-4">
      {children}
    </h3>
  );
}

const inputCls =
  "bg-white dark:bg-[#1a2236] border-zinc-200 dark:border-slate-700/60 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-slate-500";

const labelCls = "text-zinc-700 dark:text-slate-300";
const descCls  = "text-zinc-400 dark:text-slate-500 text-xs";

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function AddStudentDialog({
  open,
  onOpenChange,
  parents,
  classYears,
  streams,
  schoolId,
  schoolCode,
  enrolledById,
}: Props) {
  const [isLoading, setIsLoading]           = useState(false);
  const router = useRouter();
  const [photoFiles, setPhotoFiles]         = useState<FileWithMetadata[]>();
  const [availableStreams, setAvailableStreams] = useState<Stream[]>([]);
  const [showPassword, setShowPassword]     = useState(false);

  // A-level subject combination selection
  const [showSubjectStep, setShowSubjectStep]   = useState(false);
  const [aLevelSubjects, setALevelSubjects]     = useState<ALevelSubject[]>([]);
  const [selectedMajorIds, setSelectedMajorIds] = useState<Set<string>>(new Set());
  const [selectedSubIds, setSelectedSubIds]     = useState<Set<string>>(new Set());
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [pendingFormData, setPendingFormData]   = useState<FormData | null>(null);

  const [genderOpen,     setGenderOpen]     = useState(false);
  const [bloodGroupOpen, setBloodGroupOpen] = useState(false);
  const [parentOpen,     setParentOpen]     = useState(false);
  const [classYearOpen,  setClassYearOpen]  = useState(false);
  const [streamOpen,     setStreamOpen]     = useState(false);

  const genderOptions = [
    { value: "MALE",   label: "Male"   },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER",  label: "Other"  },
  ] as const;

  const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const form = useForm<FormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName:         "",
      lastName:          "",
      otherNames:        "",
      admissionNo:       "",
      linNumber:         "",
      dob:               "",
      gender:            "MALE",
      nationality:       "Ugandan",
      NIN:               "",
      bloodGroup:        undefined,
      village:           "",
      religion:          "",
      parentId:          "",
      medicalConditions: "",
      disability:        "",
      previousSchool:    "",
      classYearId:       "",
      streamId:          undefined,
      // ── credentials ──
      phone:    "",
      password: "",
    },
  });

  const selectedClassYearId = form.watch("classYearId");

  useEffect(() => {
    if (open) generateAdmissionNumber();
  }, [open]);

  useEffect(() => {
    if (selectedClassYearId) {
      const filtered = streams.filter((s) => s.classYearId === selectedClassYearId);
      setAvailableStreams(filtered);
      const cur = form.getValues("streamId");
      if (cur && !filtered.find((s) => s.id === cur)) {
        form.setValue("streamId", undefined);
      }
    } else {
      setAvailableStreams([]);
      form.setValue("streamId", undefined);
    }
  }, [selectedClassYearId, streams, form]);

  const generateAdmissionNumber = () => {
    const prefix = schoolCode.slice(0, 3).toUpperCase();
    const now = new Date();
    const year = now.getFullYear();
    const monthStr = String(now.getMonth() + 1).padStart(2, "0");
    const seq = String(Math.floor(1 + Math.random() * 999)).padStart(3, "0");
    form.setValue("admissionNo", `${prefix}STD${year}${monthStr}${seq}`);
  };

  const popoverContentCls =
    "w-full p-0 bg-white dark:bg-[#111827] border-zinc-200 dark:border-slate-700/60";
  const commandItemCls =
    "text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-[#1a2236] cursor-pointer";

  const comboTrigger = (hasValue: boolean) =>
    cn(
      "w-full justify-between bg-white dark:bg-[#1a2236]",
      "border-zinc-200 dark:border-slate-700/60",
      "text-zinc-900 dark:text-white",
      "hover:bg-zinc-50 dark:hover:bg-[#1e2a42]",
      !hasValue && "text-zinc-400 dark:text-slate-500"
    );

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isALevel = () => {
    const cy = classYears.find((c) => c.id === form.getValues("classYearId"));
    return cy?.classLevel === "A_LEVEL";
  };

  const submitStudent = async (data: FormData, selectedSubjectIds?: string[]) => {
    setIsLoading(true);
    try {
      const result = await createStudentSmart({
        firstName:         data.firstName,
        lastName:          data.lastName,
        otherNames:        data.otherNames,
        admissionNo:       data.admissionNo,
        linNumber:         data.linNumber || undefined,
        dob:               new Date(data.dob),
        gender:            data.gender,
        nationality:       data.nationality,
        NIN:               data.NIN,
        bloodGroup:        data.bloodGroup,
        village:           data.village,
        religion:          data.religion,
        parentId:          data.parentId,
        medicalConditions: data.medicalConditions,
        disability:        data.disability,
        previousSchool:    data.previousSchool,
        schoolId,
        imageUrl:          photoFiles?.[0]?.publicUrl ?? null,
        classYearId:       data.classYearId,
        streamId:          data.streamId || null,
        selectedSubjectIds,
        enrolledById,
        phone:    data.phone,
        password: data.password || undefined,
      });

      if (result.ok === true) {
        const loginId   = result.userAccount?.loginId;
        const defPwd    = result.userAccount?.defaultPassword;
        const invoiceNo = result.feeInvoice?.invoiceNo;

        toast.success("Student created successfully!", {
          description: [
            `Login ID: ${loginId}`,
            defPwd !== "custom" ? `Default password: ${defPwd}` : "Custom password set",
            invoiceNo ? `Invoice: ${invoiceNo}` : null,
          ]
            .filter(Boolean)
            .join(" · "),
          duration: 8000,
        });

        form.reset();
        setPhotoFiles(undefined);
        setShowSubjectStep(false);
        setALevelSubjects([]);
        setSelectedMajorIds(new Set());
        setSelectedSubIds(new Set());
        setPendingFormData(null);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.message ?? "Failed to create student");
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    if (isALevel()) {
      // Step 1 → fetch subjects & show picker
      const streamId = data.streamId;
      if (!streamId) {
        toast.error("Please select a stream before proceeding.");
        return;
      }
      setIsLoadingSubjects(true);
      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out. Please try again.")), 15000)
        );
        const res = await Promise.race([
          getALevelSubjectsForRegistration(streamId),
          timeout,
        ]);
        if (!res.ok || res.data.length === 0) {
          toast.error("No A-level subjects found for this stream. Please assign subjects to this stream first.");
          return;
        }
        const subjects = res.data;
        setALevelSubjects(subjects);
        // Auto-select General Paper
        const gp = subjects.find((s) => s.isGeneralPaper);
        setSelectedSubIds(gp ? new Set([gp.id]) : new Set());
        setSelectedMajorIds(new Set());
        setPendingFormData(data);
        setShowSubjectStep(true);
      } finally {
        setIsLoadingSubjects(false);
      }
    } else {
      // O-level: submit directly
      await submitStudent(data);
    }
  };

  // ── A-level confirm ───────────────────────────────────────────────────────
  const onConfirmALevel = async () => {
    if (!pendingFormData) return;
    if (selectedMajorIds.size !== 3) {
      toast.error("Please select exactly 3 principal subjects.");
      return;
    }

    const gpSubject = aLevelSubjects.find((s) => s.isGeneralPaper);
    const hasGP     = gpSubject ? selectedSubIds.has(gpSubject.id) : false;

    if (gpSubject && !hasGP) {
      toast.error("General Paper is compulsory and must be selected.");
      return;
    }

    const nonGPSubCount = [...selectedSubIds].filter((id) => {
      const s = aLevelSubjects.find((x) => x.id === id);
      return s && !s.isGeneralPaper;
    }).length;

    if (nonGPSubCount < 1) {
      toast.error("Please select 1 subsidiary subject (besides General Paper).");
      return;
    }
    if (nonGPSubCount > 1) {
      toast.error("You can only select 1 subsidiary subject.");
      return;
    }

    const allSelected = [...selectedMajorIds, ...selectedSubIds];
    await submitStudent(pendingFormData, allSelected);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setShowSubjectStep(false);
      setALevelSubjects([]);
      setSelectedMajorIds(new Set());
      setSelectedSubIds(new Set());
      setPendingFormData(null);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111827] border-zinc-200 dark:border-slate-700/60">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white text-xl font-semibold">
            {showSubjectStep ? "Select Subject Combination" : "Add New Student"}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-slate-400">
            {showSubjectStep
              ? "Choose 3 principal subjects and 2 subsidiary subjects (General Paper is compulsory)."
              : "Register a new student and enrol them in a class. Fields marked * are required."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-2">

            {/* ── Form fields hidden during subject step ─────────────── */}
            <div className={showSubjectStep ? "hidden" : undefined}>

            {/* ── Profile Photo ──────────────────────────────────────── */}
            <div>
              <SectionHeader>Profile Photo</SectionHeader>
              <Dropzone
                provider="cloudflare-r2"
                variant="avatar"
                maxFiles={1}
                maxSize={1024 * 1024 * 5}
                onFilesChange={setPhotoFiles}
              />
              <p className={cn(descCls, "mt-2")}>Optional · Max 5 MB</p>
            </div>

            {/* ── Personal Information ───────────────────────────────── */}
            <div>
              <SectionHeader>Personal Information</SectionHeader>
              <div className="grid grid-cols-2 gap-4">

                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>First Name *</FormLabel>
                    <FormControl><Input placeholder="John" className={inputCls} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Last Name *</FormLabel>
                    <FormControl><Input placeholder="Doe" className={inputCls} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="otherNames" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Other Names</FormLabel>
                    <FormControl><Input placeholder="Middle names" className={inputCls} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Admission No */}
                <FormField control={form.control} name="admissionNo" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Admission Number *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="STD000001"
                          readOnly
                          className={cn(inputCls, "flex-1 font-mono bg-zinc-50 dark:bg-[#0d1117]")}
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button" variant="outline" size="icon"
                        onClick={generateAdmissionNumber}
                        className="border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#1a2236] text-zinc-600 dark:text-slate-400 hover:bg-zinc-50 dark:hover:bg-[#1e2a42]"
                        title="Generate new admission number"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormDescription className={descCls}>Auto-generated: school code + STD + 7 digits (e.g. SMCSTD1234567)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="dob" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Date of Birth *</FormLabel>
                    <FormControl><Input type="date" className={inputCls} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Gender */}
                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className={labelCls}>Gender *</FormLabel>
                    <Popover open={genderOpen} onOpenChange={setGenderOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" disabled={isLoading} className={comboTrigger(!!field.value)}>
                            {field.value ? genderOptions.find((g) => g.value === field.value)?.label : "Select gender"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className={popoverContentCls} align="start">
                        <Command className="bg-transparent">
                          <CommandInput placeholder="Search gender..." className="text-zinc-900 dark:text-white" />
                          <CommandList>
                            <CommandEmpty className="text-zinc-500 dark:text-slate-400 py-3 text-center text-sm">No option found.</CommandEmpty>
                            <CommandGroup>
                              {genderOptions.map((g) => (
                                <CommandItem key={g.value} value={g.label} onSelect={() => { form.setValue("gender", g.value); setGenderOpen(false); }} className={commandItemCls}>
                                  <Check className={cn("mr-2 h-4 w-4", g.value === field.value ? "opacity-100" : "opacity-0")} />
                                  {g.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="nationality" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Nationality *</FormLabel>
                    <FormControl><Input placeholder="Ugandan" className={inputCls} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="NIN" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>National ID (NIN)</FormLabel>
                    <FormControl><Input placeholder="CM12345678901234" className={inputCls} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="linNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>LIN Number <span className="text-zinc-400 dark:text-slate-500 font-normal">(optional)</span></FormLabel>
                    <FormControl><Input placeholder="e.g. LIN1234567" className={inputCls} {...field} /></FormControl>
                    <FormDescription className={descCls}>Learner Identification Number — can also be used to sign in.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Blood Group */}
                <FormField control={form.control} name="bloodGroup" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className={labelCls}>Blood Group</FormLabel>
                    <Popover open={bloodGroupOpen} onOpenChange={setBloodGroupOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" disabled={isLoading} className={comboTrigger(!!field.value)}>
                            {field.value || "Select blood group"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className={popoverContentCls} align="start">
                        <Command className="bg-transparent">
                          <CommandInput placeholder="Search blood group..." className="text-zinc-900 dark:text-white" />
                          <CommandList>
                            <CommandEmpty className="text-zinc-500 dark:text-slate-400 py-3 text-center text-sm">No option found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem value="not-specified" onSelect={() => { form.setValue("bloodGroup", undefined); setBloodGroupOpen(false); }} className={commandItemCls}>
                                <Check className={cn("mr-2 h-4 w-4", !field.value ? "opacity-100" : "opacity-0")} />
                                Not specified
                              </CommandItem>
                              {bloodGroupOptions.map((bg) => (
                                <CommandItem key={bg} value={bg} onSelect={() => { form.setValue("bloodGroup", bg); setBloodGroupOpen(false); }} className={commandItemCls}>
                                  <Check className={cn("mr-2 h-4 w-4", bg === field.value ? "opacity-100" : "opacity-0")} />
                                  {bg}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="religion" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Religion</FormLabel>
                    <FormControl><Input placeholder="Christian, Muslim, etc." className={inputCls} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="village" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Village/Location</FormLabel>
                    <FormControl><Input placeholder="Village or area" className={inputCls} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* ── Parent / Guardian ──────────────────────────────────── */}
            <div>
              <SectionHeader>Parent / Guardian</SectionHeader>
              <FormField control={form.control} name="parentId" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className={labelCls}>Select Parent/Guardian *</FormLabel>
                  <Popover open={parentOpen} onOpenChange={setParentOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" role="combobox" disabled={isLoading} className={comboTrigger(!!field.value)}>
                          {field.value
                            ? (() => { const p = parents.find((p) => p.id === field.value); return p ? `${p.firstName} ${p.lastName} — ${p.phone}` : "Select parent or guardian"; })()
                            : "Select parent or guardian"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className={popoverContentCls} align="start">
                      <Command className="bg-transparent">
                        <CommandInput placeholder="Search parent..." className="text-zinc-900 dark:text-white" />
                        <CommandList>
                          <CommandEmpty className="text-zinc-500 dark:text-slate-400 py-3 text-center text-sm">No parent found.</CommandEmpty>
                          <CommandGroup>
                            {parents.map((p) => (
                              <CommandItem key={p.id} value={`${p.firstName} ${p.lastName} ${p.phone}`} onSelect={() => { form.setValue("parentId", p.id); setParentOpen(false); }} className={commandItemCls}>
                                <Check className={cn("mr-2 h-4 w-4", p.id === field.value ? "opacity-100" : "opacity-0")} />
                                {p.firstName} {p.lastName} — {p.phone}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription className={descCls}>
                    If the parent is not listed, add them in the Parents section first.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* ── Class Enrolment ────────────────────────────────────── */}
            <div>
              <SectionHeader>Class Enrolment</SectionHeader>
              <div className="grid grid-cols-2 gap-4">

                <FormField control={form.control} name="classYearId" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className={labelCls}>Class *</FormLabel>
                    <Popover open={classYearOpen} onOpenChange={setClassYearOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" disabled={isLoading} className={comboTrigger(!!field.value)}>
                            {field.value ? classYears.find((c) => c.id === field.value)?.name : "Select class"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className={popoverContentCls} align="start">
                        <Command className="bg-transparent">
                          <CommandInput placeholder="Search class..." className="text-zinc-900 dark:text-white" />
                          <CommandList>
                            <CommandEmpty className="text-zinc-500 dark:text-slate-400 py-3 text-center text-sm">No class found.</CommandEmpty>
                            <CommandGroup>
                              {classYears.map((c) => (
                                <CommandItem key={c.id} value={c.name} onSelect={() => { form.setValue("classYearId", c.id); setClassYearOpen(false); }} className={commandItemCls}>
                                  <Check className={cn("mr-2 h-4 w-4", c.id === field.value ? "opacity-100" : "opacity-0")} />
                                  {c.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription className={descCls}>
                      Student will be enrolled in the active term.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                {availableStreams.length > 0 && (
                  <FormField control={form.control} name="streamId" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className={labelCls}>Stream (Optional)</FormLabel>
                      <Popover open={streamOpen} onOpenChange={setStreamOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" role="combobox" disabled={isLoading} className={comboTrigger(!!field.value)}>
                              {field.value ? availableStreams.find((s) => s.id === field.value)?.name : "Select stream (optional)"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className={popoverContentCls} align="start">
                          <Command className="bg-transparent">
                            <CommandInput placeholder="Search stream..." className="text-zinc-900 dark:text-white" />
                            <CommandList>
                              <CommandEmpty className="text-zinc-500 dark:text-slate-400 py-3 text-center text-sm">No stream found.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem value="no-stream" onSelect={() => { form.setValue("streamId", undefined); setStreamOpen(false); }} className={commandItemCls}>
                                  <Check className={cn("mr-2 h-4 w-4", !field.value ? "opacity-100" : "opacity-0")} />
                                  No Stream
                                </CommandItem>
                                {availableStreams.map((s) => (
                                  <CommandItem key={s.id} value={s.name} onSelect={() => { form.setValue("streamId", s.id); setStreamOpen(false); }} className={commandItemCls}>
                                    <Check className={cn("mr-2 h-4 w-4", s.id === field.value ? "opacity-100" : "opacity-0")} />
                                    {s.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </div>
            </div>

            {/* ── Student Login Credentials ──────────────────────────── */}
            <div>
              <SectionHeader>
                <KeyRound className="h-3.5 w-3.5" />
                Student Login Credentials
              </SectionHeader>
              <p className={cn(descCls, "mb-4 -mt-2")}>
                The student will log in using their{" "}
                <span className="font-semibold text-zinc-600 dark:text-slate-300">
                  Admission Number
                </span>{" "}
                as their Login ID. Phone is required to create the account.
                If no password is set, it defaults to the admission number.
              </p>
              <div className="grid grid-cols-2 gap-4">

                {/* ✅ phone — matches server action field name */}
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Student Phone *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+256 700 000000"
                        className={inputCls}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className={descCls}>
                      Required for the student&apos;s system account
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Login ID preview — read-only, derived from admissionNo */}
                <div className="space-y-2">
                  <label className={cn("text-sm font-medium", labelCls)}>
                    Login ID (auto-set)
                  </label>
                  <Input
                    readOnly
                    value={form.watch("admissionNo") || "Generated above"}
                    className={cn(inputCls, "font-mono bg-zinc-50 dark:bg-[#0d1117] cursor-not-allowed")}
                  />
                  <p className={descCls}>Student types this at the login screen</p>
                </div>

                {/* ✅ password — matches server action field name */}
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className={labelCls}>Initial Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Min. 8 characters (leave blank to use admission number)"
                          className={cn(inputCls, "pr-10")}
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-slate-500 hover:text-zinc-600 dark:hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FormDescription className={descCls}>
                      Leave blank — password defaults to the admission number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* ── Health & Additional ────────────────────────────────── */}
            <div>
              <SectionHeader>Health &amp; Additional Information</SectionHeader>
              <div className="grid grid-cols-1 gap-4">

                <FormField control={form.control} name="medicalConditions" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Medical Conditions</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any medical conditions or allergies..." className={inputCls} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="disability" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Disability (if any)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any physical or learning disabilities..." className={inputCls} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="previousSchool" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Previous School</FormLabel>
                    <FormControl>
                      <Input placeholder="Name of previous school" className={inputCls} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
            </div>{/* end hidden-during-subject-step */}

            {/* ── A-Level Subject Combination Picker ─────────────── */}
            {showSubjectStep && (
              <div className="rounded-lg border border-purple-200 dark:border-purple-800/50 bg-purple-50 dark:bg-purple-950/20 p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-1">
                    Select Subject Combination (A Level)
                  </h3>
                  <p className="text-xs text-purple-700 dark:text-purple-400">
                    Choose exactly <strong>3 Principal subjects</strong> and <strong>2 Subsidiary subjects</strong> (General Paper is compulsory).
                  </p>
                </div>

                {/* Principal (MAJOR) subjects */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-slate-400 mb-2">
                    Principal Subjects — select 3 ({selectedMajorIds.size}/3)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {aLevelSubjects
                      .filter((s) => s.aLevelCategory === "MAJOR")
                      .map((s) => {
                        const checked = selectedMajorIds.has(s.id);
                        const disabled = !checked && selectedMajorIds.size >= 3;
                        return (
                          <label
                            key={s.id}
                            className={cn(
                              "flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors",
                              checked
                                ? "border-purple-500 bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200"
                                : disabled
                                ? "border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-[#1a2236] text-zinc-400 dark:text-slate-600 cursor-not-allowed"
                                : "border-zinc-200 dark:border-slate-700 bg-white dark:bg-[#1a2236] text-zinc-800 dark:text-slate-200 hover:border-purple-300 dark:hover:border-purple-700"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => {
                                setSelectedMajorIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(s.id)) next.delete(s.id);
                                  else if (next.size < 3) next.add(s.id);
                                  return next;
                                });
                              }}
                              className="accent-purple-600"
                            />
                            <span className="flex-1">{s.name}</span>
                            {s.code && (
                              <span className="text-xs font-mono text-zinc-400 dark:text-slate-500">{s.code}</span>
                            )}
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Subsidiary subjects */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-slate-400 mb-2">
                    Subsidiary Subjects — General Paper (compulsory) + 1 more
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {aLevelSubjects
                      .filter((s) => s.aLevelCategory === "SUBSIDIARY" || s.isGeneralPaper)
                      .map((s) => {
                        const checked    = selectedSubIds.has(s.id);
                        const isGP       = s.isGeneralPaper;
                        const nonGPCount = [...selectedSubIds].filter((id) => {
                          const x = aLevelSubjects.find((a) => a.id === id);
                          return x && !x.isGeneralPaper;
                        }).length;
                        const disabled = isGP || (!checked && nonGPCount >= 1);
                        return (
                          <label
                            key={s.id}
                            className={cn(
                              "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                              isGP
                                ? "border-teal-400 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300 cursor-default"
                                : checked
                                ? "border-teal-500 bg-teal-100 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200 cursor-pointer"
                                : disabled
                                ? "border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-[#1a2236] text-zinc-400 dark:text-slate-600 cursor-not-allowed"
                                : "border-zinc-200 dark:border-slate-700 bg-white dark:bg-[#1a2236] text-zinc-800 dark:text-slate-200 hover:border-teal-300 dark:hover:border-teal-700 cursor-pointer"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => {
                                if (isGP) return;
                                setSelectedSubIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(s.id)) next.delete(s.id);
                                  else next.add(s.id);
                                  return next;
                                });
                              }}
                              className="accent-teal-600"
                            />
                            <span className="flex-1">{s.name}</span>
                            {isGP && (
                              <span className="text-[10px] font-semibold bg-teal-200 dark:bg-teal-800 text-teal-800 dark:text-teal-200 px-1.5 py-0.5 rounded">
                                Compulsory
                              </span>
                            )}
                            {s.code && !isGP && (
                              <span className="text-xs font-mono text-zinc-400 dark:text-slate-500">{s.code}</span>
                            )}
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Footer ────────────────────────────────────────────── */}
            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-slate-700/60">
              <Button
                type="button" variant="outline"
                onClick={() => {
                  if (showSubjectStep) {
                    setShowSubjectStep(false);
                    setPendingFormData(null);
                  } else {
                    onOpenChange(false);
                  }
                }}
                disabled={isLoading}
                className="border-zinc-200 dark:border-slate-700/60 bg-white dark:bg-[#1a2236] text-zinc-700 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-[#1e2a42]"
              >
                {showSubjectStep ? "Back" : "Cancel"}
              </Button>
              {showSubjectStep ? (
                <Button
                  type="button"
                  disabled={isLoading || selectedMajorIds.size !== 3}
                  onClick={onConfirmALevel}
                  className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-600"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm &amp; Register
                </Button>
              ) : (
                <Button
                  type="submit" disabled={isLoading || isLoadingSubjects}
                  className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  {(isLoading || isLoadingSubjects) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoadingSubjects ? "Loading subjects..." : "Add Student"}
                </Button>
              )}
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}