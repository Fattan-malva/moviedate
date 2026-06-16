import type { CastMember } from "@/lib/types";

interface Props {
  member: CastMember;
}

export default function CastCard({ member }: Props) {
  const initials = member.actor
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl min-w-[200px] hover:bg-white/[0.06] hover:border-violet-500/30 transition-all">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-white truncate">{member.actor}</p>
        <p className="text-xs text-gray-500 truncate">as {member.character}</p>
      </div>
    </div>
  );
}
