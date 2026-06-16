interface Props {
  label: string;
  variant?: "default" | "genre" | "type";
}

export default function Badge({ label, variant = "default" }: Props) {
  const variants = {
    default: "bg-[#1f1f2e] text-gray-300 border-[#2d2d44]",
    genre: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    type: "bg-pink-500/10 text-pink-300 border-pink-500/20",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${variants[variant]}`}
    >
      {label}
    </span>
  );
}
