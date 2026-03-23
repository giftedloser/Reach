interface ReachLogoProps {
  className?: string;
  size?: number;
}

export function ReachLogo({ className = "", size = 24 }: ReachLogoProps) {
  return (
    <img
      src="/reach-logo.svg"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
    />
  );
}
