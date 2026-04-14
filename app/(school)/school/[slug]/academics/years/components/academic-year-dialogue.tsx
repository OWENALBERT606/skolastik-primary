// // components/academic-years/CreateAcademicYearDialog.tsx
// "use client";

// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Form,
//   FormControl,
//   FormDescription,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Switch } from "@/components/ui/switch";
// import { Calendar } from "@/components/ui/calendar";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { CalendarIcon, Loader2 } from "lucide-react";
// import { format } from "date-fns";
// import { cn } from "@/lib/utils";
// import { toast } from "sonner";
// import { createAcademicYear } from "@/actions/years";

// const formSchema = z.object({
//   year: z
//     .string()
//     .min(4, "Academic year is required")
//     .regex(/^\d{4}(\/\d{4})?$/, "Format should be '2024' or '2024/2025'"),
//   isActive: z.boolean().default(true),
//   startDate: z.date().optional(),
//   endDate: z.date().optional(),
// }).refine(
//   (data) => {
//     if (data.startDate && data.endDate) {
//       return data.startDate < data.endDate;
//     }
//     return true;
//   },
//   {
//     message: "End date must be after start date",
//     path: ["endDate"],
//   }
// );

// type FormValues = z.infer<typeof formSchema>;

// interface CreateAcademicYearDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   schoolId: string;
//   onSuccess: (year: any) => void;
// }

// export default function CreateAcademicYearDialog({
//   open,
//   onOpenChange,
//   schoolId,
//   onSuccess,
// }: CreateAcademicYearDialogProps) {
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const form = useForm<FormValues>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       year: "",
//       isActive: true,
//       startDate: undefined,
//       endDate: undefined,
//     },
//   });

//   const onSubmit = async (values: FormValues) => {
//     setIsSubmitting(true);
//     try {
//       const result = await createAcademicYear({
//         schoolId,
//         year: values.year,
//         isActive: values.isActive,
//         startDate: values.startDate,
//         endDate: values.endDate,
//       });

//       if (result.ok) {
//         toast.success("Academic year created successfully");
//         onSuccess(result.data);
//         form.reset();
//         onOpenChange(false);
//       } else {
//         toast.error(result.error);
//       }
//     } catch (error) {
//       toast.error("Failed to create academic year");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle>Create Academic Year</DialogTitle>
//           <DialogDescription>
//             Add a new academic year to your school. This will organize students,
//             classes, and terms.
//           </DialogDescription>
//         </DialogHeader>

//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//             {/* Year */}
//             <FormField
//               control={form.control}
//               name="year"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Academic Year *</FormLabel>
//                   <FormControl>
//                     <Input
//                       placeholder="e.g., 2024 or 2024/2025"
//                       {...field}
//                     />
//                   </FormControl>
//                   <FormDescription>
//                     Enter the academic year in format: 2024 or 2024/2025
//                   </FormDescription>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             {/* Date Range */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               {/* Start Date */}
//               <FormField
//                 control={form.control}
//                 name="startDate"
//                 render={({ field }) => (
//                   <FormItem className="flex flex-col">
//                     <FormLabel>Start Date</FormLabel>
//                     <Popover>
//                       <PopoverTrigger asChild>
//                         <FormControl>
//                           <Button
//                             variant="outline"
//                             className={cn(
//                               "pl-3 text-left font-normal",
//                               !field.value && "text-muted-foreground"
//                             )}
//                           >
//                             {field.value ? (
//                               format(field.value, "PPP")
//                             ) : (
//                               <span>Pick a date</span>
//                             )}
//                             <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
//                           </Button>
//                         </FormControl>
//                       </PopoverTrigger>
//                       <PopoverContent className="w-auto p-0" align="start">
//                         <Calendar
//                           mode="single"
//                           selected={field.value}
//                           onSelect={field.onChange}
//                           initialFocus
//                         />
//                       </PopoverContent>
//                     </Popover>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* End Date */}
//               <FormField
//                 control={form.control}
//                 name="endDate"
//                 render={({ field }) => (
//                   <FormItem className="flex flex-col">
//                     <FormLabel>End Date</FormLabel>
//                     <Popover>
//                       <PopoverTrigger asChild>
//                         <FormControl>
//                           <Button
//                             variant="outline"
//                             className={cn(
//                               "pl-3 text-left font-normal",
//                               !field.value && "text-muted-foreground"
//                             )}
//                           >
//                             {field.value ? (
//                               format(field.value, "PPP")
//                             ) : (
//                               <span>Pick a date</span>
//                             )}
//                             <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
//                           </Button>
//                         </FormControl>
//                       </PopoverTrigger>
//                       <PopoverContent className="w-auto p-0" align="start">
//                         <Calendar
//                           mode="single"
//                           selected={field.value}
//                           onSelect={field.onChange}
//                           disabled={(date) =>
//                             form.watch("startDate")
//                               ? date < form.watch("startDate")!
//                               : false
//                           }
//                           initialFocus
//                         />
//                       </PopoverContent>
//                     </Popover>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>

