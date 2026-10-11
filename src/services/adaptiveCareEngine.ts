import {
  GardenPlant,
  GardenSpace,
  EnvironmentalObservation,
  EnvironmentalContext,
  CareRecommendation,
  AdaptiveCareTask
} from '../types';

export class AdaptiveCareEngine {
  /**
   * Generates deterministic, explainable, weather-aware care recommendations for all plants in a space.
   */
  generateRecommendations(
    space: GardenSpace,
    plants: GardenPlant[],
    observations: EnvironmentalObservation[],
    currentDate: Date = new Date(),
    environmentalContext?: EnvironmentalContext | null
  ): CareRecommendation[] {
    const recommendations: CareRecommendation[] = [];
    const nowMs = currentDate.getTime();

    // 1. Determine Space Exposure
    const userConfirmExposure = space.userObservations?.find((o) => o.category === 'rain_exposure');
    const isShelteredByProperty =
      space.isSheltered === true ||
      userConfirmExposure?.value === 'sheltered' ||
      userConfirmExposure?.value === 'covered';
    const isIndoor = space.type === 'indoor' || space.type === 'windowsill';
    const spaceExposure: 'exposed' | 'sheltered' | 'indoor' = isIndoor
      ? 'indoor'
      : isShelteredByProperty
      ? 'sheltered'
      : 'exposed';
    const isOutdoorExposed = spaceExposure === 'exposed';

    // 2. Filter Valid Telemetry for this Space
    const spaceObs = observations.filter((o) => o.spaceId === space.id && o.dataQuality === 'valid');

    const latestSoilMoisture = spaceObs
      .filter((o) => o.type === 'soil_moisture')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    const latestAirTemp = spaceObs
      .filter((o) => o.type === 'air_temperature')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    const soilMoistureAgeHours = latestSoilMoisture
      ? (nowMs - new Date(latestSoilMoisture.timestamp).getTime()) / (1000 * 3600)
      : null;
    const isSoilMoistureStale = soilMoistureAgeHours !== null && soilMoistureAgeHours > 24;

    // 3. Normalized Weather Intelligence (Milestone 16)
    const weatherValid = !!environmentalContext && !environmentalContext.isUnavailable;
    const weatherSnapshot = weatherValid ? environmentalContext!.snapshot : null;
    const forecast = weatherValid ? environmentalContext!.forecast : null;

    const weatherTempC = weatherSnapshot ? weatherSnapshot.temperatureC : undefined;
    const maxTempC = weatherSnapshot ? weatherSnapshot.maxTemperatureC : undefined;
    const minTempC = weatherSnapshot ? weatherSnapshot.minTemperatureC : undefined;
    const precipProb = weatherSnapshot
      ? weatherSnapshot.precipitationProbabilityPercent
      : (forecast?.daily?.[0]?.precipitationProbPercent ?? 0);
    const forecastRainfallMm =
      weatherSnapshot?.forecastRainfallMm ?? (forecast?.daily?.[0]?.rainfallMm ?? 0);
    const observedRainfallMm =
      weatherSnapshot?.observedRainfallMm ?? (weatherSnapshot?.rainfallMm ?? 0);
    const severeAlert = weatherSnapshot?.severeWeatherAlert;

    // Distinguish forecast from observed rainfall
    const isRainForecast = weatherValid && (precipProb >= 60 || forecastRainfallMm >= 3);
    const isRainObserved = weatherValid && observedRainfallMm >= 2;

    plants.forEach((gp) => {
      const plant = gp.plant;
      const targetPlantInstanceId = gp.instanceId || `inst-${gp.plantId}`;
      const plantProvenance = plant.dataQuality?.sources?.[0]?.name || 'Botanical Knowledge Base';

      // Last recorded watering or soil check
      const lastWateredAt = gp.lastWateredAt ? new Date(gp.lastWateredAt).getTime() : null;
      const hoursSinceWater = lastWateredAt ? (nowMs - lastWateredAt) / (1000 * 60 * 60) : null;

      const recentSoilChecks = (gp.careHistory || [])
        .filter((c) => c.type === 'soil_checked')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const lastSoilCheck = recentSoilChecks[0];
      const hoursSinceSoilCheck = lastSoilCheck
        ? (nowMs - new Date(lastSoilCheck.timestamp).getTime()) / (1000 * 60 * 60)
        : null;

      // Effective temperature (sensor takes precedence if fresh < 6h, else weather)
      const effectiveAirTemp =
        latestAirTemp && (nowMs - new Date(latestAirTemp.timestamp).getTime()) < 6 * 3600 * 1000
          ? latestAirTemp.value
          : weatherTempC;

      // Plant-specific temperature requirements from M11 catalog
      const plantMaxTemp =
        plant.temperatureRequirements?.maxC ?? (plant.category === 'succulents' ? 40 : 35);
      const plantMinTemp =
        plant.temperatureRequirements?.minC ?? (plant.category === 'indoor' ? 14 : 8);

      // ---------------------------------------------------------
      // WATERING & PHYSICAL SOIL MOISTURE INTELLIGENCE
      // ---------------------------------------------------------

      // Stale Sensor Telemetry Check:
      // "A stale soil-moisture reading must not be presented as a current measurement."
      if (isSoilMoistureStale && latestSoilMoisture) {
        recommendations.push({
          id: `rec-stale-sensor-${targetPlantInstanceId}`,
          spaceId: space.id,
          targetPlantInstanceId,
          plantId: gp.plantId,
          category: 'inspection',
          actionTitle: `Perform manual soil check for ${plant.name}`,
          actionInstructions: 'Push your index finger 1 inch into the potting mix. Do not rely on old telemetry.',
          reason: `The soil-moisture reading (${latestSoilMoisture.value}%) is older than 24 hours (${Math.round(soilMoistureAgeHours || 0)}h old), so it may not represent current conditions. Check the soil before deciding whether to water.`,
          supportingObservationIds: [latestSoilMoisture.id],
          referencedRequirement: {
            source: plantProvenance,
            requirement: plant.wateringText || 'Check topsoil before watering.'
          },
          evidenceQuality: 'insufficient',
          classification: 'needs_inspection',
          priority: 'normal',
          missingEvidence: ['Fresh soil moisture reading (< 24h old)'],
          evidenceLimitations: ['Last sensor telemetry is older than 24 hours.'],
          spaceExposure,
          createdAt: currentDate.toISOString(),
          status: 'active'
        });
      }
      // RULE A: Sensor shows soil moisture is high (> 60%) or recent check found moist soil within 18h
      else if (
        (latestSoilMoisture &&
          !isSoilMoistureStale &&
          latestSoilMoisture.value >= 60 &&
          nowMs - new Date(latestSoilMoisture.timestamp).getTime() < 18 * 3600 * 1000) ||
        (lastSoilCheck &&
          lastSoilCheck.soilCondition === 'moist' &&
          hoursSinceSoilCheck !== null &&
          hoursSinceSoilCheck < 18)
      ) {
        recommendations.push({
          id: `rec-water-wait-${targetPlantInstanceId}`,
          spaceId: space.id,
          targetPlantInstanceId,
          plantId: gp.plantId,
          category: 'watering',
          actionTitle: `Hold off watering ${plant.name}`,
          actionInstructions: 'Soil currently has sufficient moisture. Do not add water today to prevent root suffocation.',
          reason:
            latestSoilMoisture && latestSoilMoisture.value >= 60
              ? `Active sensor measured ${latestSoilMoisture.value}% soil moisture. Roots need aeration between drinks.`
              : `Finger check ${Math.round(hoursSinceSoilCheck || 0)}h ago confirmed moist soil at 1 inch depth.`,
          supportingObservationIds: latestSoilMoisture ? [latestSoilMoisture.id] : [],
          supportingCareEventIds: lastSoilCheck ? [lastSoilCheck.id] : [],
          referencedRequirement: {
            source: plantProvenance,
            requirement: plant.wateringText || 'Allow top inch to dry between waterings.'
          },
          evidenceQuality: 'high',
          classification: 'no_action_needed',
          priority: 'low',
          spaceExposure,
          createdAt: currentDate.toISOString(),
          status: 'active'
        });
      }
      // RULE B: Low soil moisture confirmed (< 25%) or finger check confirmed dry within 12h
      else if (
        (latestSoilMoisture &&
          !isSoilMoistureStale &&
          latestSoilMoisture.value < 25 &&
          nowMs - new Date(latestSoilMoisture.timestamp).getTime() < 12 * 3600 * 1000) ||
        (lastSoilCheck &&
          lastSoilCheck.soilCondition === 'dry' &&
          hoursSinceSoilCheck !== null &&
          hoursSinceSoilCheck < 12)
      ) {
        // Sub-case: Outdoor exposed space WITH rain forecast
        if (isOutdoorExposed && isRainForecast) {
          recommendations.push({
            id: `rec-water-rain-check-${targetPlantInstanceId}`,
            spaceId: space.id,
            targetPlantInstanceId,
            plantId: gp.plantId,
            category: 'inspection',
            actionTitle: `Check root-zone moisture for ${plant.name} before rain`,
            actionInstructions: `Rain is forecast (~${forecastRainfallMm}mm, ${precipProb}% probability) for this exposed space. Check root zone depth; forecast rain does not guarantee adequate root-zone moisture for parched soil.`,
            reason: `Rain is forecast this afternoon/evening, and this plant is in an exposed outdoor space (${space.name}). Check the soil before watering; forecast rain does not guarantee adequate root-zone moisture.`,
            supportingObservationIds: latestSoilMoisture ? [latestSoilMoisture.id] : [],
            supportingCareEventIds: lastSoilCheck ? [lastSoilCheck.id] : [],
            referencedRequirement: {
              source: plantProvenance,
              requirement: plant.wateringText || 'Maintain balanced root-zone hydration.'
            },
            evidenceQuality: 'high',
            classification: 'needs_inspection',
            priority: 'high',
            weatherReason: `Forecast rain (~${forecastRainfallMm}mm, ${precipProb}%) in exposed outdoor space.`,
            reevaluateAt: new Date(nowMs + 6 * 3600 * 1000).toISOString(),
            spaceExposure,
            createdAt: currentDate.toISOString(),
            status: 'active'
          });
        } else {
          // Standard watering due (sheltered / indoor or no rain forecast)
          const shelteredRainNote =
            !isOutdoorExposed && isRainForecast
              ? ` (Note: ${space.name} is sheltered/indoor; outdoor forecast rain will not moisten this pot.)`
              : '';

          recommendations.push({
            id: `rec-water-due-${targetPlantInstanceId}`,
            spaceId: space.id,
            targetPlantInstanceId,
            plantId: gp.plantId,
            category: 'watering',
            actionTitle: `Water ${plant.name} at the base`,
            actionInstructions: `Apply water gently and directly to the potting mix until slight runoff appears from the bottom drainage holes.${shelteredRainNote}`,
            reason:
              latestSoilMoisture && latestSoilMoisture.value < 25
                ? `Measured soil moisture is critically low at ${latestSoilMoisture.value}%.${shelteredRainNote}`
                : `Finger test confirmed dry soil at 1 inch depth.${shelteredRainNote}`,
            supportingObservationIds: latestSoilMoisture ? [latestSoilMoisture.id] : [],
            supportingCareEventIds: lastSoilCheck ? [lastSoilCheck.id] : [],
            referencedRequirement: {
              source: plantProvenance,
              requirement: plant.wateringText || 'Thorough base watering when topsoil is dry.'
            },
            evidenceQuality: 'high',
            classification: 'recommended',
            priority: 'high',
            suggestedTimeWindow: 'Morning (before 10 AM) or late afternoon',
            spaceExposure,
            createdAt: currentDate.toISOString(),
            status: 'active'
          });
        }
      }
      // RULE C: Rain Forecast for Exposed Outdoor Space with moderate/unmeasured soil moisture -> Postpone watering
      else if (isOutdoorExposed && isRainForecast) {
        recommendations.push({
          id: `rec-water-postpone-rain-${targetPlantInstanceId}`,
          spaceId: space.id,
          targetPlantInstanceId,
          plantId: gp.plantId,
          category: 'watering',
          actionTitle: `Hold off watering ${plant.name} (Rain Forecast)`,
          actionInstructions: `Rain is forecast (~${forecastRainfallMm}mm, ${precipProb}% probability). Pots in ${space.name} are open to the sky and will receive natural rainfall. Check soil after the shower passes.`,
          reason: `Rain is forecast (${precipProb}% probability, ~${forecastRainfallMm}mm) and this plant is in an exposed outdoor space (${space.name}). Postponing scheduled watering; check soil after the rain passes.`,
          supportingObservationIds: [],
          referencedRequirement: {
            source: plantProvenance,
            requirement: plant.wateringText || 'Allow nature to water when outdoor rainfall occurs.'
          },
          evidenceQuality: 'moderate',
          classification: 'no_action_needed',
          priority: 'low',
          isPostponedOrSuppressed: true,
          weatherReason: `Rain forecast (${precipProb}%, ~${forecastRainfallMm}mm) for exposed space. Reevaluating after rainfall.`,
          reevaluateAt: new Date(nowMs + 8 * 3600 * 1000).toISOString(),
          spaceExposure,
          createdAt: currentDate.toISOString(),
          status: 'active'
        });
      }
      // RULE D: Observed Rain in Exposed Space -> Verify root penetration
      else if (isOutdoorExposed && isRainObserved) {
        recommendations.push({
          id: `rec-rain-observed-check-${targetPlantInstanceId}`,
          spaceId: space.id,
          targetPlantInstanceId,
          plantId: gp.plantId,
          category: 'inspection',
          actionTitle: `Check rain penetration for ${plant.name}`,
          actionInstructions: `~${observedRainfallMm}mm rainfall was observed. Push your finger 1 inch into the pot to confirm rainwater penetrated into the root zone.`,
          reason: `Observed outdoor rain (${observedRainfallMm}mm) may wet surface foliage without soaking container root zones.`,
          supportingObservationIds: [],
          referencedRequirement: {
            source: plantProvenance,
            requirement: plant.wateringText || 'Verify root-zone moisture after rain showers.'
          },
          evidenceQuality: 'high',
          classification: 'needs_inspection',
          priority: 'normal',
          weatherReason: `Observed rain: ${observedRainfallMm}mm.`,
          reevaluateAt: new Date(nowMs + 12 * 3600 * 1000).toISOString(),
          spaceExposure,
          createdAt: currentDate.toISOString(),
          status: 'active'
        });
      }
      // RULE E: High Heat Environment -> Hot weather alone must NOT trigger watering when soil moisture is adequate
      else if (
        effectiveAirTemp !== undefined &&
        (effectiveAirTemp >= 33 || effectiveAirTemp >= plantMaxTemp || (maxTempC !== undefined && maxTempC >= plantMaxTemp))
      ) {
        const isMoistVerified =
          (latestSoilMoisture &&
            !isSoilMoistureStale &&
            latestSoilMoisture.value >= 45 &&
            nowMs - new Date(latestSoilMoisture.timestamp).getTime() < 18 * 3600 * 1000) ||
          (lastSoilCheck &&
            lastSoilCheck.soilCondition === 'moist' &&
            hoursSinceSoilCheck !== null &&
            hoursSinceSoilCheck < 18);

        if (isMoistVerified) {
          // Adequate moisture -> Recommend shade/mulch, NEVER overwatering
          recommendations.push({
            id: `rec-heat-shade-${targetPlantInstanceId}`,
            spaceId: space.id,
            targetPlantInstanceId,
            plantId: gp.plantId,
            category: 'protection',
            actionTitle: `Provide afternoon shade for ${plant.name} (Heat Protection)`,
            actionInstructions: `Move container away from reflective walls or place under 30-50% shade cloth. Soil moisture is currently adequate (${
              latestSoilMoisture ? `${latestSoilMoisture.value}%` : 'moist to touch'
            }), so do NOT add water; overwatering in high heat causes root suffocation.`,
            reason: `Temperature (${effectiveAirTemp}°C, forecast high ${
              maxTempC ?? effectiveAirTemp
            }°C) exceeds ${plant.name}'s optimal ceiling (${plantMaxTemp}°C). Soil moisture is adequate, so do not overwater. Protect foliage from sunburn.`,
            supportingObservationIds: latestAirTemp ? [latestAirTemp.id] : [],
            referencedRequirement: {
              source: plantProvenance,
              requirement: `Temperature ceiling: ${plantMaxTemp}°C. Optimal range: ${
                plant.temperatureRequirements?.optimalMinC ?? 18
              }–${plant.temperatureRequirements?.optimalMaxC ?? 30}°C.`
            },
            evidenceQuality: 'high',
            classification: 'recommended',
            priority: 'high',
            suggestedTimeWindow: 'Midday (11 AM – 3 PM)',
            spaceExposure,
            createdAt: currentDate.toISOString(),
            status: 'active'
          });
        } else {
          // Soil moisture unverified or dry -> Inspect soil moisture
          recommendations.push({
            id: `rec-heat-check-${targetPlantInstanceId}`,
            spaceId: space.id,
            targetPlantInstanceId,
            plantId: gp.plantId,
            category: 'inspection',
            actionTitle: `Test soil moisture for ${plant.name} (Heat Alert)`,
            actionInstructions:
              'Push your index finger 1 inch into the pot mix. Container volumes dry rapidly in hot weather.',
            reason: `High ambient temperature (${effectiveAirTemp}°C) accelerates container evaporation against ${plant.name}'s limit (${plantMaxTemp}°C).`,
            supportingObservationIds: latestAirTemp ? [latestAirTemp.id] : [],
            referencedRequirement: {
              source: plantProvenance,
              requirement: `Temperature ceiling: ${plantMaxTemp}°C.`
            },
            evidenceQuality: 'high',
            classification: 'needs_inspection',
            priority: 'high',
            suggestedTimeWindow: 'Morning inspection (before 10 AM)',
            spaceExposure,
            createdAt: currentDate.toISOString(),
            status: 'active'
          });
        }
      }
      // RULE F: Cold & Frost Protection -> Plant-specific minimum threshold
      else if (
        effectiveAirTemp !== undefined &&
        (effectiveAirTemp <= plantMinTemp || (minTempC !== undefined && minTempC <= plantMinTemp))
      ) {
        recommendations.push({
          id: `rec-cold-protection-${targetPlantInstanceId}`,
          spaceId: space.id,
          targetPlantInstanceId,
          plantId: gp.plantId,
          category: 'protection',
          actionTitle: `Protect ${plant.name} from cold temperatures`,
          actionInstructions: `Forecast low (${
            minTempC ?? effectiveAirTemp
          }°C) approaches or falls below ${plant.name}'s cold threshold (${plantMinTemp}°C). Move pot indoors or cover with frost cloth before nightfall.`,
          reason: `Temperature (${effectiveAirTemp}°C, forecast low ${
            minTempC ?? effectiveAirTemp
          }°C) is near or below ${plant.name}'s minimum tolerance (${plantMinTemp}°C).`,
          supportingObservationIds: latestAirTemp ? [latestAirTemp.id] : [],
          referencedRequirement: {
            source: plantProvenance,
            requirement: `Minimum temperature tolerance: ${plantMinTemp}°C.`
          },
          evidenceQuality: 'high',
          classification: 'recommended',
          priority: 'high',
          suggestedTimeWindow: 'Late afternoon before sunset',
          spaceExposure,
          createdAt: currentDate.toISOString(),
          status: 'active'
        });
      }
      // RULE G: High Winds Alert for Outdoor Exposed spaces
      else if (isOutdoorExposed && weatherSnapshot && weatherSnapshot.windSpeedKmh >= 35) {
        recommendations.push({
          id: `rec-wind-protection-${targetPlantInstanceId}`,
          spaceId: space.id,
          targetPlantInstanceId,
          plantId: gp.plantId,
          category: 'protection',
          actionTitle: `Secure ${plant.name} against high winds`,
          actionInstructions: `Wind speeds of ${weatherSnapshot.windSpeedKmh} km/h are forecast. Check bamboo stakes and move lightweight pots closer to an inner wall.`,
          reason: `Gusty wind conditions (${weatherSnapshot.windSpeedKmh} km/h) in exposed outdoor space (${space.name}) risk snapping stems or tipping containers.`,
          supportingObservationIds: [],
          referencedRequirement: {
            source: plantProvenance,
            requirement: 'Protect top-heavy stems from wind shearing.'
          },
          evidenceQuality: 'moderate',
          classification: 'recommended',
          priority: 'high',
          spaceExposure,
          createdAt: currentDate.toISOString(),
          status: 'active'
        });
      }
      // RULE H: Routine moisture check when no care action logged in >48h and no sensor
      else if (hoursSinceWater === null || hoursSinceWater > 48) {
        recommendations.push({
          id: `rec-routine-check-${targetPlantInstanceId}`,
          spaceId: space.id,
          targetPlantInstanceId,
          plantId: gp.plantId,
          category: 'inspection',
          actionTitle: `Check soil moisture for ${plant.name}`,
          actionInstructions:
            'Touch the soil 1 inch below surface. Water only if soil feels completely dry to touch.',
          reason:
            hoursSinceWater !== null
              ? `It has been ${Math.round(hoursSinceWater / 24)} days since last logged watering.`
              : 'No prior watering log found for this plant.',
          supportingObservationIds: [],
          referencedRequirement: {
            source: plantProvenance,
            requirement: plant.wateringText || 'Check soil before watering.'
          },
          evidenceQuality: latestSoilMoisture ? 'moderate' : 'insufficient',
          classification: 'needs_inspection',
          priority: 'normal',
          spaceExposure,
          createdAt: currentDate.toISOString(),
          status: 'active'
        });
      }

      // ---------------------------------------------------------
      // LIFECYCLE-SPECIFIC CARE RECOMMENDATIONS
      // ---------------------------------------------------------
      const stage = gp.lifecycleStage || 'vegetative';

      if (stage === 'seedling') {
        recommendations.push({
          id: `rec-seedling-care-${targetPlantInstanceId}`,
          spaceId: space.id,
          targetPlantInstanceId,
          plantId: gp.plantId,
          category: 'inspection',
          actionTitle: `Inspect young seedlings of ${plant.name}`,
          actionInstructions:
            'Check for damping off, gentle bright indirect light, and avoid harsh direct blast of water.',
          reason: `${plant.name} is in fragile seedling stage. Delicate root systems require steady, gentle care.`,
          referencedRequirement: {
            source: plantProvenance,
            requirement: `Germination to seedling transition: ${
              plant.growthMetrics?.germinationDaysMin ?? 7
            }–${plant.growthMetrics?.germinationDaysMax ?? 14} days.`
          },
          evidenceQuality: 'moderate',
          classification: 'recommended',
          priority: 'normal',
          spaceExposure,
          createdAt: currentDate.toISOString(),
          status: 'active'
        });
      } else if (stage === 'flowering' || stage === 'fruiting') {
        const postponeFeedingForRain =
          isOutdoorExposed && isRainForecast && (forecastRainfallMm >= 15 || precipProb >= 80);

        recommendations.push({
          id: `rec-flowering-care-${targetPlantInstanceId}`,
          spaceId: space.id,
          targetPlantInstanceId,
          plantId: gp.plantId,
          category: 'feeding',
          actionTitle: `Support ${stage} stage for ${plant.name}`,
          actionInstructions: postponeFeedingForRain
            ? `Heavy rain forecast (~${forecastRainfallMm}mm). Postpone liquid fertilizing until showers pass to prevent nutrient runoff into drains.`
            : 'Top dress with a handful of well-rotted compost or vermicompost to support bloom and fruit set.',
          reason: postponeFeedingForRain
            ? 'Heavy rainfall will wash away nutrients before roots can absorb them.'
            : `Plant has reached the ${stage} milestone, where energy demands for phosphorus and potassium peak.`,
          referencedRequirement: {
            source: plantProvenance,
            requirement: `Maturity period: ${plant.growthMetrics?.maturityDaysMin ?? 45}–${
              plant.growthMetrics?.maturityDaysMax ?? 75
            } days.`
          },
          evidenceQuality: 'high',
          classification: 'recommended',
          priority: 'normal',
          spaceExposure,
          createdAt: currentDate.toISOString(),
          status: 'active'
        });
      } else if (stage === 'harvest') {
        recommendations.push({
          id: `rec-harvest-milestone-${targetPlantInstanceId}`,
          spaceId: space.id,
          targetPlantInstanceId,
          plantId: gp.plantId,
          category: 'milestone_check',
          actionTitle: `Harvest mature ${plant.name}`,
          actionInstructions:
            'Harvest outer leaves or ripe fruit in the cool morning to enjoy peak freshness and flavor.',
          reason: `${plant.name} has reached its harvest milestone in garden memory.`,
          referencedRequirement: {
            source: plantProvenance,
            requirement: plant.approximateGrowthTime || 'Harvest ready'
          },
          evidenceQuality: 'high',
          classification: 'recommended',
          priority: 'high',
          spaceExposure,
          createdAt: currentDate.toISOString(),
          status: 'active'
        });
      }

      // ---------------------------------------------------------
      // CATALOG-SPECIFIC CARE INSTRUCTIONS
      // ---------------------------------------------------------
      if (plant.careInstructions && plant.careInstructions.length > 0) {
        plant.careInstructions.forEach((inst, idx) => {
          if (inst.category === 'pruning' && stage === 'vegetative') {
            recommendations.push({
              id: `rec-pruning-${targetPlantInstanceId}-${idx}`,
              spaceId: space.id,
              targetPlantInstanceId,
              plantId: gp.plantId,
              category: 'pruning',
              actionTitle: inst.title,
              actionInstructions: inst.instruction,
              reason: `Documented botanical care for ${plant.name} recommends periodic pruning to stimulate healthy bushiness.`,
              referencedRequirement: {
                source: plantProvenance,
                requirement: `Recurrence: every ${inst.frequencyDays || 7} days.`
              },
              evidenceQuality: 'high',
              classification: 'recommended',
              priority: 'low',
              spaceExposure,
              createdAt: currentDate.toISOString(),
              status: 'active'
            });
          }
        });
      }
    });

    // Space-level severe weather alert recommendation if applicable
    if (severeAlert && plants.length > 0) {
      recommendations.push({
        id: `rec-severe-weather-${space.id}-${severeAlert.type}`,
        spaceId: space.id,
        category: 'protection',
        actionTitle: severeAlert.headline,
        actionInstructions: severeAlert.instructions,
        reason: severeAlert.description,
        evidenceQuality: 'high',
        classification: 'recommended',
        priority: 'high',
        weatherAlert: severeAlert,
        weatherReason: severeAlert.headline,
        spaceExposure,
        createdAt: currentDate.toISOString(),
        status: 'active'
      });
    }

    return recommendations;
  }

