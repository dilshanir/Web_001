import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Variants,
} from "motion/react";
import useMeasure from "react-use-measure";
import type Hls from "hls.js";
import { ArrowUpRight, Zap } from "lucide-react";
import { cn } from "../lib/utils";
import { InfiniteSlider } from "./ui/infinite-slider";

/* ------------------------------------------------------------------ */
/* Swap-me constants                                                   */
/* ------------------------------------------------------------------ */

export const HERO_VIDEO_HLS =
  "https://customer-cbeadsgr09pnsezs.cloudflarestream.com/697945ca6b876878dba3b23fbd2f1561/manifest/video.m3u8";
export const HERO_VIDEO_MP4 = "/_videos/v1/f0c78f536d5f21a047fb7792723a36f9d647daa1";

/** Where "Book a 15-min call" goes (Cal.com / Calendly link etc.). */
export const CTA_HREF = "#book-a-call";

/* Icons: each one is isolated here so it can be swapped for a custom SVG. */
const PillIcon = Zap;
const CtaArrowIcon = ArrowUpRight;

/* ------------------------------------------------------------------ */
/* Shared motion + style tokens                                        */
/* ------------------------------------------------------------------ */

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const BRAND_GRADIENT =
  "bg-linear-to-br from-brand-pink via-brand-orchid to-brand-violet";

/** Timeline (seconds from page load). */
const T = {
  pill: 0,
  words: 0.2,
  wordStagger: 0.08,
  sub: 0.85,
  cta: 1.0,
  sweep: 1.4,
};

/* ------------------------------------------------------------------ */
/* Headline data                                                       */
/* ------------------------------------------------------------------ */

type Word = { text: string; fill: string };

// Each word carries its own slice of the white -> pink -> purple gradient,
// so the fill reads as one continuous gradient across each line while every
// word can still animate on its own. Full literal class strings only.
const HEADLINE: Word[][] = [
  [
    { text: "Your", fill: "from-white to-[#FBEFFC]" },
    { text: "Vision", fill: "from-[#FBEFFC] to-[#F4D3F7]" },
  ],
  [
    { text: "Our", fill: "from-white to-[#F8DDFA]" },
    { text: "Digital", fill: "from-[#F8DDFA] to-brand-pink" },
    { text: "Reality.", fill: "from-brand-pink to-brand-orchid" },
  ],
];

const HEADLINE_TEXT = HEADLINE.map((line) =>
  line.map((w) => w.text).join(" "),
).join(" ");

// Padding + matching negative margin stops bg-clip-text from cutting off
// descenders (the "y" in "Your") without changing the line height.
const WORD_BOX = "inline-block pb-[0.12em] -mb-[0.12em]";

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: T.words + i * T.wordStagger,
      duration: 0.8,
      ease: EASE_OUT,
    },
  }),
};

/* ------------------------------------------------------------------ */
/* Logos                                                               */
/* ------------------------------------------------------------------ */

// Logo files are self-hosted in public/logos/ (see public/logos/SOURCES.md).
//  - "wordmark": the SVG already contains the brand name.
//  - "mark":     symbol-only SVG (Simple Icons), shown next to the name in Manrope.
//  - "text":     no free logo file exists, so the name is set as a wordmark.
// To use an official logo later, drop the SVG in public/logos/ and switch the
// entry to kind "wordmark".
type Logo =
  | { kind: "wordmark" | "mark"; name: string; src: string; height: number; className: string }
  | { kind: "text"; name: string };

const logoSrc = (file: string) => `${import.meta.env.BASE_URL}logos/${file}`;

