import { ChatMessage } from '../types';
import { AssistantContext, GardenAssistantProvider } from './types';

export class LocalGardenAssistantProvider implements GardenAssistantProvider {
  readonly id = 'local-garden-assistant';
  readonly name = 'Local Context-Aware Assistant (Rule-Based)';
  readonly isLocalMock = true;

  async respond(
    userMessage: string,
    _history: ChatMessage[],
    context: AssistantContext
  ): Promise<ChatMessage> {
    const query = userMessage.toLowerCase().trim();
    const { profile, selectedSpace, selectedPlants, environmentalContext } = context;

    const currentSpaceName = selectedSpace?.name || profile?.spaceName || 'your space';
    const spaceType = selectedSpace?.type || profile?.spaceType || 'growing space';
    const spaceSize = selectedSpace?.size || profile?.spaceSize || 'standard';
    const spaceText = selectedSpace ? `${selectedSpace.name} (${spaceType})` : `${spaceType} (${spaceSize} size)`;

    const plantListNames = selectedPlants.length > 0
      ? selectedPlants.map(p => p.name).join(', ')
      : 'None yet';

    const locationText = profile?.location?.city
      ? `${profile.location.city}, ${profile.location.state || profile.location.country}`
      : 'your city';

    const sunText = (selectedSpace?.sunlight || profile?.sunlight || 'moderate light').replace(/_/g, ' ');

    let answer = '';
    let suggestedQuestions: string[] = [];

    const weatherNote = environmentalContext
      ? `\n\n🌤️ *Demo weather for ${locationText}: ${environmentalContext.snapshot.conditionText} (${environmentalContext.snapshot.temperatureC}°C).*`
      : '';

    // Context-driven answering
    if (query.includes('what should i grow') || query.includes('recommend') || query.includes('what can i grow')) {
      if (selectedPlants.length > 0) {
        answer = `Based on your profile for **${currentSpaceName}** (${spaceType}) in **${locationText}** with **${sunText}**, you've already added **${plantListNames}**!

If you'd like to add another beginner-proof plant:
• For quick culinary rewards: Try **Mint (Pudina)** or **Fenugreek (Methi)**.
• If you get 4+ hours of sun: Try **Tulsi** or **Cherry Tomatoes**.
• For compact foliage: Try **Spinach (Palak)** in shallow planters.

Check out the **Plants** tab anytime to explore full care cards tailored to your space!${weatherNote}`;
      } else {
        answer = `For your **${currentSpaceName}** (${spaceType}) in **${locationText}** with **${sunText}**, here are our top beginner recommendations:
1. **Mint (Pudina)** — Virtually foolproof, loves pots, and thrives in partial light.
2. **Coriander (Dhania)** — Fast sprouting in shallow containers; perfect for kitchen windows.
3. **Fenugreek (Methi)** — Ready to harvest as fresh greens in just 20 to 25 days!

Head over to the **Plants** tab to add them to your garden and generate your shopping list.${weatherNote}`;
      }
      suggestedQuestions = ['What do I need to buy?', 'What should I do today?', 'How often should I water this?'];

    } else if (query.includes('what should i do today') || query.includes('today\'s tasks') || query.includes('task')) {
      if (selectedPlants.length === 0) {
        answer = `Today's best first step:
1. Go out to your **${spaceText}** for 2 minutes to observe where sunlight lands right now.
2. Browse the **Plants** tab and pick 1 or 2 easy starter plants (like Mint or Fenugreek).
3. Then close the app and enjoy your day!`;
      } else {
        answer = `Here are your quick tasks for today (estimated ~8 minutes total):
1. **The 1-Inch Finger Test**: Poke your index finger 1 inch into the pot soil of your **${selectedPlants[0].name}**. Water only if it feels bone dry.
2. **Inspect Leaf Undersides**: Take 60 seconds to flip a few leaves and verify no little pests are hiding.
3. **Rotate Containers**: Give pots on your ${profile?.spaceType || 'balcony'} a quick 90° turn towards the sun for balanced growth.

Once you tick those off in **Today's Garden**, close GardenMitra and step outside to touch grass! 🌿`;
      }
      suggestedQuestions = ['How often should I water this?', 'Why are my leaves turning yellow?', 'What do I need to buy?'];

    } else if (query.includes('what do i need to buy') || query.includes('shopping') || query.includes('buy')) {
      if (selectedPlants.length === 0) {
        answer = `Before buying anything, pick 1 or 2 plants in the **Plants** tab! 

As a rule of thumb for beginners, all you need is:
1. One container (6–10 inches) with drainage holes.
2. A bag of well-draining potting mix (soil + vermicompost + coco peat).
3. Quality seeds or a live starter sapling from a local nursery.
4. A simple watering can or spray bottle.

No expensive gadgets required!`;
      } else {
        answer = `For your active garden (**${plantListNames}**), your starter shopping list is already ready in the **Shopping List** tab!

Key essentials:
• **Containers**: Suitable pots with drainage holes and bottom saucers for your ${profile?.spaceType || 'balcony'}.
• **Growing Medium**: Well-draining potting mix (avoid digging roadside mud).
• **Nutrients**: A 5kg bag of organic vermicompost.
• **Starter Plants**: Seeds or small saplings for ${plantListNames}.
• **Tool**: A gentle rose-spout watering can.`;
      }
      suggestedQuestions = ['What fertilizer do I need?', 'How often should I water this?', 'What should I do today?'];

    } else if (
      query.includes('did i water') ||
      query.includes('when did i water') ||
      query.includes('watered my') ||
      query.includes('watering history') ||
      query.includes('last watered')
    ) {
      const gPlants = context.gardenPlants || selectedSpace?.plants || [];
      if (gPlants.length === 0) {
        answer = `You don't have any plants added to **${currentSpaceName}** yet! Add a plant from the **Plants** tab first to start tracking its watering history.`;
      } else {
        // Find if a specific plant was named in the query
        const matched = gPlants.find((gp) => {
          const nameLower = gp.plant.name.toLowerCase();
          const idLower = gp.plantId.toLowerCase();
          const hindiLower = (gp.plant.hindiName || '').toLowerCase();
          const nameTokens = nameLower.split(/\s+/);
          return (
            query.includes(nameLower) ||
            query.includes(idLower) ||
            (hindiLower && query.includes(hindiLower)) ||
            nameTokens.some((token) => token.length >= 3 && query.includes(token))
          );
        });

        if (matched) {
          if (matched.lastWateredAt) {
            const dateStr = new Date(matched.lastWateredAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric'
            });
            const timeStr = new Date(matched.lastWateredAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });
            const count = matched.wateringCount || (matched.careHistory?.filter(e => e.type === 'watered').length || 1);
            answer = `Yes! Your **${matched.plant.name}** in **${currentSpaceName}** was last watered on **${dateStr} at ${timeStr}** (Total logged waterings: ${count}).
            
Push your finger 1 inch into the pot soil before watering again to ensure the roots need moisture.`;
          } else {
            answer = `Your **${matched.plant.name}** in **${currentSpaceName}** hasn't been logged for watering yet.
            
Tip: Push your index finger 1 inch into the potting soil. If dry, tap **[ 💧 I Watered It ]** in Today's Garden or My Garden to log it!`;
          }
        } else {
          // Summary of all plants in this space
          const statusLines = gPlants.map((gp) => {
            if (gp.lastWateredAt) {
              const d = new Date(gp.lastWateredAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
              return `• **${gp.plant.name}**: Last watered ${d}`;
            }
            return `• **${gp.plant.name}**: No watering logged yet`;
          });
          answer = `Here is the watering status for **${currentSpaceName}**:
${statusLines.join('\n')}

Always test soil dampness before adding more water!`;
        }
      }
      suggestedQuestions = ['What should I do today?', 'How often should I water this?', 'Check soil moisture'];

    } else if (query.includes('how often should i water') || query.includes('water') || query.includes('watering')) {
      answer = `Beginner Golden Rule: **Never water on a rigid calendar schedule!** Instead, water by testing moisture.

1. **The Finger Test**: Push your finger 1 inch down into the soil.
   • If it feels cool and damp: **Do not water**.
   • If it feels dry and dusty: Water slowly at the base until a little trickles into the bottom saucer.
2. **Morning is best**: Water before 9:00 AM so excess moisture evaporates before nightfall, preventing fungal spots.
3. **Roots drink, not leaves**: Always direct water onto the soil surface, not on the foliage.`;
      suggestedQuestions = ['Did I water my tomato?', 'Why are my leaves turning yellow?', 'What should I do today?'];

    } else if (query.includes('what fertilizer') || query.includes('fertilizer') || query.includes('compost') || query.includes('nutrients')) {
      answer = `For beginner containers in **${locationText}**, keep it simple and organic:

• **Vermicompost (Earthworm castings)**: The safest, most complete food. Add 2 handfuls per pot every 3 to 4 weeks.
• **Used Tea Leaves (Rinsed)**: Rinse milk and sugar off, dry in the sun, and scratch into the topsoil for gentle nitrogen and acidity (mint and herbs love this!).
• **For Fruiting Plants (Tomatoes & Chillies)**: Once flowers appear, add crushed eggshells or wood ash for calcium and potassium.

⚠️ **Beginner Caution**: Avoid chemical synthetic blue crystals (NPK) early on — they easily burn shallow roots if measured incorrectly.`;
      suggestedQuestions = ['How often should I water this?', 'Why are my leaves turning yellow?', 'My plant doesn\'t look healthy.'];

    } else if (query.includes('yellow') || query.includes('leaves turning yellow')) {
      answer = `Yellow leaves are the most common sign for beginners. Here is how to troubleshoot:

1. **Check the soil moisture right now**: 
   • If soggy/wet: **Overwatering** is suffocating the roots. Let the pot dry out completely before watering again.
   • If bone dry: The plant is dehydrated and shedding leaves to conserve moisture.
2. **Check drainage**: Ensure water isn't pooled in the bottom saucer.
3. **Position of yellowing**:
   • Lowest 1–2 leaves only: Natural shedding as the plant grows taller (totally normal).
   • Top new leaves yellowing: Usually lack of sunlight or nutrient depletion.

Check our **Garden Doctor** tab to upload a photo and get step-by-step guidance!`;
      suggestedQuestions = ['My plant doesn\'t look healthy.', 'How often should I water this?', 'What fertilizer do I need?'];

    } else if (query.includes('not healthy') || query.includes('dying') || query.includes('sick') || query.includes('doctor') || query.includes('pests')) {
      answer = `Don't panic! Even master gardeners encounter struggling plants.

Three immediate checks:
1. **Soil Check**: Is it soaking wet or dry like dust?
2. **Sunlight Check**: Has the plant received at least 3–4 hours of bright light today?
3. **Pest Check**: Look under 3 leaves for tiny dots or webbing. If you see bugs, wipe them off with soapy water.

Use our **Garden Doctor** tab to select your exact symptom (wilting, brown tips, leaf spots) for educational troubleshooting!`;
      suggestedQuestions = ['Why are my leaves turning yellow?', 'How often should I water this?', 'What should I do today?'];

    } else if (query.includes('touch grass') || query.includes('outside') || query.includes('philosophy')) {
      answer = `🌱 That's the heart of GardenMitra! 

Real gardens grow in real soil, under real clouds and sunshine, not inside software applications. Our job is to give you clarity in under 2 minutes so you can put down your screen, step outside into your **${spaceText}**, and enjoy the living world.`;
      suggestedQuestions = ['What should I do today?', 'What should I grow?'];

    } else {
      // General thoughtful response incorporating context
      answer = `I hear you! Regarding "${userMessage}":

In your **${spaceText}** in **${locationText}** with **${sunText}**, the simplest approach is always to observe nature directly. 
• Keep soil moisture balanced (neither swampy nor cracked).
• Make sure containers get regular air circulation.
• Start small with 1 or 2 resilient plants (like Mint, Coriander, or Fenugreek) to build confidence.

Would you like advice on watering, fertilizers, or troubleshooting a specific plant?`;
      suggestedQuestions = ['What should I grow?', 'What should I do today?', 'What do I need to buy?', 'How often should I water this?'];
    }

    return {
      id: 'msg-' + Date.now(),
      sender: 'assistant',
      content: answer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedQuestions,
      isRuleBased: true
    };
  }
}

export const gardenAssistantProvider = new LocalGardenAssistantProvider();
