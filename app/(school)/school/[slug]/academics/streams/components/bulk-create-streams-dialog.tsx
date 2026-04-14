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
import { Badge } from "@/components/ui/badge";
import { bulkCreateStreams } from "@/actions/streams";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { getActiveClassYears } from "@/actions/querries";

interface BulkCreateStreamsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
}

export default function BulkCreateStreamsDialog({
  open,
  onOpenChange,
  schoolId,
}: BulkCreateStreamsDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [classYears, setClassYears] = useState<any[]>([]);
  const [classYearId, setClassYearId] = useState("");
  const [streamNames, setStreamNames] = useState<string[]>([""]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, schoolId]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const data = await getActiveClassYears(schoolId);
      setClassYears(data);
    } catch (error) {
      toast.error("Failed to load class years");
    } finally {
      setLoadingData(false);
    }
  };

  const addStreamName = () => {
    setStreamNames([...streamNames, ""]);
  };

  const removeStreamName = (index: number) => {
    setStreamNames(streamNames.filter((_, i) => i !== index));
  };

  const updateStreamName = (index: number, value: string) => {
    const updated = [...streamNames];
    updated[index] = value;
    setStreamNames(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validNames = streamNames.filter((name) => name.trim());
    
    if (validNames.length === 0) {
      toast.error("Please enter at least one stream name");
      return;
    }

    setLoading(true);

    try {
      const result = await bulkCreateStreams({
        names: validNames,
        classYearId,
        schoolId,
      });

      if (result.ok) {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
        setStreamNames([""]);
        setClassYearId("");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to create streams");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Create Streams</DialogTitle>
          <DialogDescription>
            Create multiple streams at once for a class year. All streams will be
            automatically assigned the class subjects.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="space-y-4 py-4">
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="classYearId">
                Class Year <span className="text-destructive">*</span>
              </Label>
              <Select
                value={classYearId}
                onValueChange={setClassYearId}
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
              <div className="flex items-center justify-between">
                <Label>
                  Stream Names <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStreamName}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add More
                </Button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {streamNames.map((name, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={name}
                      onChange={(e) => updateStreamName(index, e.target.value)}
                      placeholder={`Stream ${index + 1} (e.g., East, West, A)`}
                      className="flex-1"
                    />
                    {streamNames.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStreamName(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">
                  {streamNames.filter((n) => n.trim()).length} stream(s)
                </Badge>
                <span>will be created</span>
              </div>
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
                Create Streams
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}