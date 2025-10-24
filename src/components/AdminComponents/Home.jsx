// components/AdminComponents/Home.jsx
'use client';

import { useState, useEffect } from 'react';
import { 
  FiUsers, FiSend, FiLogOut, FiChevronLeft, FiChevronRight, 
  FiRefreshCw, FiSearch, FiClock, FiDollarSign, FiFilter,
  FiCalendar, FiUser, FiBriefcase, FiSettings, FiEye, FiEyeOff
} from 'react-icons/fi';
import { signOut } from 'next-auth/react';

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('candidates');
  
  // Estados para Candidatos
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para Marcações
  const [attendance, setAttendance] = useState([]);
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);

  // Estados para Verbas
  const [budgets, setBudgets] = useState([]);
  const [isFetchingBudgets, setIsFetchingBudgets] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    name: '',
    documentNumber: '',
    email: '',
    phone: '',
    nationality: '',
    page: 1,
    pageSize: 10,
  });

  const [attendanceFilters, setAttendanceFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    companyId: '',
    employeeId: '',
    externalId: '',
    page: 1,
    pageSize: 10,
  });

  const [budgetsFilters, setBudgetsFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    companyId: '',
    employeeIds: '',
    externalIds: '',
    budgetConfigId: '',
    page: 1,
    pageSize: 10,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });

  const [attendancePagination, setAttendancePagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });

  const [budgetsPagination, setBudgetsPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showAttendanceFilters, setShowAttendanceFilters] = useState(true);
  const [showBudgetsFilters, setShowBudgetsFilters] = useState(true);
  const [stats, setStats] = useState({ 
    totalCandidates: 0, 
    submitted: 0,
    todayAttendance: 0,
    totalBudgets: 0
  });

  const logout = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  // Fetch Candidates
  const fetchCandidates = async () => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams({
        page: String(filters.page),
        pageSize: String(filters.pageSize),
        ...(filters.name && { name: filters.name }),
        ...(filters.documentNumber && { documentNumber: filters.documentNumber }),
        ...(filters.email && { email: filters.email }),
        ...(filters.phone && { phone: filters.phone }),
        ...(filters.nationality && { nationality: filters.nationality }),
      });

      const res = await fetch(`/api/candidates?${params.toString()}`);
      if (!res.ok) throw new Error('Falha ao buscar candidatos');
      
      const data = await res.json();
      setCandidates(data.records || []);
      setPagination({
        page: Number(data.metadata?.currentPage ?? 1),
        pageSize: Number(data.metadata?.perPage ?? filters.pageSize),
        total: Number(data.metadata?.totalCount ?? 0),
        totalPages: Number(data.metadata?.totalPages ?? 1),
      });
      setStats(p => ({ ...p, totalCandidates: Number(data.metadata?.totalCount ?? 0) }));
    } catch (e) {
      console.error('fetchCandidates error:', e);
      setCandidates([]);
    } finally {
      setIsFetching(false);
    }
  };

  // Fetch Attendance - CORRIGIDO
  const fetchAttendance = async () => {
    setIsFetchingAttendance(true);
    try {
      const params = new URLSearchParams({
        date: attendanceFilters.date,
        companyId: attendanceFilters.companyId,
        ...(attendanceFilters.employeeId && { employeeId: attendanceFilters.employeeId }),
        ...(attendanceFilters.externalId && { externalId: attendanceFilters.externalId }),
      });

      const res = await fetch(`/api/attendance?${params.toString()}`);
      if (!res.ok) throw new Error('Falha ao buscar marcações');
      
      const data = await res.json();
      setAttendance(data.records || []);
      setAttendancePagination(prev => ({
        ...prev,
        page: Number(data.metadata?.currentPage ?? 1),
        total: Number(data.metadata?.totalCount ?? 0),
        totalPages: Number(data.metadata?.totalPages ?? 1),
      }));
      setStats(p => ({ ...p, todayAttendance: data.records?.length || 0 }));
    } catch (e) {
      console.error('fetchAttendance error:', e);
      setAttendance([]);
    } finally {
      setIsFetchingAttendance(false);
    }
  };

  // Fetch Budgets
  const fetchBudgets = async () => {
    setIsFetchingBudgets(true);
    try {
      const params = new URLSearchParams({
        year: String(budgetsFilters.year),
        month: String(budgetsFilters.month),
        ...(budgetsFilters.companyId && { companyId: budgetsFilters.companyId }),
        ...(budgetsFilters.employeeIds && { employeeIds: budgetsFilters.employeeIds }),
        ...(budgetsFilters.externalIds && { externalIds: budgetsFilters.externalIds }),
        ...(budgetsFilters.budgetConfigId && { budgetConfigId: budgetsFilters.budgetConfigId }),
        page: String(budgetsFilters.page),
        pageSize: String(budgetsFilters.pageSize),
      });

      const res = await fetch(`/api/budgets?${params.toString()}`);
      if (!res.ok) throw new Error('Falha ao buscar verbas');
      
      const data = await res.json();
      setBudgets(data.records || []);
      setBudgetsPagination(prev => ({
        ...prev,
        page: Number(data.metadata?.currentPage ?? 1),
        total: Number(data.metadata?.totalCount ?? 0),
        totalPages: Number(data.metadata?.totalPages ?? 1),
      }));
      setStats(p => ({ ...p, totalBudgets: Number(data.metadata?.totalCount ?? 0) }));
    } catch (e) {
      console.error('fetchBudgets error:', e);
      setBudgets([]);
    } finally {
      setIsFetchingBudgets(false);
    }
  };

  const submitCandidates = async () => {
    if (selectedCandidates.length === 0) {
      alert('Selecione pelo menos um candidato');
      return;
    }
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setStats((p) => ({ ...p, submitted: p.submitted + selectedCandidates.length }));
      setSelectedCandidates([]);
      alert(`${selectedCandidates.length} candidatos enviados com sucesso!`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCandidateSelection = (id) =>
    setSelectedCandidates((prev) => 
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleSelectAll = () =>
    setSelectedCandidates((prev) => 
      prev.length === candidates.length ? [] : candidates.map((c) => c.id)
    );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value, page: 1 }));
  };

  const handleAttendanceFilterChange = (e) => {
    const { name, value } = e.target;
    setAttendanceFilters((p) => ({ ...p, [name]: value, page: 1 }));
  };

  const handleBudgetsFilterChange = (e) => {
    const { name, value } = e.target;
    setBudgetsFilters((p) => ({ ...p, [name]: value, page: 1 }));
  };

  const changePage = (newPage, type = 'candidates') => {
    if (type === 'candidates') {
      if (newPage >= 1 && newPage <= pagination.totalPages) {
        setFilters((p) => ({ ...p, page: newPage }));
      }
    } else if (type === 'attendance') {
      if (newPage >= 1 && newPage <= attendancePagination.totalPages) {
        setAttendanceFilters(p => ({ ...p, page: newPage }));
      }
    } else {
      if (newPage >= 1 && newPage <= budgetsPagination.totalPages) {
        setBudgetsFilters(p => ({ ...p, page: newPage }));
      }
    }
  };

  // Effects
  useEffect(() => { 
    if (activeTab === 'candidates') fetchCandidates();
  }, [
    filters.page,
    filters.pageSize,
    filters.name,
    filters.documentNumber,
    filters.email,
    filters.phone,
    filters.nationality,
    activeTab
  ]);

  // Temporariamente desativado: Marcações (attendance)
  // useEffect(() => {
  //   if (activeTab === 'attendance') fetchAttendance();
  // }, [attendanceFilters.page, attendanceFilters.pageSize, activeTab]);

  // Temporariamente desativado: Verbas (budgets)
  // useEffect(() => {
  //   if (activeTab === 'budgets') fetchBudgets();
  // }, [budgetsFilters.page, budgetsFilters.pageSize, activeTab]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Render Components
  const renderCandidatesTab = () => (
    <div className="space-y-6">
      <div className={`rounded-xl shadow-lg p-6 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Gerenciamento de Candidatos
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Gerencie e envie candidatos para processos seletivos
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {showFilters ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>

            <button 
              onClick={fetchCandidates} 
              disabled={isFetching}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg shadow hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isFetching ? <FiRefreshCw className="animate-spin" /> : <FiSearch />}
              {isFetching ? 'Buscando...' : 'Buscar Candidatos'}
            </button>

            <button 
              onClick={submitCandidates} 
              disabled={isSubmitting || selectedCandidates.length === 0}
              className={`px-4 py-2 rounded-lg text-white font-medium shadow-md flex items-center gap-2 transition-all disabled:opacity-50 ${
                isSubmitting 
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' 
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              }`}
            >
              {isSubmitting ? <FiRefreshCw className="animate-spin" /> : <FiSend />}
              {isSubmitting ? 'Enviando...' : `Enviar (${selectedCandidates.length})`}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'name', label: 'Nome', type: 'text', placeholder: 'Nome do candidato' },
                { name: 'documentNumber', label: 'CPF', type: 'text', placeholder: '000.000.000-00' },
                { name: 'email', label: 'Email', type: 'email', placeholder: 'email@exemplo.com' },
                { name: 'phone', label: 'Telefone', type: 'text', placeholder: '(00) 00000-0000' },
              ].map((f) => (
                <div key={f.name}>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    name={f.name}
                    value={filters[f.name]}
                    onChange={handleFilterChange}
                    placeholder={f.placeholder}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-900' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20`}
                  />
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Nacionalidade
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={filters.nationality}
                  onChange={handleFilterChange}
                  placeholder="Nacionalidade"
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-900' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Itens por página
                </label>
                <select
                  name="pageSize"
                  value={filters.pageSize}
                  onChange={handleFilterChange}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-900' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20`}
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>{n} itens</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabela Candidatos */}
      <div className={`rounded-xl shadow-lg overflow-hidden transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="p-6 border-b flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Lista de Candidatos
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {pagination.total} candidatos encontrados • Página {pagination.page} de {pagination.totalPages}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => changePage(pagination.page - 1)} 
              disabled={pagination.page === 1}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-30' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-30'
              }`}
            >
              <FiChevronLeft />
            </button>
            <span className={`px-3 py-1 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
              {pagination.page}
            </span>
            <button 
              onClick={() => changePage(pagination.page + 1)} 
              disabled={pagination.page === pagination.totalPages}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-30' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-30'
              }`}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.length === candidates.length && candidates.length > 0}
                    onChange={toggleSelectAll}
                    className={`rounded transition-colors ${
                      darkMode 
                        ? 'text-gray-900 bg-gray-600 border-gray-500' 
                        : 'text-gray-900 bg-white border-gray-300'
                    }`}
                  />
                </th>
                {['Nome', 'CPF', 'Email', 'Telefone', 'Nacionalidade'].map((h) => (
                  <th 
                    key={h} 
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
              {candidates.length > 0 ? candidates.map((c) => (
                <tr 
                  key={c.id}
                  className={`transition-colors ${
                    darkMode 
                      ? 'hover:bg-gray-750' 
                      : 'hover:bg-gray-50'
                  } ${
                    selectedCandidates.includes(c.id) 
                      ? (darkMode ? 'bg-gray-750' : 'bg-gray-50') 
                      : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox"
                      checked={selectedCandidates.includes(c.id)}
                      onChange={() => toggleCandidateSelection(c.id)}
                      className={`rounded transition-colors ${
                        darkMode 
                          ? 'text-gray-900 bg-gray-600 border-gray-500' 
                          : 'text-gray-900 bg-white border-gray-300'
                      }`} 
                    />
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <div className="font-medium">{c.name}</div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      ID: {c.id}
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {c.cpf}
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {c.email}
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {c.phone}
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {c.nationality}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    {isFetching ? (
                      <div className="flex flex-col items-center justify-center">
                        <FiRefreshCw className="animate-spin text-3xl mb-3 text-gray-900" />
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                          Buscando candidatos...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <FiUsers className="text-3xl mb-3 text-gray-400" />
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                          Nenhum candidato encontrado
                        </p>
                        <button 
                          onClick={fetchCandidates}
                          className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          Buscar Novamente
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAttendanceTab = () => (
    <div className="space-y-6">
      <div className={`rounded-xl shadow-lg p-6 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Marcações de Ponto
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Registros de entrada e saída dos colaboradores
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setShowAttendanceFilters(!showAttendanceFilters)}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {showAttendanceFilters ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              {showAttendanceFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>

            <button 
              onClick={fetchAttendance} 
              disabled={isFetchingAttendance}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg shadow hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isFetchingAttendance ? <FiRefreshCw className="animate-spin" /> : <FiSearch />}
              {isFetchingAttendance ? 'Buscando...' : 'Buscar Marcações'}
            </button>
          </div>
        </div>

        {showAttendanceFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Data <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={attendanceFilters.date}
                  onChange={handleAttendanceFilterChange}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-900' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  ID da Empresa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyId"
                  value={attendanceFilters.companyId}
                  onChange={handleAttendanceFilterChange}
                  placeholder="ID da empresa"
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-900' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  ID do Funcionário
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={attendanceFilters.employeeId}
                  onChange={handleAttendanceFilterChange}
                  placeholder="ID do funcionário"
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-900' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  ID Externo
                </label>
                <input
                  type="text"
                  name="externalId"
                  value={attendanceFilters.externalId}
                  onChange={handleAttendanceFilterChange}
                  placeholder="ID externo"
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-900' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20`}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabela Attendance */}
      <div className={`rounded-xl shadow-lg overflow-hidden transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="p-6 border-b flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Registros de Pontos
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {attendancePagination.total} registros encontrados • Página {attendancePagination.page} de {attendancePagination.totalPages}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => changePage(attendancePagination.page - 1, 'attendance')} 
              disabled={attendancePagination.page === 1}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-30' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-30'
              }`}
            >
              <FiChevronLeft />
            </button>
            <span className={`px-3 py-1 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
              {attendancePagination.page}
            </span>
            <button 
              onClick={() => changePage(attendancePagination.page + 1, 'attendance')} 
              disabled={attendancePagination.page === attendancePagination.totalPages}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-30' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-30'
              }`}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                {['Funcionário', 'Data', 'Entrada', 'Saída', 'Total', 'Status'].map((h) => (
                  <th 
                    key={h} 
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
              {attendance.length > 0 ? attendance.map((record) => (
                <tr 
                  key={record.id} 
                  className={`transition-colors ${darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}`}
                >
                  <td className={`px-6 py-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <div className="font-medium">{record.employeeName || 'N/A'}</div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      ID: {record.employeeId || 'N/A'}
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {record.date ? new Date(record.date).toLocaleDateString('pt-BR') : 'N/A'}
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {record.clockIn || '--:--'}
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {record.clockOut || '--:--'}
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {record.totalHours || '--:--'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      record.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : record.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {record.status === 'completed' ? 'Completo' :
                       record.status === 'pending' ? 'Pendente' : 'Não registrado'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    {isFetchingAttendance ? (
                      <div className="flex flex-col items-center justify-center">
                        <FiRefreshCw className="animate-spin text-3xl mb-3 text-gray-900" />
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                          Buscando registros...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <FiClock className="text-3xl mb-3 text-gray-400" />
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                          Nenhum registro encontrado
                        </p>
                        <button 
                          onClick={fetchAttendance}
                          className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          Buscar Novamente
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBudgetsTab = () => (
    <div className="space-y-6">
      <div className={`rounded-xl shadow-lg p-6 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Gestão de Verbas
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Controle e acompanhamento de verbas orçamentárias
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setShowBudgetsFilters(!showBudgetsFilters)}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {showBudgetsFilters ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              {showBudgetsFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>

            <button 
              onClick={fetchBudgets} 
              disabled={isFetchingBudgets}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg shadow hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isFetchingBudgets ? <FiRefreshCw className="animate-spin" /> : <FiSearch />}
              {isFetchingBudgets ? 'Buscando...' : 'Buscar Verbas'}
            </button>
          </div>
        </div>

        {showBudgetsFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Ano <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="year"
                  value={budgetsFilters.year}
                  onChange={handleBudgetsFilterChange}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-900' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Mês <span className="text-red-500">*</span>
                </label>
                <select
                  name="month"
                  value={budgetsFilters.month}
                  onChange={handleBudgetsFilterChange}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                >
                  {[
                    { value: 1, label: 'Janeiro' },
                    { value: 2, label: 'Fevereiro' },
                    { value: 3, label: 'Março' },
                    { value: 4, label: 'Abril' },
                    { value: 5, label: 'Maio' },
                    { value: 6, label: 'Junho' },
                    { value: 7, label: 'Julho' },
                    { value: 8, label: 'Agosto' },
                    { value: 9, label: 'Setembro' },
                    { value: 10, label: 'Outubro' },
                    { value: 11, label: 'Novembro' },
                    { value: 12, label: 'Dezembro' },
                  ].map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  ID da Empresa
                </label>
                <input
                  type="text"
                  name="companyId"
                  value={budgetsFilters.companyId}
                  onChange={handleBudgetsFilterChange}
                  placeholder="ID da empresa"
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-900' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  IDs dos Funcionários
                </label>
                <input
                  type="text"
                  name="employeeIds"
                  value={budgetsFilters.employeeIds}
                  onChange={handleBudgetsFilterChange}
                  placeholder="IDs separados por vírgula"
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  IDs Externos
                </label>
                <input
                  type="text"
                  name="externalIds"
                  value={budgetsFilters.externalIds}
                  onChange={handleBudgetsFilterChange}
                  placeholder="IDs externos separados por vírgula"
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  ID da Configuração
                </label>
                <input
                  type="text"
                  name="budgetConfigId"
                  value={budgetsFilters.budgetConfigId}
                  onChange={handleBudgetsFilterChange}
                  placeholder="ID da configuração"
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabela Budgets */}
      <div className={`rounded-xl shadow-lg overflow-hidden transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="p-6 border-b flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Lista de Verbas
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {budgetsPagination.total} verbas encontradas • Página {budgetsPagination.page} de {budgetsPagination.totalPages}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => changePage(budgetsPagination.page - 1, 'budgets')} 
              disabled={budgetsPagination.page === 1}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-30' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-30'
              }`}
            >
              <FiChevronLeft />
            </button>
            <span className={`px-3 py-1 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
              {budgetsPagination.page}
            </span>
            <button 
              onClick={() => changePage(budgetsPagination.page + 1, 'budgets')} 
              disabled={budgetsPagination.page === budgetsPagination.totalPages}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-30' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-30'
              }`}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                {['Funcionário', 'Valor', 'Período', 'Tipo', 'Status'].map((h) => (
                  <th 
                    key={h} 
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
              {budgets.length > 0 ? budgets.map((budget) => (
                <tr 
                  key={budget.id} 
                  className={`transition-colors ${darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}`}
                >
                  <td className={`px-6 py-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <div className="font-medium">{budget.employeeName || 'N/A'}</div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      ID: {budget.employeeId || 'N/A'}
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    R$ {typeof budget.value === 'number' ? budget.value.toFixed(2) : '0.00'}
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {budget.month}/{budget.year}
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {budget.type || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      budget.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : budget.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {budget.status === 'approved' ? 'Aprovado' :
                       budget.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    {isFetchingBudgets ? (
                      <div className="flex flex-col items-center justify-center">
                        <FiRefreshCw className="animate-spin text-3xl mb-3 text-gray-900" />
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                          Buscando verbas...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <FiDollarSign className="text-3xl mb-3 text-gray-400" />
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                          Nenhuma verba encontrada
                        </p>
                        <button 
                          onClick={fetchBudgets}
                          className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          Buscar Novamente
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header antigo removido em favor do header minimalista com logo ALTERDATA */}

        {/* Header minimalista com logo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src="/images/image.png" alt="ALTERDATA" className="h-8 w-auto" />
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-gray-900 hover:text-gray-700">
            <FiLogOut />
            Sair
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { 
              title: 'Total de Candidatos', 
              value: pagination.total,
              format: (v) => new Intl.NumberFormat('pt-BR').format(v),
              valueClass: 'text-4xl',
              icon: <FiUsers className="text-gray-600" size={24} />,
              gradient: 'from-white to-white',
              bgGradient: 'from-white to-white',
              darkBg: 'from-white to-white'
            },
            { 
              title: 'Enviados', 
              value: stats.submitted, 
              icon: <FiSend className="text-gray-600" size={24} />,
              gradient: 'from-white to-white',
              bgGradient: 'from-white to-white',
              darkBg: 'from-white to-white'
            },
            { 
              title: 'Registros Hoje', 
              value: stats.todayAttendance, 
              icon: <FiClock className="text-gray-600" size={24} />,
              gradient: 'from-white to-white',
              bgGradient: 'from-white to-white',
              darkBg: 'from-white to-white'
            },
            { 
              title: 'Total Verbas', 
              value: stats.totalBudgets, 
              icon: <FiDollarSign className="text-gray-600" size={24} />,
              gradient: 'from-white to-white',
              bgGradient: 'from-white to-white',
              darkBg: 'from-white to-white'
            },
          ].map((stat, i) => (
            <div 
              key={i} 
              className={`rounded-2xl p-6 transition-all duration-300 hover:shadow-xl ${
                darkMode 
                  ? `bg-gradient-to-br ${stat.darkBg} border-gray-700` 
                  : `bg-gradient-to-br ${stat.bgGradient} border-gray-200`
              } border shadow-lg`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {stat.title}
                  </p>
                  <h3 className={`${stat.valueClass || 'text-3xl'} font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {stat.format ? stat.format(stat.value) : stat.value}
                  </h3>
                </div>
                <span className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow-lg`}>
                  {stat.icon}
                </span>
              </div>
            </div>
          ))}
        </div>



        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'candidates', name: 'Candidatos', icon: <FiUsers size={18} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-900'
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'candidates' && renderCandidatesTab()}
        {/* Attendance temporariamente desativado */}
        {/* {activeTab === 'attendance' && renderAttendanceTab()} */}
        {/* Budgets temporariamente desativado */}
        {/* {activeTab === 'budgets' && renderBudgetsTab()} */}

        <footer className="mt-12 text-center">
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            MediaWorks Dashboard • {new Date().getFullYear()} • Todos os direitos reservados
          </p>
        </footer>
      </div>
    </div>
  );
}