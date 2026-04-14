// app/school/[slug]/academics/streams/[id]/components/stream-settings-dialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  Loader2,
  Save,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { updateStream, deleteStream } from "@/actions/streams";
import { useRouter } from "next/navigation";
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

interface StreamSettingsDialogProps {
  stream: any;
  onSuccess: () => void;
}

export default function StreamSettingsDialog({
  stream,
  onSuccess,
}: StreamSettingsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: stream.name || "",
    capacity: stream.capacity || "",
    description: stream.description || "",
    isActive: stream.isActive ?? true,
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Stream name is required");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateStream(stream.id, {
        name: formData.name,
        // capacity: formData.capacity ? parseInt(formData.capacity) : null,
        // description: formData.description || null,
        // isActive: formData.isActive,
      });

      if (result.ok) {
        toast.success("Stream settings updated successfully");
        setOpen(false);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to update stream settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteStream(stream.id);

      if (result.ok) {
        toast.success(result.message);
        router.push(`/school/${stream.schoolId}/academics/classes`);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to delete stream");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#5B9BD5]" />
            Stream Settings
          </DialogTitle>
          <DialogDescription>
            Manage stream information and configuration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Stream Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Stream Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., East, West, A, B"
            />
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">Student Capacity (Optional)</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({ ...formData, capacity: e.target.value })
              }
              placeholder="Maximum number of students"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Leave empty for no limit
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Add stream description or notes..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Active Status</Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inactive streams won't accept new enrollments
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <Label className="text-red-600">Danger Zone</Label>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Stream
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the stream{" "}
                      <strong>{stream.name}</strong> and all associated data.
                      <br />
                      <br />
                      {stream._count?.enrollments > 0 && (
                        <span className="text-red-600 dark:text-red-400">
                          ⚠️ This stream has {stream._count.enrollments}{" "}
                          enrolled student(s). Please reassign them first.
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting || stream._count?.enrollments > 0}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Stream"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-[#5B9BD5] hover:bg-[#4A8BC2]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}