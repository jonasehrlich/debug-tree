import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/store";
import { appNodeFormSchema } from "@/types/nodes";
import type { AppState } from "@/types/state";
import { zodResolver } from "@hookform/resolvers/zod";
import { useReactFlow } from "@xyflow/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";
import { NodeForm } from "./node-form";
import { Button } from "./ui/button";

const selector = (s: AppState) => ({
  currentEditNode: s.currentEditNodeData,
  setCurrentEditNodeData: s.setCurrentEditNodeData,
});

export const EditNodeDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { setCurrentEditNodeData, currentEditNode } = useStore(
    useShallow(selector),
  );
  const form = useForm<z.infer<typeof appNodeFormSchema>>({
    resolver: zodResolver(appNodeFormSchema),
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
  const submitForm = (values: z.infer<typeof appNodeFormSchema>) => {
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
        <NodeForm
          nodeType={currentEditNode.type}
          form={form}
          submitForm={submitForm}
          submitButtonText="Apply"
          cancelComponent={
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          }
        />
      </DialogContent>
    </Dialog>
  );
};
