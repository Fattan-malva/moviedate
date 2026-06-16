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
    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#14141f] border border-[#1f1f2e] min-w-[200px]">
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
