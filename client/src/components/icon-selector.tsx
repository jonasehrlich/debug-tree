import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@radix-ui/react-select";
import React from "react";


// Define the type for the icons object
export type IconMap<TKey extends string = string> = Record<TKey, React.ReactNode>; // A string key maps to a ReactNode (JSX.Element)

// Define the type for a single icon option
export interface IconOption<TKey extends string = string> {
    value: TKey;
    label: string;
};


// Define the type for the iconOptions array
export type IconOptions<TKey extends string = string> = IconOption<TKey>[];

// Define the props interface for IconSelector
interface IconSelectorProps<TKey extends string = string> {
    selectedIcon: TKey;
    onSelectChange: (value: TKey) => void; // Function that receives the new selected value
    availableIcons: IconMap; // The map of icon keys to JSX elements
    iconChoices: IconOptions; // The array of icon options
    ariaLabel?: string;
}


export const IconSelector: React.FC<IconSelectorProps> = ({ selectedIcon, onSelectChange, availableIcons, iconChoices, ariaLabel }) => {
    return (<Select onValueChange={onSelectChange} value={selectedIcon}>
        <SelectTrigger
            className={cn(
                "p-0 flex items-center justify-center rounded-full",
                "border-none  focus:ring-0 focus:ring-offset-0",
                // "data-[state=open]:ring-0 data-[state=open]:ring-offset-0",
                "cursor-pointer"
            )}
            aria-label={ariaLabel ?? "Change Icon"}
        >
            <SelectValue asChild>
                <span className="pointer-events-none">
                    {availableIcons[selectedIcon]} {/* Use availableIcons prop */}
                </span>
            </SelectValue>
        </SelectTrigger>
        <SelectContent position="popper">
            {iconChoices.map((option) => ( // Use iconChoices prop
                <SelectItem key={option.value} value={option.value} className="p-0 bg-popover">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-popover hover:bg-muted focus:bg-muted w-full transition-colors text-sm">
                        <span className="shrink-0">
                            {availableIcons[option.value]} {/* Get the icon for this option's value */}
                        </span>
                        <span>{option.label}</span>
                    </div>
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
    );
};
