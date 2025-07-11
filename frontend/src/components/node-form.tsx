import { client } from "@/client";
import type { AppNodeType } from "@/types/nodes";
import { appNodeFormSchema } from "@/types/nodes";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { AsyncCombobox, type ComboboxItem } from "./async-combobox";
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

const GitRevCommandItem = ({ id, label }: ComboboxItem) => {
  return (
    <div className="font-mono">
      <span className="font-bold">{id}</span> • {label}
    </div>
  );
};

interface NodeFormProps {
  /** Node type  */
  nodeType: AppNodeType;
  /** Form object */
  form: UseFormReturn<z.infer<typeof appNodeFormSchema>>;
  /** Callback to submit the form */
  submitForm: (values: z.infer<typeof appNodeFormSchema>) => void;
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
  const fetchGitRevisions = async (value: string): Promise<ComboboxItem[]> => {
    console.log("fetching revs", value);
    const { data, error } = await client.GET("/api/v1/git/revs/match", {
      params: { query: { revPrefix: value } },
    });
    if (data) {
      return [
        ...data.tags.map((tag) => {
          return { id: tag.tag, label: tag.commit.summary };
        }),
        ...data.commits.map((commit) => {
          return {
            id: commit.id.slice(0, 7),
            label: commit.summary,
          };
        }),
      ];
    }
    throw new Error(`Failed to fetch Git revisions: ${error.message}`);
  };

  const [gitRevSuggestionsIsOpen, setGitRevSuggestionIsOpen] = useState(false);
  return (
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
        {nodeType === "statusNode" && (
          <div className="space-y-8">
            <FormField
              control={form.control}
              name="state"
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
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gitRev"
              render={({ field }) => (
                <FormItem className="flex gap-4">
                  <FormLabel className="w-24">Git Revision</FormLabel>
                  <FormControl>
                    <AsyncCombobox
                      fetchItems={fetchGitRevisions}
                      value={field.value ?? ""}
                      onChange={(item) => {
                        field.onChange(item ? item.id : null);
                      }}
                      placeholder="Select revision"
                      onDropdownOpenChange={setGitRevSuggestionIsOpen}
                      renderItem={GitRevCommandItem}
                      fontFamily="font-mono"
                      buttonClasses="w-[200px]"
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
