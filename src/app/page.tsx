import { getHomepage } from "@/lib/data";
import HeroSlider from "@/components/home/HeroSlider";
import CategoryRow from "@/components/home/CategoryRow";

export default async function HomePage() {
  const data = await getHomepage();
  const { hero, categories } = data;

  return (
    <div className="space-y-8 pb-8">
      <HeroSlider items={hero} />
      <div className="max-w-7xl mx-auto px-4 space-y-10">
        {categories.map((cat) => (
          <CategoryRow
            key={cat.name}
            title={cat.name}
            items={cat.items}
            showType
          />
        ))}
      </div>
    </div>
  );
}
