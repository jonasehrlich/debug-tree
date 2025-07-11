import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { debounce } from "lodash";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "./ui/button";

export interface ComboboxItem {
  id: string;
  label: string;
}

interface AsyncCombobox {
  value: string;
  onChange: (item: ComboboxItem | null) => void;
  fetchItems: (value: string) => Promise<ComboboxItem[]>;
  /** Callback to notify the parent component when the dropdown is open */
  onDropdownOpenChange?: (isOpen: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  renderItem?: (item: ComboboxItem) => ReactNode;
  /** Font family for the button, the input and the dropdown items */
  fontFamily?: "font-sans" | "font-serif" | "font-mono" | "";
  buttonClasses?: string;
}

export const AsyncCombobox = ({
  fetchItems: fetchSuggestions,
  value,
  onChange,
  placeholder = "Select an option",
  onDropdownOpenChange,
  renderItem,
  fontFamily = "",
  buttonClasses = "",
}: AsyncCombobox) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [items, setItems] = useState<ComboboxItem[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedFetch = useCallback(
    debounce(async (input: string) => {
      if (!input) {
        return;
      }
      setLoading(true);
      try {
        const results = await fetchSuggestions(input);
        setLoading(false);

        setItems(results);
      } catch (err) {
        console.error(err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    if (input.trim().length > 0) {
      void debouncedFetch(input);
    } else {
      setItems([]);
    }
  }, [input, debouncedFetch]);

  // Notify the parent component about the dropdown being open, to e.g. disabling form submit
  useEffect(() => {
    onDropdownOpenChange?.(open);
  }, [open, onDropdownOpenChange]);

  const handleClear = () => {
    onChange(null);
    setInput("");
    setItems([]);
    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between flex", fontFamily, buttonClasses)}
        >
          <div className="flex-1 truncate overflow-hidden whitespace-nowrap text-ellipsis text-left">
            {value ? value : placeholder}
          </div>
          <ChevronsUpDown className=" ml-2 size-4 opacity-50 justify-end" />
        </Button>
      </PopoverTrigger>
      {value && (
        <Button variant="outline" onClick={handleClear}>
          Clear
        </Button>
      )}
      <PopoverContent className="w-[500px] p-0 " align="start">
        <Command className={fontFamily}>
          <CommandInput
            value={input}
            onValueChange={setInput}
            placeholder="Search..."
          />
          <CommandList>
            {loading && <CommandItem disabled>Loading...</CommandItem>}
            {!loading && (
              <>
                {items.length === 0 ? (
                  <CommandEmpty>No results found.</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {items.map((item) => {
                      return (
                        <CommandItem
                          key={item.id}
                          value={item.id}
                          onSelect={() => {
                            onChange(item);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === item.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {renderItem ? renderItem(item) : item.label}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
