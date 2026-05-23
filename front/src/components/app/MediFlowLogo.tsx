import { MEDIFLOW_PLATFORM } from "@/lib/theme/platformBranding";
import { cn } from "@/lib/utils";

type MediFlowLogoProps = {
  className?: string;
  imgClassName?: string;
};

export function MediFlowLogo({ className, imgClassName }: MediFlowLogoProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <img
        src={MEDIFLOW_PLATFORM.logoSrc}
        alt={MEDIFLOW_PLATFORM.name}
        className={cn("h-auto w-full max-w-[220px] object-contain", imgClassName)}
      />
    </div>
  );
}
