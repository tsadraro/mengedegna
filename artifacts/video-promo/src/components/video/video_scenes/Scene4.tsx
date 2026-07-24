import { motion } from "framer-motion";

const OPERATORS = [
  "SELAM BUS", "SKY BUS", "LIYOU BUS", 
  "VELOCITY EXP.", "HABESHA EXP.", "GOLDEN BUS"
];

export default function Scene4() {
  return (
    <motion.div 
      className="absolute inset-0 w-full h-full overflow-hidden bg-background flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ scale: 1.1, opacity: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10">
        <motion.div 
          className="w-[150vw] h-[150vw] rounded-full border-[1px] border-primary"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 4, ease: "easeOut" }}
        />
        <motion.div 
          className="absolute w-[100vw] h-[100vw] rounded-full border-[2px] border-primary"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 4, delay: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* LUXURY BUS IMAGE */}
      <motion.div 
        className="absolute z-10 top-[20%] w-[60vw]"
        initial={{ x: "-100vw", opacity: 0 }}
        animate={{ x: "0%", opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/luxury_bus.png`} 
          alt="Luxury Bus" 
          className="w-full h-auto drop-shadow-2xl mix-blend-screen"
        />
      </motion.div>

      {/* KICKER */}
      <motion.div className="absolute top-[10vw] right-[10vw] z-30 text-right overflow-hidden">
        <motion.p 
          className="font-mono text-primary text-[1.2vw] mb-4"
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          04 — PREMIUM OPERATORS
        </motion.p>
      </motion.div>

      {/* OPERATORS MARQUEE / GRID */}
      <div className="absolute bottom-[10vw] w-full z-20 overflow-hidden">
        <div className="flex flex-col items-center gap-[2vw]">
          <motion.h2 
            className="font-display text-[4vw] font-bold text-white text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
          >
            TRAVEL WITH THE BEST
          </motion.h2>

          <div className="flex flex-wrap justify-center gap-x-[4vw] gap-y-[2vw] max-w-[80vw]">
            {OPERATORS.map((op, i) => (
              <motion.div
                key={op}
                className="font-display font-black text-[3vw] text-transparent text-edge-outline"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ 
                  duration: 0.8, 
                  delay: 1.5 + (i * 0.1), 
                  type: "spring",
                  stiffness: 100
                }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  color: i % 2 === 0 ? "rgba(255,255,255,1)" : "rgba(212,160,23,1)",
                  WebkitTextStroke: "0px"
                } as any}
              >
                {op}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
