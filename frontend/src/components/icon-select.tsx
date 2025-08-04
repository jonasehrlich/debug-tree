import { Select } from "@/components/ui/select";
import { IconSelectContent } from "./icon-select-content";
import { SelectTriggerIcon } from "./select-trigger-icon";
import type { OptionListAndValueMap } from "./state-colors-icons";

interface IconSelectProps<T extends string = string> {
  selectedIcon: T;
  /** Function that receives the new selected value */
  onSelectChange: (value: T) => void;
  optionsAndIcons: OptionListAndValueMap<string, React.ReactNode>;
  ariaLabel?: string;
}

export const IconSelect = <T extends string>({
  selectedIcon,
  onSelectChange,
  optionsAndIcons,
  ariaLabel,
}: IconSelectProps<T>) => {
  return (
    <Select onValueChange={onSelectChange} value={selectedIcon}>
      <SelectTriggerIcon
        variant="ghost"
        // That it fits with a NodeHeaderAction
        className="size-6 p-1"
        aria-label={ariaLabel ?? "Change Icon"}
      >
        {optionsAndIcons.map[selectedIcon]}
      </SelectTriggerIcon>
      <IconSelectContent optionsAndIcons={optionsAndIcons} />
    </Select>
  );
};
