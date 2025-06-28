import {
  Select,
  SelectContent,
  SelectItem,
  SelectTriggerIcon,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
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
      <SelectTriggerIcon
        variant="ghost"
        size="sm"
        // That it fits with a NodeHeaderAction
        className="size-6 p-1"
        aria-label={ariaLabel ?? "Change Icon"}
      >
        {availableIcons[selectedIcon]}
      </SelectTriggerIcon>
      <SelectContent position="popper">
        {iconChoices.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="p-0 bg-popover"
          >
            <div className={cn("flex items-center gap-2 px-3 py-2")}>
              <span>
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
