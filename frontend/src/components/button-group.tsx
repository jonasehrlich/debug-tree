import { cn } from "@/lib/utils";
import { type VariantProps } from "class-variance-authority";
import React from "react";
import { Button } from "./ui/button";
import { type buttonVariants } from "./ui/button-props";

interface ButtonGroupButtonProps<ButtonKey extends string> {
  /** Key of the button */
  key: ButtonKey;
  /** Label to display in the button */
  label: string;
  /** Icon to display in front of the label */
  icon?: React.ReactElement;
}

interface ButtonGroupProps<ButtonKey extends string> {
  /** Key of the selected button, this will be disabled */
  selectedButton: ButtonKey;
  /** Handler when one of the buttons is clicked */
  onChange: (buttonKey: ButtonKey) => void;
  /** Button props for each button in the group */
  buttons: [
    ButtonGroupButtonProps<ButtonKey>,
    ButtonGroupButtonProps<ButtonKey>,
    ...ButtonGroupButtonProps<ButtonKey>[],
  ];
}

export const ButtonGroup = React.memo(
  <ButtonKey extends string>({
    selectedButton,
    onChange,
    variant,
    size,
    buttons,
  }: ButtonGroupProps<ButtonKey> & VariantProps<typeof buttonVariants>) => {
    return (
      <div className={cn("inline-flex overflow-hidden border rounded-md")}>
        {buttons.map((button, index) => {
          const isFirst = index === 0;
          const isLast = index === buttons.length - 1;
          return (
            <Button
              key={button.key}
              variant={variant}
              size={size}
              onClick={() => {
                onChange(button.key);
              }}
              disabled={button.key === selectedButton}
              className={cn(
                "rounded-none border-l first:border-l-0", // cleanup internal borders
                isFirst && "rounded-l-md",
                isLast && "rounded-r-md",
              )}
            >
              {button.icon}
              {button.label}
            </Button>
          );
        })}
      </div>
    );
  },
);
