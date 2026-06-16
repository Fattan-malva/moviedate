import { getHomepage } from "@/lib/data";
import HeroSlider from "@/components/home/HeroSlider";
import CategoryRow from "@/components/home/CategoryRow";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getHomepage();
  const { hero, categories } = data;

  // Filter categories that have items with actual titles
  const validCategories = categories.filter(
    (cat) => cat.items && cat.items.length > 0 && cat.items.some((i) => i.title && i.poster)
  );

  return (
    <main className="w-full min-h-screen bg-[#0a0a0f]">
      {/* Hero Section */}
      <HeroSlider items={hero} />

      {/* Categories Section */}
      <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-8">
        {validCategories.map((cat, idx) => (
          <CategoryRow
            key={`${cat.name}-${idx}`}
            title={cat.name}
            items={cat.items}
            showType={false}
          />
        ))}
      </div>
    </main>
  );
}