  /**
   * Synchronizes recommendations into persistent adaptive tasks.
   * Guarantees NO duplicate active tasks for the same plant and action category.
   * Properly preserves completed history, handles reevaluations and postponements.
   */
  synchronizeTasksFromRecommendations(
    existingTasks: AdaptiveCareTask[],
    recommendations: CareRecommendation[],
    space: GardenSpace
  ): AdaptiveCareTask[] {
    const updatedTasks = [...existingTasks];
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    // Map active tasks by key: spaceId + plantInstanceId + category
    const activeTaskMap = new Map<string, AdaptiveCareTask>();

    updatedTasks.forEach((task) => {
      if (
        task.status === 'suggested' ||
        task.status === 'planned' ||
        task.status === 'due' ||
        task.status === 'snoozed' ||
        task.status === 'postponed'
      ) {
        const key = `${task.spaceId}_${task.plantInstanceId || 'space'}_${task.category}`;
        activeTaskMap.set(key, task);
      }
    });

    recommendations.forEach((rec) => {
      const key = `${rec.spaceId}_${rec.targetPlantInstanceId || 'space'}_${rec.category}`;
      const existing = activeTaskMap.get(key);

      // Handle postponed or suppressed recommendations (e.g. rain postponing watering)
      if (rec.isPostponedOrSuppressed) {
        if (existing) {
          existing.status = 'postponed';
          existing.isPostponed = true;
          existing.reevaluateAt = rec.reevaluateAt;
          existing.weatherReason = rec.reason;
          existing.description = `${rec.actionInstructions} (Reason: ${rec.reason})`;
        }
        return;
      }

      // Only convert 'recommended' and 'needs_inspection' to actionable tasks
      if (rec.classification !== 'recommended' && rec.classification !== 'needs_inspection') {
        return;
      }

      if (existing) {
        // If task was snoozed or postponed, check if snooze or reevaluation period expired
        if (existing.status === 'snoozed' && existing.snoozedUntil) {
          if (new Date(existing.snoozedUntil).getTime() <= nowMs) {
            existing.status = 'due';
            existing.snoozedUntil = undefined;
          }
        } else if (existing.status === 'postponed' && existing.reevaluateAt) {
          if (new Date(existing.reevaluateAt).getTime() <= nowMs) {
            existing.status = 'due';
            existing.isPostponed = false;
          }
        }

        // Update details without generating duplicate
        existing.title = rec.actionTitle;
        existing.description = `${rec.actionInstructions} (Reason: ${rec.reason})`;
        existing.priority = rec.priority;
        existing.supportingObservationIds = rec.supportingObservationIds;
        existing.isWeatherAware = !!rec.weatherReason;
        existing.weatherReason = rec.weatherReason;
        existing.weatherAlertHeadline = rec.weatherAlert?.headline;
        existing.missingEvidence = rec.missingEvidence;
        existing.spaceExposure = rec.spaceExposure;
      } else {
        // Create new deduplicated task
        const newTask: AdaptiveCareTask = {
          id: `task-adaptive-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          recommendationId: rec.id,
          plantInstanceId: rec.targetPlantInstanceId,
          plantId: rec.plantId,
          plantName: space.plants?.find(
            (p) => p.instanceId === rec.targetPlantInstanceId || p.plantId === rec.plantId
          )?.plant.name,
          spaceId: rec.spaceId,
          spaceName: space.name,
          title: rec.actionTitle,
          description: `${rec.actionInstructions} (Reason: ${rec.reason})`,
          category: rec.category,
          priority: rec.priority,
          status: 'due',
          estimatedMinutes:
            rec.category === 'watering' ? 3 : rec.category === 'inspection' ? 2 : 5,
          createdAt: nowIso,
          dueWindow: rec.suggestedTimeWindow || 'Today',
          supportingObservationIds: rec.supportingObservationIds,
          touchGrassPrompt: 'Take a calm moment outside with your living plants.',
          isWeatherAware: !!rec.weatherReason,
          weatherReason: rec.weatherReason,
          weatherAlertHeadline: rec.weatherAlert?.headline,
          missingEvidence: rec.missingEvidence,
          spaceExposure: rec.spaceExposure
        };

        updatedTasks.push(newTask);
        activeTaskMap.set(key, newTask);
      }
    });

    return updatedTasks;
  }

  /**
   * Completes an adaptive task with optional notes.
   */
  completeTask(
    tasks: AdaptiveCareTask[],
    taskId: string,
    notes?: string
  ): { tasks: AdaptiveCareTask[]; completedTask?: AdaptiveCareTask } {
    let completedTask: AdaptiveCareTask | undefined;
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        completedTask = {
          ...t,
          status: 'completed',
          completedAt: new Date().toISOString(),
          completionNotes: notes || t.completionNotes
        };
        return completedTask;
      }
      return t;
    });

    return { tasks: updated, completedTask };
  }

  /**
   * Snoozes an adaptive task for a given duration in hours.
   */
  snoozeTask(tasks: AdaptiveCareTask[], taskId: string, hours: number = 24): AdaptiveCareTask[] {
    const snoozedUntil = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    return tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'snoozed',
          snoozedUntil
        };
      }
      return t;
    });
  }

  /**
   * Dismisses an adaptive task with a reason.
   */
  dismissTask(tasks: AdaptiveCareTask[], taskId: string, reason?: string): AdaptiveCareTask[] {
    return tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'dismissed',
          dismissedAt: new Date().toISOString(),
          dismissReason: reason || 'Dismissed by gardener'
        };
      }
      return t;
    });
  }
}

export const adaptiveCareEngine = new AdaptiveCareEngine();
