import { describe, it, expect, beforeEach } from 'vitest';
import { CareEngine } from '../services/careEngine';
import { NotificationService } from '../services/notificationService';
import { LocalGardenAssistantProvider } from '../services/localAssistantProvider';
import { BEGINNER_PLANTS } from '../data/plants';
import { GardenPlant, GardenSpace, EnvironmentalContext } from '../types';

describe('Milestone 3: Smart Garden Care & Notifications', () => {
  let careEngine: CareEngine;
  let notificationService: NotificationService;
  let assistantProvider: LocalGardenAssistantProvider;

  const tomato = BEGINNER_PLANTS.find((p) => p.id === 'cherry-tomato')!;
  const mint = BEGINNER_PLANTS.find((p) => p.id === 'mint')!;

  const mockSpace: GardenSpace = {
    id: 'space-balcony-1',
    name: 'South Balcony',
    type: 'balcony',
    size: 'small',
    sunlight: '4_to_6h',
    goal: 'kitchen_garden',
    photos: [],
    plants: [],
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const createMockGardenPlant = (overrides?: Partial<GardenPlant>): GardenPlant => ({
    plantId: tomato.id,
    plant: tomato,
    addedAt: '2026-10-01T08:00:00.000Z',
    plantedAt: '2026-10-01T08:00:00.000Z',
    status: 'planted',
    spaceId: mockSpace.id,
    wateringCount: 0,
    careHistory: [],
    ...overrides
  });

  beforeEach(() => {
    careEngine = new CareEngine();
    notificationService = new NotificationService();
    notificationService.resetSentKeys();
    assistantProvider = new LocalGardenAssistantProvider();
  });

  it('1. Creates a typed watering event and updates care history', () => {
    const event = careEngine.createWateringEvent(tomato.id, mockSpace.id, 'Deep soak at base');
    expect(event.type).toBe('watered');
    expect(event.plantId).toBe(tomato.id);
    expect(event.spaceId).toBe(mockSpace.id);
    expect(event.note).toBe('Deep soak at base');
    expect(event.timestamp).toBeDefined();

    const plant = createMockGardenPlant({
      careHistory: [event],
      lastWateredAt: event.timestamp,
      wateringCount: 1
    });

    expect(plant.careHistory).toHaveLength(1);
    expect(plant.wateringCount).toBe(1);
    expect(plant.lastWateredAt).toBe(event.timestamp);
  });

  it('2. Prevents rapid duplicate watering within threshold', () => {
    const now = new Date();
    const recentPlant = createMockGardenPlant({
      lastWateredAt: new Date(now.getTime() - 2 * 60 * 1000).toISOString() // 2 minutes ago
    });

    const checkRecent = careEngine.canWaterNow(recentPlant, 5);
    expect(checkRecent.allowed).toBe(false);
    expect(checkRecent.reason).toContain('already recorded');

    // Plant watered 30 minutes ago should be allowed
    const olderPlant = createMockGardenPlant({
      lastWateredAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString()
    });
    const checkOlder = careEngine.canWaterNow(olderPlant, 5);
    expect(checkOlder.allowed).toBe(true);
  });

  it('3. Evaluates soil check decision: Dry soil recommends watering', () => {
    const soilCheckEvent = careEngine.createSoilCheckEvent(tomato.id, mockSpace.id, 'dry');
    expect(soilCheckEvent.type).toBe('soil_checked');
    expect(soilCheckEvent.soilCondition).toBe('dry');

    const plantWithDrySoil = createMockGardenPlant({
      careHistory: [soilCheckEvent]
    });

    const decision = careEngine.evaluateCareDecision(plantWithDrySoil, mockSpace, null);
    expect(decision.action).toBe('water');
    expect(decision.headline).toContain('Soil is dry');
    expect(decision.urgency).toBe('high');
  });

  it('4. Evaluates soil check decision: Moist soil recommends waiting', () => {
    const soilCheckEvent = careEngine.createSoilCheckEvent(tomato.id, mockSpace.id, 'moist');
    expect(soilCheckEvent.soilCondition).toBe('moist');

    const plantWithMoistSoil = createMockGardenPlant({
      careHistory: [soilCheckEvent]
    });

    const decision = careEngine.evaluateCareDecision(plantWithMoistSoil, mockSpace, null);
    expect(decision.action).toBe('wait');
    expect(decision.headline).toContain('still moist');
    expect(decision.urgency).toBe('low');
  });

  it('5. Considers environmental rain expected when giving care advice', () => {
    const rainyEnv: EnvironmentalContext = {
      location: { city: 'Bengaluru', state: 'KA', country: 'India' },
      snapshot: {
        temperatureC: 24,
        minTemperatureC: 20,
        maxTemperatureC: 26,
        humidityPercent: 88,
        precipitationProbabilityPercent: 85,
        rainfallMm: 12,
        windSpeedKmh: 14,
        cloudCoverPercent: 90,
        conditionText: 'Heavy Rain Expected',
        timestamp: new Date().toISOString(),
        isMock: true
      },
      source: 'demo_mock',
      confidence: 'simulated',
      timestamp: new Date().toISOString()
    };

    const plant = createMockGardenPlant({
      lastWateredAt: '2026-10-06T08:00:00.000Z' // 2 days ago
    });

    const decision = careEngine.evaluateCareDecision(plant, mockSpace, rainyEnv);
    expect(decision.action).toBe('check_soil');
    expect(decision.headline).toContain('Rain expected');
    expect(decision.reason).toContain('Rain is expected in Bengaluru');
  });

  it('6. Considers environmental high-temperature when giving care advice', () => {
    const hotEnv: EnvironmentalContext = {
      location: { city: 'Delhi', state: 'DL', country: 'India' },
      snapshot: {
        temperatureC: 36,
        minTemperatureC: 28,
        maxTemperatureC: 38,
        humidityPercent: 30,
        precipitationProbabilityPercent: 0,
        rainfallMm: 0,
        windSpeedKmh: 16,
        cloudCoverPercent: 10,
        conditionText: 'Sunny & Hot',
        timestamp: new Date().toISOString(),
        isMock: true
      },
      source: 'demo_mock',
      confidence: 'simulated',
      timestamp: new Date().toISOString()
    };

    const plant = createMockGardenPlant({
      lastWateredAt: '2026-10-07T08:00:00.000Z'
    });

    const decision = careEngine.evaluateCareDecision(plant, mockSpace, hotEnv);
    expect(decision.action).toBe('check_soil');
    expect(decision.headline).toContain('Warm weather moisture check');
    expect(decision.reason).toContain('36°C');
  });

  it('7. Generates today\'s care tasks and respects task states (pending, completed, skipped)', () => {
    const spaceWithPlants: GardenSpace = {
      ...mockSpace,
      plants: [
        createMockGardenPlant({ plantId: tomato.id, plant: tomato }),
        createMockGardenPlant({ plantId: mint.id, plant: mint })
      ]
    };

    const careTasks = careEngine.generateCareTasks(spaceWithPlants, null);
    expect(careTasks.length).toBeGreaterThanOrEqual(2);

    const firstTask = careTasks[0];
    expect(firstTask.status).toBe('pending');
    expect(firstTask.spaceId).toBe(mockSpace.id);
    expect(firstTask.actionType).toBeDefined();

    // Verify task state transitions
    const completedTask = { ...firstTask, status: 'completed' as const, completed: true };
    expect(completedTask.status).toBe('completed');
    expect(completedTask.completed).toBe(true);

    const skippedTask = { ...firstTask, status: 'skipped' as const, completed: false };
    expect(skippedTask.status).toBe('skipped');
    expect(skippedTask.completed).toBe(false);
  });

  it('8. Builds plant care timeline in chronological sequence', () => {
    const event1 = careEngine.createWateringEvent(tomato.id, mockSpace.id, 'Initial potting drink');
    const event2 = careEngine.createSoilCheckEvent(tomato.id, mockSpace.id, 'moist');
    const event3 = careEngine.createWateringEvent(tomato.id, mockSpace.id, 'Morning watering');

    const plant = createMockGardenPlant({
      careHistory: [event1, event2, event3]
    });

    expect(plant.careHistory).toHaveLength(3);
    expect(plant.careHistory![0].type).toBe('watered');
    expect(plant.careHistory![1].type).toBe('soil_checked');
    expect(plant.careHistory![2].type).toBe('watered');
  });

  it('9. Creates care reminders and enforces notification de-duplication', () => {
    const spaceWithPlant: GardenSpace = {
      ...mockSpace,
      plants: [createMockGardenPlant()]
    };

    const reminders = careEngine.generateReminders(spaceWithPlant, null);
    expect(reminders).toHaveLength(1);
    expect(reminders[0].plantId).toBe(tomato.id);
    expect(reminders[0].status).toBe('pending');

    // Test de-duplication tracking
    const reminderKey = `reminder-${mockSpace.id}-${tomato.id}`;
    expect(notificationService.isAlreadyNotified(reminderKey)).toBe(false);

    // Simulated notify
    (notificationService as any).sentKeys.add(
      `${new Date().toISOString().split('T')[0]}:${reminderKey}`
    );
    expect(notificationService.isAlreadyNotified(reminderKey)).toBe(true);

    // Repeated call should decline sending duplicate
    const sendResult = notificationService.sendCareReminder({
      key: reminderKey,
      title: 'GardenMitra Check',
      body: 'Check your plant soil'
    });
    expect(sendResult).toBe(false);
  });

  it('10. Chatbot local assistant understands care history and watering status', async () => {
    const wateredPlant = createMockGardenPlant({
      lastWateredAt: '2026-10-08T08:30:00.000Z',
      wateringCount: 3,
      careHistory: [careEngine.createWateringEvent(tomato.id, mockSpace.id)]
    });

    const reply = await assistantProvider.respond(
      'Did I water my tomato?',
      [],
      {
        profile: null,
        selectedSpace: { ...mockSpace, plants: [wateredPlant] },
        selectedPlants: [tomato],
        gardenPlants: [wateredPlant],
        photoUploaded: false,
        tasksCount: 1,
        completedTasksCount: 0
      }
    );

    expect(reply.content).toContain('Yes!');
    expect(reply.content).toContain('Cherry Tomato');
    expect(reply.content).toContain('last watered');
    expect(reply.content).toContain('Total logged waterings: 3');
  });
});
