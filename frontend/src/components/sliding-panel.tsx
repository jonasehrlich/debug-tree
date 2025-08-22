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
      className="bg-muted/30 fixed inset-0 z-40 justify-start backdrop-blur-sm" // ⬅️ Aligns content to the left
    >
      <div
        ref={panelRef}
        className="fit-content bg-muted fixed top-0 left-0 z-50 h-full p-4 shadow-lg" // ⬅️ Aligned to the left
      >
        <div className="m-4 flex items-center justify-end">
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="w-full overflow-hidden">{children}</div>
      </div>
    </div>
  );
};
