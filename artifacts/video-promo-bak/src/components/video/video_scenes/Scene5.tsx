import { motion } from "framer-motion";

export default function Scene5() {
  return (
    <motion.div 
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* BACKGROUND VIDEO REPRISE */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: "easeOut" }}
      >
        <video 
          src={`${import.meta.env.BASE_URL}videos/ethiopia_landscape.mp4`}
          className="w-full h-full object-cover opacity-30"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
      </motion.div>

      {/* MIDGROUND ORNAMENT */}
      <motion.div 
        className="absolute w-[30vw] h-[30vw] rounded-full border border-primary/20 z-10 flex items-center justify-center"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: 90 }}
        transition={{ duration: 4, ease: "easeOut" }}
      >
        <div className="w-[15vw] h-[15vw] rounded-full border border-primary/40" />
      </motion.div>

      <div className="relative z-20 flex flex-col items-center text-center">
        {/* LOGO */}
        <motion.div 
          className="w-[8vw] h-[8vw] rounded-full bg-primary flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(212,160,23,0.5)]"
          initial={{ scale: 0, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.5 }}
        >
          <svg className="w-[4vw] h-[4vw] text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>
        </motion.div>

        <motion.div className="overflow-hidden mb-2">
          <motion.h1 
            className="font-display text-[6vw] font-black text-white leading-none tracking-tight"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 1, delay: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            MENGEDEGNA
          </motion.h1>
        </motion.div>

        <motion.div className="overflow-hidden">
          <motion.h2 
            className="font-mono text-[1.5vw] text-primary tracking-[0.2em]"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 1, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            BOOK THE ROAD AHEAD.
          </motion.h2>
        </motion.div>

        {/* URL OR CTA */}
        <motion.div 
          className="mt-[4vw] px-[2vw] py-[1vw] border border-white/20 rounded-full backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2 }}
        >
          <span className="font-mono text-white/70 text-[1vw]">WWW.MENGEDEGNA.COM</span>
        </motion.div>
      </div>

    </motion.div>
  );
}
