import { Camera } from "lucide-react";

/** Small attribution badge for a freely licensed photo. */
export function PhotoCredit({ photo }: { photo: { author: string; license: string; sourceUrl: string } }) {
  return (
    <a
      href={photo.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`Photo: ${photo.author} · ${photo.license} · Wikimedia Commons`}
      className="inline-flex max-w-64 items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white backdrop-blur hover:bg-black/70"
    >
      <Camera className="size-3 shrink-0" aria-hidden="true" />
      <span className="truncate">
        {photo.author} · {photo.license}
      </span>
    </a>
  );
}
