import { GardenProfile, GardenTask, Plant, EnvironmentalContext } from '../types';
import { TaskGenerator } from './types';
import { environmentalRuleEngine } from './environmentalRuleEngine';

export class LocalTaskGenerator implements TaskGenerator {
  generateDailyTasks(
    plants: Plant[],
    profile: GardenProfile | null,
    spaceId?: string,
    spaceName?: string,
    environmentalContext?: EnvironmentalContext | null
  ): GardenTask[] {
    const tasks: GardenTask[] = [];

    // Fallback if no plants are selected yet
    if (!plants || plants.length === 0) {
      tasks.push(
        {
          id: 'task-prep-space',
          title: 'Step into your growing space & take a breath',
          description: `Go out to your ${profile?.spaceType || 'outdoor space'} for 3 minutes. Feel the breeze, note where the morning or afternoon light falls, and visualize where your pots will live.`,
          estimatedMinutes: 3,
          completed: false,
          category: 'prep',
          touchGrassPrompt: 'Notice the temperature and sunlight angle on your balcony/patio.'
        },
        {
          id: 'task-choose-starter',
          title: 'Review beginner plant recommendations',
          description: 'Browse the suggested plants for your space and pick 1 or 2 to get started without overwhelm.',
          estimatedMinutes: 4,
          completed: false,
          category: 'prep'
        }
      );
    } else {
      // 1. Universal golden rule task: Finger moisture check
      tasks.push({
        id: 'task-check-moisture',
        title: 'The 1-Inch Finger Test for Soil Moisture',
        description: 'Stick your index finger 1 inch into the pot soil. If cool and damp, DO NOT water today. If dry and crumbly, give a gentle drink at soil level.',
        estimatedMinutes: 2,
        completed: false,
        category: 'inspection',
        touchGrassPrompt: 'Touch the actual soil with your bare finger. Real moisture feels distinctly cool.'
      });

      // 2. Leaf underside inspection
      const vulnerableLeafPlants = plants.filter((p) => p.id === 'coriander' || p.id === 'spinach' || p.id === 'chilli');
      if (vulnerableLeafPlants.length > 0) {
        tasks.push({
          id: 'task-leaf-inspect',
          title: `Gently inspect leaf undersides (${vulnerableLeafPlants.map(p => p.name.split(' ')[0]).join(', ')})`,
          description: 'Turn 3 or 4 random leaves upside down. Look for tiny aphids or whitefly specks. Catching pests early takes only 60 seconds and prevents infestations.',
          estimatedMinutes: 2,
          completed: false,
          category: 'inspection',
          plantName: vulnerableLeafPlants[0].name,
          touchGrassPrompt: 'Look closely at the natural patterns and veins on the undersides of leaves.'
        });
      }

      // 3. Mint / Basil pinching or trimming
      const herbalPinching = plants.filter((p) => p.id === 'mint' || p.id === 'sweet-basil' || p.id === 'holy-basil');
      if (herbalPinching.length > 0) {
        tasks.push({
          id: 'task-pinch-tops',
          title: `Pinch growing tips on ${herbalPinching[0].name.split(' ')[0]}`,
          description: 'Snip or pinch off the very top pair of leaves with your fingernails. This stimulates double side-branches and makes the plant bushier and fuller.',
          estimatedMinutes: 2,
          completed: false,
          category: 'maintenance',
          plantName: herbalPinching[0].name,
          touchGrassPrompt: 'Rub the snipped tip between your fingers and smell the fresh natural essential oils.'
        });
      }

      // 4. Balcony pot rotation
      if (profile?.spaceType === 'balcony' || profile?.spaceType === 'windowsill' || profile?.spaceType === 'indoor') {
        tasks.push({
          id: 'task-rotate-pots',
          title: 'Rotate pots 90° towards the light',
          description: 'Plants naturally lean towards the brightest window or railing angle. A quarter-turn prevents leaning and gives even foliage growth.',
          estimatedMinutes: 1,
          completed: false,
          category: 'sunlight',
          touchGrassPrompt: 'Feel the weight of the pot and how sturdy it sits.'
        });
      }

      // 5. Water with gentleness (if test showed dry)
      tasks.push({
        id: 'task-water-mindful',
        title: 'Water roots mindfully (only if dry)',
        description: 'Pour slowly near the root zone until you see a few droplets seep into the bottom drainage saucer. Avoid drenching the leaves in late afternoon.',
        estimatedMinutes: 3,
        completed: false,
        category: 'watering',
        touchGrassPrompt: 'Listen to the sound of water soaking through the porous potting mix.'
      });
    }

    // Milestone 2: Additive Environmental Task (Does not replace routine tasks)
    if (environmentalContext) {
      const advice = environmentalRuleEngine.evaluateWeather(environmentalContext.snapshot);
      const isOutdoor = !profile || ['balcony', 'terrace', 'backyard', 'garden', 'pots', 'other'].includes(profile.spaceType);
      if (advice.suggestedTask && isOutdoor) {
        tasks.push({
          id: `weather-task-${advice.actionType}`,
          title: `${advice.suggestedTask.title}${spaceName ? ` (${spaceName})` : ''}`,
          description: advice.suggestedTask.description,
          estimatedMinutes: advice.suggestedTask.estimatedMinutes,
          completed: false,
          category: advice.suggestedTask.category,
          isWeatherDerived: true,
          touchGrassPrompt: 'Notice the outdoor breeze and air temperature directly in your space.'
        });
      }
    }

    const effectiveSpaceId = spaceId || profile?.spaceId;
    const effectiveSpaceName = spaceName || profile?.spaceName;

    return tasks.map((task) => ({
      ...task,
      id: effectiveSpaceId ? `${effectiveSpaceId}-${task.id}` : task.id,
      spaceId: effectiveSpaceId,
      spaceName: effectiveSpaceName
    }));
  }
}

export const taskGenerator = new LocalTaskGenerator();
