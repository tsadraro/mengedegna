import { useVideoPlayer } from "@/lib/video/hooks";
import { AnimatePresence, motion } from "framer-motion";
import Scene0 from "./video_scenes/Scene0";
import Scene1 from "./video_scenes/Scene1";
import Scene2 from "./video_scenes/Scene2";
import Scene3 from "./video_scenes/Scene3";
import Scene4 from "./video_scenes/Scene4";
import Scene5 from "./video_scenes/Scene5";

const SCENE_DURATIONS = {
  scene0: 8000,
  scene1: 10000,
  scene2: 10000,
  scene3: 10000,
  scene4: 10000,
  scene5: 8000,
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  const numScenes = Object.keys(SCENE_DURATIONS).length;

  return (
    <div className="w-full h-screen bg-background overflow-hidden relative font-display flex items-center justify-center">
      {/* GLOBAL NOISE TEXTURE */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] z-50 pointer-events-none mix-blend-overlay" />
      
      {/* GLOBAL PERSISTENT BRAND ELEMENT - Moving Frame */}
      <motion.div 
        className="absolute inset-[3vw] border border-white/10 z-40 pointer-events-none"
        animate={{
          inset: currentScene === 5 ? "0vw" : currentScene === 0 ? "5vw" : "3vw",
          borderColor: currentScene === 3 ? "rgba(212, 160, 23, 0.3)" : "rgba(255,255,255,0.1)",
        }}
        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
      />
      
      {/* GLOBAL PERSISTENT PROGRESS LINE */}
      <motion.div 
        className="absolute bottom-0 left-0 h-1 bg-primary z-50 origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: (currentScene + 1) / numScenes }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      <AnimatePresence mode="sync">
        {currentScene === 0 && <Scene0 key="scene-0" />}
        {currentScene === 1 && <Scene1 key="scene-1" />}
        {currentScene === 2 && <Scene2 key="scene-2" />}
        {currentScene === 3 && <Scene3 key="scene-3" />}
        {currentScene === 4 && <Scene4 key="scene-4" />}
        {currentScene === 5 && <Scene5 key="scene-5" />}
      </AnimatePresence>
    </div>
  );
}
