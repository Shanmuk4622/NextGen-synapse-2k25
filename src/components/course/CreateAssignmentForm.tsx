
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Paperclip } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { collection, serverTimestamp } from "firebase/firestore";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, addDocumentNonBlocking } from "@/firebase";

const assignmentFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  dueDate: z.date({ required_error: "A due date is required." }),
  attachment: z.any().optional(), // We'll handle file validation later
});

type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

interface CreateAssignmentFormProps {
  courseId: string;
  onSuccess: () => void;
}

export function CreateAssignmentForm({ courseId, onSuccess }: CreateAssignmentFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  async function onSubmit(values: AssignmentFormValues) {
    if (!firestore || !courseId) return;
    
    // NOTE: File upload logic is not implemented yet.
    // We are preparing the data structure for when it is.
    const attachmentUrl = ""; // Placeholder for the uploaded file URL
    
    const assignmentId = uuidv4();
    const newAssignment = {
      id: assignmentId,
      courseId,
      title: values.title,
      description: values.description,
      dueDate: values.dueDate,
      attachmentUrl: attachmentUrl,
      createdAt: serverTimestamp(),
    };

    const assignmentsCollection = collection(firestore, `courses/${courseId}/assignments`);
    addDocumentNonBlocking(assignmentsCollection, newAssignment);
    
    toast({
      title: "Assignment Created",
      description: `The assignment "${values.title}" has been added to the course.`,
    });
    
    onSuccess();
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assignment Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Chapter 1 Review" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide instructions for the assignment..."
                  className="resize-y"
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Due Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
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
                    disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="attachment"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Attach File (Optional)
              </FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                  className="pt-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : "Create Assignment"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
