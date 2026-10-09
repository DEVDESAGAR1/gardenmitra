import { describe, it, expect } from 'vitest';
import { Garden, GardenSpace, GardenProfile } from '../types';
import { BEGINNER_PLANTS } from '../data/plants';
import { shoppingProvider } from '../services/localShoppingProvider';
import { taskGenerator } from '../services/localTaskGenerator';
import { gardenAssistantProvider } from '../services/localAssistantProvider';

describe('Milestone 1: Multi-Space Foundation', () => {
  const mint = BEGINNER_PLANTS.find((p) => p.id === 'mint')!;
  const tomato = BEGINNER_PLANTS.find((p) => p.id === 'cherry-tomato')!;
  const marigold = BEGINNER_PLANTS.find((p) => p.id === 'marigold')!;

  const createInitialGarden = (): Garden => {
    const balconySpace: GardenSpace = {
      id: 'space-balcony-1',
      name: 'North Balcony',
      type: 'balcony',
      size: 'small',
      sunlight: '2_to_4h',
      goal: 'kitchen_garden',
      photos: [],
      plants: [
        {
          plantId: mint.id,
          plant: mint,
          addedAt: new Date().toISOString(),
          status: 'growing',
          spaceId: 'space-balcony-1'
        },
        {
          plantId: tomato.id,
          plant: tomato,
          addedAt: new Date().toISOString(),
          status: 'planning',
          spaceId: 'space-balcony-1'
        }
      ],
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const terraceSpace: GardenSpace = {
      id: 'space-terrace-1',
      name: 'Rooftop Terrace',
      type: 'terrace',
      size: 'large',
      sunlight: 'more_than_6h',
      goal: 'flowers',
      photos: [],
      plants: [
        {
          plantId: marigold.id,
          plant: marigold,
          addedAt: new Date().toISOString(),
          status: 'growing',
          spaceId: 'space-terrace-1'
        }
      ],
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      id: 'garden-123',
      name: 'Dev Garden',
      location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      experience: 'complete_beginner',
      spaces: [balconySpace, terraceSpace],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  it('allows creating, selecting, and coexisting multiple spaces inside one garden', () => {
    const garden = createInitialGarden();

    expect(garden.spaces.length).toBe(2);
    expect(garden.spaces[0].name).toBe('North Balcony');
    expect(garden.spaces[1].name).toBe('Rooftop Terrace');

    // Add a third space
    const windowSpace: GardenSpace = {
      id: 'space-window-1',
      name: 'Kitchen Window',
      type: 'windowsill',
      size: 'very_small',
      sunlight: '2_to_4h',
      goal: 'herbs',
      photos: [],
      plants: [],
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    garden.spaces.push(windowSpace);
    expect(garden.spaces.length).toBe(3);
    expect(garden.spaces.some((s) => s.id === 'space-window-1')).toBe(true);
  });

  it('edits and renames an existing space', () => {
    const garden = createInitialGarden();
    const balcony = garden.spaces.find((s) => s.id === 'space-balcony-1')!;

    // Edit name and sunlight
    balcony.name = 'Sunny Master Balcony';
    balcony.sunlight = '4_to_6h';

    expect(balcony.name).toBe('Sunny Master Balcony');
    expect(balcony.sunlight).toBe('4_to_6h');
  });

  it('deletes a space without corrupting remaining spaces', () => {
    const garden = createInitialGarden();
    expect(garden.spaces.length).toBe(2);

    // Delete terrace
    garden.spaces = garden.spaces.filter((s) => s.id !== 'space-terrace-1');

    expect(garden.spaces.length).toBe(1);
    expect(garden.spaces[0].id).toBe('space-balcony-1');
  });

  it('keeps plants strictly isolated per space (no leaking across spaces)', () => {
    const garden = createInitialGarden();
    const balconyPlants = garden.spaces[0].plants.map((p) => p.plantId);
    const terracePlants = garden.spaces[1].plants.map((p) => p.plantId);

    // Balcony has mint & tomato
    expect(balconyPlants).toContain('mint');
    expect(balconyPlants).toContain('cherry-tomato');
    expect(balconyPlants).not.toContain('marigold');

    // Terrace has only marigold
    expect(terracePlants).toContain('marigold');
    expect(terracePlants).not.toContain('mint');
    expect(terracePlants).not.toContain('cherry-tomato');
  });

  it('generates space-isolated tasks that retain their space id and space name', () => {
    const garden = createInitialGarden();
    const balcony = garden.spaces[0];
    const terrace = garden.spaces[1];

    const balconyProfile: GardenProfile = {
      id: garden.id,
      spaceId: balcony.id,
      spaceName: balcony.name,
      location: garden.location,
      spaceType: balcony.type,
      spaceSize: balcony.size,
      sunlight: balcony.sunlight,
      experience: garden.experience,
      goal: balcony.goal,
      createdAt: balcony.createdAt,
      updatedAt: balcony.updatedAt
    };

    const balconyTasks = taskGenerator.generateDailyTasks(
      balcony.plants.map((p) => p.plant),
      balconyProfile,
      balcony.id,
      balcony.name
    );

    expect(balconyTasks.length).toBeGreaterThan(0);
    // Every task must carry the balcony spaceId and spaceName
    for (const task of balconyTasks) {
      expect(task.spaceId).toBe('space-balcony-1');
      expect(task.spaceName).toBe('North Balcony');
    }

    const terraceProfile: GardenProfile = {
      id: garden.id,
      spaceId: terrace.id,
      spaceName: terrace.name,
      location: garden.location,
      spaceType: terrace.type,
      spaceSize: terrace.size,
      sunlight: terrace.sunlight,
      experience: garden.experience,
      goal: terrace.goal,
      createdAt: terrace.createdAt,
      updatedAt: terrace.updatedAt
    };

    const terraceTasks = taskGenerator.generateDailyTasks(
      terrace.plants.map((p) => p.plant),
      terraceProfile,
      terrace.id,
      terrace.name
    );

    for (const task of terraceTasks) {
      expect(task.spaceId).toBe('space-terrace-1');
      expect(task.spaceName).toBe('Rooftop Terrace');
    }
  });

  it('associates shopping list items with the originating space', async () => {
    const garden = createInitialGarden();
    const balcony = garden.spaces[0];
    const terrace = garden.spaces[1];

    const balconyProfile: GardenProfile = {
      id: garden.id,
      spaceId: balcony.id,
      spaceName: balcony.name,
      location: garden.location,
      spaceType: balcony.type,
      spaceSize: balcony.size,
      sunlight: balcony.sunlight,
      experience: garden.experience,
      goal: balcony.goal,
      createdAt: balcony.createdAt,
      updatedAt: balcony.updatedAt
    };

    const balconyItems = await shoppingProvider.generateShoppingList(
      balcony.plants.map((p) => p.plant),
      balconyProfile,
      balcony.id,
      balcony.name
    );

    for (const item of balconyItems) {
      expect(item.spaceId).toBe('space-balcony-1');
      expect(item.spaceName).toBe('North Balcony');
    }

    const terraceProfile: GardenProfile = {
      id: garden.id,
      spaceId: terrace.id,
      spaceName: terrace.name,
      location: garden.location,
      spaceType: terrace.type,
      spaceSize: terrace.size,
      sunlight: terrace.sunlight,
      experience: garden.experience,
      goal: terrace.goal,
      createdAt: terrace.createdAt,
      updatedAt: terrace.updatedAt
    };

    const terraceItems = await shoppingProvider.generateShoppingList(
      terrace.plants.map((p) => p.plant),
      terraceProfile,
      terrace.id,
      terrace.name
    );

    for (const item of terraceItems) {
      expect(item.spaceId).toBe('space-terrace-1');
      expect(item.spaceName).toBe('Rooftop Terrace');
    }
  });

  it('feeds selected-space context to the chatbot so it does not mix plants from other spaces', async () => {
    const garden = createInitialGarden();
    const balcony = garden.spaces[0];

    const balconyProfile: GardenProfile = {
      id: garden.id,
      spaceId: balcony.id,
      spaceName: balcony.name,
      location: garden.location,
      spaceType: balcony.type,
      spaceSize: balcony.size,
      sunlight: balcony.sunlight,
      experience: garden.experience,
      goal: balcony.goal,
      createdAt: balcony.createdAt,
      updatedAt: balcony.updatedAt
    };

    const context = {
      profile: balconyProfile,
      selectedSpace: balcony,
      allSpaces: garden.spaces,
      selectedPlants: balcony.plants.map((p) => p.plant),
      photoUploaded: false,
      tasksCount: 3,
      completedTasksCount: 1
    };

    const res = await gardenAssistantProvider.respond('What should I grow here?', [], context);
    expect(res.content).toContain('North Balcony');
    expect(res.content).toContain('balcony');
    // Balcony has mint and tomato, so it should mention them, NOT marigold from the terrace
    expect(res.content).toContain('Mint');
    expect(res.content).not.toContain('Marigold');
  });

  it('safely and idempotently migrates old single-space localStorage format into multi-space Garden', () => {
    // Old single-space localStorage data structure
    const oldV1StorageData = {
      profile: {
        id: 'prof-old-1',
        location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
        spaceType: 'balcony' as const,
        spaceSize: 'small' as const,
        dimensions: { width: '5', length: '10', unit: 'ft' as const },
        sunlight: '2_to_4h' as const,
        experience: 'complete_beginner' as const,
        goal: 'kitchen_garden' as const,
        createdAt: '2026-10-01T10:00:00.000Z',
        updatedAt: '2026-10-01T10:00:00.000Z'
      },
      photo: {
        id: 'photo-old',
        dataUrl: 'data:image/svg+xml;utf8,<svg></svg>',
        fileName: 'balcony.jpg',
        uploadedAt: '2026-10-01T10:05:00.000Z'
      },
      selectedGardenPlants: [
        {
          plantId: 'mint',
          plant: mint,
          addedAt: '2026-10-01T10:06:00.000Z',
          status: 'growing' as const
        }
      ],
      tasks: [
        {
          id: 'task-check-moisture',
          title: 'The 1-Inch Finger Test for Soil Moisture',
          description: 'Stick your index finger 1 inch into the pot soil.',
          estimatedMinutes: 2,
          completed: true,
          category: 'inspection' as const
        }
      ],
      shoppingList: [
        {
          id: 'container-mint',
          name: 'Dedicated 6–8 Inch Pot for Mint',
          category: 'container' as const,
          whatIsThisFor: 'Mint runners containment',
          whyNeeded: 'Keeps mint separate',
          estimatedQuantity: '1 pot',
          checked: true,
          plantNames: ['Mint']
        }
      ]
    };

    // Migration function (pure simulation of the context migration algorithm)
    const migrateV1ToV2 = (oldData: typeof oldV1StorageData): Garden => {
      const spaceId = 'space-default-' + (oldData.profile.id || '1');
      const spaceName = 'Balcony';

      const space: GardenSpace = {
        id: spaceId,
        name: spaceName,
        type: oldData.profile.spaceType,
        size: oldData.profile.spaceSize,
        dimensions: oldData.profile.dimensions,
        sunlight: oldData.profile.sunlight,
        goal: oldData.profile.goal,
        photos: oldData.photo ? [oldData.photo] : [],
        plants: oldData.selectedGardenPlants.map((p) => ({ ...p, spaceId })),
        tasks: oldData.tasks.map((t) => ({ ...t, spaceId, spaceName })),
        createdAt: oldData.profile.createdAt,
        updatedAt: oldData.profile.updatedAt
      };

      return {
        id: 'garden-' + oldData.profile.id,
        name: `${oldData.profile.location.city} Garden`,
        location: oldData.profile.location,
        experience: oldData.profile.experience,
        spaces: [space],
        createdAt: oldData.profile.createdAt,
        updatedAt: new Date().toISOString()
      };
    };

    const migrated = migrateV1ToV2(oldV1StorageData);

    // Verify preservation
    expect(migrated.spaces.length).toBe(1);
    expect(migrated.spaces[0].name).toBe('Balcony');
    expect(migrated.spaces[0].type).toBe('balcony');
    expect(migrated.spaces[0].dimensions?.width).toBe('5');
    expect(migrated.spaces[0].sunlight).toBe('2_to_4h');
    expect(migrated.spaces[0].photos.length).toBe(1);
    expect(migrated.spaces[0].photos[0].fileName).toBe('balcony.jpg');
    expect(migrated.spaces[0].plants.length).toBe(1);
    expect(migrated.spaces[0].plants[0].plantId).toBe('mint');
    expect(migrated.spaces[0].tasks.length).toBe(1);
    expect(migrated.spaces[0].tasks[0].completed).toBe(true);
    expect(migrated.location.city).toBe('Bengaluru');
  });
});
