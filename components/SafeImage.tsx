import Image from "next/image";
import { isWhitelistedImageDomain } from "@/lib/utils/image";

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function SafeImage({
  src,
  alt,
  width = 800,
  height = 400,
  className = "",
}: SafeImageProps) {
  const isWhitelisted = isWhitelistedImageDomain(src);

  if (!isWhitelisted) {
    return (
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="text-purple-400 hover:text-purple-300 text-sm"
      >
        View external image
      </a>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="object-cover w-full h-full"
      />
    </div>
  );
}
