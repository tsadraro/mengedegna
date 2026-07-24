import { motion } from "framer-motion";

const cities = [
  { name: "ADDIS ABABA", x: "50%", y: "50%", main: true },
  { name: "BAHIR DAR", x: "30%", y: "20%" },
  { name: "DIRE DAWA", x: "75%", y: "45%" },
  { name: "HAWASSA", x: "45%", y: "75%" },
  { name: "MEKELLE", x: "50%", y: "15%" },
  { name: "GONDAR", x: "25%", y: "30%" },
];

export default function Scene1() {
  return (
    <motion.div 
      className="absolute inset-0 w-full h-full overflow-hidden bg-background"
      initial={{ opacity: 0, clipPath: "circle(0% at 50% 50%)" }}
      animate={{ opacity: 1, clipPath: "circle(150% at 50% 50%)" }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* BACKGROUND VIDEO */}
      <motion.div className="absolute inset-0 z-0 opacity-20 mix-blend-screen"
        initial={{ scale: 1 }}
        animate={{ scale: 1.1 }}
        transition={{ duration: 10, ease: "linear" }}
      >
        <video 
          src={`${import.meta.env.BASE_URL}videos/bus_highway.mp4`}
          className="w-full h-full object-cover grayscale"
          autoPlay muted loop playsInline
        />
      </motion.div>

      {/* ABSTRACT MAP */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        {/* Connecting Lines */}
        <svg className="absolute inset-0 w-full h-full">
          {cities.slice(1).map((city, i) => (
            <motion.line
              key={`line-${i}`}
              x1="50%" y1="50%"
              x2={city.x} y2={city.y}
              stroke="rgba(212, 160, 23, 0.4)"
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 1 + i * 0.2, ease: "easeInOut" }}
            />
          ))}
        </svg>

        {/* Nodes */}
        {cities.map((city, i) => (
          <motion.div
            key={`node-${i}`}
            className="absolute flex flex-col items-center justify-center"
            style={{ left: city.x, top: city.y, transform: "translate(-50%, -50%)" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: city.main ? 0.5 : 1.5 + i * 0.2 }}
          >
            <div className={`rounded-full bg-primary flex items-center justify-center
              ${city.main ? 'w-[2vw] h-[2vw] shadow-[0_0_30px_rgba(212,160,23,0.8)]' : 'w-[1vw] h-[1vw]'}`}
            >
              <div className="w-[40%] h-[40%] bg-background rounded-full" />
            </div>
            <motion.div 
              className={`font-mono mt-2 whitespace-nowrap text-edge-outline
                ${city.main ? 'text-[1.5vw] text-primary' : 'text-[1vw] text-white/70'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: city.main ? 0.8 : 1.8 + i * 0.2 }}
            >
              {city.name}
            </motion.div>
          </motion.div>
        ))}

        {/* Active Bus Route Animation */}
        <motion.div
          className="absolute w-[1.5vw] h-[1.5vw] rounded-full bg-white shadow-[0_0_20px_white] z-20"
          initial={{ left: "50%", top: "50%", x: "-50%", y: "-50%" }}
          animate={{ left: "30%", top: "20%" }}
          transition={{ duration: 2, delay: 3, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[1.5vw] h-[1.5vw] rounded-full bg-white shadow-[0_0_20px_white] z-20"
          initial={{ left: "50%", top: "50%", x: "-50%", y: "-50%" }}
          animate={{ left: "75%", top: "45%" }}
          transition={{ duration: 2, delay: 4.5, ease: "easeInOut" }}
        />
      </div>

      {/* TEXT FOREGROUND */}
      <div className="absolute bottom-[10vw] left-[5vw] z-30">
        <motion.div className="overflow-hidden">
          <motion.p 
            className="font-mono text-primary text-[1.2vw] mb-4"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            01 — THE NETWORK
          </motion.p>
        </motion.div>
        
        <motion.h2 
          className="font-display text-[6vw] font-bold leading-none text-white max-w-[60vw]"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          EVERY MAJOR ROUTE. <br />
          <span className="text-transparent text-edge-outline-gold">ONE PLATFORM.</span>
        </motion.h2>
      </div>
    </motion.div>
  );
}
