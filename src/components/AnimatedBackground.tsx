import { motion } from "framer-motion";

// macOS-style ambient orbs — subtle blue/purple tints matching system blue
const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Dot grid */}
      <div className="absolute inset-0 dot-bg opacity-30" />

      {/* Ambient blue orb (top-right) */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(211 100% 50% / 0.08), transparent 70%)",
          top: "-10%",
          right: "-5%",
        }}
        animate={{ y: [0, -24, 0], x: [0, 12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Ambient purple orb (bottom-left) */}
      <motion.div
        className="absolute w-[380px] h-[380px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(252 100% 67% / 0.06), transparent 70%)",
          bottom: "5%",
          left: "-5%",
        }}
        animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle center glow */}
      <motion.div
        className="absolute w-64 h-64 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(211 100% 50% / 0.04), transparent 70%)",
          top: "45%",
          left: "45%",
          transform: "translate(-50%, -50%)",
        }}
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};

export default AnimatedBackground;
