import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import useStore from "@/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";

interface SelectProjectDialogProps {
  // The element that triggers the dialog (e.g., a button).
  children: React.ReactNode;
}

const formSchema = z.object({
  projectName: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
});

export const ProjectDialog: React.FC<SelectProjectDialogProps> = ({
  children,
}) => {
  const currentProject = useStore((state) => state.currentProject);
  const [isOpen, setIsOpen] = useState(currentProject === null);

  // If a currentProject is set, close the dialog
  useEffect(() => {
    if (currentProject) {
      setIsOpen(false);
    }
  }, [currentProject]);

  const projects = useStore((state) => state.projects);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const loadProjects = useStore((state) => state.loadProjectsMetadata);
  // Load projects on mount
  useEffect(() => {
    try {
      void loadProjects();
    } finally {
      setIsProjectsLoading(false);
    }
  }, [loadProjects]);

  // When current project is set to null, open the dialog and close it automatically if a current project is set
  useEffect(() => {
    if (currentProject === null) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [setIsOpen, currentProject]);

  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const loadProject = useStore((state) => state.loadProject);
  const onLoadProjectClick = () => {
    if (selectedProject) {
      void loadProject(selectedProject);
    } else {
      toast.error("No project selected");
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
    },
  });

  const createProject = useStore((state) => state.createProject);
  const onCreateProject = async (values: z.infer<typeof formSchema>) => {
    await createProject(values.projectName);
    form.reset();
  };

  const deleteProject = useStore((state) => state.deleteProject);
  const onDeleteProjectConfirm = async (id: string) => {
    await deleteProject(id);
  };

  const onOpenChange = (open: boolean) => {
    if (!open && currentProject === null) {
      // Don't allow closing the dialog if there is no currentProject
      return;
    }
    setIsOpen(open);
    if (open) {
      // Load projects on open
      try {
        void loadProjects();
      } finally {
        setIsProjectsLoading(false);
      }
    } else {
      form.reset();
      setSelectedProject(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        className="sm:max-w-[500px] p-0 overflow-hidden"
        showCloseButton={currentProject !== null}
      >
        <div className="flex flex-col">
          {" "}
          {/* Top Section  */}
          <div className="p-6">
            {" "}
            <DialogHeader className="mb-4">
              <DialogTitle>Select a Project to Open</DialogTitle>
              <DialogDescription>Select a project to open</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <h4 className="mb-4 text-sm leading-none font-medium">
                Projects
              </h4>
              <ScrollArea className="h-72 w-48 rounded-md border">
                <div className="p-4">
                  {isProjectsLoading ? (
                    <>
                      <Skeleton />
                      <Skeleton />
                      <Skeleton />
                    </>
                  ) : (
                    projects.map((project) => (
                      <div
                        key={project.id}
                        className={cn(
                          "p-2 border cursor-pointer hover:bg-blue-50 flex items-center justify-between text-sm select-none",
                          {
                            "bg-blue-100 border-blue-500":
                              selectedProject === project.id,
                          },
                        )}
                        onClick={() => {
                          setSelectedProject(
                            selectedProject == project.id ? null : project.id,
                          );
                        }}
                        onDoubleClick={() => {
                          // Double click on the project, load it directly
                          void loadProject(project.id);
                        }}
                      >
                        {project.name}{" "}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="cursor-pointer shadow-sm"
                            >
                              <Trash className="text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Project
                              </AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogDescription>
                              Are you sure you want to delete this project?
                            </AlertDialogDescription>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  onDeleteProjectConfirm(project.id);
                                }}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>{" "}
            </div>
            {/* --- SECTION ONE FOOTER --- */}
            <div className="pt-4 mt-4 flex justify-end gap-2">
              <Button
                size="sm"
                type="submit"
                disabled={selectedProject === null}
                onClick={onLoadProjectClick}
              >
                Open Project
              </Button>
            </div>
          </div>
          {/* Bottom Section  */}
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle>Create a Project</DialogTitle>
              <DialogDescription>
                Enter a name for the project.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                // ignoring this promise does not work as the
                onSubmit={form.handleSubmit(onCreateProject)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              autoComplete="off"
                              className="col-span-3"
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
                <div className="pt-4 mt-4 flex justify-end gap-2">
                  <Button
                    disabled={
                      !form.formState.isValid || form.formState.isSubmitting
                    }
                    type="submit"
                  >
                    Create Project
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
