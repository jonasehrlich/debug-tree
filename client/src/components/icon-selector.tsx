import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@radix-ui/react-select";
import { Button } from "./ui/button";
import React from "react";

// A generic string key maps to a ReactNode (JSX.Element), these are the icons shown for the individual elements
export type IconMap<T extends string = string> = Record<T, React.ReactNode>;

// Define the type for a single icon option
export interface IconOption<T extends string = string> {
  value: T;
  label: string;
}

// Define the type for the iconOptions array
export type IconOptions<T extends string = string> = IconOption<T>[];

// Define the props interface for IconSelector
interface IconSelectorProps<T extends string = string> {
  selectedIcon: T;
  onSelectChange: (value: T) => void; // Function that receives the new selected value
  availableIcons: IconMap; // The map of icon keys to JSX elements
  iconChoices: IconOptions; // The array of icon options
  ariaLabel?: string;
}

export const IconSelector = <T extends string>({
  selectedIcon,
  onSelectChange,
  availableIcons,
  iconChoices,
  ariaLabel,
}: IconSelectorProps<T>) => {
  return (
    <Select onValueChange={onSelectChange} value={selectedIcon}>
      <SelectTrigger
        className={cn(
          "p-0 flex items-center justify-center",
          "border-none focus:ring-0 focus:ring-offset-0",
          "data-[state=open]:ring-0 data-[state=open]:ring-offset-0",
          "cursor-pointer",
        )}
        aria-label={ariaLabel ?? "Change Icon"}
        asChild
      >
        <Button variant="ghost" size="icon" className="nodrag size-6 p1">
          {availableIcons[selectedIcon]}
        </Button>
      </SelectTrigger>
      <SelectContent position="popper">
        {iconChoices.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="p-0 bg-popover"
          >
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-md bg-popover hover:bg-muted",
                "focus:bg-muted w-full transition-colors text-sm hover:border-none",
              )}
            >
              <span className="shrink-0">
                {availableIcons[option.value]}{" "}
                {/* Get the icon for this option's value */}
              </span>
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
