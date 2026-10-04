import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ThemeDrawer from '../components/ThemeDrawer';
import AssistantChat from '../components/AssistantChat';
import { ThemeProvider } from '../context/ThemeContext';
import { clearPageSearchHighlight, highlightPageText } from '../utils/pageSearch';

function MainLayoutContent({ currentUser, onLogout, onUserUpdated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pageContentRef = useRef(null);
  // false = sidebar lebar, true = sidebar ikon saja.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  useEffect(() => {
    clearPageSearchHighlight();
  }, [location.pathname]);

  const searchCurrentPage = (searchTerm) => highlightPageText(pageContentRef.current, searchTerm);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[var(--theme-background)] text-[var(--theme-text)]">
      {/* Status dan fungsi toggle dikirim ke Sidebar agar tombolnya mengubah state layout. */}
      <Sidebar
        currentUser={currentUser}
        onLogout={handleLogout}
        onUserUpdated={onUserUpdated}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
      />

      {/* Margin konten harus sama dengan lebar Sidebar agar tidak tertutup. */}
      <div className={`flex-1 ${isSidebarCollapsed ? 'ml-16' : 'ml-52'} flex flex-col transition-[margin] duration-300`}>
        <Header
          onSearch={searchCurrentPage}
          showAI={currentUser?.role !== 'pelanggan'}
          onOpenAI={() => {
            setIsDrawerOpen(false);
            setIsAIChatOpen(true);
          }}
          onOpenTheme={() => {
            setIsAIChatOpen(false);
            setIsDrawerOpen(true);
          }}
        />

        <main ref={pageContentRef} className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
      <ThemeDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <AssistantChat isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
    </div>
  );
}

function MainLayout(props) {
  return (
    <ThemeProvider>
      <MainLayoutContent {...props} />
    </ThemeProvider>
  );
}

export default MainLayout;