import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import type { AppState } from "@/types/state";
import { zodResolver } from "@hookform/resolvers/zod";
import { useReactFlow } from "@xyflow/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";
import { statusNodeIconMap, statusNodeIconOptions } from "./status-icons";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string(),
  state: z.enum(["unknown", "progress", "fail", "success"]).optional(),
  gitRev: z
    .string()
    .regex(/[0-9a-fA-F]*/, {
      message: "Invalid Git revision",
    })
    .optional(),
});

const selector = (s: AppState) => ({
  currentEditNode: s.currentEditNodeData,
  setCurrentEditNodeData: s.setCurrentEditNodeData,
});

export const EditNodeDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { setCurrentEditNodeData, currentEditNode } = useStore(
    useShallow(selector),
  );
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (currentEditNode) {
      setIsOpen(true);
      // Set initial form values
      form.reset({
        title: currentEditNode.data.title,
        description: currentEditNode.data.description,
      });
      if (currentEditNode.type === "statusNode") {
        form.setValue("state", currentEditNode.data.state);
        form.setValue("gitRev", currentEditNode.data.git.rev);
      }
    } else {
      setIsOpen(false);
      form.reset();
    }
  }, [currentEditNode, form]);
  const { updateNodeData } = useReactFlow();

  if (currentEditNode === null) {
    return null;
  }
  const submitForm = (values: z.infer<typeof formSchema>) => {
    let data = {
      title: values.title,
      description: values.description,
    };

    if (currentEditNode.type === "statusNode") {
      data = {
        ...data,
        ...{
          state: values.state ?? "unknown",
          git: {
            rev: values.gitRev ?? "",
          },
          hasTargetHandle: currentEditNode.data.hasTargetHandle,
        },
      };
    }
    updateNodeData(currentEditNode.id, data);
    setCurrentEditNodeData(null);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setCurrentEditNodeData(null);
        }
        setIsOpen(open);
      }}
    >
      <DialogContent className="md:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Edit Node</DialogTitle>
          <DialogDescription>Update node attributes.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onSubmit={form.handleSubmit(submitForm)}
            className="space-y-8"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" />
                  </FormControl>
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
                    <Textarea {...field} autoComplete="off" />
                  </FormControl>
                </FormItem>
              )}
            />
            {currentEditNode.type === "statusNode" && (
              <div className="space-y-8">
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem className="flex gap-5">
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select
                          name="status"
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {statusNodeIconOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                className="p-0 bg-popover"
                              >
                                <div
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-2",
                                  )}
                                >
                                  <span>
                                    {statusNodeIconMap[option.value]}{" "}
                                  </span>
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gitRev"
                  render={({ field }) => (
                    <FormItem className="flex gap-5">
                      <FormLabel>Git Revision</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete="off"
                          className="font-mono w-[180px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
