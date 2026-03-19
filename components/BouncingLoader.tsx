"use client";

interface BouncingLoaderProps {
  /** Optional text to display below the loader */
  text?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

export default function BouncingLoader({
  text,
  size = "md",
}: BouncingLoaderProps) {
  // Size configurations
  const sizes = {
    sm: {
      wrapper: "w-[120px] h-[40px]",
      ball: "w-3 h-3",
      shadow: "w-3 h-1 top-[42px]",
    },
    md: {
      wrapper: "w-[200px] h-[60px]",
      ball: "w-5 h-5",
      shadow: "w-5 h-1 top-[62px]",
    },
    lg: {
      wrapper: "w-[280px] h-[80px]",
      ball: "w-7 h-7",
      shadow: "w-7 h-1.5 top-[82px]",
    },
  };

  const config = sizes[size];

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className={`${config.wrapper} relative z-[1]`}>
        {/* Bouncing circles */}
        <div
          className={`${config.ball} absolute rounded-full bg-emerald-400 left-[15%] origin-center animate-bounce-ball`}
        />
        <div
          className={`${config.ball} absolute rounded-full bg-emerald-400 left-[45%] origin-center animate-bounce-ball animation-delay-200`}
        />
        <div
          className={`${config.ball} absolute rounded-full bg-emerald-400 left-auto right-[15%] origin-center animate-bounce-ball animation-delay-300`}
        />

        {/* Shadows */}
        <div
          className={`${config.shadow} absolute rounded-full bg-black/70 left-[15%] origin-center -z-10 blur-[1px] animate-bounce-shadow`}
        />
        <div
          className={`${config.shadow} absolute rounded-full bg-black/70 left-[45%] origin-center -z-10 blur-[1px] animate-bounce-shadow animation-delay-200`}
        />
        <div
          className={`${config.shadow} absolute rounded-full bg-black/70 left-auto right-[15%] origin-center -z-10 blur-[1px] animate-bounce-shadow animation-delay-300`}
        />
      </div>

      {text && (
        <p className="text-emerald-400/80 text-sm font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
