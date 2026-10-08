import { getDestinationByAirport } from "@/lib/catalog/destinations";
import { DestinationArt } from "./destination-art";

const FALLBACK = { theme: "beach" as const, from: "#93c5fd", to: "#1e3a8a" };

/** DestinationArt looked up by airport code. */
export function DestinationArtFor({
  code,
  className,
  showCode,
  photoWidth,
}: {
  code: string;
  className?: string;
  showCode?: boolean;
  photoWidth?: number;
}) {
  const art = getDestinationByAirport(code)?.art ?? FALLBACK;
  return <DestinationArt code={code} theme={art.theme} from={art.from} to={art.to} className={className} showCode={showCode} photoWidth={photoWidth} />;
}
