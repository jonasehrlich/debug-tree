import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface SlidingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  width?: number;
  title: string;
  children: React.ReactNode;
}

const panelVariants = {
  hidden: { x: "100%" },
  visible: { x: 0 },
  exit: { x: "100%" },
};

export const SlidingPanel: React.FC<SlidingPanelProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-background bg-opacity-80 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed top-0 right-0 w-fit h-full bg-background shadow-lg z-50 p-4"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={panelVariants}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button onClick={onClose} aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