//             {/* Active Status */}
//             <FormField
//               control={form.control}
//               name="isActive"
//               render={({ field }) => (
//                 <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
//                   <div className="space-y-0.5">
//                     <FormLabel className="text-base">Active Status</FormLabel>
//                     <FormDescription>
//                       Set this as the active academic year. Only one year can be
//                       active at a time.
//                     </FormDescription>
//                   </div>
//                   <FormControl>
//                     <Switch
//                       checked={field.value}
//                       onCheckedChange={field.onChange}
//                     />
//                   </FormControl>
//                 </FormItem>
//               )}
//             />

//             <DialogFooter>
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => onOpenChange(false)}
//                 disabled={isSubmitting}
//               >
//                 Cancel
//               </Button>
//               <Button type="submit" disabled={isSubmitting}>
//                 {isSubmitting && (
//                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                 )}
//                 Create Academic Year
//               </Button>
//             </DialogFooter>
//           </form>
//         </Form>
//       </DialogContent>
//     </Dialog>
//   );
// }


// components/academic-years/CreateAcademicYearDialog.tsx
"use client";

import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createAcademicYear } from "@/actions/years";

/* -------------------- Validation Schema -------------------- */
const formSchema = z
  .object({
    year: z
      .string()
      .min(4, "Academic year is required")
      .regex(/^\d{4}(\/\d{4})?$/, "Format should be '2024' or '2024/2025'"),
    isActive: z.boolean().default(true),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

interface CreateAcademicYearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  onSuccess: (year: any) => void;
}

export default function CreateAcademicYearDialog({
  open,
  onOpenChange,
  schoolId,
  onSuccess,
}: CreateAcademicYearDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: "",
      isActive: true,
      startDate: undefined,
      endDate: undefined,
    },
  });


  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createAcademicYear({
        schoolId,
        year: values.year,
        isActive: values.isActive,
        startDate: values.startDate ? new Date(values.startDate) : undefined,
        endDate: values.endDate ? new Date(values.endDate) : undefined,
      });

      if (result.ok) {
        toast.success("Academic year created successfully");
        onSuccess(result.data);
        form.reset();
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to create academic year");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Academic Year</DialogTitle>
          <DialogDescription>
            Add a new academic year to your school. This will organize students,
            classes, and terms.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Academic Year */}
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Year *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 2024 or 2024/2025" {...field} />
                  </FormControl>
                  <FormDescription>
                    Format: 2024 or 2024/2025
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
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <input
                        type="date"
                        value={field.value ?? ""}
                        onChange={e => field.onChange(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <input
                        type="date"
                        value={field.value ?? ""}
                        onChange={e => field.onChange(e.target.value)}
                        min={form.watch("startDate") ?? undefined}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Active Status */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Only one academic year can be active at a time.
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

            {/* Footer */}
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
                Create Academic Year
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
