import {
  Basket,
  BowlFood,
  Cookie,
  DropHalfBottom,
  FishSimple,
  GrainsSlash,
  Leaf,
} from "@phosphor-icons/react/ssr";
import type { IconProps } from "@phosphor-icons/react";
import type { IngredientCategory } from "@/lib/types";

const ICONS: Record<IngredientCategory, React.ComponentType<IconProps>> = {
  produce: Leaf,
  protein: FishSimple,
  dairy: DropHalfBottom,
  pantry: Basket,
  grain: GrainsSlash,
  spice: BowlFood,
  bakery: Cookie,
};

export function CategoryIcon({
  category,
  className,
}: {
  category: IngredientCategory;
  className?: string;
}) {
  const Icon = ICONS[category];
  return <Icon className={className} weight="regular" />;
}
