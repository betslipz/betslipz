import Image from "next/image";
import { SITE_NAME } from "@/lib/config";

// Brand files live in public/brand. The on-dark variant has no background, so it sits on any dark surface.
export default function Logo({ className = "h-9" }: { className?: string }) {
  return <Image src="/brand/betslipz-logo-on-dark.svg" alt={SITE_NAME} width={547} height={156} priority className={`w-auto ${className}`} />;
}
