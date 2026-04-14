// // // app/school/[slug]/finance/fees/bursaries/components/BursariesClient.tsx
// // "use client";

// // import { useState, useTransition } from "react";
// // import { Button } from "@/components/ui/button";
// // import { Input } from "@/components/ui/input";
// // import { Label } from "@/components/ui/label";
// // import { Badge } from "@/components/ui/badge";
// // import {
// //   Dialog,
// //   DialogContent,
// //   DialogDescription,
// //   DialogFooter,
// //   DialogHeader,
// //   DialogTitle,
// //   DialogTrigger,
// // } from "@/components/ui/dialog";
// // import {
// //   Select,
// //   SelectContent,
// //   SelectItem,
// //   SelectTrigger,
// //   SelectValue,
// // } from "@/components/ui/select";
// // import {
// //   Table,
// //   TableBody,
// //   TableCell,
// //   TableHead,
// //   TableHeader,
// //   TableRow,
// // } from "@/components/ui/table";
// // import { Switch } from "@/components/ui/switch";
// // import {
// //   BadgeDollarSign,
// //   Edit2,
// //   Loader2,
// //   Plus,
// //   Search,
// //   UserPlus,
// //   Users,
// // } from "lucide-react";
// // import { toast } from "sonner";
// // import { assignBursaryToStudent, createBursary, toggleBursaryStatus, updateBursary } from "@/actions/fee-bursary-installment";


// // // ─── Types ────────────────────────────────────────────────────────────────────

// // type BursaryForUI = {
// //   id:               string;
// //   name:             string;
// //   code:             string;
// //   type:             string;   // "PERCENTAGE" | "FIXED"
// //   value:            number;
// //   description:      string;
// //   isActive:         boolean;
// //   assignedStudents: number;
// // };

// // type StudentOption = {
// //   id:    string;
// //   name:  string;
// //   admNo: string;
// //   class: string;
// // };

// // // ─── Create / Edit Dialog ─────────────────────────────────────────────────────

// // function BursaryDialog({
// //   mode,
// //   bursary,
// //   schoolId,
// //   onDone,
// //   trigger,
// // }: {
// //   mode:     "create" | "edit";
// //   bursary?: BursaryForUI;
// //   schoolId: string;
// //   onDone:   (b: BursaryForUI) => void;
// //   trigger:  React.ReactNode;
// // }) {
// //   const [open, setOpen]              = useState(false);
// //   const [isPending, startTransition] = useTransition();
// //   const [form, setForm]              = useState({
// //     name:        bursary?.name        ?? "",
// //     code:        bursary?.code        ?? "",
// //     type:        bursary?.type        ?? "PERCENTAGE",
// //     value:       bursary?.value?.toString() ?? "",
// //     description: bursary?.description ?? "",
// //   });

// //   function handleOpenChange(o: boolean) {
// //     setOpen(o);
// //     if (o && mode === "edit" && bursary) {
// //       setForm({
// //         name:        bursary.name,
// //         code:        bursary.code,
// //         type:        bursary.type,
// //         value:       bursary.value.toString(),
// //         description: bursary.description,
// //       });
// //     }
// //     if (o && mode === "create") {
// //       setForm({ name: "", code: "", type: "PERCENTAGE", value: "", description: "" });
// //     }
// //   }

// //   function handleSave() {
// //     startTransition(async () => {
// //       let result;

// //       if (mode === "create") {
// //         result = await createBursary({
// //           schoolId,
// //           name:        form.name.trim(),
// //           code:        form.code.trim().toUpperCase(),
// //           percentage:  form.type === "PERCENTAGE" ? Number(form.value) : undefined,
// //           fixedAmount: form.type === "FIXED"      ? Number(form.value) : undefined,
// //           description: form.description.trim() || undefined,
// //         });
// //       } else {
// //         result = await updateBursary(bursary!.id, {
// //           name:        form.name.trim(),
// //           percentage:  form.type === "PERCENTAGE" ? Number(form.value) : undefined,
// //           fixedAmount: form.type === "FIXED"      ? Number(form.value) : undefined,
// //           description: form.description.trim() || undefined,
// //         });
// //       }

// //       if (result.ok) {
// //         toast.success(
// //           mode === "create"
// //             ? `Bursary "${result.data.name}" created`
// //             : `Bursary "${result.data.name}" updated`
// //         );
// //         onDone({
// //           id:               result.data.id,
// //           name:             result.data.name,
// //           code:             result.data.code,
// //           type:             result.data.percentage !== null ? "PERCENTAGE" : "FIXED",
// //           value:            result.data.percentage !== null
// //                               ? (result.data.percentage ?? 0)
// //                               : (result.data.fixedAmount ?? 0),
// //           description:      result.data.description ?? "",
// //           isActive:         result.data.isActive,
// //           assignedStudents: bursary?.assignedStudents ?? 0,
// //         });
// //         setOpen(false);
// //       } else {
// //         toast.error(result.error);
// //       }
// //     });
// //   }

// //   const isValid =
// //     form.name.trim() &&
// //     form.code.trim() &&
// //     Number(form.value) > 0 &&
// //     (form.type !== "PERCENTAGE" || Number(form.value) <= 100);

// //   return (
// //     <Dialog open={open} onOpenChange={handleOpenChange}>
// //       <DialogTrigger asChild>{trigger}</DialogTrigger>
// //       <DialogContent className="sm:max-w-md">
// //         <DialogHeader>
// //           <DialogTitle>
// //             {mode === "create" ? "Create Bursary / Scholarship" : "Edit Bursary"}
// //           </DialogTitle>
// //           <DialogDescription>
// //             {mode === "create"
// //               ? "Define a bursary scheme. Assign individual students separately."
// //               : "Update the bursary details below."}
// //           </DialogDescription>
// //         </DialogHeader>

// //         <div className="space-y-4 py-2">
// //           <div className="space-y-1.5">
// //             <Label>Bursary Name</Label>
// //             <Input
// //               placeholder="e.g. Academic Excellence"
// //               value={form.name}
// //               onChange={(e) => setForm({ ...form, name: e.target.value })}
// //               className="border-slate-200"
// //               disabled={isPending}
// //             />
// //           </div>

// //           <div className="space-y-1.5">
// //             <Label>
// //               Code{" "}
// //               <span className="text-slate-400 font-normal text-xs">(uppercase)</span>
// //             </Label>
// //             <Input
// //               placeholder="ACAD_EXC"
// //               value={form.code}
// //               onChange={(e) =>
// //                 setForm({
// //                   ...form,
// //                   code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""),
// //                 })
// //               }
// //               className="border-slate-200 font-mono"
// //               maxLength={10}
// //               disabled={isPending}
// //             />
// //           </div>

// //           <div className="space-y-1.5">
// //             <Label>Discount Type</Label>
// //             <div className="grid grid-cols-2 gap-2">
// //               {(["PERCENTAGE", "FIXED"] as const).map((t) => (
// //                 <button
// //                   key={t}
// //                   type="button"
// //                   onClick={() => setForm({ ...form, type: t })}
// //                   disabled={isPending}
// //                   className={`border rounded-lg p-2.5 text-xs font-medium transition-all ${
// //                     form.type === t
// //                       ? "border-blue-400 bg-blue-50 text-blue-700"
// //                       : "border-slate-200 text-slate-600 hover:border-slate-300"
// //                   }`}
// //                 >
// //                   {t === "PERCENTAGE" ? "Percentage (%)" : "Fixed Amount (UGX)"}
// //                 </button>
// //               ))}
// //             </div>
// //           </div>

