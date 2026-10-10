import React from 'react';
import { GardenProvider, useGarden } from './context/GardenContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GardenSetupWizard } from './components/GardenSetupWizard';
import { MyGardenDashboard } from './components/MyGardenDashboard';
import { PlantRecommendationView } from './components/PlantRecommendationView';
import { ShoppingListView } from './components/ShoppingListView';
import { ChatbotView } from './components/ChatbotView';
import { GardenDoctorView } from './components/GardenDoctorView';
import { TodaysGardenView } from './components/TodaysGardenView';
import { PlantDetailModal } from './components/PlantDetailModal';
import { TouchGrassModal } from './components/TouchGrassModal';
import { SpaceModal } from './components/SpaceModal';
import { SpaceLayoutPlanner } from './components/SpaceLayoutPlanner';
import { DigitalTwinStudio } from './components/DigitalTwinStudio';
import { GardenJournalView } from './components/GardenJournalView';

const AppContent: React.FC = () => {
  const { activeTab, selectedPlantForDetail, setSelectedPlantForDetail } = useGarden();

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return <WelcomeScreen />;
      case 'setup':
        return <GardenSetupWizard />;
      case 'my_garden':
        return <MyGardenDashboard />;
      case 'plants':
        return <PlantRecommendationView />;
      case 'shopping':
        return <ShoppingListView />;
      case 'chat':
        return <ChatbotView />;
      case 'doctor':
        return <GardenDoctorView />;
      case 'today':
        return <TodaysGardenView />;
      case 'layout':
        return <SpaceLayoutPlanner />;
      case 'twin':
        return <DigitalTwinStudio />;
      case 'journal':
        return <GardenJournalView />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">
        <div className="container">
          {renderActiveScreen()}
        </div>
      </main>
      <Footer />

      {/* Global Modals */}
      <PlantDetailModal
        plant={selectedPlantForDetail}
        onClose={() => setSelectedPlantForDetail(null)}
      />
      <TouchGrassModal />
      <SpaceModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <GardenProvider>
      <AppContent />
    </GardenProvider>
  );
};

export default App;
