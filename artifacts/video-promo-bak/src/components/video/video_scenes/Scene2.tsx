import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const SEAT_ROWS = 6;
const SEAT_COLS = 4;

export default function Scene2() {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  useEffect(() => {
    // Choreograph seat selection
    const timer = setTimeout(() => {
      setSelectedSeat(14); // 4th row, 3rd seat
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 w-full h-full overflow-hidden bg-secondary"
      initial={{ x: "100%" }}
      animate={{ x: "0%" }}
      exit={{ x: "-100%", filter: "blur(5px)" }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* BACKGROUND GRAPHICS */}
      <motion.div 
        className="absolute right-0 top-0 w-[50vw] h-full bg-primary/10 clip-diagonal"
        initial={{ x: "100%" }}
        animate={{ x: "0%" }}
        transition={{ duration: 1.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      />
      
      <div className="absolute inset-0 flex items-center justify-between px-[10vw]">
        
        {/* TEXT CONTENT */}
        <div className="z-20 max-w-[40vw]">
          <motion.div className="overflow-hidden">
            <motion.p 
              className="font-mono text-primary text-[1.2vw] mb-4"
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              02 — LIVE SEAT MAP
            </motion.p>
          </motion.div>
          
          <div className="overflow-hidden">
            <motion.h2 
              className="font-display text-[5vw] font-bold leading-[1.1] text-white"
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              YOUR JOURNEY.
            </motion.h2>
          </div>
          <div className="overflow-hidden">
            <motion.h2 
              className="font-display text-[5vw] font-bold leading-[1.1] text-primary"
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1, delay: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              YOUR SEAT.
            </motion.h2>
          </div>
          
          <motion.p
            className="font-mono text-white/50 text-[1vw] mt-8 max-w-[25vw] leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
          >
            CHOOSE YOUR EXACT POSITION BEFORE YOU PAY. REAL-TIME AVAILABILITY. NO SURPRISES.
          </motion.p>
        </div>

        {/* SEAT MAP VISUAL */}
        <motion.div 
          className="relative z-20"
          initial={{ opacity: 0, rotateX: 60, rotateZ: -30, scale: 0.8, y: 100 }}
          animate={{ opacity: 1, rotateX: 40, rotateZ: -20, scale: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="grid grid-cols-4 gap-[2vw] p-[2vw] bg-black/40 border border-white/10 rounded-[2vw] backdrop-blur-sm relative shadow-2xl">
            {/* Bus layout aisle gap */}
            <div className="absolute top-0 bottom-0 left-[50%] w-[4vw] -ml-[2vw] bg-white/5 rounded-full" />
            
            {Array.from({ length: SEAT_ROWS * SEAT_COLS }).map((_, i) => {
              const isAisle = i % 4 === 1;
              const isSelected = selectedSeat === i;
              const isBooked = i === 2 || i === 3 || i === 8 || i === 9 || i === 18;
              
              return (
                <motion.div
                  key={i}
                  className={`relative w-[4vw] h-[5vw] rounded-t-[1vw] rounded-b-[0.5vw] border-2 flex items-center justify-center
                    ${isBooked ? 'bg-white/10 border-white/5' : isSelected ? 'bg-primary border-primary shadow-[0_0_30px_rgba(212,160,23,0.5)]' : 'bg-transparent border-white/20'}`}
                  style={{ marginRight: isAisle ? "4vw" : "0" }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    y: isSelected ? -10 : 0,
                    z: isSelected ? 20 : 0
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 20, 
                    delay: 1 + (i * 0.05) 
                  }}
                >
                  {isSelected && (
                    <motion.div 
                      className="absolute -top-[3vw] bg-white text-black font-display font-bold text-[1vw] px-[1vw] py-[0.5vw] rounded-full whitespace-nowrap shadow-xl"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      SEAT {i + 1}
                    </motion.div>
                  )}
                  {/* Seat details */}
                  <div className={`w-[80%] h-[20%] rounded-full absolute top-[10%] ${isBooked ? 'bg-white/10' : isSelected ? 'bg-black/20' : 'bg-white/20'}`} />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
        
      </div>
    </motion.div>
  );
}
