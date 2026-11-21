import type { ReactNode } from 'react';
import { useRoute } from './lib/router';
import { TopBar } from './components/TopBar';
import { KeyboardDock } from './components/KeyboardDock';
import { Dashboard } from './modules/Dashboard';
import { SolfegeModule } from './modules/solfege/SolfegeModule';
import { RhythmModule } from './modules/rhythm/RhythmModule';
import { LessonsModule, LessonView } from './modules/lessons/LessonsModule';
import { PieceView, PracticeModule } from './modules/practice/PracticeModule';
import { SettingsPage } from './modules/SettingsPage';
import { BackButton } from './components/ui';
import { navigate } from './lib/router';

export function App() {
  const route = useRoute();
  let page: ReactNode;
  switch (route.name) {
    case 'solfege':
      page = <SolfegeModule />;
      break;
    case 'rhythm':
      page = <RhythmModule />;
      break;
    case 'lessons':
      page = <LessonsModule />;
      break;
    case 'lesson':
      page = <LessonView key={route.id} id={route.id} />;
      break;
    case 'practice':
      page = <PracticeModule />;
      break;
    case 'piece':
      page = <PieceView key={route.id} id={route.id} />;
      break;
    case 'settings':
      page = <SettingsPage />;
      break;
    default:
      page = <Dashboard />;
  }
  return (
    <div className="flex min-h-full flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {route.name !== 'dashboard' && route.name !== 'lesson' && route.name !== 'piece' && (
          <div className="mb-2">
            <BackButton onClick={() => navigate({ name: 'dashboard' })} label="Tableau de bord" />
          </div>
        )}
        {page}
      </main>
      <footer className="pb-2 text-center text-xs text-slate-400">
        Piano Solfège Academy · progression enregistrée dans ce navigateur · morceaux du domaine public
      </footer>
      <KeyboardDock />
    </div>
  );
}
