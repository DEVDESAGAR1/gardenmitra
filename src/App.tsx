import React, { Suspense, lazy } from 'react';
import { GardenProvider, useGarden } from './context/GardenContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ScreenSkeleton } from './components/ScreenSkeleton';
import { WelcomeScreen } from './components/WelcomeScreen';
import { TodaysGardenView } from './components/TodaysGardenView';
import { MyGardenDashboard } from './components/MyGardenDashboard';
import { PlantDetailModal } from './components/PlantDetailModal';
import { TouchGrassModal } from './components/TouchGrassModal';
import { SpaceModal } from './components/SpaceModal';

// Route-level code splitting for secondary views (FIND-PERF-01)
const GardenSetupWizard = lazy(() =>
  import('./components/GardenSetupWizard').then((m) => ({ default: m.GardenSetupWizard }))
);
const PlantRecommendationView = lazy(() =>
  import('./components/PlantRecommendationView').then((m) => ({ default: m.PlantRecommendationView }))
);
const ShoppingListView = lazy(() =>
  import('./components/ShoppingListView').then((m) => ({ default: m.ShoppingListView }))
);
const ChatbotView = lazy(() =>
  import('./components/ChatbotView').then((m) => ({ default: m.ChatbotView }))
);
const GardenDoctorView = lazy(() =>
  import('./components/GardenDoctorView').then((m) => ({ default: m.GardenDoctorView }))
);
const SpaceLayoutPlanner = lazy(() =>
  import('./components/SpaceLayoutPlanner').then((m) => ({ default: m.SpaceLayoutPlanner }))
);
const DigitalTwinStudio = lazy(() =>
  import('./components/DigitalTwinStudio').then((m) => ({ default: m.DigitalTwinStudio }))
);
const GardenJournalView = lazy(() =>
  import('./components/GardenJournalView').then((m) => ({ default: m.GardenJournalView }))
);
const GardenEnvironmentView = lazy(() =>
  import('./components/GardenEnvironmentView').then((m) => ({ default: m.GardenEnvironmentView }))
);
const CarePlannerView = lazy(() =>
  import('./components/CarePlannerView').then((m) => ({ default: m.CarePlannerView }))
);
const GardenPerformanceView = lazy(() =>
  import('./components/GardenPerformanceView').then((m) => ({ default: m.GardenPerformanceView }))
);

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
        return (
          <ErrorBoundary sectionName="Garden Doctor">
            <GardenDoctorView />
          </ErrorBoundary>
        );
      case 'today':
        return <TodaysGardenView />;
      case 'layout':
        return <SpaceLayoutPlanner />;
      case 'twin':
        return (
          <ErrorBoundary sectionName="Digital Twin Studio">
            <DigitalTwinStudio />
          </ErrorBoundary>
        );
      case 'journal':
        return <GardenJournalView />;
      case 'environment':
        return <GardenEnvironmentView />;
      case 'planner':
        return <CarePlannerView />;
      case 'performance':
        return <GardenPerformanceView />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">
        <div className="container">
          <ErrorBoundary sectionName="Current View">
            <Suspense fallback={<ScreenSkeleton />}>
              {renderActiveScreen()}
            </Suspense>
          </ErrorBoundary>
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
    <ErrorBoundary sectionName="GardenMitra Root">
      <ToastProvider>
        <GardenProvider>
          <AppContent />
        </GardenProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
