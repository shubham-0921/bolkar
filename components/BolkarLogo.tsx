interface BolkarLogoProps {
  size?: number;
  className?: string;
}

export default function BolkarLogo({ size = 28, className = "" }: BolkarLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/bolkar_logo.png"
      alt="Bolkar"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