// //           <div className="space-y-1.5">
// //             <Label>
// //               {form.type === "PERCENTAGE" ? "Percentage (%)" : "Fixed Amount (UGX)"}
// //             </Label>
// //             <Input
// //               type="number"
// //               placeholder={form.type === "PERCENTAGE" ? "e.g. 50" : "e.g. 500000"}
// //               value={form.value}
// //               onChange={(e) => setForm({ ...form, value: e.target.value })}
// //               className="border-slate-200 font-mono"
// //               min={1}
// //               max={form.type === "PERCENTAGE" ? 100 : undefined}
// //               disabled={isPending}
// //             />
// //             {form.type === "PERCENTAGE" && Number(form.value) > 100 && (
// //               <p className="text-xs text-red-500">Percentage cannot exceed 100%</p>
// //             )}
// //           </div>

// //           <div className="space-y-1.5">
// //             <Label>Description</Label>
// //             <Input
// //               placeholder="Optional description"
// //               value={form.description}
// //               onChange={(e) => setForm({ ...form, description: e.target.value })}
// //               className="border-slate-200"
// //               disabled={isPending}
// //             />
// //           </div>
// //         </div>

// //         <DialogFooter>
// //           <Button
// //             variant="outline"
// //             onClick={() => setOpen(false)}
// //             disabled={isPending}
// //             className="border-slate-200"
// //           >
// //             Cancel
// //           </Button>
// //           <Button
// //             disabled={!isValid || isPending}
// //             onClick={handleSave}
// //             className="bg-blue-600 hover:bg-blue-700 text-white"
// //           >
// //             {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
// //             {mode === "create" ? "Create Bursary" : "Save Changes"}
// //           </Button>
// //         </DialogFooter>
// //       </DialogContent>
// //     </Dialog>
// //   );
// // }

// // // ─── Assign to Student Dialog ─────────────────────────────────────────────────

// // function AssignBursaryDialog({
// //   bursary,
// //   students,
// //   schoolId,
// //   onAssigned,
// // }: {
// //   bursary:    BursaryForUI;
// //   students:   StudentOption[];
// //     schoolId:   string;
// //   onAssigned: (bursaryId: string) => void;
// // }) {
// //   const [open, setOpen]              = useState(false);
// //   const [isPending, startTransition] = useTransition();
// //   const [form, setForm]              = useState({
// //     studentId:  "",
// //     validFrom:  "",
// //     validUntil: "",
// //   });

// //   function handleAssign() {
// //     startTransition(async () => {
// //   const result=await assignBursaryToStudent({
// //   bursaryId: bursary.id,
// //   studentId: form.studentId,
// //   schoolId: schoolId, // ← add this (from your component's props/context)
// //   validFrom: form.validFrom ? new Date(form.validFrom) : undefined,
// //   validUntil: form.validUntil ? new Date(form.validUntil) : undefined,
// //    });

// //       if (result.ok) {
// //         toast.success("Bursary assigned successfully");
// //         onAssigned(bursary.id);
// //         setOpen(false);
// //         setForm({ studentId: "", validFrom: "", validUntil: "" });
// //       } else {
// //         toast.error(result.error);
// //       }
// //     });
// //   }

// //   return (
// //     <Dialog open={open} onOpenChange={setOpen}>
// //       <DialogTrigger asChild>
// //         <Button
// //           variant="ghost"
// //           size="sm"
// //           className="h-7 px-2.5 text-xs text-blue-600 hover:bg-blue-50 gap-1"
// //         >
// //           <UserPlus className="w-3 h-3" /> Assign
// //         </Button>
// //       </DialogTrigger>
// //       <DialogContent className="sm:max-w-sm">
// //         <DialogHeader>
// //           <DialogTitle>Assign Bursary</DialogTitle>
// //           <DialogDescription>
// //             Assign <b>{bursary.name}</b> to a student with a validity window.
// //           </DialogDescription>
// //         </DialogHeader>

// //         <div className="space-y-4 py-2">
// //           <div className="space-y-1.5">
// //             <Label>Student</Label>
// //             <Select
// //               value={form.studentId}
// //               onValueChange={(v) => setForm({ ...form, studentId: v })}
// //               disabled={isPending}
// //             >
// //               <SelectTrigger className="border-slate-200">
// //                 <SelectValue placeholder="Select student…" />
// //               </SelectTrigger>
// //               <SelectContent>
// //                 {students.map((s) => (
// //                   <SelectItem key={s.id} value={s.id}>
// //                     <span className="font-medium">{s.name}</span>
// //                     <span className="text-slate-400 ml-2 text-xs">
// //                       {s.admNo} · {s.class}
// //                     </span>
// //                   </SelectItem>
// //                 ))}
// //               </SelectContent>
// //             </Select>
// //           </div>

// //           <div className="grid grid-cols-2 gap-3">
// //             <div className="space-y-1.5">
// //               <Label className="text-xs">Valid From</Label>
// //               <Input
// //                 type="date"
// //                 value={form.validFrom}
// //                 onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
// //                 className="border-slate-200 text-sm"
// //                 disabled={isPending}
// //               />
// //             </div>
// //             <div className="space-y-1.5">
// //               <Label className="text-xs">Valid Until</Label>
// //               <Input
// //                 type="date"
// //                 value={form.validUntil}
// //                 onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
// //                 className="border-slate-200 text-sm"
// //                 disabled={isPending}
// //               />
// //             </div>
// //           </div>

// //           {/* Discount summary */}
// //           <div className="bg-violet-50 border border-violet-200 rounded-lg px-3 py-2 text-xs text-violet-800">
// //             Discount:{" "}
// //             <b>
// //               {bursary.type === "PERCENTAGE"
// //                 ? `${bursary.value}%`
// //                 : `UGX ${Number(bursary.value).toLocaleString()}`}
// //             </b>{" "}
// //             off total invoice amount
// //           </div>
// //         </div>

// //         <DialogFooter>
// //           <Button
// //             variant="outline"
// //             onClick={() => setOpen(false)}
// //             disabled={isPending}
// //             className="border-slate-200"
// //           >
// //             Cancel
// //           </Button>
// //           <Button
// //             disabled={!form.studentId || isPending}
// //             onClick={handleAssign}
// //             className="bg-violet-600 hover:bg-violet-700 text-white"
// //           >
// //             {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
// //             Assign Bursary
// //           </Button>
// //         </DialogFooter>
// //       </DialogContent>
// //     </Dialog>
// //   );
// // }

// // // ─── Main client component ────────────────────────────────────────────────────

// // type Props = {
// //   initialBursaries: BursaryForUI[];
// //   students:         StudentOption[];
// //   schoolId:         string;
// // };

// // export default function BursariesClient({
// //   initialBursaries,
// //   students,
// //   schoolId,
// // }: Props) {
// //   const [bursaries, setBursaries] = useState<BursaryForUI[]>(initialBursaries);
// //   const [search, setSearch]       = useState("");
// //   const [togglingId, setTogglingId] = useState<string | null>(null);

// //   const filtered = bursaries.filter(
// //     (b) =>
// //       b.name.toLowerCase().includes(search.toLowerCase()) ||
// //       b.code.toLowerCase().includes(search.toLowerCase())
// //   );

// //   const totalBeneficiaries = bursaries.reduce(
// //     (sum, b) => sum + b.assignedStudents,
// //     0
// //   );

