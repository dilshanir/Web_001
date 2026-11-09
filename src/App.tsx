import { MotionConfig } from "motion/react";
import Hero from "./components/Hero";

export default function App() {
  return (
    // "user" = follow the OS reduced-motion setting (Motion ignores it by default).
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh bg-page font-sans text-white antialiased">
        <main>
          <Hero />
        </main>
      </div>
    </MotionConfig>
  );
}
