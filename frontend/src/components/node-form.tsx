import { client } from "@/client";
import type { AppNodeType } from "@/types/nodes";
import {
  AppNodeSchema,
  formatGitRevision,
  type GitMetadata,
} from "@/types/nodes";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { AsyncCombobox } from "./async-combobox";
import { IconSelectContent } from "./icon-select-content";
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
import { Textarea } from "./ui/textarea";

const GitRevCommandItem = (m: GitMetadata) => {
  return (
    <div className="font-mono">
      <span className="font-bold">{formatGitRevision(m)}</span> • {m.summary}
    </div>
  );
};

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
}

export const NodeForm = ({
  nodeType,
  form,
  submitForm,
  submitButtonText,
  cancelComponent,
}: NodeFormProps) => {
  const fetchGitRevisions = async (value: string): Promise<GitMetadata[]> => {
    const { data, error } = await client.GET("/api/v1/git/revs/match", {
      params: { query: { revPrefix: value } },
    });
    if (data) {
      return [
        ...data.commits.map((commit) => {
          return {
            rev: commit.id,
            summary: commit.summary,
            isTag: false,
          };
        }),
      ];
    }
    throw new Error(`Failed to fetch Git revisions: ${error.message}`);
  };

  const fetGitTags = async (value: string): Promise<GitMetadata[]> => {
    const { data, error } = await client.GET("/api/v1/git/tags", {
      params: { query: { prefix: value } },
    });

    if (data) {
      return [
        ...data.tags.map((data) => {
          return {
            rev: data.tag,
            summary: data.commit.summary,
            isTag: true,
          };
        }),
      ];
    }
    throw new Error(`Failed to fetch Git tags: ${error.message}`);
  };

  const fetGitTagsAndRevisions = async (
    value: string,
  ): Promise<GitMetadata[]> => {
    const [revisions, tags] = await Promise.all([
      fetchGitRevisions(value),
      fetGitTags(value),
    ]);
    return [...revisions, ...tags];
  };

  const [gitRevSuggestionsIsOpen, setGitRevSuggestionIsOpen] = useState(false);
  return (
    <Form {...form}>
      <form
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSubmit={form.handleSubmit(submitForm, (errors) => {
          console.log(errors);
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
                <Textarea {...field} autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {nodeType === "statusNode" && (
          <div className="space-y-8">
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
            <FormField
              control={form.control}
              name="data.git"
              render={({ field }) => (
                <FormItem className="flex gap-4">
                  <FormLabel className="w-24">Git Revision</FormLabel>
                  <FormControl>
                    <AsyncCombobox<GitMetadata>
                      fetchItems={fetGitTagsAndRevisions}
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {cancelComponent}
          <Button
            disabled={
              !form.formState.isValid ||
              form.formState.isSubmitting ||
              gitRevSuggestionsIsOpen
            }
            type="submit"
          >
            {submitButtonText}
          </Button>
        </div>{" "}
      </form>
    </Form>
  );
};
