import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/store";
import { AppNodeSchema } from "@/types/nodes";
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
  const form = useForm<z.infer<typeof AppNodeSchema>>({
    resolver: zodResolver(AppNodeSchema),
  });

  useEffect(() => {
    if (currentEditNode) {
      setIsOpen(true);
      form.reset(currentEditNode);
    } else {
      setIsOpen(false);
      form.reset();
    }
  }, [currentEditNode, form]);
  const { updateNodeData } = useReactFlow();

  if (currentEditNode === null) {
    return null;
  }
  const submitForm = (values: z.infer<typeof AppNodeSchema>) => {
    const data = { ...currentEditNode.data, ...values.data };
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
