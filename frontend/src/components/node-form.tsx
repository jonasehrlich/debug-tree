import {
  createBranch,
  createTag,
  fetchBranches,
  fetchCommits,
  fetchTags,
  type GitMetadata,
} from "@/client";
import type { AppNodeType } from "@/types/nodes";
import { AppNodeSchema, formatGitRevision } from "@/types/nodes";
import log from "loglevel";
import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AsyncCombobox } from "./async-combobox";
import { CreateGitRevisionInput } from "./create-git-rev";
import { GitRevisionIcon } from "./git-revision";
import { IconSelectContent } from "./icon-select-content";
import { MarkdownPreviewTextarea } from "./markdown-preview-textarea";
import { statusNodeStateIconConfig } from "./state-colors-icons";
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
import { Select, SelectTrigger, SelectValue } from "./ui/select";

const GitRevCommandItem = (m: GitMetadata) => {
  return (
    <div className="font-mono">
      <span className="inline-flex items-center font-bold">
        <GitRevisionIcon revision={m} size={1} />

        <span className="ml-1">{formatGitRevision(m)}</span>
      </span>
      {" • "}
      {m.summary}
    </div>
  );
};

const logger = log.getLogger("node-form");

interface NodeFormProps {
  /** Node type  */
  nodeType: AppNodeType;
  /** Form object */
  form: UseFormReturn<z.infer<typeof AppNodeSchema>>;
  /** Callback to submit the form */
  submitForm: (values: z.infer<typeof AppNodeSchema>) => void;
  /** Text to show in the submit button */
  submitButtonText: string;
  /** Component to cancel the form */
  cancelComponent?: React.ReactNode;
  /** Optional base revision to allow creating branches/tags from */
  baseRev?: GitMetadata | null;
}

export const NodeForm = ({
  nodeType,
  form,
  submitForm,
  submitButtonText,
  cancelComponent,
  baseRev,
}: NodeFormProps) => {
  const fetchGitTagsAndCommits = async (
    value: string,
  ): Promise<GitMetadata[]> => {
    const [revisions, tags] = await Promise.all([
      fetchCommits(value),
      fetchTags(value),
    ]);
    return [...revisions, ...tags];
  };

  const [gitRevSuggestionsIsOpen, setGitRevSuggestionIsOpen] =
    React.useState(false);
  const fetchGitTagsAndBranches = async (value: string) => {
    const [branches, tags] = await Promise.all([
      fetchBranches(value),
      fetchTags(value),
    ]);

    return [...branches, ...tags];
  };

  const createGitRev = async (
    type: "branch" | "tag",
    name: string,
  ): Promise<GitMetadata | null> => {
    if (!name || !baseRev) {
      logger.error(`Cannot create ${type}: no name or base revision provided`);
      return null;
    }
    let rev = null;
    try {
      if (type === "branch") {
        rev = await createBranch(name, baseRev);
      } else {
        // tag
        rev = await createTag(name, baseRev);
      }
      toast.success(`Created ${type} ${name} successfully`);
    } catch (error) {
      toast.error((error as Error).message);
    }

    return rev;
  };
  return (
    <Form {...form}>
      <form
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSubmit={form.handleSubmit(submitForm, (errors) => {
          logger.info("Form submission error", errors);
        })}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="data.title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="data.description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <MarkdownPreviewTextarea
                  commonClassNames="min-h-[10lh] max-h-[35lh]"
                  textareaProps={{
                    ...field,
                    className: "font-mono",
                    autoComplete: "off",
                    rows: 10,
                  }}
                  markdownProps={{ children: field.value }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-8">
          {nodeType === "statusNode" && (
            <FormField
              control={form.control}
              name="data.state"
              render={({ field }) => (
                <FormItem className="flex gap-4">
                  <FormLabel className="w-24">Status</FormLabel>
                  <FormControl>
                    <Select
                      name="status"
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <IconSelectContent
                        optionsAndIcons={statusNodeStateIconConfig}
                      />
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="data.git"
            render={({ field }) => (
              <FormItem className="flex gap-4">
                <FormLabel className="w-24">Git Revision</FormLabel>
                <FormControl>
                  <AsyncCombobox<GitMetadata>
                    fetchItems={
                      nodeType === "statusNode"
                        ? fetchGitTagsAndCommits
                        : fetchGitTagsAndBranches
                    }
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select revision"
                    onDropdownOpenChange={setGitRevSuggestionIsOpen}
                    renderDropdownItem={GitRevCommandItem}
                    renderValue={formatGitRevision}
                    getItemValue={(item) => {
                      return item.rev;
                    }}
                    fontFamily="font-mono"
                    buttonClasses="w-[200px]"
                    commandProps={{ shouldFilter: false }}
                  />
                </FormControl>
                {nodeType === "actionNode" && (
                  <CreateGitRevisionInput
                    onSubmit={async (type, name) => {
                      const rev = await createGitRev(type, name);
                      if (rev) {
                        form.setValue("data.git", rev);
                      }
                    }}
                    branchDisabled={!baseRev}
                    tagDisabled={!baseRev}
                  />
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {cancelComponent}
          <Button
            disabled={form.formState.isSubmitting || gitRevSuggestionsIsOpen}
            type="submit"
          >
            {submitButtonText}
          </Button>
        </div>{" "}
      </form>
    </Form>
  );
};
