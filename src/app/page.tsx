import { getHomepage, getAllMovies } from "@/lib/data";
import HeroSlider from "@/components/home/HeroSlider";
import CategoryRow from "@/components/home/CategoryRow";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getHomepage();
  const { hero, categories } = data;

  return (
    <div className="space-y-6 pb-8">
      <HeroSlider items={hero} />
      <div className="max-w-7xl mx-auto px-4 space-y-10">
        {categories.map((cat, idx) => (
        <CategoryRow
          key={`${cat.name}-${idx}`}
          title={cat.name}
          items={cat.items}
          showType
        />
      ))}
      </div>
    </div>
  );
}
