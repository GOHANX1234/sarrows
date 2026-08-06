import Image from "next/image";
import { User } from "lucide-react";

interface CastMember {
  name: string;
  character?: string;
  image?: string;
}

interface Props {
  cast?: CastMember[];
}

/** Horizontal-scrolling cast row shown on movie/anime detail pages. */
export default function CastGrid({ cast }: Props) {
  if (!cast || cast.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="section-title mb-5">Cast</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {cast.map((c, i) => (
          <div key={i} className="flex-none w-24 text-center">
            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden glass border border-white/10 flex items-center justify-center mb-2">
              {c.image ? (
                <Image src={c.image} alt={c.name} width={80} height={80} className="w-full h-full object-cover" unoptimized />
              ) : (
                <User className="w-7 h-7 text-gray-600" />
              )}
            </div>
            <p className="text-xs font-medium text-gray-200 truncate" title={c.name}>{c.name}</p>
            {c.character && (
              <p className="text-[11px] text-gray-500 truncate" title={c.character}>{c.character}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
