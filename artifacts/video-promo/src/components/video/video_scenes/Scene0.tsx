import { motion } from "framer-motion";

export default function Scene0() {
  return (
    <motion.div 
      className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* BACKGROUND VIDEO */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: "linear" }}
      >
        <video 
          src={`${import.meta.env.BASE_URL}videos/ethiopia_landscape.mp4`}
          className="w-full h-full object-cover opacity-60"
          autoPlay
          muted
          loop
          playsInline
        />
        {/* GRADIENT OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
      </motion.div>

      {/* MIDGROUND ETHIOPIAN PATTERN */}
      <motion.div 
        className="absolute inset-0 z-10 opacity-20"
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: "0%", opacity: 0.2 }}
        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1], delay: 1 }}
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/gold_pattern.png)`,
          backgroundSize: '30vw',
          backgroundRepeat: 'repeat',
          mixBlendMode: 'color-dodge'
        }}
      />

      {/* FOREGROUND CONTENT */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center">
        <motion.div 
          className="overflow-hidden mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h2 
            className="font-mono text-primary text-[1.5vw] tracking-[0.3em] uppercase"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
          >
            መንገደኛ • Mengedegna
          </motion.h2>
        </motion.div>

        <div className="overflow-hidden">
          <motion.h1 
            className="font-display text-[8vw] leading-[0.9] font-black text-white"
            initial={{ y: "100%", rotate: 2 }}
            animate={{ y: "0%", rotate: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 1 }}
          >
            ETHIOPIA,
          </motion.h1>
        </div>
        
        <div className="overflow-hidden mt-2">
          <motion.h1 
            className="font-display text-[8vw] leading-[0.9] font-black text-primary text-shadow-glow"
            initial={{ y: "100%", rotate: -2 }}
            animate={{ y: "0%", rotate: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 1.2 }}
          >
            MOVING FORWARD.
          </motion.h1>
        </div>

        <motion.div
          className="mt-[6vw] w-[2px] h-[8vw] bg-gradient-to-b from-primary to-transparent"
          initial={{ scaleY: 0, originY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 2.5 }}
        />
      </div>
    </motion.div>
  );
}
