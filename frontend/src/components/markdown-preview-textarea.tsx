import { cn } from "@/lib/utils";
import Markdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";

interface MarkdownPreviewTextareaProps {
  /** Class names to be applied to both the textarea and the wrapper around the preview */
  commonClassNames?: string;
  /** Props for the markdown preview */
  markdownProps?: React.ComponentProps<typeof Markdown>;
  /** Props for the text area */
  textareaProps?: React.ComponentProps<"textarea">;
}

export const MarkdownPreviewTextarea = ({
  commonClassNames,
  markdownProps,
  textareaProps,
}: MarkdownPreviewTextareaProps) => {
  return (
    <Tabs defaultValue="edit">
      <TabsList>
        <TabsTrigger value="edit">Edit</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="edit">
        <Textarea
          {...textareaProps}
          placeholder={
            textareaProps?.placeholder ?? "Use Markdown to format your text"
          }
          className={cn(commonClassNames, textareaProps?.className)}
        />
      </TabsContent>
      <TabsContent value="preview">
        <div
          className={cn(
            "prose prose-markdown max-w-none border-input rounded-md dark:bg-input/30 rounded-md border bg-transparent px-3 py-2 shadow-xs",
            commonClassNames,
          )}
        >
          <Markdown {...markdownProps} />
        </div>
      </TabsContent>
    </Tabs>
  );
};
