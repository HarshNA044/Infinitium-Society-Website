"use client";
import React, { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  className?: string;
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main>
      <div
        className={cn(
          "relative flex flex-col h-[100vh] items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-slate-950 transition-bg",
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={cn(
              "aurora-gradient-lights",
              showRadialGradient &&
                "[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]"
            )}
          ></div>
        </div>
        {children}
      </div>
    </main>
  );
};
