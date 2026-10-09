import { Plant } from '../types';

export const BEGINNER_PLANTS: Plant[] = [
  {
    id: 'mint',
    name: 'Mint (Pudina)',
    hindiName: 'Pudina',
    scientificName: 'Mentha spicata',
    category: 'herbs',
    difficulty: 'Very Easy',
    sunlightText: 'Partial sunlight (2–4 hours/day) or bright indirect light',
    sunlightRequirement: 'partial',
    wateringText: 'Keep soil consistently moist; water when top ½ inch feels dry',
    spaceText: 'Compact: 6–8 inch wide shallow or regular pot',
    containerFriendly: true,
    beginnerFriendly: true,
    approximateGrowthTime: '3–4 weeks for first harvest',
    shortDescription: 'The champion beginner herb. Thrives in containers, spreads quickly, and smells invigorating.',
    basicRequirements: [
      '6–8 inch container with drainage holes',
      'Regular potting mix with compost',
      'Morning sun or bright shade',
      'Consistent hydration without waterlogging'
    ],
    recommendedFor: [
      'Balcony gardeners',
      'Windowsills',
      'Kitchen tea & chutney lovers',
      'Anyone who has ever killed a plant before'
    ],
    containerGuidance: 'Always grow mint in its own separate container because its roots spread vigorously and will crowd out other plants.',
    growingTimeline: 'Cuttings or seeds sprout in 7–14 days. Harvest fresh sprigs anytime after 3 weeks by snipping the top leaves.',
    basicCare: [
      'Water gently at the base in the morning',
      'Pinch off flower buds to keep leaf flavor robust and bushy',
      'Trim regularly — harvesting actually helps mint grow fuller'
    ],
    thingsToWatchFor: [
      'Crispy dry leaf edges mean soil dried out too fast',
      'Stretching or leggy stems mean it wants slightly more light'
    ],
    idealSeason: 'Spring through Autumn (Year-round in warm climates)'
  },
  {
    id: 'coriander',
    name: 'Coriander (Dhania)',
    hindiName: 'Dhania',
    scientificName: 'Coriandrum sativum',
    category: 'herbs',
    difficulty: 'Easy',
    sunlightText: 'Moderate sunlight (3–5 hours/day); prefers mild morning sun',
    sunlightRequirement: 'partial',
    wateringText: 'Water gently whenever the surface soil feels slightly dry to touch',
    spaceText: 'Shallow wide pot or trough (8–10 inches wide, 6 inches deep)',
    containerFriendly: true,
    beginnerFriendly: true,
    approximateGrowthTime: '4–5 weeks for full leaves',
    shortDescription: 'Essential everyday kitchen herb. Quick to sprout from cracked coriander seeds right in a window box or balcony pot.',
    basicRequirements: [
      'Wide shallow tray or rectangular pot with good drainage',
      'Loamy potting soil mixed with 20% vermicompost',
      'Gentle morning sunlight',
      'Even moisture via gentle spray can'
    ],
    recommendedFor: [
      'Windowsill gardeners',
      'Balcony containers',
      'Home cooks',
      'Fast weekend gardening starters'
    ],
    containerGuidance: 'A wide, relatively shallow planter (4–6 inches deep) works best because coriander has fine taproots that do not need deep soil.',
    growingTimeline: 'Seeds sprout in 8–12 days. Pick outer leaves after 30–35 days to allow center to keep producing.',
    basicCare: [
      'Gently crush whole coriander seeds before sowing to split the husks',
      'Keep soil moist but never stagnant water',
      'Keep out of scorching midday summer sun to avoid premature flowering (bolting)'
    ],
    thingsToWatchFor: [
      'Premature tall flower stems (bolting) happen in extreme heat',
      'Yellow lower leaves indicate soggy soil with poor drainage'
    ],
    idealSeason: 'Cooler months (Autumn, Winter, early Spring)'
  },
  {
    id: 'holy-basil',
    name: 'Tulsi (Holy Basil)',
    hindiName: 'Tulsi',
    scientificName: 'Ocimum tenuiflorum',
    category: 'herbs',
    difficulty: 'Easy',
    sunlightText: 'Needs good sunlight (4–6 hours/day)',
    sunlightRequirement: 'full',
    wateringText: 'Water when top 1 inch of soil feels dry; loves regular but moderate water',
    spaceText: '8–10 inch terracotta or clay pot',
    containerFriendly: true,
    beginnerFriendly: true,
    approximateGrowthTime: '4–6 weeks to established bush',
    shortDescription: 'Revered, aromatic, and remarkably hardy. Adapts wonderfully to balconies, terraces, and sunny verandas.',
    basicRequirements: [
      '8–10 inch porous terracotta pot with base drainage',
      'Well-aerated soil with coarse sand and compost',
      'Direct sunlight for at least 4 hours',
      'Regular pinching of flower heads (manjari)'
    ],
    recommendedFor: [
      'Sunny balconies & terraces',
      'Daily morning herbal rituals',
      'Natural mosquito and pest deterrent'
    ],
    containerGuidance: 'Terracotta pots are ideal for Tulsi because the clay breathes and prevents moisture buildup around the roots.',
    growingTimeline: 'Sprouts in 7–10 days. Grows into a bushy perennial plant that lasts for years with seasonal trimming.',
    basicCare: [
      'Pinch off terminal flower clusters as soon as they emerge to encourage dense lateral growth',
      'Water early morning, avoiding wetting leaves in humid evenings',
      'Feed with a handful of vermicompost or leaf mold once a month'
    ],
    thingsToWatchFor: [
      'Leaf dropping in deep winter is normal; reduce watering during cold spells',
      'Powdery white residue on leaves can be cleared with neem oil spray'
    ],
    idealSeason: 'Year-round in tropical/subtropical zones'
  },
  {
    id: 'sweet-basil',
    name: 'Italian Sweet Basil',
    hindiName: 'Vilayati Tulsi',
    scientificName: 'Ocimum basilicum',
    category: 'herbs',
    difficulty: 'Easy',
    sunlightText: 'Moderate to full sunlight (4–6 hours/day)',
    sunlightRequirement: 'full',
    wateringText: 'Water thoroughly when soil surface feels dry; loves warm, moist soil',
    spaceText: '6–8 inch pot or grouped with tomatoes',
    containerFriendly: true,
    beginnerFriendly: true,
    approximateGrowthTime: '4–5 weeks to first big harvest',
    shortDescription: 'Lush, fragrant leaves perfect for pestos, pastas, and fresh salads. Loves warmth and companion planting.',
    basicRequirements: [
      '6–8 inch pot with bottom drainage hole',
      'Nutrient-rich, well-drained potting mix',
      'Warm sunny spot sheltered from harsh wind',
      'Regular leaf harvesting'
    ],
    recommendedFor: [
      'Sunny balconies & kitchen windows',
      'Pasta & pizza lovers',
      'Companion planting next to tomatoes'
    ],
    containerGuidance: 'Pairs well with a medium container. Ensure soil remains light and airy rather than dense clay.',
    growingTimeline: 'Germinates quickly within 5–8 days. Ready for perpetual leaf picking in 30 days.',
    basicCare: [
      'Always pinch from top nodes to stimulate double branching',
      'Never harvest more than ⅓ of the plant at once'
    ],
    thingsToWatchFor: [
      'Wilting on hot afternoons is common; check if soil is dry before overwatering'
    ],
    idealSeason: 'Spring and Summer'
  },
  {
    id: 'spinach',
    name: 'Spinach (Palak)',
    hindiName: 'Palak',
    scientificName: 'Spinacia oleracea',
    category: 'vegetables',
    difficulty: 'Very Easy',
    sunlightText: 'Partial to moderate sunlight (3–5 hours/day)',
    sunlightRequirement: 'partial',
    wateringText: 'Keep soil consistently damp like a wrung-out sponge',
    spaceText: 'Wide planter box or tray (6 inches deep, any width)',
    containerFriendly: true,
    beginnerFriendly: true,
    approximateGrowthTime: '4–5 weeks for tender harvest',
    shortDescription: 'Nutrient-rich green that grows super fast in shallow containers. A dream starter crop for first-time gardeners.',
    basicRequirements: [
      'Wide shallow crate, grow bag, or rectangular planter',
      'Nitrogen-rich compost blended with garden soil',
      'Gentle sunlight or partial shade in hotter climates',
      'Regular light watering'
    ],
    recommendedFor: [
      'Apartment balconies',
      'Kitchen gardens',
      'Quick gratification lovers (ready in a month!)'
    ],
    containerGuidance: 'Grow in a wide shallow trough (depth 6 inches) to maximize leaf surface area.',
    growingTimeline: 'Fast germination in 4–7 days. "Cut and come again" harvest starts by week 4.',
    basicCare: [
      'Sow seeds ½ inch deep and 2 inches apart',
      'Harvest outer leaves first, leaving center crown to regenerate'
    ],
    thingsToWatchFor: [
      'Slugs or caterpillars love tender leaves; check leaf undersides during morning visits'
    ],
    idealSeason: 'Autumn, Winter, early Spring'
  },
  {
    id: 'fenugreek',
    name: 'Fenugreek (Methi)',
    hindiName: 'Methi',
    scientificName: 'Trigonella foenum-graecum',
    category: 'vegetables',
    difficulty: 'Very Easy',
    sunlightText: 'Moderate sunlight (3–4 hours/day)',
    sunlightRequirement: 'partial',
    wateringText: 'Gently sprinkle water daily to maintain even top moisture',
    spaceText: 'Shallow tray, crate, or pot (4–5 inches deep)',
    containerFriendly: true,
    beginnerFriendly: true,
    approximateGrowthTime: '3 weeks for tender microgreens/leaves',
    shortDescription: 'The fastest, most foolproof vegetable in the world. Ready to snip and cook in just 20 to 25 days from seed.',
    basicRequirements: [
      'Any shallow container or recycled tray with drainage pinholes',
      'Loose soil mixed with coco peat and compost',
      'Morning sunlight or balcony brightness',
      'Soak kitchen methi seeds overnight before planting'
    ],
    recommendedFor: [
      'Absolute beginners wanting instant success',
      'Small balcony planters',
      'Children and families starting gardening'
    ],
    containerGuidance: 'Needs very little depth (4 inches is plenty). Great for repurposing fruit crates with a liner.',
    growingTimeline: 'Sprouts in 48 hours! Tender leaves ready to harvest in 20–25 days.',
    basicCare: [
      'Broadcast seeds evenly over moist soil and dust with a thin layer of compost',
      'Keep moist with a fine water spray'
    ],
    thingsToWatchFor: [
      'Over-saturating soil can cause damping off; ensure excess water drains freely'
    ],
    idealSeason: 'Winter through Spring'
  },
  {
    id: 'chilli',
    name: 'Green Chilli (Hari Mirch)',
    hindiName: 'Hari Mirch',
    scientificName: 'Capsicum annuum',
    category: 'vegetables',
    difficulty: 'Easy',
    sunlightText: 'Full sunlight (5–6+ hours/day)',
    sunlightRequirement: 'full',
    wateringText: 'Water thoroughly when top 1–2 inches of soil feel dry',
    spaceText: 'Medium pot (10–12 inch diameter)',
    containerFriendly: true,
    beginnerFriendly: true,
    approximateGrowthTime: '8–10 weeks for continuous spicy peppers',
    shortDescription: 'Productive, rewarding, and resilient. Once it begins fruiting, a single healthy plant yields chillies for months.',
    basicRequirements: [
      '10–12 inch sturdy pot with drainage',
      'Rich organic potting mix with compost and bone meal or wood ash',
      'Direct bright sunshine',
      'A small wooden stick or bamboo stake for branch support'
    ],
    recommendedFor: [
      'Terraces and sunny balconies',
      'Indian cooking daily essentials',
      'Gardeners with at least 5 hours of sunlight'
    ],
    containerGuidance: 'Use a container with at least 10 inches depth and width to give the root ball sufficient space.',
    growingTimeline: 'Seeds sprout in 10–14 days. Flowers appear around week 6, followed by chillies ripening from week 8 onwards.',
    basicCare: [
      'Let soil dry slightly between waterings to encourage flowering and spicier chillies',
      'Give monthly top-dress of compost once flowers show up'
    ],
    thingsToWatchFor: [
      'Leaf curling can indicate tiny aphids or mites under leaves; rinse leaves with water or mild soap'
    ],
    idealSeason: 'Warm season (Spring through Autumn)'
  },
  {
    id: 'cherry-tomato',
    name: 'Cherry Tomato',
    hindiName: 'Chota Tamatar',
    scientificName: 'Solanum lycopersicum var. cerasiforme',
    category: 'vegetables',
    difficulty: 'Easy',
    sunlightText: 'Direct sunlight (6+ hours/day)',
    sunlightRequirement: 'full',
    wateringText: 'Deep, consistent watering; keep soil moist without waterlogging',
    spaceText: 'Large pot (12–14 inch diameter) or grow bag',
    containerFriendly: true,
    beginnerFriendly: true,
    approximateGrowthTime: '8–10 weeks for juicy sweet red clusters',
    shortDescription: 'Far easier and more forgiving than large beefsteak tomatoes. Generous clusters of sweet, candy-like red tomatoes.',
    basicRequirements: [
      '12–14 inch container or 10-gallon grow bag',
      'Rich, well-draining soil with plenty of organic compost',
      '6+ hours of unbroken sunshine',
      'Sturdy bamboo stake or small cage for climbing stems'
    ],
    recommendedFor: [
      'Sunny balconies & open terraces',
      'Satisfying harvesting with kids',
      'Fresh homegrown snacking'
    ],
    containerGuidance: 'Ensure deep container with at least 12 inches depth. Add a bamboo cane early on before roots fill the pot.',
    growingTimeline: 'Seedlings take 7–10 days to sprout. Blooms at 6 weeks, ripe fruit clusters from week 9 onwards.',
    basicCare: [
      'Water at soil level to keep tomato foliage dry',
      'Tie central stem loosely to support stake as it climbs',
      'Feed with calcium-rich organic fertilizer or crushed eggshells'
    ],
    thingsToWatchFor: [
      'Irregular watering can cause fruit skins to split; keep watering rhythm steady'
    ],
    idealSeason: 'Warm months (or Winter in mild tropical regions)'
  },
  {
    id: 'radish',
    name: 'Radish (Mooli)',
    hindiName: 'Mooli',
    scientificName: 'Raphanus sativus',
    category: 'vegetables',
    difficulty: 'Very Easy',
    sunlightText: 'Moderate to full sunlight (4–6 hours/day)',
    sunlightRequirement: 'partial',
    wateringText: 'Regular even moisture to keep roots crisp and mild',
    spaceText: 'Pot with at least 8–10 inches depth for roots to expand',
    containerFriendly: true,
    beginnerFriendly: true,
    approximateGrowthTime: '4–6 weeks from seed to crunchy root',
    shortDescription: 'One of the fastest root vegetables to grow. Both the crunchy root and crisp leafy greens are edible.',
    basicRequirements: [
      'Deep pot (minimum 8–10 inches deep) with light, rock-free soil',
      'Loose soil mixed with sand so the root can push down easily',
      'Moderate sun',
      'Consistent watering to prevent pithy or overly pungent roots'
    ],
    recommendedFor: [
      'Gardeners wanting to see root magic',
      'Balcony troughs and deep pots',
      'Fresh winter salads'
    ],
    containerGuidance: 'Soil must be loose and free of hard clods or rocks so the taproot grows straight and plump.',
    growingTimeline: 'Sprouts in 3–5 days. Ready to harvest in 30–40 days when root crown peaks above soil line.',
    basicCare: [
      'Thin seedlings so plants have 3 inches between each other',
      'Keep soil moist; drying out makes radishes unpleasantly woody'
    ],
    thingsToWatchFor: [
      'Flea beetles can make tiny holes in leaves; floating row cover or neem spray helps'
    ],
    idealSeason: 'Autumn and Winter'
  },
  {
    id: 'marigold',
    name: 'Marigold (Genda)',
    hindiName: 'Genda',
    scientificName: 'Tagetes erecta',
    category: 'flowers',
    difficulty: 'Very Easy',
    sunlightText: 'Bright sunlight (5–6+ hours/day)',
    sunlightRequirement: 'full',
    wateringText: 'Water when top 1 inch of soil is dry; remarkably drought-tolerant',
    spaceText: '6–8 inch pot',
    containerFriendly: true,
    beginnerFriendly: true,
    approximateGrowthTime: '6–8 weeks to vibrant gold & orange blossoms',
    shortDescription: 'Cheery golden flowers that naturally repel garden pests. The absolute best companion flower for any beginner vegetable patch.',
    basicRequirements: [
      '6–8 inch pot with standard drainage',
      'Standard garden potting soil',
      'Plenty of warm sunlight',
      'Occasional deadheading (pinching spent flowers)'
    ],
    recommendedFor: [
      'Balconies needing vibrant color',
      'Natural companion pest control for tomatoes & chillies',
      'Festival and garland lovers'
    ],
    containerGuidance: 'Standard 6–8 inch pot or tucked into corners of larger vegetable grow bags.',
    growingTimeline: 'Sprouts in 4–7 days. Blooms abundantly after 45 days.',
    basicCare: [
      'Deadhead old fading flowers to trigger a continuous wave of new buds',
      'Water in the morning at the base'
    ],
    thingsToWatchFor: [
      'Avoid splashing muddy water onto petals'
    ],
    idealSeason: 'Year-round in warm areas, peak in Autumn/Winter'
  }
];