// //   // ── Handlers ────────────────────────────────────────────────────────────

// //   function handleCreated(b: BursaryForUI) {
// //     setBursaries((prev) => [b, ...prev]);
// //   }

// //   function handleUpdated(updated: BursaryForUI) {
// //     setBursaries((prev) =>
// //       prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
// //     );
// //   }

// //   async function handleToggle(id: string) {
// //     setTogglingId(id);
// //     const result = await toggleBursaryStatus(id);
// //     setTogglingId(null);

// //     if (result.ok) {
// //       setBursaries((prev) =>
// //         prev.map((b) =>
// //           b.id === id ? { ...b, isActive: result.data.isActive } : b
// //         )
// //       );
// //     } else {
// //       toast.error(result.error);
// //     }
// //   }

// //   function handleAssigned(bursaryId: string) {
// //     // Increment beneficiary count optimistically after assignment
// //     setBursaries((prev) =>
// //       prev.map((b) =>
// //         b.id === bursaryId
// //           ? { ...b, assignedStudents: b.assignedStudents + 1 }
// //           : b
// //       )
// //     );
// //   }

// //   // ── Render ───────────────────────────────────────────────────────────────

// //   return (
// //     <div className="space-y-5">

// //       {/* Header */}
// //       <div className="flex items-center justify-between">
// //         <div>
// //           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
// //             Bursaries & Scholarships
// //           </h1>
// //           <p className="text-sm text-slate-500 mt-0.5">
// //             {bursaries.length} schemes · {totalBeneficiaries} beneficiaries
// //           </p>
// //         </div>
// //         <BursaryDialog
// //           mode="create"
// //           schoolId={schoolId}
// //           onDone={handleCreated}
// //           trigger={
// //             <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
// //               <Plus className="w-4 h-4" /> New Bursary
// //             </Button>
// //           }
// //         />
// //       </div>

// //       {/* Search */}
// //       <div className="relative">
// //         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
// //         <Input
// //           placeholder="Search bursaries…"
// //           value={search}
// //           onChange={(e) => setSearch(e.target.value)}
// //           className="pl-9 bg-white border-slate-200 w-72"
// //         />
// //       </div>

// //       {/* Empty state */}
// //       {bursaries.length === 0 && (
// //         <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
// //           <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-3">
// //             <BadgeDollarSign className="w-5 h-5 text-violet-500" />
// //           </div>
// //           <p className="text-sm font-semibold text-slate-700">No bursary schemes yet</p>
// //           <p className="text-xs text-slate-400 mt-1 mb-4">
// //             Create your first scheme then assign it to qualifying students.
// //           </p>
// //           <BursaryDialog
// //             mode="create"
// //             schoolId={schoolId}
// //             onDone={handleCreated}
// //             trigger={
// //               <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
// //                 <Plus className="w-3.5 h-3.5" /> Create First Bursary
// //               </Button>
// //             }
// //           />
// //         </div>
// //       )}

// //       {/* Table */}
// //       {bursaries.length > 0 && (
// //         <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
// //           <Table>
// //             <TableHeader>
// //               <TableRow className="bg-slate-50 border-b border-slate-200">
// //                 {["Bursary", "Code", "Discount", "Beneficiaries", "Status", ""].map((h) => (
// //                   <TableHead
// //                     key={h}
// //                     className="text-xs font-semibold uppercase tracking-wide text-slate-500 first:pl-5 last:pr-5"
// //                   >
// //                     {h}
// //                   </TableHead>
// //                 ))}
// //               </TableRow>
// //             </TableHeader>
// //             <TableBody>
// //               {filtered.map((b) => (
// //                 <TableRow key={b.id} className="hover:bg-slate-50/50 transition-colors">

// //                   {/* Name + description */}
// //                   <TableCell className="pl-5">
// //                     <div className="flex items-center gap-2.5">
// //                       <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
// //                         <BadgeDollarSign className="w-3.5 h-3.5 text-violet-600" />
// //                       </div>
// //                       <div>
// //                         <p className="text-sm font-semibold text-slate-800">{b.name}</p>
// //                         <p className="text-xs text-slate-400">{b.description || "—"}</p>
// //                       </div>
// //                     </div>
// //                   </TableCell>

// //                   {/* Code */}
// //                   <TableCell>
// //                     <code className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
// //                       {b.code}
// //                     </code>
// //                   </TableCell>

// //                   {/* Discount value */}
// //                   <TableCell>
// //                     <Badge
// //                       variant="outline"
// //                       className="text-xs border-violet-200 text-violet-700 bg-violet-50 font-bold"
// //                     >
// //                       {b.type === "PERCENTAGE"
// //                         ? `${b.value}%`
// //                         : `UGX ${Number(b.value).toLocaleString()}`}
// //                     </Badge>
// //                   </TableCell>

// //                   {/* Beneficiary count */}
// //                   <TableCell>
// //                     <div className="flex items-center gap-1.5 text-xs text-slate-600">
// //                       <Users className="w-3.5 h-3.5 text-slate-400" />
// //                       {b.assignedStudents} student{b.assignedStudents !== 1 ? "s" : ""}
// //                     </div>
// //                   </TableCell>

// //                   {/* Active toggle */}
// //                   <TableCell>
// //                     <div className="flex items-center gap-2">
// //                       <Switch
// //                         checked={b.isActive}
// //                         onCheckedChange={() => handleToggle(b.id)}
// //                         disabled={togglingId === b.id}
// //                         className="data-[state=checked]:bg-blue-500"
// //                       />
// //                       {togglingId === b.id ? (
// //                         <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
// //                       ) : (
// //                         <span
// //                           className={`text-xs font-medium ${
// //                             b.isActive ? "text-blue-600" : "text-slate-400"
// //                           }`}
// //                         >
// //                           {b.isActive ? "Active" : "Inactive"}
// //                         </span>
// //                       )}
// //                     </div>
// //                   </TableCell>

// //                   {/* Actions */}
// //                   <TableCell className="pr-5">
// //                     <div className="flex items-center gap-1">
// //                       <AssignBursaryDialog
// //                         bursary={b}
// //                         students={students}
// //                         schoolId={schoolId}
// //                         onAssigned={handleAssigned}
// //                       />
// //                       <BursaryDialog
// //                         mode="edit"
// //                         bursary={b}
// //                         schoolId={schoolId}
// //                         onDone={handleUpdated}
// //                         trigger={
// //                           <Button
// //                             variant="ghost"
// //                             size="sm"
// //                             className="h-7 w-7 p-0 hover:bg-blue-50"
// //                           >
// //                             <Edit2 className="w-3.5 h-3.5 text-blue-600" />
// //                           </Button>
// //                         }
// //                       />
// //                     </div>
// //                   </TableCell>
// //                 </TableRow>
// //               ))}
// //             </TableBody>
// //           </Table>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }




// // app/school/[slug]/finance/fees/bursaries/components/BursariesClient.tsx
// "use client";

// import { useState, useTransition } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Badge } from "@/components/ui/badge";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Switch } from "@/components/ui/switch";
// import {
//   BadgeDollarSign,
//   Edit2,
//   Loader2,
//   Plus,
//   Search,
//   UserPlus,
//   Users,
// } from "lucide-react";
// import { toast } from "sonner";
// import {
//   assignBursaryToStudent,
//   createBursary,
//   toggleBursaryStatus,
//   updateBursary,
// } from "@/actions/fee-bursary-installment";
// import type { ApplyBursaryResult } from "@/actions/fee-bursary-installment";

