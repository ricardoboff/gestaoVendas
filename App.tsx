import React, { useState, useEffect } from 'react';
import { Customer, User } from './types';
import { initializeStorage, getCustomers, getCurrentUser, logoutUser } from './services/storageService';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import CustomerDetail from './components/CustomerDetail';
import AdminPanel from './components/AdminPanel';
import { LayoutDashboard, Users, LogOut, Menu, X, Diamond, Shield, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'customers' | 'detail' | 'admin'>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await initializeStorage();
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await refreshData();
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    const data = await getCustomers();
    setCustomers(data);
    
    // Update selected customer
    if (selectedCustomer) {
      const updated = data.find(c => c.id === selectedCustomer.id);
      if (updated) setSelectedCustomer(updated);
      else {
        setSelectedCustomer(null);
        setCurrentView('customers');
      }
    }
    setIsLoading(false);
  };

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    await refreshData();
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setCurrentView('dashboard');
  };

  const navigateToCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCurrentView('detail');
    setMobileMenuOpen(false);
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const Logo = () => (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-2">
        <Diamond className="text-primary" size={24} />
        <span className="font-script text-4xl text-primary leading-none pt-2">Ornare</span>
      </div>
      <span className="text-[0.6rem] tracking-[0.2em] text-gray-400 uppercase ml-9">Semijoias e Prata</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col md:flex-row text-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
           <span className="font-script text-3xl text-primary">Ornare</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-300">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 h-full flex flex-col">
          <div className="hidden md:block mb-8 pl-2">
             <Logo />
          </div>

          <div className="space-y-2 flex-1">
            <button
              onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                currentView === 'dashboard' ? 'bg-gray-800 text-white font-medium border border-gray-700' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <LayoutDashboard size={20} />
              Painel Geral
            </button>
            <button
              onClick={() => { setCurrentView('customers'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                currentView === 'customers' || currentView === 'detail' ? 'bg-gray-800 text-white font-medium border border-gray-700' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Users size={20} />
              Clientes
            </button>

            {user.role === 'admin' && (
              <button
                onClick={() => { setCurrentView('admin'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  currentView === 'admin' ? 'bg-gray-800 text-white font-medium border border-gray-700' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Shield size={20} />
                Usuários
              </button>
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-gray-800">
            <div className="flex items-center gap-3 px-4 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <div className="font-medium text-sm truncate text-white">{user.name}</div>
                <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                  {user.role === 'admin' && <Shield size={10} />}
                  @{user.username}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-rose-500 hover:bg-rose-900/20 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-gray-950 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        )}
        
        <div className="max-w-5xl mx-auto">
          {currentView === 'dashboard' && (
            <Dashboard 
              customers={customers} 
              onSelectCustomer={navigateToCustomer}
            />
          )}
          {currentView === 'customers' && (
            <CustomerList 
              customers={customers} 
              onSelectCustomer={navigateToCustomer} 
              onUpdate={refreshData}
            />
          )}
          {currentView === 'detail' && selectedCustomer && (
            <CustomerDetail 
              customer={selectedCustomer} 
              onBack={() => setCurrentView('customers')}
              onUpdate={refreshData}
            />
          )}
          {currentView === 'admin' && user.role === 'admin' && (
            <AdminPanel currentUser={user} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;