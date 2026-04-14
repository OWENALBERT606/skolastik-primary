"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStream } from "@/actions/streams";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getActiveClassYears, getActiveTeachers } from "@/actions/querries";

interface CreateStreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
}

export default function CreateStreamDialog({
  open,
  onOpenChange,
  schoolId,
}: CreateStreamDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [classYears, setClassYears] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    classYearId: "",
    classHeadId: "",
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, schoolId]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [classYearsData, teachersData] = await Promise.all([
        getActiveClassYears(schoolId),
        getActiveTeachers(schoolId),
      ]);
      setClassYears(classYearsData);
      setTeachers(teachersData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createStream({
        name: formData.name,
        classYearId: formData.classYearId,
        schoolId,
        classHeadId: formData.classHeadId || undefined,
      });

      if (result.ok) {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
        setFormData({ name: "", classYearId: "", classHeadId: "" });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to create stream");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Stream</DialogTitle>
          <DialogDescription>
            Add a new stream to an existing class. Subjects will be automatically
            assigned.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="classYearId">
                Class Year <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.classYearId}
                onValueChange={(value) =>
                  setFormData({ ...formData, classYearId: value })
                }
                required
              >
                <SelectTrigger id="classYearId">
                  <SelectValue placeholder="Select class year" />
                </SelectTrigger>
                <SelectContent>
                  {classYears.map((cy) => (
                    <SelectItem key={cy.id} value={cy.id}>
                      {cy.classTemplate.name} - {cy.academicYear.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Stream Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., East, West, A, B"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="classHeadId">Class Head (Optional)</Label>
              <Select
                value={formData.classHeadId}
                onValueChange={(value) =>
                  setFormData({ ...formData, classHeadId: value })
                }
              >
                <SelectTrigger id="classHeadId">
                  <SelectValue placeholder="Select class head" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} ({teacher.staffNo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Stream
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}