import { memo } from "react";
import type { OptionListAndValueMap } from "./state-colors-icons";
import { SelectContent, SelectItem } from "./ui/select";

interface IconSelectContentProps {
  /** The map of icon keys to JSX elements*/
  optionsAndIcons: OptionListAndValueMap<string, React.ReactNode>;
}

/**
 * A SelectContent component which displays an icon from the
 * {@link OptionListAndValueMap} in {@link IconSelectContentProps.optionsAndIcons}
 * next to the label from {@link OptionListAndValueMap.options} in each SelectItem.
 * @see {@link IconSelectContentProps} for props
 */
export const IconSelectContent = memo(
  ({ optionsAndIcons: iconConfig }: IconSelectContentProps) => {
    return (
      <SelectContent position="popper">
        {iconConfig.options.map((option) => (
          <SelectItem key={option.key} value={option.key}>
            <div className="flex items-center gap-2">
              <span>{iconConfig.map[option.key]}</span>
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    );
  },
);
