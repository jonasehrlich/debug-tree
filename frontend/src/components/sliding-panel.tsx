import { X } from "lucide-react";
import React from "react";

interface SlidingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  width?: number;
  children: React.ReactNode;
}

export const SlidingPanel: React.FC<SlidingPanelProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  const panelRef = React.useRef<HTMLDivElement>(null);

  if (!isOpen) return null;
  return (
    <div
      onClick={(e) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
      className="bg-muted/30 fixed inset-0 z-40 backdrop-blur-sm justify-end"
    >
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full p-4 fit-content bg-muted shadow-lg z-50"
      >
        <div className="flex justify-end items-center m-4">
          <button onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="w-full overflow-hidden">{children}</div>
      </div>
    </div>
  );
};
