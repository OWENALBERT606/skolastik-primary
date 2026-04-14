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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ArrowRightLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getStreamsByClassYear, transferStudentToStream } from "@/actions/students";

// ════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ════════════════════════════════════════════════════════════════════════════

const transferSchema = z.object({
  newStreamId: z.string().min(1, "New stream is required"),
  reason: z.string().optional(),
});

type FormData = z.infer<typeof transferSchema>;

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type Enrollment = {
  id: string;
  classYearId: string;
  classYear: {
    classTemplate: {
      name: string;
    };
  };
  stream?: {
    id: string;
    name: string;
  } | null;
};

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
};

type Stream = {
  id: string;
  name: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollment: Enrollment;
  student: Student;
  schoolId: string;
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function TransferStreamDialog({
  open,
  onOpenChange,
  enrollment,
  student,
  schoolId,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableStreams, setAvailableStreams] = useState<Stream[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      newStreamId: "",
      reason: "",
    },
  });

  // Fetch available streams for the current class year
  useEffect(() => {
    const fetchStreams = async () => {
      if (enrollment.classYearId && open) {
        try {
          const result = await getStreamsByClassYear(enrollment.classYearId);
          if (result.ok && result.data) {
            // Filter out current stream
            const filtered = result.data.filter(
              (stream) => stream.id !== enrollment.stream?.id
            );
            setAvailableStreams(filtered);
          }
        } catch (error) {
          console.error("Error fetching streams:", error);
          toast.error("Failed to load available streams");
        }
      }
    };

    fetchStreams();
  }, [open, enrollment.classYearId, enrollment.stream?.id]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
    const result = await transferStudentToStream({
    enrollmentId: enrollment.id,
    newStreamId: data.newStreamId,
    reason: data.reason,
    schoolId: schoolId,
      });

      if (result.ok) {
        toast.success(result.message);
        form.reset();
        onOpenChange(false);
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Transfer stream error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Stream
          </DialogTitle>
          <DialogDescription>
            Transfer {student.firstName} {student.lastName} to a different stream
            within {enrollment.classYear.classTemplate.name}.
          </DialogDescription>
        </DialogHeader>

        {enrollment.stream ? (
          <>
            <Alert>
              <AlertDescription>
                <p className="font-medium">Current Stream:</p>
                <p className="text-sm">
                  {enrollment.classYear.classTemplate.name} -{" "}
                  {enrollment.stream.name}
                </p>
              </AlertDescription>
            </Alert>

            {availableStreams.length === 0 ? (
              <Alert variant="destructive">
                <AlertDescription>
                  No other streams available for this class. Please create
                  additional streams first.
                </AlertDescription>
              </Alert>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="newStreamId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Stream *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select new stream" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableStreams.map((stream) => (
                              <SelectItem key={stream.id} value={stream.id}>
                                {stream.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the stream to transfer the student to
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide a reason for the transfer..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: Explain why this transfer is being made
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Transfer Student
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </>
        ) : (
          <Alert>
            <AlertDescription>
              This student is not currently in a stream. Use the "Enroll in
              Class" option to assign them to a stream.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}