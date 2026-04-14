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
import { updateStream } from "@/actions/streams";
import { getAvailableClassHeads } from "@/actions/streams";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Stream = {
  id: string;
  name: string;
  classYear: {
    id: string;
  };
  classHead?: {
    id: string;
  } | null;
};

interface EditStreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stream: Stream;
}

export default function EditStreamDialog({
  open,
  onOpenChange,
  stream,
}: EditStreamDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: stream.name,
    classHeadId: stream.classHead?.id || "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: stream.name,
        classHeadId: stream.classHead?.id || "",
      });
      loadTeachers();
    }
  }, [open, stream]);

  const loadTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const data = await getAvailableClassHeads(
        "school-id", // Get from context
        stream.classYear.id,
        stream.id
      );
      setTeachers(data);
    } catch (error) {
      toast.error("Failed to load teachers");
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateStream(stream.id, {
        name: formData.name,
        classHeadId: formData.classHeadId || null,
      });

      if (result.ok) {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to update stream");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Stream</DialogTitle>
          <DialogDescription>
            Update stream details and class head assignment
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="classHeadId">Class Head</Label>
            {loadingTeachers ? (
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
            ) : (
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
                  <SelectItem value="">None</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} ({teacher.staffNo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}