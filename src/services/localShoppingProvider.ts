import { GardenProfile, Plant, ShoppingItem } from '../types';
import { ShoppingProvider } from './types';

export class LocalShoppingProvider implements ShoppingProvider {
  readonly id = 'local-shopping-provider';
  readonly name = 'Local Beginner Shopping List Generator';

  async generateShoppingList(
    plants: Plant[],
    profile: GardenProfile | null,
    spaceId?: string,
    spaceName?: string
  ): Promise<ShoppingItem[]> {
    if (!plants || plants.length === 0) {
      return [];
    }

    const items: ShoppingItem[] = [];
    const plantNames = plants.map((p) => p.name);

    // 1. Containers
    const needsDeepContainers = plants.some((p) => p.id === 'cherry-tomato' || p.id === 'radish' || p.id === 'chilli');
    const needsShallowContainers = plants.some((p) => p.id === 'spinach' || p.id === 'coriander' || p.id === 'fenugreek');
    const hasMint = plants.some((p) => p.id === 'mint');

    if (needsDeepContainers) {
      items.push({
        id: 'container-deep',
        name: 'Deep Pots / Grow Bags (10–12 inch depth with drainage)',
        category: 'container',
        whatIsThisFor: 'Gives root vegetables, tomatoes, and chillies enough depth so roots don\'t get stunted or root-bound.',
        whyNeeded: 'Vegetables need room to drink nutrients and anchor firm stems.',
        estimatedQuantity: `${plants.filter(p => p.id === 'cherry-tomato' || p.id === 'radish' || p.id === 'chilli').length} pots`,
        checked: false,
        plantNames: plants.filter(p => p.id === 'cherry-tomato' || p.id === 'radish' || p.id === 'chilli').map(p => p.name)
      });
    }

    if (needsShallowContainers) {
      items.push({
        id: 'container-shallow',
        name: 'Wide Shallow Trays / Planter Boxes (4–6 inch depth with drainage)',
        category: 'container',
        whatIsThisFor: 'Leafy greens and herbs need surface area to sprout rather than deep soil.',
        whyNeeded: 'Maximizes your harvest space while keeping weight low on balconies and windowsills.',
        estimatedQuantity: '1 to 2 wide rectangular planters',
        checked: false,
        plantNames: plants.filter(p => p.id === 'spinach' || p.id === 'coriander' || p.id === 'fenugreek').map(p => p.name)
      });
    }

    if (hasMint) {
      items.push({
        id: 'container-mint',
        name: 'Dedicated 6–8 Inch Pot for Mint',
        category: 'container',
        whatIsThisFor: 'Mint sends invasive horizontal runners that choke out fellow plants.',
        whyNeeded: 'Keeping mint in its own private pot keeps the rest of your garden safe.',
        estimatedQuantity: '1 standalone pot',
        checked: false,
        plantNames: ['Mint (Pudina)']
      });
    }

    // Always include base container trays for balconies/indoor
    if (profile?.spaceType === 'balcony' || profile?.spaceType === 'windowsill' || profile?.spaceType === 'indoor') {
      items.push({
        id: 'container-saucers',
        name: 'Base Drip Trays / Saucers',
        category: 'container',
        whatIsThisFor: 'Catches excess drained water under pots to protect your floor and prevent messy balcony runoffs.',
        whyNeeded: 'Maintains cleanliness while letting roots drain freely without sitting in puddles.',
        estimatedQuantity: `${Math.min(plants.length, 4)} saucers`,
        checked: false,
        plantNames
      });
    }

    // 2. Seeds & Seedlings
    plants.forEach((plant) => {
      items.push({
        id: `seeds-${plant.id}`,
        name: `${plant.name} — Quality Seeds or Starter Saplings`,
        category: 'plant',
        whatIsThisFor: `The living foundation for growing ${plant.name}.`,
        whyNeeded: 'Beginner tip: For tomatoes, chillies, or mint, a healthy small starter sapling from a nursery yields results weeks faster than starting from raw seed.',
        estimatedQuantity: '1 packet of seeds OR 1 healthy sapling',
        checked: false,
        plantNames: [plant.name]
      });
    });

    // 3. Growing Medium
    items.push({
      id: 'medium-potting-mix',
      name: 'Well-Draining Potting Mix (Soil + Coco Peat / Perlite blend)',
      category: 'medium',
      whatIsThisFor: 'Provides soft, aerated bedding so delicate baby roots can breathe and absorb moisture.',
      whyNeeded: 'Avoid digging heavy clay dirt from a roadside; sterile potting mix prevents fungal root rot and hard clods.',
      estimatedQuantity: `${Math.max(10, plants.length * 5)} kg / liters`,
      checked: false,
      plantNames
    });

    // 4. Nutrients & Compost
    items.push({
      id: 'nutrient-vermicompost',
      name: 'Organic Vermicompost or Aged Cow Dung Manure',
      category: 'nutrients',
      whatIsThisFor: 'Slow-release natural nourishment rich in earthworm castings, beneficial soil microbes, and nitrogen.',
      whyNeeded: 'Feeds plants naturally for months without chemical burns or harsh salts.',
      estimatedQuantity: '5 kg bag',
      checked: false,
      plantNames
    });

    if (plants.some((p) => p.id === 'cherry-tomato' || p.id === 'chilli')) {
      items.push({
        id: 'nutrient-calcium',
        name: 'Bone Meal or Wood Ash / Crushed Eggshells (Calcium & Potassium booster)',
        category: 'nutrients',
        whatIsThisFor: 'Strengthens cell walls in fruiting plants to prevent blossom end rot (black spots on fruit bottoms).',
        whyNeeded: 'Tomatoes and chillies consume large amounts of calcium once flowering starts.',
        estimatedQuantity: '500g – 1 kg pack',
        checked: false,
        plantNames: plants.filter(p => p.id === 'cherry-tomato' || p.id === 'chilli').map(p => p.name)
      });
    }

    // 5. Tools
    items.push({
      id: 'tool-watering-can',
      name: 'Gentle Watering Can with Rose Spout (or Spray Bottle)',
      category: 'tools',
      whatIsThisFor: 'Delivers a soft shower of water like gentle rain rather than a harsh pipe blast.',
      whyNeeded: 'A harsh blast washes away tiny seeds and exposes tender shallow roots.',
      estimatedQuantity: '1 can (1.5L to 3L)',
      checked: false,
      plantNames
    });

    items.push({
      id: 'tool-trowel',
      name: 'Small Hand Trowel (Garden scoop)',
      category: 'tools',
      whatIsThisFor: 'Mixing potting mix with compost and scooping soil neatly into pots.',
      whyNeeded: 'Saves your hands from scrapes and speeds up pot filling.',
      estimatedQuantity: '1 hand trowel',
      checked: false,
      plantNames
    });

    if (plants.some((p) => p.id === 'cherry-tomato' || p.id === 'chilli')) {
      items.push({
        id: 'tool-support-stake',
        name: 'Bamboo Stakes or Garden Twine (Support Sticks)',
        category: 'tools',
        whatIsThisFor: 'Keeps tomato and chilli stems upright once heavy fruit clusters start forming.',
        whyNeeded: 'Prevents stems from snapping under fruit weight or sudden gusts of balcony wind.',
        estimatedQuantity: '2 to 3 stakes',
        checked: false,
        plantNames: plants.filter(p => p.id === 'cherry-tomato' || p.id === 'chilli').map(p => p.name)
      });
    }

    const effectiveSpaceId = spaceId || profile?.spaceId;
    const effectiveSpaceName = spaceName || profile?.spaceName;

    return items.map((item) => ({
      ...item,
      id: effectiveSpaceId ? `${effectiveSpaceId}-${item.id}` : item.id,
      spaceId: effectiveSpaceId,
      spaceName: effectiveSpaceName
    }));
  }
}

export const shoppingProvider = new LocalShoppingProvider();
