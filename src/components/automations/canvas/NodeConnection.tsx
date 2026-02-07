import { motion } from "framer-motion";

interface NodeConnectionProps {
  className?: string;
}

export function NodeConnection({ className }: NodeConnectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      className={className}
    >
      <svg
        width="2"
        height="32"
        viewBox="0 0 2 32"
        className="my-1"
      >
        <defs>
          <linearGradient id="connection-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--border))" />
            <stop offset="100%" stopColor="hsl(var(--border) / 0.5)" />
          </linearGradient>
        </defs>
        <line
          x1="1"
          y1="0"
          x2="1"
          y2="32"
          stroke="url(#connection-gradient)"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </svg>
    </motion.div>
  );
}