const LOGOS: Logo[] = [
  { kind: "wordmark", name: "OpenAI", src: logoSrc("openai.svg"), height: 24, className: "h-6" },
  { kind: "mark", name: "Nvidia", src: logoSrc("nvidia.svg"), height: 20, className: "h-5" },
  { kind: "text", name: "Column" },
  { kind: "mark", name: "GitHub", src: logoSrc("github.svg"), height: 20, className: "h-5" },
  { kind: "mark", name: "Nike", src: logoSrc("nike.svg"), height: 20, className: "h-5" },
  { kind: "mark", name: "Lemon Squeezy", src: logoSrc("lemonsqueezy.svg"), height: 20, className: "h-5" },
  { kind: "mark", name: "Laravel", src: logoSrc("laravel.svg"), height: 20, className: "h-5" },
  { kind: "wordmark", name: "Lilly", src: logoSrc("lilly.svg"), height: 28, className: "h-7" },
];

/* ================================================================== */
/* Hero                                                                */
/* ================================================================== */

export default function Hero() {
  return (
    <>
      <section
        aria-labelledby="hero-title"
        className="relative isolate overflow-x-clip"
      >
        <AmbientOrbs />

        <header className="relative z-20 mx-auto flex max-w-5xl flex-col items-center px-4 pt-28 pb-6 text-center sm:px-6 md:pt-36">
          <AnnouncementPill />
          <Headline />

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: T.sub, duration: 0.8, ease: EASE_OUT }}
            className="mt-6 max-w-[560px] text-base leading-relaxed text-white/80 md:text-lg"
          >
            We turn bold ideas into modern designs that don't just look amazing,
            they grow your business fast.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: T.cta, duration: 0.8, ease: EASE_OUT }}
            className="mt-10"
          >
            <BookCallButton />
          </motion.div>
        </header>

        <HeroVideo />
      </section>

      <LogoCloud />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Ambient light                                                       */
/* ------------------------------------------------------------------ */

