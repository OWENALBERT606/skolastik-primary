// components/academic-terms/UpdateAcademicTermDialog.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateAcademicTerm } from "@/actions/terms";

const formSchema = z
  .object({
    name: z.string().min(1, "Term name is required"),
    termNumber: z.number().min(1, "Term number must be at least 1").max(3, "Term number must be at most 3"),
    startDate: z.date({
      required_error: "Start date is required",
    }),
    endDate: z.date({
      required_error: "End date is required",
    }),
    isActive: z.boolean(),
  })
  .refine(
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

interface UpdateAcademicTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicTerm: any;
  onSuccess: (term: any) => void;
}

export default function UpdateAcademicTermDialog({
  open,
  onOpenChange,
  academicTerm,
  onSuccess,
}: UpdateAcademicTermDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: academicTerm.name,
      termNumber: academicTerm.termNumber,
      startDate: new Date(academicTerm.startDate),
      endDate: new Date(academicTerm.endDate),
      isActive: academicTerm.isActive,
    },
  });

  // Reset form when academic term changes
  useEffect(() => {
    form.reset({
      name: academicTerm.name,
      termNumber: academicTerm.termNumber,
      startDate: new Date(academicTerm.startDate),
      endDate: new Date(academicTerm.endDate),
      isActive: academicTerm.isActive,
    });
  }, [academicTerm, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const result = await updateAcademicTerm(academicTerm.id, {
        name: values.name,
        termNumber: values.termNumber,
        startDate: values.startDate,
        endDate: values.endDate,
        isActive: values.isActive,
      });

      if (result.ok) {
        toast.success("Academic term updated successfully");
        onSuccess(result.data);
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to update academic term");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            Update Academic Term
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Make changes to the academic term details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Term Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-gray-100">Term Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Term 1, First Term"
                        {...field}
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Term Number */}
              <FormField
                control={form.control}
                name="termNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-gray-100">Term Number *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <SelectValue placeholder="Select term number" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectItem value="1">Term 1</SelectItem>
                        <SelectItem value="2">Term 2</SelectItem>
                        <SelectItem value="3">Term 3</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-gray-900 dark:text-gray-100">Start Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
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
                      <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" align="start">
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
                render={({ field }) => {
                  const startDate = form.watch("startDate");
                  
                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-gray-900 dark:text-gray-100">End Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
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
                        <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            defaultMonth={
                              startDate
                                ? new Date(
                                    startDate.getFullYear(),
                                    startDate.getMonth() + 1,
                                    1
                                  )
                                : new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {startDate && (
                        <FormDescription className="text-xs text-gray-600 dark:text-gray-400">
                          Should be after {format(startDate, "PPP")}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* Active Status */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-gray-900 dark:text-gray-100">Active Status</FormLabel>
                    <FormDescription className="text-gray-600 dark:text-gray-400">
                      Set this as the active academic term. Only one term can be active per academic year.
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
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Update Academic Term
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}