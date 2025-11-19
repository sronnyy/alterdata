// components/AdminComponents/Home.jsx
'use client';

import { useState, useEffect } from 'react';
import { 
  FiUsers, FiSend, FiLogOut, FiChevronLeft, FiChevronRight, 
  FiRefreshCw, FiSearch, FiClock, FiDollarSign, FiFilter,
  FiCalendar, FiUser, FiBriefcase, FiSettings, FiEye, FiEyeOff,
  FiChevronDown, FiChevronUp, FiPhone, FiMail, FiMapPin, FiFileText
} from 'react-icons/fi';
import { signOut } from 'next-auth/react';

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('budgets');
  
  // Estados para Candidatos
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [expandedCandidates, setExpandedCandidates] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para Marcações
  const [attendance, setAttendance] = useState([]);
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);

  // Estados para Verbas
  const [budgets, setBudgets] = useState([]);
  const [isFetchingBudgets, setIsFetchingBudgets] = useState(false);

  // Estados para Empresas
  const [companies, setCompanies] = useState([]);
  const [isFetchingCompanies, setIsFetchingCompanies] = useState(false);

  // Estados para Accordion de Verbas
  const [expandedBudgets, setExpandedBudgets] = useState([]);

  // Filtros
  const [filters, setFilters] = useState({
    name: '',
    documentNumber: '',
    email: '',
    phone: '',
    nationality: '',
    cnpj: '19214084000194',
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

  // Fetch Companies
  const fetchCompanies = async () => {
    setIsFetchingCompanies(true);
    try {
      const res = await fetch('/api/companies');
      if (!res.ok) throw new Error('Falha ao buscar empresas');
      
      const data = await res.json();
      setCompanies(data.records || []);
    } catch (e) {
      console.error('fetchCompanies error:', e);
      setCompanies([]);
    } finally {
      setIsFetchingCompanies(false);
    }
  };

  // Fetch Budgets
  const fetchBudgets = async () => {
    setIsFetchingBudgets(true);
    try {
      // Formatar mês com zero à esquerda (ex: "09" para setembro)
      const monthFormatted = String(budgetsFilters.month).padStart(2, '0');
      
      const params = new URLSearchParams({
        year: String(budgetsFilters.year),
        month: monthFormatted,
        companyId: budgetsFilters.companyId,
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

  const toggleCandidateExpansion = (id) =>
    setExpandedCandidates((prev) => 
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleSelectAll = () =>
    setSelectedCandidates((prev) => 
      prev.length === candidates.length ? [] : candidates.map((c) => c.id)
    );

  const toggleBudgetExpansion = (employeeId) =>
    setExpandedBudgets((prev) => 
      prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId]
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
  // Temporariamente desativado: Candidatos
  // useEffect(() => { 
  //   if (activeTab === 'candidates') fetchCandidates();
  // }, [
  //   filters.page,
  //   filters.pageSize,
  //   filters.name,
  //   filters.documentNumber,
  //   filters.email,
  //   filters.phone,
  //   filters.nationality,
  //   activeTab
  // ]);

  // Temporariamente desativado: Marcações (attendance)
  // useEffect(() => {
  //   if (activeTab === 'attendance') fetchAttendance();
  // }, [attendanceFilters.page, attendanceFilters.pageSize, activeTab]);

  // Carregar empresas ao montar o componente
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Verbas (budgets)
  useEffect(() => {
    if (activeTab === 'budgets') fetchBudgets();
  }, [budgetsFilters.page, budgetsFilters.pageSize, budgetsFilters.year, budgetsFilters.month, budgetsFilters.companyId, activeTab]);

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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
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
                  CNPJ
                </label>
                <input
                  type="text"
                  name="cnpj"
                  value={filters.cnpj}
                  onChange={handleFilterChange}
                  placeholder="00.000.000/0000-00"
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

        <div className="space-y-4">
          {candidates.length > 0 ? candidates.map((c) => (
            <div 
              key={c.id}
              className={`rounded-lg border transition-all duration-200 ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              } ${
                selectedCandidates.includes(c.id) 
                  ? (darkMode ? 'ring-2 ring-blue-500 border-blue-500' : 'ring-2 ring-blue-500 border-blue-500') 
                  : ''
              }`}
            >
              {/* Header do Accordion */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input 
                    type="checkbox"
                    checked={selectedCandidates.includes(c.id)}
                    onChange={() => toggleCandidateSelection(c.id)}
                    className={`rounded transition-colors ${
                      darkMode 
                        ? 'text-blue-600 bg-gray-700 border-gray-600' 
                        : 'text-blue-600 bg-white border-gray-300'
                    }`} 
                  />
                  <div className="flex-1">
                    <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {c.name}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        CPF: {c.cpf}
                      </span>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        ID: {c.id}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => toggleCandidateExpansion(c.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {expandedCandidates.includes(c.id) ? (
                    <FiChevronUp size={20} />
                  ) : (
                    <FiChevronDown size={20} />
                  )}
                </button>
              </div>

              {/* Conteúdo Expandido */}
              {expandedCandidates.includes(c.id) && (
                <div className={`border-t px-4 pb-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                    
                    {/* Coluna Esquerda - Informações Pessoais e Contato */}
                    <div className="space-y-4">
                      {/* Informações de Contato */}
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
                        <h5 className={`font-medium mb-3 flex items-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          <FiUser className="mr-2" size={16} />
                          Informações Pessoais
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <FiMail className="mr-2" size={14} />
                            <span className="font-medium mr-2">Email:</span>
                            {c.email}
                          </div>
                          <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <FiPhone className="mr-2" size={14} />
                            <span className="font-medium mr-2">Telefone:</span>
                            {c.phone}
                          </div>
                          <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <FiMapPin className="mr-2" size={14} />
                            <span className="font-medium mr-2">Nacionalidade:</span>
                            {c.nationality}
                          </div>
                          {c.hiringDate && (
                            <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              <FiCalendar className="mr-2" size={14} />
                              <span className="font-medium mr-2">Data de Contratação:</span>
                              {new Date(c.hiringDate).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Endereço Residencial */}
                      {c.documents && c.documents.filter(doc => doc.sectionName === 'Endereço Residencial').length > 0 && (
                        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <h5 className={`font-medium mb-3 flex items-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            <FiMapPin className="mr-2" size={16} />
                            Endereço Residencial
                          </h5>
                          <div className="space-y-1 text-sm">
                            {c.documents.filter(doc => doc.sectionName === 'Endereço Residencial').map((doc, idx) => {
                              const fieldLabels = {
                                'CEP': 'CEP',
                                'Logradouro': 'Logradouro',
                                'Número': 'Número',
                                'Complemento': 'Complemento',
                                'Bairro': 'Bairro',
                                'Cidade': 'Cidade',
                                'Estado': 'Estado'
                              };
                              return (
                                <div key={idx} className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  <span className="font-medium">{fieldLabels[doc.fieldName] || doc.fieldName}:</span> {doc.value}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Coluna Direita - Documentos */}
                    <div className="space-y-4">
                      {/* Documentos Principais - CPF, RG */}
                      {c.documents && (
                        <>
                          {/* CPF */}
                          {c.documents.filter(doc => doc.sectionName === 'Cadastro de Pessoas Físicas (CPF)').length > 0 && (
                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
                              <h5 className={`font-medium mb-3 flex items-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                <FiFileText className="mr-2" size={16} />
                                CPF
                              </h5>
                              <div className="space-y-1 text-sm">
                                {c.documents.filter(doc => doc.sectionName === 'Cadastro de Pessoas Físicas (CPF)').map((doc, idx) => (
                                  <div key={idx} className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <span className="font-medium">Número:</span> {doc.value}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* RG */}
                          {c.documents.filter(doc => doc.sectionName === 'Registro Geral (RG)').length > 0 && (
                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
                              <h5 className={`font-medium mb-3 flex items-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                <FiFileText className="mr-2" size={16} />
                                RG - Registro Geral
                              </h5>
                              <div className="space-y-1 text-sm">
                                {c.documents.filter(doc => doc.sectionName === 'Registro Geral (RG)').map((doc, idx) => {
                                  const fieldLabels = {
                                    'Número do documento': 'Número',
                                    'Nome completo': 'Nome Completo',
                                    'Órgão emissor': 'Órgão Emissor',
                                    'UF de emissão': 'UF',
                                    'Naturalidade': 'Naturalidade',
                                    'Data de expedição': 'Data de Expedição',
                                    'Nome da mãe': 'Nome da Mãe',
                                    'Nome do pai': 'Nome do Pai'
                                  };
                                  let displayValue = doc.value;
                                  if (doc.fieldName === 'Data de expedição') {
                                    displayValue = new Date(doc.value).toLocaleDateString('pt-BR');
                                  }
                                  return (
                                    <div key={idx} className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      <span className="font-medium">{fieldLabels[doc.fieldName] || doc.fieldName}:</span> {displayValue}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* CTPS */}
                          {c.documents.filter(doc => doc.sectionName === 'Carteira de Trabalho (CTPS)').length > 0 && (
                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
                              <h5 className={`font-medium mb-3 flex items-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                <FiBriefcase className="mr-2" size={16} />
                                CTPS - Carteira de Trabalho
                              </h5>
                              <div className="space-y-1 text-sm">
                                {c.documents.filter(doc => doc.sectionName === 'Carteira de Trabalho (CTPS)').map((doc, idx) => {
                                  const fieldLabels = {
                                    'Número do documento': 'Número',
                                    'Série da carteira': 'Série',
                                    'UF da carteira': 'UF',
                                    'Data de emissão': 'Data de Emissão'
                                  };
                                  let displayValue = doc.value;
                                  if (doc.fieldName === 'Data de emissão') {
                                    displayValue = new Date(doc.value).toLocaleDateString('pt-BR');
                                  }
                                  return (
                                    <div key={idx} className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      <span className="font-medium">{fieldLabels[doc.fieldName] || doc.fieldName}:</span> {displayValue}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* PIS */}
                          {c.documents.filter(doc => doc.sectionName === 'Programa de Integração Social (PIS)').length > 0 && (
                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
                              <h5 className={`font-medium mb-3 flex items-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                <FiFileText className="mr-2" size={16} />
                                PIS
                              </h5>
                              <div className="space-y-1 text-sm">
                                {c.documents.filter(doc => doc.sectionName === 'Programa de Integração Social (PIS)').map((doc, idx) => (
                                  <div key={idx} className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <span className="font-medium">Número:</span> {doc.value}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Título de Eleitor */}
                          {c.documents.filter(doc => doc.sectionName === 'Título de Eleitor').length > 0 && (
                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
                              <h5 className={`font-medium mb-3 flex items-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                <FiFileText className="mr-2" size={16} />
                                Título de Eleitor
                              </h5>
                              <div className="space-y-1 text-sm">
                                {c.documents.filter(doc => doc.sectionName === 'Título de Eleitor').map((doc, idx) => {
                                  const fieldLabels = {
                                    'Número do documento': 'Número',
                                    'Zona de votação': 'Zona',
                                    'Seção de votação': 'Seção'
                                  };
                                  return (
                                    <div key={idx} className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      <span className="font-medium">{fieldLabels[doc.fieldName] || doc.fieldName}:</span> {doc.value}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Certidão */}
                          {c.documents.filter(doc => doc.sectionName === 'Certidão de Nascimento ou Casamento').length > 0 && (
                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
                              <h5 className={`font-medium mb-3 flex items-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                <FiFileText className="mr-2" size={16} />
                                Certidão
                              </h5>
                              <div className="space-y-1 text-sm">
                                {c.documents.filter(doc => doc.sectionName === 'Certidão de Nascimento ou Casamento').map((doc, idx) => {
                                  const fieldLabels = {
                                    'Número do documento': 'Número',
                                    'Estado civil': 'Estado Civil'
                                  };
                                  return (
                                    <div key={idx} className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      <span className="font-medium">{fieldLabels[doc.fieldName] || doc.fieldName}:</span> {doc.value}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Uniforme */}
                          {c.documents.filter(doc => doc.sectionName === 'Uniforme').length > 0 && (
                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
                              <h5 className={`font-medium mb-3 flex items-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                <FiSettings className="mr-2" size={16} />
                                Uniforme
                              </h5>
                              <div className="space-y-1 text-sm">
                                {c.documents.filter(doc => doc.sectionName === 'Uniforme').map((doc, idx) => {
                                  const fieldLabels = {
                                    'UNIFORME _ CALÇA': 'Calça',
                                    'UNIFORME _ CAMISA': 'Camisa'
                                  };
                                  return (
                                    <div key={idx} className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      <span className="font-medium">{fieldLabels[doc.fieldName] || doc.fieldName}:</span> {doc.value}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Status */}
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
                        <h5 className={`font-medium mb-3 flex items-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          <FiSettings className="mr-2" size={16} />
                          Status
                        </h5>
                        <div className="space-y-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            c.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {c.status === 'active' ? 'Ativo' : 'Pendente'}
                          </span>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Criado em: {new Date(c.createdAt || Date.now()).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div className="py-12 text-center">
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
            </div>
          )}
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
              disabled={isFetchingBudgets || !budgetsFilters.companyId}
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
                  Empresa <span className="text-red-500">*</span>
                </label>
                <select
                  name="companyId"
                  value={budgetsFilters.companyId}
                  onChange={handleBudgetsFilterChange}
                  disabled={isFetchingCompanies}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-900 disabled:opacity-50' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900 disabled:opacity-50'
                  } focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20`}
                >
                  <option value="">Selecione uma empresa</option>
                  {companies.map((company) => (
                    <option key={company.id || company._id} value={company.id || company._id}>
                      {company.name || company.companyName || company.id || company._id}
                    </option>
                  ))}
                </select>
                {isFetchingCompanies && (
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Carregando empresas...
                  </p>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Informações da Empresa Selecionada */}
      {budgetsFilters.companyId && (() => {
        const selectedCompany = companies.find(c => (c.id || c._id) === budgetsFilters.companyId);
        return selectedCompany ? (
          <div className={`rounded-xl shadow-lg p-6 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Informações da Empresa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <div>
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Nome
                  </label>
                  <p className={`mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {selectedCompany.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Razão Social
                  </label>
                  <p className={`mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {selectedCompany.legalName || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    CNPJ / Registro
                  </label>
                  <p className={`mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {selectedCompany.registrationNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Status
                  </label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                    selectedCompany.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedCompany.active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>

              {/* Endereço */}
              {selectedCompany.address && (
                <div className="space-y-4">
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Endereço
                    </label>
                    <div className={`mt-1 space-y-1 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {selectedCompany.address.street && (
                        <p>
                          {selectedCompany.address.street}
                          {selectedCompany.address.number && `, ${selectedCompany.address.number}`}
                          {selectedCompany.address.complement && Object.keys(selectedCompany.address.complement).length > 0 && 
                            ` - ${Object.values(selectedCompany.address.complement).join(', ')}`
                          }
                        </p>
                      )}
                      {selectedCompany.address.district && (
                        <p>{selectedCompany.address.district}</p>
                      )}
                      <p>
                        {selectedCompany.address.city && `${selectedCompany.address.city}`}
                        {selectedCompany.address.state && `, ${selectedCompany.address.state}`}
                        {selectedCompany.address.zipCode && ` - ${selectedCompany.address.zipCode}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Logo (se existir) */}
              {selectedCompany.logo && (
                <div className="md:col-span-2">
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Logo
                  </label>
                  <div className="mt-2">
                    <img 
                      src={selectedCompany.logo} 
                      alt={selectedCompany.name || 'Logo da empresa'} 
                      className="max-h-32 max-w-32 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null;
      })()}

      {/* Lista de Verbas Agrupadas por Funcionário */}
      <div className={`rounded-xl shadow-lg overflow-hidden transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Verbas por Funcionário
              </h3>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {budgetsPagination.total} {budgetsPagination.total === 1 ? 'funcionário encontrado' : 'funcionários encontrados'} • Página {budgetsPagination.page} de {budgetsPagination.totalPages}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => changePage(budgetsPagination.page - 1, 'budgets')} 
                disabled={budgetsPagination.page === 1}
                className={`p-2 rounded-lg transition-all ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-300'
                }`}
              >
                <FiChevronLeft size={18} />
              </button>
              <span className={`px-4 py-2 rounded-lg font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700 border border-gray-300'}`}>
                {budgetsPagination.page} / {budgetsPagination.totalPages}
              </span>
              <button 
                onClick={() => changePage(budgetsPagination.page + 1, 'budgets')} 
                disabled={budgetsPagination.page === budgetsPagination.totalPages}
                className={`p-2 rounded-lg transition-all ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-300'
                }`}
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {budgets.length > 0 ? (
            <div className="space-y-4">
              {budgets.map((funcionario, idx) => {
                const totalEvents = funcionario.events?.length || 0;
                const totalValue = funcionario.events?.reduce((sum, e) => {
                  const val = parseFloat(e.decimal || e.value || 0);
                  return sum + (isNaN(val) ? 0 : val);
                }, 0) || 0;
                const employeeId = funcionario.employeeId || idx;
                const isExpanded = expandedBudgets.includes(employeeId);

                return (
                  <div 
                    key={employeeId} 
                    className={`rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                      isExpanded
                        ? 'border-orange-400 shadow-lg'
                        : darkMode 
                          ? 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:shadow-lg' 
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
                    }`}
                  >
                    {/* Header do Funcionário - Clicável */}
                    <button
                      onClick={() => toggleBudgetExpansion(employeeId)}
                      className={`w-full p-5 transition-all duration-200 ${
                        darkMode 
                          ? 'bg-gray-800 hover:bg-gray-750' 
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 text-left">
                          <div className={`p-3 rounded-lg transition-colors ${
                            darkMode 
                              ? 'bg-gray-700' 
                              : 'bg-gray-100'
                          }`}>
                            <FiUser className={darkMode ? 'text-gray-300' : 'text-gray-600'} size={24} />
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-lg font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                              Funcionário
                            </h4>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-medium px-3 py-1 rounded ${
                                darkMode 
                                  ? 'bg-gray-700 text-gray-300' 
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                ID: {funcionario.employeeId || 'N/A'}
                              </span>
                              {funcionario.externalId && (
                                <span className={`text-xs font-medium px-3 py-1 rounded ${
                                  darkMode 
                                    ? 'bg-gray-700 text-gray-300' 
                                    : 'bg-gray-200 text-gray-700'
                                }`}>
                                  Registro: {funcionario.externalId}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`text-right ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            <div className="text-2xl font-bold">
                              {totalEvents}
                            </div>
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {totalEvents === 1 ? 'evento' : 'eventos'}
                            </div>
                            {totalValue !== 0 && (
                              <div className="text-sm font-semibold mt-1">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                  minimumFractionDigits: 2
                                }).format(totalValue)}
                              </div>
                            )}
                          </div>
                          <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            <FiChevronDown className={isExpanded ? 'text-orange-500' : (darkMode ? 'text-gray-300' : 'text-gray-600')} size={24} />
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Conteúdo do Accordion */}
                    <div className={`transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                    }`}>
                      <div className="p-5 bg-white">
                        {funcionario.events && funcionario.events.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {funcionario.events.map((event, eventIdx) => {
                              const eventValue = parseFloat(event.decimal || event.value || 0);
                              const isPositive = eventValue >= 0;
                              
                              return (
                                <div
                                  key={eventIdx}
                                  className="rounded-lg border border-gray-200 p-4 bg-white transition-all duration-200 hover:shadow-md hover:border-gray-300"
                                >
                                  {/* Header do Evento */}
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className="text-xs font-bold px-3 py-1 rounded bg-[#1E3A8A] text-white">
                                          {event.eventCode || 'N/A'}
                                        </span>
                                        {event.type && (
                                          <span className={`text-xs px-3 py-1 rounded font-medium ${
                                            event.type.toLowerCase().includes('credit') || event.type.toLowerCase().includes('provento')
                                              ? 'bg-green-100 text-green-800 border border-green-300'
                                              : 'bg-red-100 text-red-800 border border-red-300'
                                          }`}>
                                            {event.type}
                                          </span>
                                        )}
                                      </div>
                                      <h5 className="font-semibold text-sm text-gray-900">
                                        {event.description || 'Sem descrição'}
                                      </h5>
                                    </div>
                                  </div>

                                {/* Detalhes do Evento */}
                                <div className="space-y-2 mt-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-600">
                                      <FiCalendar size={12} className="inline mr-1" />
                                      Data
                                    </span>
                                    <span className="text-xs font-medium text-gray-700">
                                      {event.date ? new Date(event.date).toLocaleDateString('pt-BR') : 'N/A'}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-600">
                                      <FiDollarSign size={12} className="inline mr-1 text-orange-500" />
                                      Valor
                                    </span>
                                    <span className={`text-sm font-bold ${
                                      isPositive 
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }`}>
                                      {!isNaN(eventValue) ? new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                      }).format(eventValue) : (event.value || '0.00')}
                                    </span>
                                  </div>

                                  {event.hm && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-600">
                                        <FiClock size={12} className="inline mr-1" />
                                        Horas
                                      </span>
                                      <span className="text-xs font-medium text-gray-700">
                                        {event.hm}
                                      </span>
                                    </div>
                                  )}

                                  {event.decimal !== null && event.decimal !== undefined && event.decimal !== eventValue && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-600">
                                        Decimal
                                      </span>
                                      <span className="text-xs font-medium text-gray-700">
                                        {event.decimal}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          </div>
                        ) : (
                          <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <FiFileText size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhum evento encontrado para este funcionário.</p>
                          </div>
                        )}

                        {/* Footer com Total */}
                        {totalValue !== 0 && (
                          <div className="mt-6 px-5 py-3 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600">
                                Total de Verbas:
                              </span>
                              <span className={`text-lg font-bold ${
                                totalValue >= 0 
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}>
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(totalValue)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              {isFetchingBudgets ? (
                <div className="flex flex-col items-center justify-center">
                  <FiRefreshCw className={`animate-spin text-4xl mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Buscando verbas...
                  </p>
                  <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Aguarde enquanto carregamos os dados
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className={`p-4 rounded-full mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <FiDollarSign className={`text-4xl ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  </div>
                  <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nenhuma verba encontrada
                  </p>
                  <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Selecione uma empresa e período para buscar verbas
                  </p>
                  <button 
                    onClick={fetchBudgets}
                    className="mt-6 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium shadow-md hover:shadow-lg"
                  >
                    Buscar Novamente
                  </button>
                </div>
              )}
            </div>
          )}
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
                // { id: 'candidates', name: 'Candidatos', icon: <FiUsers size={18} /> },
                { id: 'budgets', name: 'Verbas', icon: <FiDollarSign size={18} /> },
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
        {/* {activeTab === 'candidates' && renderCandidatesTab()} */}
        {/* Attendance temporariamente desativado */}
        {/* {activeTab === 'attendance' && renderAttendanceTab()} */}
        {activeTab === 'budgets' && renderBudgetsTab()}

        <footer className="mt-12 text-center">
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            MediaWorks Dashboard • {new Date().getFullYear()} • Todos os direitos reservados
          </p>
        </footer>
      </div>
    </div>
  );
}