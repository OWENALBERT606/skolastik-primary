// app/school/[slug]/finance/fees/categories/components/FeeCategoriesClient.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Edit2, Loader2, Plus, Tag, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { 
    createFeeCategory,
    deleteFeeCategory,
    toggleFeeCategoryStatus,
    updateFeeCategory
 } from "@/actions/feescategory";

type CategoryForUI = {
  id:          string;
  name:        string;
  code:        string;
  description: string | null;
  isActive:    boolean;
  isMandatory: boolean;
  isOptional:  boolean;
  schoolId:    string;
  createdAt:   Date;
  updatedAt:   Date;
  stats: {
    totalStructureItems: number;
    totalInvoiceItems:   number;
    isInUse:             boolean;
  };
};

// ─── Create / Edit Dialog ─────────────────────────────────────────────────────

function CategoryDialog({
  mode,
  category,
  schoolId,
  onDone,
  trigger,
}: {
  mode:      "create" | "edit";
  category?: CategoryForUI;
  schoolId:  string;
  onDone:    (updated: CategoryForUI) => void;
  trigger:   React.ReactNode;
}) {
  const [open, setOpen]              = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm]              = useState({
    name:        category?.name        ?? "",
    code:        category?.code        ?? "",
    description: category?.description ?? "",
  });

  function handleOpenChange(o: boolean) {
    setOpen(o);
    if (o && mode === "create") {
      setForm({ name: "", code: "", description: "" });
    }
    if (o && mode === "edit" && category) {
      setForm({
        name:        category.name,
        code:        category.code,
        description: category.description ?? "",
      });
    }
  }

  function handleSave() {
    startTransition(async () => {
      let result;

      if (mode === "create") {
        result = await createFeeCategory({
          schoolId,
          name:        form.name.trim(),
          code:        form.code.trim().toUpperCase(),
          description: form.description.trim() || undefined,
        });
      } else {
        result = await updateFeeCategory(category!.id, {
          name:        form.name.trim(),
          code:        form.code.trim().toUpperCase(),
          description: form.description.trim() || undefined,
        });
      }

      if (result.ok) {
        toast.success(
          mode === "create"
            ? `Category "${result.data.name}" created`
            : `Category "${result.data.name}" updated`
        );
        // Merge the DB record back with existing stats (stats don't change on name/code edits)
        onDone({
          ...result.data,
          description: result.data.description ?? null,
          stats: category?.stats ?? {
            totalStructureItems: 0,
            totalInvoiceItems:   0,
            isInUse:             false,
          },
        });
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-900">
            {mode === "create" ? "Create Fee Category" : "Edit Fee Category"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new category to group fee line items (e.g. Tuition, ICT Levy)."
              : "Update the category details below."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Category Name</Label>
            <Input
              id="cat-name"
              placeholder="e.g. Tuition Fee"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border-slate-200"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-code">
              Code{" "}
              <span className="text-slate-400 font-normal text-xs">
                (2–10 uppercase letters/numbers/underscores)
              </span>
            </Label>
            <Input
              id="cat-code"
              placeholder="e.g. TUITION"
              value={form.code}
              onChange={(e) =>
                setForm({
                  ...form,
                  code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""),
                })
              }
              className="border-slate-200 font-mono"
              maxLength={10}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              placeholder="Optional description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border-slate-200 resize-none"
              rows={2}
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
            className="border-slate-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!form.name || !form.code || isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            {mode === "create" ? "Create Category" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

type Props = {
  initialCategories: CategoryForUI[];
  schoolId:          string;
};

export default function FeeCategoriesClient({ initialCategories, schoolId }: Props) {
  const [categories, setCategories] = useState<CategoryForUI[]>(initialCategories);
  const [search, setSearch]         = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  // ── Handlers ────────────────────────────────────────────────────────────

  function handleCreated(created: CategoryForUI) {
    setCategories((prev) => [created, ...prev]);
  }

  function handleUpdated(updated: CategoryForUI) {
    setCategories((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
    );
  }

  async function handleToggle(id: string) {
    setTogglingId(id);
    const result = await toggleFeeCategoryStatus(id);
    setTogglingId(null);

    if (result.ok) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: result.data.isActive } : c))
      );
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete(id: string, name: string) {
    setDeletingId(id);
    const result = await deleteFeeCategory(id);
    setDeletingId(null);

    if (result.ok) {
      toast.success(`"${name}" deleted`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } else {
      // Server action already guards against deleting in-use categories
      toast.error(result.error);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Fee Categories
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {categories.length} categories ·{" "}
            {categories.filter((c) => c.isActive).length} active
          </p>
        </div>
        <CategoryDialog
          mode="create"
          schoolId={schoolId}
          onDone={handleCreated}
          trigger={
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4" />
              New Category
            </Button>
          }
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white border-slate-200 w-72"
        />
      </div>

      {/* Empty state */}
      {categories.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3">
            <Tag className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No fee categories yet</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Create your first category to start building fee structures.
          </p>
          <CategoryDialog
            mode="create"
            schoolId={schoolId}
            onDone={handleCreated}
            trigger={
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Create First Category
              </Button>
            }
          />
        </div>
      )}

      {/* Table */}
      {categories.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 pl-5">
                  Category
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Code
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Usage
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 text-right pr-5">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cat) => (
                <TableRow key={cat.id} className="hover:bg-slate-50/50 transition-colors">

                  {/* Name + description */}
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                        <Tag className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
                        <p className="text-xs text-slate-400">{cat.description ?? "—"}</p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Code */}
                  <TableCell>
                    <code className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                      {cat.code}
                    </code>
                  </TableCell>

                  {/* Usage — real counts from DB */}
                  <TableCell>
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">{cat.stats.totalStructureItems}</span> structures ·{" "}
                      <span className="font-medium">{cat.stats.totalInvoiceItems}</span> invoices
                    </p>
                  </TableCell>

                  {/* Active toggle */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={cat.isActive}
                        onCheckedChange={() => handleToggle(cat.id)}
                        disabled={togglingId === cat.id}
                        className="data-[state=checked]:bg-blue-500"
                      />
                      {togglingId === cat.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                      ) : (
                        <span className={`text-xs font-medium ${cat.isActive ? "text-blue-600" : "text-slate-400"}`}>
                          {cat.isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right pr-5">
                    <div className="flex items-center justify-end gap-1">

                      <CategoryDialog
                        mode="edit"
                        category={cat}
                        schoolId={schoolId}
                        onDone={handleUpdated}
                        trigger={
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50">
                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          </Button>
                        }
                      />

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-50"
                            disabled={cat.stats.isInUse || deletingId === cat.id}
                            title={
                              cat.stats.isInUse
                                ? "In use — deactivate instead of deleting"
                                : "Delete category"
                            }
                          >
                            {deletingId === cat.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                              : <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            }
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{cat.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This category will be permanently removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(cat.id, cat.name)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

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