// // ─── Types ────────────────────────────────────────────────────────────────────

// type BursaryForUI = {
//   id:               string;
//   name:             string;
//   code:             string;
//   type:             string;   // "PERCENTAGE" | "FIXED"
//   value:            number;
//   description:      string;
//   isActive:         boolean;
//   assignedStudents: number;
// };

// type StudentOption = {
//   id:    string;
//   name:  string;
//   admNo: string;
//   class: string;
// };

// // ─── Create / Edit Dialog ─────────────────────────────────────────────────────

// function BursaryDialog({
//   mode,
//   bursary,
//   schoolId,
//   onDone,
//   trigger,
// }: {
//   mode:     "create" | "edit";
//   bursary?: BursaryForUI;
//   schoolId: string;
//   onDone:   (b: BursaryForUI) => void;
//   trigger:  React.ReactNode;
// }) {
//   const [open, setOpen]              = useState(false);
//   const [isPending, startTransition] = useTransition();
//   const [form, setForm]              = useState({
//     name:        bursary?.name            ?? "",
//     code:        bursary?.code            ?? "",
//     type:        bursary?.type            ?? "PERCENTAGE",
//     value:       bursary?.value?.toString() ?? "",
//     description: bursary?.description    ?? "",
//   });

//   function handleOpenChange(o: boolean) {
//     setOpen(o);
//     if (o && mode === "edit" && bursary) {
//       setForm({
//         name:        bursary.name,
//         code:        bursary.code,
//         type:        bursary.type,
//         value:       bursary.value.toString(),
//         description: bursary.description,
//       });
//     }
//     if (o && mode === "create") {
//       setForm({ name: "", code: "", type: "PERCENTAGE", value: "", description: "" });
//     }
//   }

//   function handleSave() {
//     startTransition(async () => {
//       let result;

//       if (mode === "create") {
//         result = await createBursary({
//           schoolId,
//           name:        form.name.trim(),
//           code:        form.code.trim().toUpperCase(),
//           percentage:  form.type === "PERCENTAGE" ? Number(form.value) : undefined,
//           fixedAmount: form.type === "FIXED"      ? Number(form.value) : undefined,
//           description: form.description.trim() || undefined,
//         });
//       } else {
//         result = await updateBursary(bursary!.id, {
//           name:        form.name.trim(),
//           percentage:  form.type === "PERCENTAGE" ? Number(form.value) : undefined,
//           fixedAmount: form.type === "FIXED"      ? Number(form.value) : undefined,
//           description: form.description.trim() || undefined,
//         });
//       }

//       if (result.ok) {
//         toast.success(
//           mode === "create"
//             ? `Bursary "${result.data.name}" created`
//             : `Bursary "${result.data.name}" updated`
//         );
//         onDone({
//           id:               result.data.id,
//           name:             result.data.name,
//           code:             result.data.code,
//           type:             result.data.percentage !== null ? "PERCENTAGE" : "FIXED",
//           value:
//             result.data.percentage !== null
//               ? (result.data.percentage ?? 0)
//               : (result.data.fixedAmount ?? 0),
//           description:      result.data.description ?? "",
//           isActive:         result.data.isActive,
//           assignedStudents: bursary?.assignedStudents ?? 0,
//         });
//         setOpen(false);
//       } else {
//         toast.error(result.error);
//       }
//     });
//   }

//   const isValid =
//     form.name.trim() &&
//     form.code.trim() &&
//     Number(form.value) > 0 &&
//     (form.type !== "PERCENTAGE" || Number(form.value) <= 100);

//   return (
//     <Dialog open={open} onOpenChange={handleOpenChange}>
//       <DialogTrigger asChild>{trigger}</DialogTrigger>
//       <DialogContent className="sm:max-w-md">
//         <DialogHeader>
//           <DialogTitle>
//             {mode === "create" ? "Create Bursary / Scholarship" : "Edit Bursary"}
//           </DialogTitle>
//           <DialogDescription>
//             {mode === "create"
//               ? "Define a bursary scheme. Assign individual students separately."
//               : "Update the bursary details below."}
//           </DialogDescription>
//         </DialogHeader>

//         <div className="space-y-4 py-2">
//           <div className="space-y-1.5">
//             <Label>Bursary Name</Label>
//             <Input
//               placeholder="e.g. Academic Excellence"
//               value={form.name}
//               onChange={(e) => setForm({ ...form, name: e.target.value })}
//               className="border-slate-200"
//               disabled={isPending}
//             />
//           </div>

//           <div className="space-y-1.5">
//             <Label>
//               Code{" "}
//               <span className="text-slate-400 font-normal text-xs">(uppercase)</span>
//             </Label>
//             <Input
//               placeholder="ACAD_EXC"
//               value={form.code}
//               onChange={(e) =>
//                 setForm({
//                   ...form,
//                   code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""),
//                 })
//               }
//               className="border-slate-200 font-mono"
//               maxLength={10}
//               disabled={isPending}
//             />
//           </div>

//           <div className="space-y-1.5">
//             <Label>Discount Type</Label>
//             <div className="grid grid-cols-2 gap-2">
//               {(["PERCENTAGE", "FIXED"] as const).map((t) => (
//                 <button
//                   key={t}
//                   type="button"
//                   onClick={() => setForm({ ...form, type: t })}
//                   disabled={isPending}
//                   className={`border rounded-lg p-2.5 text-xs font-medium transition-all ${
//                     form.type === t
//                       ? "border-blue-400 bg-blue-50 text-blue-700"
//                       : "border-slate-200 text-slate-600 hover:border-slate-300"
//                   }`}
//                 >
//                   {t === "PERCENTAGE" ? "Percentage (%)" : "Fixed Amount (UGX)"}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div className="space-y-1.5">
//             <Label>
//               {form.type === "PERCENTAGE" ? "Percentage (%)" : "Fixed Amount (UGX)"}
//             </Label>
//             <Input
//               type="number"
//               placeholder={form.type === "PERCENTAGE" ? "e.g. 50" : "e.g. 500000"}
//               value={form.value}
//               onChange={(e) => setForm({ ...form, value: e.target.value })}
//               className="border-slate-200 font-mono"
//               min={1}
//               max={form.type === "PERCENTAGE" ? 100 : undefined}
//               disabled={isPending}
//             />
//             {form.type === "PERCENTAGE" && Number(form.value) > 100 && (
//               <p className="text-xs text-red-500">Percentage cannot exceed 100%</p>
//             )}
//           </div>

//           <div className="space-y-1.5">
//             <Label>Description</Label>
//             <Input
//               placeholder="Optional description"
//               value={form.description}
//               onChange={(e) => setForm({ ...form, description: e.target.value })}
//               className="border-slate-200"
//               disabled={isPending}
//             />
//           </div>
//         </div>

//         <DialogFooter>
//           <Button
//             variant="outline"
//             onClick={() => setOpen(false)}
//             disabled={isPending}
//             className="border-slate-200"
//           >
//             Cancel
//           </Button>
//           <Button
//             disabled={!isValid || isPending}
//             onClick={handleSave}
//             className="bg-blue-600 hover:bg-blue-700 text-white"
//           >
//             {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
//             {mode === "create" ? "Create Bursary" : "Save Changes"}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

// // ─── Assign to Student Dialog ─────────────────────────────────────────────────

