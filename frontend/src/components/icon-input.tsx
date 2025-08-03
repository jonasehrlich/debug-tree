import { Input } from "@/components/ui/input";
import { Search, X, type LucideIcon } from "lucide-react";
import React from "react";

interface IconInputProps {
  icon: LucideIcon;
  clearable?: boolean;
}

export const IconInput = ({
  icon: Icon,
  clearable,
  value,
  onChange,
  ...props
}: IconInputProps & React.ComponentProps<typeof Input>) => {
  const handleClear = () => {
    // Fire onChange with an empty value if it's a controlled input
    onChange?.({
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="relative w-full">
      {/* Icon */}
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        value={value}
        onChange={onChange}
        {...props}
        className="pl-10 pr-10"
      />

      {/* Clear Button */}
      {clearable && value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export const SearchInput = ({
  ...props
}: Omit<React.ComponentProps<typeof IconInput>, "icon">) => {
  return <IconInput icon={Search} {...props} />;
};
