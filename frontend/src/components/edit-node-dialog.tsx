import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/store";
import { AppNodeSchema, isAppNode } from "@/types/nodes";
import type { AppState } from "@/types/state";
import { zodResolver } from "@hookform/resolvers/zod";
import { useReactFlow } from "@xyflow/react";
import log from "loglevel";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";
import { NodeForm } from "./node-form";
import { Button } from "./ui/button";

const selector = (s: AppState) => ({
  currentEditNode:
    s.dialogNodeData?.type === "edit" ? s.dialogNodeData.data : null,
  setCurrentEditNodeData: s.setCurrentEditNodeData,
});

export const EditNodeDialog = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { setCurrentEditNodeData, currentEditNode } = useStore(
    useShallow(selector),
  );
  const form = useForm<z.infer<typeof AppNodeSchema>>({
    resolver: zodResolver(AppNodeSchema),
  });

  React.useEffect(() => {
    if (currentEditNode) {
      setIsOpen(true);
      form.reset(currentEditNode);
    } else {
      setIsOpen(false);
      form.reset();
    }
  }, [currentEditNode, form]);
  const { updateNodeData, getNodeConnections, getNode } = useReactFlow();

  if (currentEditNode === null) {
    return null;
  }

  const logger = log.getLogger("edit-node-dialog");

  const submitForm = (values: z.infer<typeof AppNodeSchema>) => {
    const data = { ...currentEditNode.data, ...values.data };
    updateNodeData(currentEditNode.id, data);
    setCurrentEditNodeData(null);
  };

  const sourceConnections = getNodeConnections({
    type: "target",
    nodeId: currentEditNode.id,
  });
  if (sourceConnections.length > 1) {
    logger.warn(
      `Node ${currentEditNode.id} has more than one source connection, this is unexpected.`,
    );
  }

  let baseRev = null;
  if (sourceConnections.length > 0) {
    const sourceNode = getNode(sourceConnections[0].source);
    if (sourceNode && isAppNode(sourceNode)) {
      baseRev = sourceNode.data.git;
    } else {
      logger.warn(
        `No valid source node ${sourceConnections[0].source} not found for node ${currentEditNode.id}.`,
      );
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setCurrentEditNodeData(null);
          // At this point it is sufficient to set the current edit node data to null, theReact.useEffect in this
          // component will close it for us and also re-open if some component sets it at some point
        }
      }}
    >
      <DialogContent className="md:max-w-[800px]">
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
          baseRev={baseRev}
        />
      </DialogContent>
    </Dialog>
  );
};