// function AssignBursaryDialog({
//   bursary,
//   students,
//   schoolId,
//   onAssigned,
// }: {
//   bursary:    BursaryForUI;
//   students:   StudentOption[];
//   schoolId:   string;
//   onAssigned: (bursaryId: string) => void;
// }) {
//   const [open, setOpen]              = useState(false);
//   const [isPending, startTransition] = useTransition();
//   const [form, setForm]              = useState({
//     studentId:  "",
//     validFrom:  "",
//     validUntil: "",
//   });

//   function handleAssign() {
//     startTransition(async () => {
//       const result = await assignBursaryToStudent({
//         bursaryId:  bursary.id,
//         studentId:  form.studentId,
//         schoolId,
//         validFrom:  form.validFrom  ? new Date(form.validFrom)  : undefined,
//         validUntil: form.validUntil ? new Date(form.validUntil) : undefined,
//       });

//       if (result.ok) {
//         // ── Smart toast: tell the bursar exactly what happened to the invoice ──
//         const applied    = (result as any).applied    as ApplyBursaryResult | null;
//         const applyError = (result as any).applyError as string | null;

//         if (applied && !applied.alreadyApplied && applied.discountApplied > 0) {
//           // ✅ Bursary assigned AND discount hit a live invoice immediately
//           toast.success(
//             `Bursary assigned & applied — UGX ${applied.discountApplied.toLocaleString()} discount deducted. ` +
//             `New invoice balance: UGX ${applied.newInvoiceBalance.toLocaleString()}`
//           );
//         } else if (applied?.alreadyApplied) {
//           // ℹ️ Duplicate guard fired — discount was already on the invoice
//           toast.success("Bursary assigned (discount was already applied to the current invoice).");
//         } else {
//           // ⚠️ No open invoice found — will apply on enrollment
//           toast.success(
//             applyError
//               ? `Bursary assigned. Note: ${applyError}`
//               : "Bursary assigned. Discount will be applied automatically when the student is enrolled this term."
//           );
//         }

//         onAssigned(bursary.id);
//         setOpen(false);
//         setForm({ studentId: "", validFrom: "", validUntil: "" });
//       } else {
//         toast.error(result.error);
//       }
//     });
//   }

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         <Button
//           variant="ghost"
//           size="sm"
//           className="h-7 px-2.5 text-xs text-blue-600 hover:bg-blue-50 gap-1"
//         >
//           <UserPlus className="w-3 h-3" /> Assign
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="sm:max-w-sm">
//         <DialogHeader>
//           <DialogTitle>Assign Bursary</DialogTitle>
//           <DialogDescription>
//             Assign <b>{bursary.name}</b> to a student with a validity window.
//           </DialogDescription>
//         </DialogHeader>

//         <div className="space-y-4 py-2">
//           <div className="space-y-1.5">
//             <Label>Student</Label>
//             <Select
//               value={form.studentId}
//               onValueChange={(v) => setForm({ ...form, studentId: v })}
//               disabled={isPending}
//             >
//               <SelectTrigger className="border-slate-200">
//                 <SelectValue placeholder="Select student…" />
//               </SelectTrigger>
//               <SelectContent>
//                 {students.map((s) => (
//                   <SelectItem key={s.id} value={s.id}>
//                     <span className="font-medium">{s.name}</span>
//                     <span className="text-slate-400 ml-2 text-xs">
//                       {s.admNo} · {s.class}
//                     </span>
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="grid grid-cols-2 gap-3">
//             <div className="space-y-1.5">
//               <Label className="text-xs">Valid From</Label>
//               <Input
//                 type="date"
//                 value={form.validFrom}
//                 onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
//                 className="border-slate-200 text-sm"
//                 disabled={isPending}
//               />
//             </div>
//             <div className="space-y-1.5">
//               <Label className="text-xs">Valid Until</Label>
//               <Input
//                 type="date"
//                 value={form.validUntil}
//                 onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
//                 className="border-slate-200 text-sm"
//                 disabled={isPending}
//               />
//             </div>
//           </div>

//           {/* Discount preview */}
//           <div className="bg-violet-50 border border-violet-200 rounded-lg px-3 py-2 text-xs text-violet-800">
//             Discount:{" "}
//             <b>
//               {bursary.type === "PERCENTAGE"
//                 ? `${bursary.value}%`
//                 : `UGX ${Number(bursary.value).toLocaleString()}`}
//             </b>{" "}
//             off total invoice amount.{" "}
//             {bursary.type === "PERCENTAGE" && (
//               <span className="text-violet-600">
//                 Applied immediately if the student has an open invoice.
//               </span>
//             )}
//           </div>
//         </div>

//         <DialogFooter>
//           <Button
//             variant="outline"
//             onClick={() => setOpen(false)}
//             disabled={isPending}
//             className="border-slate-200"
//           >
//             Cancel
//           </Button>
//           <Button
//             disabled={!form.studentId || isPending}
//             onClick={handleAssign}
//             className="bg-violet-600 hover:bg-violet-700 text-white"
//           >
//             {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
//             Assign Bursary
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

// // ─── Main client component ────────────────────────────────────────────────────

// type Props = {
//   initialBursaries: BursaryForUI[];
//   students:         StudentOption[];
//   schoolId:         string;
// };

// export default function BursariesClient({
//   initialBursaries,
//   students,
//   schoolId,
// }: Props) {
//   const [bursaries, setBursaries]     = useState<BursaryForUI[]>(initialBursaries);
//   const [search, setSearch]           = useState("");
//   const [togglingId, setTogglingId]   = useState<string | null>(null);

//   const filtered = bursaries.filter(
//     (b) =>
//       b.name.toLowerCase().includes(search.toLowerCase()) ||
//       b.code.toLowerCase().includes(search.toLowerCase())
//   );

//   const totalBeneficiaries = bursaries.reduce(
//     (sum, b) => sum + b.assignedStudents,
//     0
//   );

//   // ── Handlers ────────────────────────────────────────────────────────────

//   function handleCreated(b: BursaryForUI) {
//     setBursaries((prev) => [b, ...prev]);
//   }

//   function handleUpdated(updated: BursaryForUI) {
//     setBursaries((prev) =>
//       prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
//     );
//   }

//   async function handleToggle(id: string) {
//     setTogglingId(id);
//     const result = await toggleBursaryStatus(id);
//     setTogglingId(null);

//     if (result.ok) {
//       setBursaries((prev) =>
//         prev.map((b) =>
//           b.id === id ? { ...b, isActive: result.data.isActive } : b
//         )
//       );
//     } else {
//       toast.error(result.error);
//     }
//   }

//   function handleAssigned(bursaryId: string) {
//     // Increment beneficiary count optimistically after assignment
//     setBursaries((prev) =>
//       prev.map((b) =>
//         b.id === bursaryId
//           ? { ...b, assignedStudents: b.assignedStudents + 1 }
//           : b
//       )
//     );
//   }

//   // ── Render ───────────────────────────────────────────────────────────────

//   return (
//     <div className="space-y-5">

//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
//             Bursaries &amp; Scholarships
//           </h1>
//           <p className="text-sm text-slate-500 mt-0.5">
//             {bursaries.length} schemes · {totalBeneficiaries} beneficiaries
//           </p>
//         </div>
//         <BursaryDialog
//           mode="create"
//           schoolId={schoolId}
//           onDone={handleCreated}
//           trigger={
//             <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
//               <Plus className="w-4 h-4" /> New Bursary
//             </Button>
//           }
//         />
//       </div>

