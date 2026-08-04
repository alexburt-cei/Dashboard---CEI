import Header from './components/layout/Header';
import { DataProvider } from './context/DataContext';
import AppRoutes from './routes/AppRoutes';

/**
 * Shell de la aplicación. El Header (con SectionNav) queda fuera de <Routes>
 * porque es común a todas las vistas; cada sección aporta su propia TabNav.
 */
export default function App() {
  return (
    <DataProvider>
      <div className="app">
        <Header />
        <main className="app__main">
          <AppRoutes />
        </main>
      </div>
    </DataProvider>
  );
}
