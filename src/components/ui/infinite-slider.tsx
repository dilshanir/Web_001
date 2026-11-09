import { useEffect, useState, type ReactNode } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "motion/react";
import useMeasure from "react-use-measure";
import { cn } from "../../lib/utils";

export type InfiniteSliderProps = {
  children: ReactNode;
  /** Space between items, in px. */
  gap?: number;
  /** Scroll speed in px per second. */
  speed?: number;
  /** Speed (px/s) while the pointer is over the slider. Omit to keep `speed`. */
  speedOnHover?: number;
  direction?: "horizontal" | "vertical";
  reverse?: boolean;
  className?: string;
};

export function InfiniteSlider({
  children,
  gap = 24,
  speed = 60,
  speedOnHover,
  direction = "horizontal",
  reverse = false,
  className,
}: InfiniteSliderProps) {
  const [ref, bounds] = useMeasure();
  const offset = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const isHorizontal = direction === "horizontal";
  const trackSize = isHorizontal ? bounds.width : bounds.height;
  const activeSpeed =
    hovered && speedOnHover !== undefined ? speedOnHover : speed;

  useEffect(() => {
    if (prefersReducedMotion || trackSize === 0 || activeSpeed <= 0) return;

    // Track = copy + gap + copy, so one copy plus one gap is the loop distance.
    const distance = (trackSize + gap) / 2;
    const start = reverse ? -distance : 0;
    const end = reverse ? 0 : -distance;

    // Wrap the current offset into (-distance, 0] so a speed change
    // carries on from where the track is instead of snapping back.
    const current = (((offset.get() % distance) - distance) % distance) || 0;
    const remaining = Math.abs(end - current);

    let controls: AnimationPlaybackControls | undefined;

    const loopForever = () => {
      controls = animate(offset, [start, end], {
        ease: "linear",
        duration: distance / activeSpeed,
        repeat: Infinity,
        repeatType: "loop",
      });
    };

    if (remaining < 0.5) {
      loopForever();
    } else {
      // Finish the current lap at the new speed, then loop seamlessly.
      controls = animate(offset, [current, end], {
        ease: "linear",
        duration: remaining / activeSpeed,
        onComplete: () => {
          offset.set(start);
          loopForever();
        },
      });
    }

    return () => controls?.stop();
  }, [offset, trackSize, gap, activeSpeed, reverse, prefersReducedMotion]);

  const copyClass = cn("flex shrink-0 items-center", isHorizontal ? "flex-row" : "flex-col");

  return (
    <div
      className={cn("overflow-hidden", className)}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <motion.div
        ref={ref}
        className={cn("flex", isHorizontal ? "w-max flex-row" : "h-max flex-col")}
        style={{ gap, ...(isHorizontal ? { x: offset } : { y: offset }) }}
      >
        <div className={copyClass} style={{ gap }}>
          {children}
        </div>
        {/* Visual duplicate for the seamless loop; hidden from assistive tech. */}
        <div className={copyClass} style={{ gap }} aria-hidden="true">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

export default InfiniteSlider;
