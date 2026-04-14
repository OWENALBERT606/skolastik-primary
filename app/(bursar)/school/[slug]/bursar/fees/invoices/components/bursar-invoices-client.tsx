"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createManualInvoiceForStudent } from "@/actions/fee-account-invoice";

type StudentOption = {
  studentId:   string;
  studentName: string;
  admissionNo: string;
  hasAccount:  boolean;
};

type FeeStructureOption = {
  id:          string;
  name:        string;
  totalAmount: number;
  className:   string;
};

type Props = {
  slug:           string;
  userId:         string;
  schoolId:       string;
  academicYearId: string;
  termId:         string;
  students:       StudentOption[];
  feeStructures:  FeeStructureOption[];
};

export default function BursarCreateInvoiceButton({
  slug, userId, schoolId, academicYearId, termId,
  students, feeStructures,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const [studentOpen,   setStudentOpen]   = useState(false);
  const [structureOpen, setStructureOpen] = useState(false);

  const [form, setForm] = useState({
    studentId:      "",
    feeStructureId: "",
    dueDate:        "",
    notes:          "",
  });

  const student   = students.find(s => s.studentId === form.studentId);
  const structure = feeStructures.find(f => f.id === form.feeStructureId);
  const isValid   = !!form.studentId && !!form.feeStructureId;

  function reset() {
    setForm({ studentId: "", feeStructureId: "", dueDate: "", notes: "" });
  }

  function handleSubmit() {
    if (!student || !structure) return;
    start(async () => {
      const result = await createManualInvoiceForStudent({
        studentId:      form.studentId,
        schoolId,
        academicYearId,
        termId,
        feeStructureId: form.feeStructureId,
        dueDate:        form.dueDate ? new Date(form.dueDate) : undefined,
        notes:          form.notes || undefined,
        createdById:    userId,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(`Invoice ${result.data.invoiceNumber} created`);
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Create Invoice
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Manual Invoice</DialogTitle>
            <DialogDescription>
              Generate an invoice for any enrolled student — even if they don't have a fee account yet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">

            {/* Student — searchable combobox */}
            <div className="space-y-1.5">
              <Label>Student <span className="text-red-500">*</span></Label>
              <Popover open={studentOpen} onOpenChange={setStudentOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal border-slate-200"
                  >
                    {student
                      ? <span>{student.studentName} <span className="text-slate-400 text-xs ml-1">{student.admissionNo}</span></span>
                      : <span className="text-slate-400">Search student...</span>
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search by name or admission no..." />
                    <CommandList>
                      <CommandEmpty>No students found.</CommandEmpty>
                      <CommandGroup>
                        {students.map((s) => (
                          <CommandItem
                            key={s.studentId}
                            value={`${s.studentName} ${s.admissionNo}`}
                            onSelect={() => {
                              setForm({ ...form, studentId: s.studentId });
                              setStudentOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", form.studentId === s.studentId ? "opacity-100" : "opacity-0")} />
                            <span className="font-medium">{s.studentName}</span>
                            <span className="text-slate-400 text-xs ml-2">{s.admissionNo}</span>
                            {!s.hasAccount && <span className="text-amber-500 text-xs ml-1">(no account)</span>}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Fee Structure — searchable combobox */}
            <div className="space-y-1.5">
              <Label>Fee Structure <span className="text-red-500">*</span></Label>
              <Popover open={structureOpen} onOpenChange={setStructureOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal border-slate-200"
                  >
                    {structure
                      ? <span>{structure.name} <span className="text-slate-400 text-xs ml-1">UGX {structure.totalAmount.toLocaleString()}</span></span>
                      : <span className="text-slate-400">Search fee structure...</span>
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search by name or class..." />
                    <CommandList>
                      <CommandEmpty>No fee structures found.</CommandEmpty>
                      <CommandGroup>
                        {feeStructures.map((fs) => (
                          <CommandItem
                            key={fs.id}
                            value={`${fs.name} ${fs.className}`}
                            onSelect={() => {
                              setForm({ ...form, feeStructureId: fs.id });
                              setStructureOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", form.feeStructureId === fs.id ? "opacity-100" : "opacity-0")} />
                            <span className="font-medium">{fs.name}</span>
                            <span className="text-slate-400 text-xs ml-2">{fs.className}</span>
                            <span className="text-slate-400 text-xs ml-2">UGX {fs.totalAmount.toLocaleString()}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Summary */}
            {student && structure && (
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student</span>
                  <span className="font-medium">{student.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-bold text-primary">UGX {structure.totalAmount.toLocaleString()}</span>
                </div>
                {!student.hasAccount && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 pt-1">
                    A fee account will be created automatically for this student.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Due Date (optional)</Label>
              <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any notes for this invoice..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => { setOpen(false); reset(); }}>
                Cancel
              </Button>
              <Button className="flex-1" disabled={!isValid || pending} onClick={handleSubmit}>
                {pending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Creating...</>
                  : "Create Invoice"
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
