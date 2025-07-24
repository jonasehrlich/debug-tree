import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Command as CommandPrimitive } from "cmdk";
import debounce from "lodash.debounce";
import { Check, ChevronsUpDown } from "lucide-react";
import React from "react";
import { RemoveScroll } from "react-remove-scroll";
import { Button } from "./ui/button";

interface AsyncComboboxProps<ItemType> {
  /** Current value of the dropdown */
  value: ItemType | null;
  /**
   * Called when a new value is selected or the input should be cleared
   * @param item The item that was selected, or null if the value should be cleared
   */
  onChange: (item: ItemType | null) => void;
  /** Function to call to populate the dropdown based on the input */
  fetchItems: (value: string) => Promise<ItemType[]>;
  /** Callback to notify the parent component when the dropdown is open */
  onDropdownOpenChange?: (isOpen: boolean) => void;
  /** Placeholder to display in the button */
  placeholder?: string;
  /** Whether this input is disabled */
  disabled?: boolean;
  /** Render function for dropdown items */
  renderDropdownItem: (item: ItemType) => React.ReactElement;
  /** Render the current value in the input button */
  renderValue: (item: ItemType) => string;
  /**
   * Get the value to use for a ItemType. This is used to check if a dropdown item is the current
   * value and as the key for dropdown elements
   */
  getItemValue: (item: ItemType) => string;
  /** Font family for the button, the input and the dropdown items */
  fontFamily?: "font-sans" | "font-serif" | "font-mono" | "";
  /** Classes to apply for the button triggering the dropdown */
  buttonClasses?: string;
  /** Props to pass to the Command component */
  commandProps?: React.ComponentProps<typeof CommandPrimitive>;
}

export const AsyncCombobox = <ItemType,>({
  fetchItems,
  value,
  onChange,
  placeholder = "Select an option",
  onDropdownOpenChange,
  renderDropdownItem,
  getItemValue,
  renderValue,
  disabled,
  fontFamily = "",
  buttonClasses = "",
  commandProps = {},
}: AsyncComboboxProps<ItemType>) => {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState(value ? renderValue(value) : "");
  const [items, setItems] = React.useState<ItemType[]>([]);
  const [loading, setLoading] = React.useState(false);

  const debouncedFetch = React.useMemo(
    () =>
      debounce(async (input: string) => {
        if (!input) {
          return;
        }
        setLoading(true);
        try {
          const results = await fetchItems(input);
          setLoading(false);

          setItems(results);
        } catch (err) {
          console.error(err);
          setItems([]);
        } finally {
          setLoading(false);
        }
      }, 100),
    [fetchItems],
  );

  React.useEffect(() => {
    return () => {
      debouncedFetch.cancel();
    };
  }, [debouncedFetch]);

  React.useEffect(() => {
    if (input.trim().length > 0) {
      void debouncedFetch(input);
    } else {
      setItems([]);
    }
  }, [input, debouncedFetch]);

  // Notify the parent component about the dropdown being open, to e.g. disabling form submit
  React.useEffect(() => {
    onDropdownOpenChange?.(open);
  }, [open, onDropdownOpenChange]);

  const handleClear = () => {
    onChange(null);
    setInput("");
    setItems([]);
    setOpen(false);
  };
  const currentValueString = value ? getItemValue(value) : "";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("justify-between flex", fontFamily, buttonClasses)}
        >
          <div className="flex-1 truncate overflow-hidden whitespace-nowrap text-ellipsis text-left">
            {value ? renderValue(value) : placeholder}
          </div>
          <ChevronsUpDown className=" ml-2 size-4 opacity-50 justify-end" />
        </Button>
      </PopoverTrigger>
      {value && (
        <Button variant="outline" type="button" onClick={handleClear}>
          Clear
        </Button>
      )}
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command
          {...commandProps}
          className={cn(commandProps.className, fontFamily)}
        >
          <CommandInput
            value={input}
            onValueChange={setInput}
            placeholder="Search..."
          />
          <RemoveScroll>
            <CommandList>
              {loading && <CommandItem disabled>Loading...</CommandItem>}
              {!loading && (
                <>
                  {items.length === 0 ? (
                    <CommandEmpty>No results found.</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {items.map((item) => {
                        const v = getItemValue(item);
                        return (
                          <CommandItem
                            key={v}
                            value={v}
                            onSelect={() => {
                              onChange(item);
                              setOpen(false);
                            }}
                          >
                            <div className="flex w-full items-center justify-between">
                              <div className="flex-1 min-w-0">
                                {renderDropdownItem(item)}
                              </div>
                              <div className="flex items-center justify-center">
                                <Check
                                  className={cn(
                                    "h-4 w-4 flex-shrink-0",
                                    currentValueString === v
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </div>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </RemoveScroll>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
