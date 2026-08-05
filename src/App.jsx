import Header from './components/layout/Header';
import { DataProvider } from './context/DataContext';
import { I18nProvider } from './i18n/I18nContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './routes/AppRoutes';

/**
 * Shell de la aplicación. El Header (con SectionNav) queda fuera de <Routes>
 * porque es común a todas las vistas; cada sección aporta su propia TabNav.
 */
export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <DataProvider>
          <div className="app">
            <Header />
            <main className="app__main">
              <AppRoutes />
            </main>
          </div>
        </DataProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