function AmbientOrbs() {
  const reduce = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <motion.div
        className="absolute -top-56 left-[calc(50%-40rem)] size-[44rem] rounded-full bg-brand-pink opacity-[0.12] blur-[140px] will-change-transform"
        animate={reduce ? undefined : { x: [0, 90, -30, 0], y: [0, 50, 100, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-10 left-[calc(50%-4rem)] size-[40rem] rounded-full bg-brand-violet opacity-[0.14] blur-[140px] will-change-transform"
        animate={reduce ? undefined : { x: [0, -80, 40, 0], y: [0, 70, -20, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Announcement pill                                                   */
/* ------------------------------------------------------------------ */

function AnnouncementPill() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: T.pill, duration: 0.7, ease: EASE_OUT }}
      className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-glass py-1 pr-4 pl-1 text-sm text-white/70 backdrop-blur-md"
    >
      <span className="relative grid size-6 shrink-0 place-items-center">
        {/* Breathing glow (opacity + transform only) */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 rounded-md opacity-60 blur-md motion-safe:animate-breathe",
            BRAND_GRADIENT,
          )}
        />
        <span
          className={cn(
            "relative grid size-6 place-items-center rounded-md",
            BRAND_GRADIENT,
          )}
        >
          <PillIcon aria-hidden="true" className="size-3.5 fill-white text-white" strokeWidth={1.5} />
        </span>
      </span>
      <span>Used by founders. Loved by devs.</span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Headline + one-time light sweep                                     */
/* ------------------------------------------------------------------ */

function Headline() {
  const [ref, bounds] = useMeasure();
  let wordIndex = 0;

  return (
    <h1
      ref={ref}
      id="hero-title"
      className="relative mt-8 w-full text-5xl leading-[1.05] font-semibold tracking-[-0.035em] md:text-7xl lg:text-[80px]"
    >
      <span className="sr-only">{HEADLINE_TEXT}</span>

      <span aria-hidden="true">
        {HEADLINE.map((line, li) => (
          <span key={li} className="block">
            {line.map((word, wi) => {
              const i = wordIndex++;
              return (
                <span key={word.text}>
                  {wi > 0 && " "}
                  <motion.span
                    custom={i}
                    variants={wordVariants}
                    initial="hidden"
                    animate="visible"
                    className={cn(
                      WORD_BOX,
                      "bg-linear-to-r bg-clip-text text-transparent will-change-[transform,filter,opacity]",
                      word.fill,
                    )}
                  >
                    {word.text}
                  </motion.span>
                </span>
              );
            })}
          </span>
        ))}
      </span>

      <LightSweep width={bounds.width} />
    </h1>
  );
}

/**
 * A soft band of light crosses the headline once.
 * A clipped "window" moves right while a white copy of the text inside it
 * moves left by the same amount, so the copy stays aligned with the real
 * text and only lights up the glyphs. Transform-only, no layout work.
 */
function LightSweep({ width }: { width: number }) {
  const reduce = useReducedMotion();
  const band = Math.max(140, width * 0.22);
  const windowX = useMotionValue(-10000);
  const innerX = useTransform(windowX, (v) => -v);
  const done = useRef(false);

  useEffect(() => {
    if (reduce || done.current || width === 0) return;
    const controls = animate(windowX, [-band, width], {
      delay: T.sweep,
      duration: 1.8,
      ease: [0.45, 0, 0.2, 1],
      onComplete: () => {
        done.current = true;
      },
    });
    return () => controls.stop();
  }, [reduce, width, band, windowX]);

  if (reduce) return null;

  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_50%,transparent)]"
      style={{ x: windowX, width: band }}
    >
      <motion.span
        className="absolute top-0 left-0 block text-white/70"
        style={{ x: innerX, width }}
      >
        {HEADLINE.map((line, li) => (
          <span key={li} className="block">
            {line.map((word, wi) => (
              <span key={word.text}>
                {wi > 0 && " "}
                <span className={WORD_BOX}>{word.text}</span>
              </span>
            ))}
          </span>
        ))}
      </motion.span>
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/* CTA                                                                 */
/* ------------------------------------------------------------------ */

function BookCallButton() {
  const arrowMotion =
    "col-start-1 row-start-1 size-[18px] text-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

  return (
    <a
      href={CTA_HREF}
      className="group relative inline-flex rounded-full border border-white/15 bg-white/[0.04] p-1 backdrop-blur-sm transition-transform duration-300 ease-out hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-pink active:scale-[0.98] motion-reduce:transition-none"
    >
      {/* Soft purple glow the glass ring picks up on hover / focus */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -inset-1.5 -z-10 rounded-full opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-50 group-focus-visible:opacity-50",
          BRAND_GRADIENT,
        )}
      />
      <span className="relative flex items-center gap-3 rounded-full bg-white py-1.5 pr-1.5 pl-6 text-[15px] font-medium text-black">
        Book a 15-min call
        <span
          className={cn(
            "grid size-10 place-items-center overflow-hidden rounded-full",
            BRAND_GRADIENT,
          )}
        >
          {/* Outgoing arrow */}
          <CtaArrowIcon
            aria-hidden="true"
            className={cn(arrowMotion, "group-hover:translate-x-7 group-hover:-translate-y-7")}
          />
          {/* Incoming arrow */}
          <CtaArrowIcon
            aria-hidden="true"
            className={cn(
              arrowMotion,
              "-translate-x-7 translate-y-7 group-hover:translate-x-0 group-hover:translate-y-0",
            )}
          />
        </span>
      </span>
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Hero video                                                          */
/* ------------------------------------------------------------------ */

function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // React doesn't reliably reflect `muted` to the DOM; autoplay needs it.
    video.muted = true;

    let hls: Hls | null = null;
    let cancelled = false;
    const tryPlay = () => {
      video.play().catch(() => {
        /* Autoplay blocked: the video just stays transparent. */
      });
    };
    const switchToMp4 = () => {
      video.src = HERO_VIDEO_MP4;
      video.load();
      tryPlay();
    };

    // 2. Native HLS (Safari / iOS) needs no library at all.
    const canPlayNativeHls = () =>
      video.canPlayType("application/vnd.apple.mpegurl") !== "";

    const startNative = () => {
      const onNativeError = () => {
        video.removeEventListener("error", onNativeError);
        switchToMp4();
      };
      video.addEventListener("error", onNativeError);
      video.src = HERO_VIDEO_HLS;
      tryPlay();
    };

    // hls.js is ~400 KB, so it loads in its own chunk and never delays the
    // headline animation.
    import("hls.js")
      .then(({ default: HlsLib }) => {
        if (cancelled) return;

        // 1. hls.js (Chrome, Firefox, Edge, desktop Safari via MSE)
        if (HlsLib.isSupported()) {
          const instance = new HlsLib({ capLevelToPlayerSize: true });
          hls = instance;
          instance.on(HlsLib.Events.MANIFEST_PARSED, tryPlay);
          instance.on(HlsLib.Events.ERROR, (_event, data) => {
            if (!data.fatal) return;
            // 4. Fatal error: drop hls.js and fall back to the MP4
            instance.destroy();
            hls = null;
            switchToMp4();
          });
          instance.loadSource(HERO_VIDEO_HLS);
          instance.attachMedia(video);
        } else if (canPlayNativeHls()) {
          startNative();
        } else {
          // 3. No HLS support at all
          switchToMp4();
        }
      })
      .catch(() => {
        // The chunk itself failed to load: use what the browser has.
        if (cancelled) return;
        if (canPlayNativeHls()) startNative();
        else switchToMp4();
      });

    // 5. Cleanup
    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, []);

  return (
    <div className="relative z-10 -mt-[150px] w-full">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        onCanPlay={() => setReady(true)}
        className={cn(
          "block h-auto w-full mix-blend-screen transition-opacity duration-1000 ease-out",
          ready ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-page via-transparent to-page" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Logo cloud                                                          */
/* ------------------------------------------------------------------ */

function LogoItem({ logo }: { logo: Logo }) {
  // Whole lockup dims together and lights up on hover.
  const wrap =
    "flex shrink-0 items-center gap-2 text-white opacity-60 transition-opacity duration-300 hover:opacity-100";
  const label = "text-[17px] leading-none font-semibold tracking-[-0.02em] whitespace-nowrap";
  // brightness-0 + invert turns any coloured SVG pure white.
  const img = "w-auto shrink-0 brightness-0 invert";

  if (logo.kind === "text") {
    return (
      <span className={wrap}>
        <span className={cn(label, "text-[19px] tracking-[-0.04em]")}>{logo.name}</span>
      </span>
    );
  }

  if (logo.kind === "wordmark") {
    return (
      <span className={wrap}>
        <img
          src={logo.src}
          alt={logo.name}
          height={logo.height}
          loading="lazy"
          decoding="async"
          className={cn(img, logo.className)}
        />
      </span>
    );
  }

  // Symbol + name: the visible name is the label, so the symbol's alt is empty.
  return (
    <span className={wrap}>
      <img
        src={logo.src}
        alt=""
        height={logo.height}
        width={logo.height}
        loading="lazy"
        decoding="async"
        className={cn(img, logo.className)}
      />
      <span className={label}>{logo.name}</span>
    </span>
  );
}

function LogoCloud() {
  return (
    <section
      aria-label="Customers"
      className="relative z-20 border-t border-white/5 bg-black/20 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-8 sm:px-6 md:flex-row md:gap-0 md:py-7">
        <p className="shrink-0 text-center text-sm text-white/60 md:w-48 md:pr-8 md:text-right">
          Powering the best teams
        </p>

        <div aria-hidden="true" className="hidden h-10 w-px shrink-0 bg-white/10 md:block" />

        <div className="w-full min-w-0 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] md:flex-1 md:pl-8">
          <InfiniteSlider gap={88} speed={40} speedOnHover={16}>
            {LOGOS.map((logo) => (
              <LogoItem key={logo.name} logo={logo} />
            ))}
          </InfiniteSlider>
        </div>
      </div>
    </section>
  );
}
