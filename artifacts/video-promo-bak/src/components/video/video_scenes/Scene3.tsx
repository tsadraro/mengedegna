import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 3000); // Transition to Ticket
    return () => {
      clearTimeout(t1);
    };
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 w-full h-full overflow-hidden bg-background"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: "-100%" }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        
        {/* TEXT CONTENT - TOP */}
        <div className="absolute top-[10vw] left-[10vw] z-30">
          <motion.div className="overflow-hidden">
            <motion.p 
              className="font-mono text-primary text-[1.2vw] mb-4"
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              03 — SEAMLESS PAYMENT & TICKETING
            </motion.p>
          </motion.div>
          
          <motion.h2 
            className="font-display text-[4vw] font-bold leading-none text-white"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {phase === 0 ? "PAY WITH TELEBIRR." : "GET YOUR E-TICKET."}
          </motion.h2>
        </div>

        {/* PHONE MOCKUP CENTER */}
        <motion.div
          className="relative w-[20vw] h-[42vw] bg-black border-[0.5vw] border-white/20 rounded-[3vw] overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.05)] z-20"
          initial={{ y: "50vw", rotateZ: -10 }}
          animate={{ y: 0, rotateZ: 0 }}
          transition={{ duration: 1.5, delay: 0.2, type: "spring", stiffness: 100, damping: 20 }}
        >
          {/* Dynamic Content Inside Phone */}
          
          {/* PHASE 0: TELEBIRR PAYMENT */}
          <motion.div 
            className="absolute inset-0 bg-[#0081C5] flex flex-col items-center justify-center p-[2vw]"
            initial={{ opacity: 1 }}
            animate={{ opacity: phase === 0 ? 1 : 0, scale: phase === 0 ? 1 : 1.1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            {/* Fake Telebirr Logo */}
            <motion.div 
              className="w-[8vw] h-[8vw] rounded-full bg-white flex items-center justify-center mb-6 shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1, type: "spring" }}
            >
              <div className="text-[#0081C5] font-display font-black text-[3vw]">tb</div>
            </motion.div>
            <motion.div 
              className="text-white font-display text-[2vw] font-bold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              telebirr
            </motion.div>
            <motion.div 
              className="mt-[4vw] w-full bg-white/20 rounded-[1vw] p-[1.5vw] backdrop-blur-md flex justify-between items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
            >
              <span className="text-white font-mono text-[1vw]">TOTAL</span>
              <span className="text-white font-display font-bold text-[1.5vw]">ETB 850</span>
            </motion.div>
            <motion.div 
              className="mt-[2vw] w-full h-[4vw] bg-white rounded-full flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.6 }}
            >
              <div className="w-[8vw] h-[0.5vw] bg-[#0081C5]/20 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-[#0081C5]"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 2, duration: 0.8 }}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* PHASE 1: QR E-TICKET */}
          <motion.div 
            className="absolute inset-0 bg-white flex flex-col items-center justify-start pt-[5vw] p-[2vw]"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: phase === 1 ? 1 : 0, y: phase === 1 ? "0%" : "100%" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="w-full text-center border-b-2 border-dashed border-gray-300 pb-[2vw] mb-[2vw]">
              <h3 className="font-display font-black text-[3vw] text-black leading-none">MENGEDEGNA</h3>
              <p className="font-mono text-[1vw] text-gray-500 mt-2">BOARDING PASS</p>
            </div>
            
            <div className="w-full flex justify-between mb-[2vw]">
              <div>
                <p className="font-mono text-[0.8vw] text-gray-400">FROM</p>
                <p className="font-display font-bold text-[1.5vw] text-black">ADDIS</p>
              </div>
              <div className="text-center">
                <div className="w-[4vw] h-[2px] bg-primary my-[1vw]" />
              </div>
              <div className="text-right">
                <p className="font-mono text-[0.8vw] text-gray-400">TO</p>
                <p className="font-display font-bold text-[1.5vw] text-black">BAHIR DAR</p>
              </div>
            </div>

            <div className="w-full bg-gray-100 rounded-[1vw] p-[2vw] flex justify-between items-center mb-[3vw]">
              <div>
                <p className="font-mono text-[0.8vw] text-gray-400">SEAT</p>
                <p className="font-display font-bold text-[2vw] text-black">15</p>
              </div>
              <div>
                <p className="font-mono text-[0.8vw] text-gray-400">BUS</p>
                <p className="font-display font-bold text-[1.5vw] text-black">SELAM</p>
              </div>
            </div>

            {/* Fake QR Code */}
            <motion.div 
              className="w-[12vw] h-[12vw] bg-black rounded-[1vw] p-[1vw] relative flex flex-wrap gap-[0.2vw] justify-center content-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: phase === 1 ? 1 : 0.8, opacity: phase === 1 ? 1 : 0 }}
              transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
            >
              {/* Generate fake blocks for QR */}
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className="w-[1.8vw] h-[1.8vw] bg-white rounded-sm" style={{ opacity: Math.random() > 0.3 ? 1 : 0 }} />
              ))}
            </motion.div>
          </motion.div>

        </motion.div>

        {/* FLOATING ELEMENTS */}
        <motion.div
          className="absolute right-[15vw] top-[30vw] w-[8vw] h-[8vw] bg-primary rounded-full blur-[40px] opacity-30 z-10"
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}
