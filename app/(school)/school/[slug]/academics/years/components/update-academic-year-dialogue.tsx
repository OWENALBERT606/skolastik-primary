// components/academic-years/UpdateAcademicYearDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateAcademicYear } from "@/actions/years";

const formSchema = z.object({
  year: z
    .string()
    .min(4, "Academic year is required")
    .regex(/^\d{4}(\/\d{4})?$/, "Format should be '2024' or '2024/2025'"),
  isActive: z.boolean(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate < data.endDate;
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

type FormValues = z.infer<typeof formSchema>;

interface UpdateAcademicYearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicYear: any;
  onSuccess: (year: any) => void;
}

export default function UpdateAcademicYearDialog({
  open,
  onOpenChange,
  academicYear,
  onSuccess,
}: UpdateAcademicYearDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: academicYear.year,
      isActive: academicYear.isActive,
      startDate: academicYear.startDate ? new Date(academicYear.startDate) : undefined,
      endDate: academicYear.endDate ? new Date(academicYear.endDate) : undefined,
    },
  });

  // Reset form when academic year changes
  useEffect(() => {
    form.reset({
      year: academicYear.year,
      isActive: academicYear.isActive,
      startDate: academicYear.startDate ? new Date(academicYear.startDate) : undefined,
      endDate: academicYear.endDate ? new Date(academicYear.endDate) : undefined,
    });
  }, [academicYear, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const result = await updateAcademicYear(academicYear.id, {
        year: values.year,
        isActive: values.isActive,
        startDate: values.startDate,
        endDate: values.endDate,
      });

      if (result.ok) {
        toast.success("Academic year updated successfully");
        onSuccess(result.data);
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to update academic year");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Academic Year</DialogTitle>
          <DialogDescription>
            Make changes to the academic year details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Year */}
            <FormField
              control={form.control}
              name="year"
              render={({ field }:{field:any}) => (
                <FormItem>
                  <FormLabel>Academic Year *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 2024 or 2024/2025"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the academic year in format: 2024 or 2024/2025
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }:{field:any}) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }:{field:any}) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            form.watch("startDate")
                              ? date < form.watch("startDate")!
                              : false
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Active Status */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }:{field:any}) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Set this as the active academic year. Only one year can be
                      active at a time.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Update Academic Year
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}