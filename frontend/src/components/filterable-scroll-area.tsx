import { cn } from "@/lib/utils";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { XCircle } from "lucide-react";
import * as React from "react";

interface FilterableScrollAreaSpecificProps {
  filterTerm: string;
  setFilterTerm: React.Dispatch<React.SetStateAction<string>>;
  placeholder?: string;
}

function FilterableScrollArea({
  className,
  children,
  placeholder,
  filterTerm,
  setFilterTerm,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> &
  FilterableScrollAreaSpecificProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setFilterTerm("");
    }
  };

  return (
    <div>
      <div className="relative">
        <input
          placeholder={placeholder}
          autoComplete="off"
          data-slot="input"
          onChange={(e) => {
            setFilterTerm(e.target.value);
          }}
          value={filterTerm}
          onKeyDown={handleKeyDown}
          className="relative border-t border-l rounded-t-md border-r ring-0 selection:bg-primary dark:bg-input/30 rounded-t-[inherit] selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:ring-0 disabled:opacity-50 md:text-sm border-input flex h-10 w-full px-4 py-1 shadow-xy transition-[color,box-shadow] outline-none mb-0 "
        />
        {filterTerm && (
          <button
            onClick={() => {
              setFilterTerm("");
            }}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted"
          >
            <XCircle className="h-4 w-4" />
            <span className="sr-only">Clear</span>
          </button>
        )}
      </div>
      <ScrollAreaPrimitive.Root
        data-slot="scroll-area"
        className={cn("relative", className, "rounded-t-none rounded-b-md")}
        {...props}
      >
        <ScrollAreaPrimitive.Viewport
          data-slot="scroll-area-viewport"
          className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </div>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="bg-border relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { FilterableScrollArea, ScrollBar };