//       {/* Search */}
//       <div className="relative">
//         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//         <Input
//           placeholder="Search bursaries…"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           className="pl-9 bg-white border-slate-200 w-72"
//         />
//       </div>

//       {/* Empty state */}
//       {bursaries.length === 0 && (
//         <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
//           <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-3">
//             <BadgeDollarSign className="w-5 h-5 text-violet-500" />
//           </div>
//           <p className="text-sm font-semibold text-slate-700">No bursary schemes yet</p>
//           <p className="text-xs text-slate-400 mt-1 mb-4">
//             Create your first scheme then assign it to qualifying students.
//           </p>
//           <BursaryDialog
//             mode="create"
//             schoolId={schoolId}
//             onDone={handleCreated}
//             trigger={
//               <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
//                 <Plus className="w-3.5 h-3.5" /> Create First Bursary
//               </Button>
//             }
//           />
//         </div>
//       )}

//       {/* Table */}
//       {bursaries.length > 0 && (
//         <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
//           <Table>
//             <TableHeader>
//               <TableRow className="bg-slate-50 border-b border-slate-200">
//                 {["Bursary", "Code", "Discount", "Beneficiaries", "Status", ""].map((h) => (
//                   <TableHead
//                     key={h}
//                     className="text-xs font-semibold uppercase tracking-wide text-slate-500 first:pl-5 last:pr-5"
//                   >
//                     {h}
//                   </TableHead>
//                 ))}
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filtered.map((b) => (
//                 <TableRow key={b.id} className="hover:bg-slate-50/50 transition-colors">

//                   {/* Name + description */}
//                   <TableCell className="pl-5">
//                     <div className="flex items-center gap-2.5">
//                       <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
//                         <BadgeDollarSign className="w-3.5 h-3.5 text-violet-600" />
//                       </div>
//                       <div>
//                         <p className="text-sm font-semibold text-slate-800">{b.name}</p>
//                         <p className="text-xs text-slate-400">{b.description || "—"}</p>
//                       </div>
//                     </div>
//                   </TableCell>

//                   {/* Code */}
//                   <TableCell>
//                     <code className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
//                       {b.code}
//                     </code>
//                   </TableCell>

//                   {/* Discount value */}
//                   <TableCell>
//                     <Badge
//                       variant="outline"
//                       className="text-xs border-violet-200 text-violet-700 bg-violet-50 font-bold"
//                     >
//                       {b.type === "PERCENTAGE"
//                         ? `${b.value}%`
//                         : `UGX ${Number(b.value).toLocaleString()}`}
//                     </Badge>
//                   </TableCell>

//                   {/* Beneficiary count */}
//                   <TableCell>
//                     <div className="flex items-center gap-1.5 text-xs text-slate-600">
//                       <Users className="w-3.5 h-3.5 text-slate-400" />
//                       {b.assignedStudents} student{b.assignedStudents !== 1 ? "s" : ""}
//                     </div>
//                   </TableCell>

//                   {/* Active toggle */}
//                   <TableCell>
//                     <div className="flex items-center gap-2">
//                       <Switch
//                         checked={b.isActive}
//                         onCheckedChange={() => handleToggle(b.id)}
//                         disabled={togglingId === b.id}
//                         className="data-[state=checked]:bg-blue-500"
//                       />
//                       {togglingId === b.id ? (
//                         <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
//                       ) : (
//                         <span
//                           className={`text-xs font-medium ${
//                             b.isActive ? "text-blue-600" : "text-slate-400"
//                           }`}
//                         >
//                           {b.isActive ? "Active" : "Inactive"}
//                         </span>
//                       )}
//                     </div>
//                   </TableCell>

//                   {/* Actions */}
//                   <TableCell className="pr-5">
//                     <div className="flex items-center gap-1">
//                       <AssignBursaryDialog
//                         bursary={b}
//                         students={students}
//                         schoolId={schoolId}
//                         onAssigned={handleAssigned}
//                       />
//                       <BursaryDialog
//                         mode="edit"
//                         bursary={b}
//                         schoolId={schoolId}
//                         onDone={handleUpdated}
//                         trigger={
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="h-7 w-7 p-0 hover:bg-blue-50"
//                           >
//                             <Edit2 className="w-3.5 h-3.5 text-blue-600" />
//                           </Button>
//                         }
//                       />
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </div>
//       )}
//     </div>
//   );
// }





// app/school/[slug]/finance/fees/bursaries/components/BursariesClient.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  BadgeDollarSign,
  Edit2,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  assignBursaryToStudent,
  createBursary,
  toggleBursaryStatus,
  updateBursary,
} from "@/actions/fee-bursary-installment";
import type { ApplyBursaryResult } from "@/actions/fee-bursary-installment";

// ─── Types ────────────────────────────────────────────────────────────────────

type BursaryForUI = {
  id:               string;
  name:             string;
  code:             string;
  type:             string;   // "PERCENTAGE" | "FIXED"
  value:            number;
  description:      string;
  isActive:         boolean;
  assignedStudents: number;
};

type StudentOption = {
  id:    string;
  name:  string;
  admNo: string;
  class: string;
};

// Beneficiary = a student who holds one or more bursaries
export type BeneficiaryForUI = {
  studentId:   string;
  studentName: string;
  admNo:       string;
  class:       string;
  bursaries:   {
    studentBursaryId: string;
    bursaryName:      string;
    bursaryCode:      string;
    type:             string;
    value:            number;
    validFrom:        string | null;
    validUntil:       string | null;
    isActive:         boolean;
  }[];
};

// ─── Create / Edit Dialog ─────────────────────────────────────────────────────

function BursaryDialog({
  mode,
  bursary,
  schoolId,
  onDone,
  trigger,
}: {
  mode:     "create" | "edit";
  bursary?: BursaryForUI;
  schoolId: string;
  onDone:   (b: BursaryForUI) => void;
  trigger:  React.ReactNode;
}) {
  const [open, setOpen]              = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm]              = useState({
    name:        bursary?.name              ?? "",
    code:        bursary?.code              ?? "",
    type:        bursary?.type              ?? "PERCENTAGE",
    value:       bursary?.value?.toString() ?? "",
    description: bursary?.description      ?? "",
  });

  function handleOpenChange(o: boolean) {
    setOpen(o);
    if (o && mode === "edit" && bursary) {
      setForm({
        name:        bursary.name,
        code:        bursary.code,
        type:        bursary.type,
        value:       bursary.value.toString(),
        description: bursary.description,
      });
    }
    if (o && mode === "create") {
      setForm({ name: "", code: "", type: "PERCENTAGE", value: "", description: "" });
    }
  }

  function handleSave() {
    startTransition(async () => {
      let result;
      if (mode === "create") {
        result = await createBursary({
          schoolId,
          name:        form.name.trim(),
          code:        form.code.trim().toUpperCase(),
          percentage:  form.type === "PERCENTAGE" ? Number(form.value) : undefined,
          fixedAmount: form.type === "FIXED"      ? Number(form.value) : undefined,
          description: form.description.trim() || undefined,
        });
      } else {
        result = await updateBursary(bursary!.id, {
          name:        form.name.trim(),
          percentage:  form.type === "PERCENTAGE" ? Number(form.value) : undefined,
          fixedAmount: form.type === "FIXED"      ? Number(form.value) : undefined,
          description: form.description.trim() || undefined,
        });
      }

      if (result.ok) {
        toast.success(
          mode === "create"
            ? `Bursary "${result.data.name}" created`
            : `Bursary "${result.data.name}" updated`
        );
        onDone({
          id:               result.data.id,
          name:             result.data.name,
          code:             result.data.code,
          type:             result.data.percentage !== null ? "PERCENTAGE" : "FIXED",
          value:            result.data.percentage !== null
                              ? (result.data.percentage ?? 0)
                              : (result.data.fixedAmount ?? 0),
          description:      result.data.description ?? "",
          isActive:         result.data.isActive,
          assignedStudents: bursary?.assignedStudents ?? 0,
        });
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  const isValid =
    form.name.trim() &&
    form.code.trim() &&
    Number(form.value) > 0 &&
    (form.type !== "PERCENTAGE" || Number(form.value) <= 100);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Bursary / Scholarship" : "Edit Bursary"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Define a bursary scheme. Assign individual students separately."
              : "Update the bursary details below."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Bursary Name</Label>
            <Input
              placeholder="e.g. Academic Excellence"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border-slate-200"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Code <span className="text-slate-400 font-normal text-xs">(uppercase)</span>
            </Label>
            <Input
              placeholder="ACAD_EXC"
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") })
              }
              className="border-slate-200 font-mono"
              maxLength={10}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Discount Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["PERCENTAGE", "FIXED"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  disabled={isPending}
                  className={`border rounded-lg p-2.5 text-xs font-medium transition-all ${
                    form.type === t
                      ? "border-blue-400 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {t === "PERCENTAGE" ? "Percentage (%)" : "Fixed Amount (UGX)"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{form.type === "PERCENTAGE" ? "Percentage (%)" : "Fixed Amount (UGX)"}</Label>
            <Input
              type="number"
              placeholder={form.type === "PERCENTAGE" ? "e.g. 50" : "e.g. 500000"}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              className="border-slate-200 font-mono"
              min={1}
              max={form.type === "PERCENTAGE" ? 100 : undefined}
              disabled={isPending}
            />
            {form.type === "PERCENTAGE" && Number(form.value) > 100 && (
              <p className="text-xs text-red-500">Percentage cannot exceed 100%</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              placeholder="Optional description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border-slate-200"
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending} className="border-slate-200">
            Cancel
          </Button>
          <Button disabled={!isValid || isPending} onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            {mode === "create" ? "Create Bursary" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assign to Student Dialog ─────────────────────────────────────────────────

function AssignBursaryDialog({
  bursary,
  students,
  schoolId,
  onAssigned,
}: {
  bursary:    BursaryForUI;
  students:   StudentOption[];
  schoolId:   string;
  onAssigned: (bursaryId: string, student: StudentOption) => void;
}) {
  const [open, setOpen]              = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm]              = useState({ studentId: "", validFrom: "", validUntil: "" });

  function handleAssign() {
    startTransition(async () => {
      const result = await assignBursaryToStudent({
        bursaryId:  bursary.id,
        studentId:  form.studentId,
        schoolId,
        validFrom:  form.validFrom  ? new Date(form.validFrom)  : undefined,
        validUntil: form.validUntil ? new Date(form.validUntil) : undefined,
      });

      if (result.ok) {
        const applied    = (result as any).applied    as ApplyBursaryResult | null;
        const applyError = (result as any).applyError as string | null;

        if (applied && !applied.alreadyApplied && applied.discountApplied > 0) {
          toast.success(
            `Bursary assigned & applied — UGX ${applied.discountApplied.toLocaleString()} discount deducted. ` +
            `New invoice balance: UGX ${applied.newInvoiceBalance.toLocaleString()}`
          );
        } else if (applied?.alreadyApplied) {
          toast.success("Bursary assigned (discount was already applied to the current invoice).");
        } else {
          toast.success(
            applyError
              ? `Bursary assigned. Note: ${applyError}`
              : "Bursary assigned. Discount will be applied automatically when the student is enrolled this term."
          );
        }

        const student = students.find((s) => s.id === form.studentId)!;
        onAssigned(bursary.id, student);
        setOpen(false);
        setForm({ studentId: "", validFrom: "", validUntil: "" });
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-blue-600 hover:bg-blue-50 gap-1">
          <UserPlus className="w-3 h-3" /> Assign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Bursary</DialogTitle>
          <DialogDescription>
            Assign <b>{bursary.name}</b> to a student with a validity window.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Student</Label>
            <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })} disabled={isPending}>
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="Select student…" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="font-medium">{s.name}</span>
                    <span className="text-slate-400 ml-2 text-xs">{s.admNo} · {s.class}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Valid From</Label>
              <Input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} className="border-slate-200 text-sm" disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valid Until</Label>
              <Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} className="border-slate-200 text-sm" disabled={isPending} />
            </div>
          </div>

          <div className="bg-violet-50 border border-violet-200 rounded-lg px-3 py-2 text-xs text-violet-800">
            Discount:{" "}
            <b>{bursary.type === "PERCENTAGE" ? `${bursary.value}%` : `UGX ${Number(bursary.value).toLocaleString()}`}</b>{" "}
            off total invoice amount.{" "}
            {bursary.type === "PERCENTAGE" && (
              <span className="text-violet-600">Applied immediately if the student has an open invoice.</span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending} className="border-slate-200">Cancel</Button>
          <Button disabled={!form.studentId || isPending} onClick={handleAssign} className="bg-violet-600 hover:bg-violet-700 text-white">
            {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Assign Bursary
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Schemes Tab ──────────────────────────────────────────────────────────────

function SchemesTab({
  bursaries,
  students,
  schoolId,
  togglingId,
  onCreated,
  onUpdated,
  onToggle,
  onAssigned,
}: {
  bursaries:  BursaryForUI[];
  students:   StudentOption[];
  schoolId:   string;
  togglingId: string | null;
  onCreated:  (b: BursaryForUI) => void;
  onUpdated:  (b: BursaryForUI) => void;
  onToggle:   (id: string) => void;
  onAssigned: (bursaryId: string, student: StudentOption) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = bursaries.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search bursaries…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-slate-200 w-64"
          />
        </div>
        <BursaryDialog
          mode="create"
          schoolId={schoolId}
          onDone={onCreated}
          trigger={
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4" /> New Bursary
            </Button>
          }
        />
      </div>

      {bursaries.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-3">
            <BadgeDollarSign className="w-5 h-5 text-violet-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No bursary schemes yet</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Create your first scheme then assign it to qualifying students.
          </p>
          <BursaryDialog
            mode="create"
            schoolId={schoolId}
            onDone={onCreated}
            trigger={
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Create First Bursary
              </Button>
            }
          />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                {["Bursary", "Code", "Discount", "Beneficiaries", "Status", ""].map((h) => (
                  <TableHead key={h} className="text-xs font-semibold uppercase tracking-wide text-slate-500 first:pl-5 last:pr-5">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                        <BadgeDollarSign className="w-3.5 h-3.5 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{b.name}</p>
                        <p className="text-xs text-slate-400">{b.description || "—"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">{b.code}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs border-violet-200 text-violet-700 bg-violet-50 font-bold">
                      {b.type === "PERCENTAGE" ? `${b.value}%` : `UGX ${Number(b.value).toLocaleString()}`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {b.assignedStudents} student{b.assignedStudents !== 1 ? "s" : ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={b.isActive}
                        onCheckedChange={() => onToggle(b.id)}
                        disabled={togglingId === b.id}
                        className="data-[state=checked]:bg-blue-500"
                      />
                      {togglingId === b.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                      ) : (
                        <span className={`text-xs font-medium ${b.isActive ? "text-blue-600" : "text-slate-400"}`}>
                          {b.isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="pr-5">
                    <div className="flex items-center gap-1">
                      <AssignBursaryDialog
                        bursary={b}
                        students={students}
                        schoolId={schoolId}
                        onAssigned={onAssigned}
                      />
                      <BursaryDialog
                        mode="edit"
                        bursary={b}
                        schoolId={schoolId}
                        onDone={onUpdated}
                        trigger={
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-50">
                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Beneficiaries Tab ────────────────────────────────────────────────────────

function BeneficiariesTab({ beneficiaries }: { beneficiaries: BeneficiaryForUI[] }) {
  const [search, setSearch] = useState("");

  const filtered = beneficiaries.filter(
    (b) =>
      b.studentName.toLowerCase().includes(search.toLowerCase()) ||
      b.admNo.toLowerCase().includes(search.toLowerCase()) ||
      b.class.toLowerCase().includes(search.toLowerCase()) ||
      b.bursaries.some((bur) => bur.bursaryName.toLowerCase().includes(search.toLowerCase()))
  );

  if (beneficiaries.length === 0) {
    return (
      <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-3">
          <GraduationCap className="w-5 h-5 text-emerald-500" />
        </div>
        <p className="text-sm font-semibold text-slate-700">No beneficiaries yet</p>
        <p className="text-xs text-slate-400 mt-1">
          Assign bursaries to students from the Schemes tab and they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search students, bursaries…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white border-slate-200"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">No results match your search.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 pl-5">Student</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admission No</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Class</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bursaries Held</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 pr-5">Total Discount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ben) => {
                // Sum up all discounts for display hint
                const hasPercentage = ben.bursaries.some((b) => b.type === "PERCENTAGE");
                const fixedTotal    = ben.bursaries
                  .filter((b) => b.type === "FIXED" && b.isActive)
                  .reduce((sum, b) => sum + b.value, 0);

                return (
                  <TableRow key={ben.studentId} className="hover:bg-slate-50/50 transition-colors align-top">
                    {/* Student name */}
                    <TableCell className="pl-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800">{ben.studentName}</p>
                      </div>
                    </TableCell>

                    {/* Admission No */}
                    <TableCell className="py-3">
                      <code className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                        {ben.admNo}
                      </code>
                    </TableCell>

                    {/* Class */}
                    <TableCell className="py-3 text-xs text-slate-600">{ben.class || "—"}</TableCell>

                    {/* Bursaries held — one badge per bursary */}
                    <TableCell className="py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {ben.bursaries.map((bur) => (
                          <div key={bur.studentBursaryId} className="flex items-center gap-1">
                            <Badge
                              variant="outline"
                              className={`text-xs font-medium px-2 py-0.5 ${
                                bur.isActive
                                  ? "border-violet-200 bg-violet-50 text-violet-700"
                                  : "border-slate-200 bg-slate-50 text-slate-400 line-through"
                              }`}
                            >
                              {bur.bursaryName}
                            </Badge>
                            <span className="text-xs text-slate-500 font-mono">
                              {bur.type === "PERCENTAGE"
                                ? `${bur.value}%`
                                : `UGX ${bur.value.toLocaleString()}`}
                            </span>
                            {!bur.isActive && (
                              <span className="text-[10px] text-slate-400 italic">revoked</span>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Validity dates for first bursary */}
                      {ben.bursaries[0]?.validUntil && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          Expires: {new Date(ben.bursaries[0].validUntil).toLocaleDateString()}
                        </p>
                      )}
                    </TableCell>

                    {/* Total discount summary */}
                    <TableCell className="py-3 pr-5">
                      <div className="space-y-0.5">
                        {hasPercentage && (
                          <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700 font-bold block w-fit">
                            % discount active
                          </Badge>
                        )}
                        {fixedTotal > 0 && (
                          <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700 font-bold block w-fit">
                            UGX {fixedTotal.toLocaleString()} fixed
                          </Badge>
                        )}
                        {!hasPercentage && fixedTotal === 0 && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

type Props = {
  initialBursaries:   BursaryForUI[];
  students:           StudentOption[];
  schoolId:           string;
  initialBeneficiaries: BeneficiaryForUI[];
};

export default function BursariesClient({
  initialBursaries,
  students,
  schoolId,
  initialBeneficiaries,
}: Props) {
  const [bursaries,    setBursaries]    = useState<BursaryForUI[]>(initialBursaries);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryForUI[]>(initialBeneficiaries);
  const [togglingId,   setTogglingId]   = useState<string | null>(null);
  const [activeTab,    setActiveTab]    = useState<"schemes" | "beneficiaries">("schemes");

  const totalBeneficiaries = beneficiaries.length;

  // ── Handlers ──────────────────────────────────────────────────────────

  function handleCreated(b: BursaryForUI) {
    setBursaries((prev) => [b, ...prev]);
  }

  function handleUpdated(updated: BursaryForUI) {
    setBursaries((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)));
  }

  async function handleToggle(id: string) {
    setTogglingId(id);
    const result = await toggleBursaryStatus(id);
    setTogglingId(null);
    if (result.ok) {
      setBursaries((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive: result.data.isActive } : b))
      );
    } else {
      toast.error(result.error);
    }
  }

  function handleAssigned(bursaryId: string, student: StudentOption) {
    // Increment scheme beneficiary count
    setBursaries((prev) =>
      prev.map((b) => (b.id === bursaryId ? { ...b, assignedStudents: b.assignedStudents + 1 } : b))
    );

    // Find the bursary details to add to beneficiaries list
    const bursary = bursaries.find((b) => b.id === bursaryId);
    if (!bursary) return;

    setBeneficiaries((prev) => {
      const existingIndex = prev.findIndex((ben) => ben.studentId === student.id);
      const newBursaryEntry = {
        studentBursaryId: `temp-${Date.now()}`, // server will have real ID on next load
        bursaryName:      bursary.name,
        bursaryCode:      bursary.code,
        type:             bursary.type,
        value:            bursary.value,
        validFrom:        null,
        validUntil:       null,
        isActive:         true,
      };

      if (existingIndex >= 0) {
        // Student already in beneficiaries list — add another bursary entry
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          bursaries: [...updated[existingIndex].bursaries, newBursaryEntry],
        };
        return updated;
      } else {
        // New beneficiary
        return [
          {
            studentId:   student.id,
            studentName: student.name,
            admNo:       student.admNo,
            class:       student.class,
            bursaries:   [newBursaryEntry],
          },
          ...prev,
        ];
      }
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Bursaries &amp; Scholarships
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {bursaries.length} scheme{bursaries.length !== 1 ? "s" : ""} ·{" "}
            {totalBeneficiaries} beneficiar{totalBeneficiaries !== 1 ? "ies" : "y"}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200">
        {(
          [
            { key: "schemes",       label: "Schemes",       icon: BadgeDollarSign, count: bursaries.length },
            { key: "beneficiaries", label: "Beneficiaries", icon: GraduationCap,   count: totalBeneficiaries },
          ] as const
        ).map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span
              className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                activeTab === key
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "schemes" ? (
        <SchemesTab
          bursaries={bursaries}
          students={students}
          schoolId={schoolId}
          togglingId={togglingId}
          onCreated={handleCreated}
          onUpdated={handleUpdated}
          onToggle={handleToggle}
          onAssigned={handleAssigned}
        />
      ) : (
        <BeneficiariesTab beneficiaries={beneficiaries} />
      )}
    </div>
  );
}