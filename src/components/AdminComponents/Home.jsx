'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiSend, FiLogOut, FiFilter, FiChevronLeft, FiChevronRight, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { signOut } from 'next-auth/react';


const Dashboard = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    documentNumber: '',
    email: '',
    phone: '',
    nationality: '',
    page: 1,
    pageSize: 10
  });
  const logout = async () => {
  await signOut({ redirect: true, callbackUrl: '/' });
};
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    submitted: 0
  });

  // Buscar candidatos da API
  // Buscar candidatos da API
  const fetchCandidates = async () => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        pageSize: filters.pageSize.toString(),
        ...(filters.name && { name: filters.name }),
        ...(filters.documentNumber && { documentNumber: filters.documentNumber }),
        ...(filters.email && { email: filters.email }),
        ...(filters.phone && { phone: filters.phone }),
        ...(filters.nationality && { nationality: filters.nationality }),
      });

      const response = await fetch(`/api/candidates?${params}`);

      if (!response.ok) {
        throw new Error('Erro ao buscar candidatos');
      }

      const data = await response.json();

      setCandidates(data.records);
      setPagination({
        page: data.metadata.currentPage,
        pageSize: data.metadata.perPage,
        total: data.metadata.totalCount,
        totalPages: data.metadata.totalPages
      });

      // Atualiza o total de candidatos com o valor da API
      setStats(prev => ({
        ...prev,
        totalCandidates: data.metadata.totalCount
      }));

    } catch (error) {
      console.error("Erro ao buscar candidatos:", error);
      // Em caso de erro, define o total de candidatos como 0
      setStats(prev => ({ ...prev, totalCandidates: 0 }));
      setCandidates([]); // Limpa a lista de candidatos
      setPagination(prev => ({ ...prev, total: 0, totalPages: 0 })); // Reseta a paginação
    } finally {
      setIsFetching(false);
    }
  };

  // Enviar candidatos selecionados (simulação)
  const submitCandidates = async () => {
    if (selectedCandidates.length === 0) {
      alert('Selecione pelo menos um candidato');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Candidatos enviados:', selectedCandidates);

      setStats(prev => ({
        ...prev,
        submitted: prev.submitted + selectedCandidates.length
      }));

      setSelectedCandidates([]);
      alert(`${selectedCandidates.length} candidatos enviados com sucesso!`);
    } catch (error) {
      console.error("Erro ao enviar candidatos:", error);
      alert('Erro ao enviar candidatos');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCandidateSelection = (candidateId) => {
    if (selectedCandidates.includes(candidateId)) {
      setSelectedCandidates(selectedCandidates.filter(id => id !== candidateId));
    } else {
      setSelectedCandidates([...selectedCandidates, candidateId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedCandidates.length === candidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(candidates.map(c => c.id));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1
    }));
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({
        ...prev,
        page: newPage
      }));
    }
  };

  const clearCandidates = () => {
    setCandidates([]);
    setStats(prev => ({ ...prev, totalCandidates: 0 })); // Reset para 0
  };

  useEffect(() => {
    fetchCandidates();
  }, [filters.page, filters.pageSize]);

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark:bg-gray-900 bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
      <div className="p-6 max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
              AT
            </div>
            <div className='text-gray-900'>
              <h1 className="text-3xl font-bold text-gray-900 "> Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gerenciamento de Candidatos</p>
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={logout} className="px-4 py-2 bg-gradient-to-r from-red-400 to-red-600 text-white rounded-lg shadow hover:shadow-md transition-all flex items-center gap-2">
              Sair
              <FiLogOut className="inline" />
            </button>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          {[
            {
              title: "Total Candidatos",
              value: stats.totalCandidates,
              icon: <FiUsers className="text-blue-500" size={24} />,
              change: '+24%'
            },
            {
              title: "Enviados",
              value: stats.submitted,
              icon: <FiSend className="text-purple-500" size={24} />,
              change: '+12%'
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`rounded-xl shadow-sm p-6 border transition-all ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-100 hover:border-gray-200'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.title}</p>
                  <h3 className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {stat.value}
                  </h3>
                </div>
                <span className={`p-3 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  {stat.icon}
                </span>
              </div>
              {/* <div className="mt-4 flex justify-between items-center">
                <div className={`text-sm ${stat.change.includes('-') ? 'text-red-500' : 'text-green-500'}`}>
                  {stat.change} ↑
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  vs último mês
                </div>
              </div> */}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-xl shadow-lg p-6 mb-6 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
        >
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Gerenciamento de Candidatos
            </h2>

            <div className="flex flex-wrap gap-3">
              {/* <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
              >
                <FiFilter /> Filtros
              </button>
x */}
              <button
                onClick={fetchCandidates}
                disabled={isFetching}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isFetching ? <FiRefreshCw className="animate-spin" /> : <FiSearch />}
                {isFetching ? 'Buscando...' : 'Buscar Candidatos'}
              </button>

              <button
                onClick={clearCandidates}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Limpar Candidatos
              </button>

              <button
                onClick={submitCandidates}
                disabled={isSubmitting || selectedCandidates.length === 0}
                className={`px-4 py-2 rounded-lg text-white font-medium shadow-md flex items-center gap-2 transition-all disabled:opacity-50 ${isSubmitting
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                  : 'bg-gradient-to-r from-green-500 to-green-600'
                  }`}
              >
                {isSubmitting ? <FiRefreshCw className="animate-spin" /> : <FiSend />}
                {isSubmitting ? 'Enviando...' : `Enviar (${selectedCandidates.length})`}
              </button>
            </div>
          </div>

          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Nome</label>
                  <input
                    type="text"
                    name="name"
                    value={filters.name}
                    onChange={handleFilterChange}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Nome do candidato"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>CPF</label>
                  <input
                    type="text"
                    name="documentNumber"
                    value={filters.documentNumber}
                    onChange={handleFilterChange}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="CPF"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={filters.email}
                    onChange={handleFilterChange}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Email"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Telefone</label>
                  <input
                    type="text"
                    name="phone"
                    value={filters.phone}
                    onChange={handleFilterChange}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Telefone"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Nacionalidade</label>
                  <input
                    type="text"
                    name="nationality"
                    value={filters.nationality}
                    onChange={handleFilterChange}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Nacionalidade"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Itens por página</label>
                  <select
                    name="pageSize"
                    value={filters.pageSize}
                    onChange={handleFilterChange}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-xl shadow-lg overflow-hidden transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
        >
          <div className="p-4 border-b flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Lista de Candidatos
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {pagination.total} candidatos encontrados | Página {pagination.page} de {pagination.totalPages}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => changePage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300 disabled:opacity-30' : 'bg-gray-200 text-gray-700 disabled:opacity-30'}`}
              >
                <FiChevronLeft />
              </button>

              <span className={`px-3 py-1 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                {pagination.page}
              </span>

              <button
                onClick={() => changePage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300 disabled:opacity-30' : 'bg-gray-200 text-gray-700 disabled:opacity-30'}`}
              >
                <FiChevronRight />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.length === candidates.length && candidates.length > 0}
                      onChange={toggleSelectAll}
                      className={`rounded ${darkMode ? 'text-blue-500' : 'text-blue-600'}`}
                    />
                  </th>
                  {['Nome', 'CPF', 'Email', 'Telefone', 'Nacionalidade'].map((header, i) => (
                    <th
                      key={i}
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                {candidates.length > 0 ? (
                  candidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className={`transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${selectedCandidates.includes(candidate.id) ? (darkMode ? 'bg-gray-700' : 'bg-blue-50') : ''
                        }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(candidate.id)}
                          onChange={() => toggleCandidateSelection(candidate.id)}
                          className={`rounded ${darkMode ? 'text-blue-500' : 'text-blue-600'}`}
                        />
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        <div className="font-medium">{candidate.name}</div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          ID: {candidate.id}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {candidate.cpf}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {candidate.email}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {candidate.phone}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {candidate.nationality}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center">
                      {isFetching ? (
                        <div className="flex flex-col items-center justify-center">
                          <FiRefreshCw className="animate-spin text-3xl mb-2 text-blue-500" />
                          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                            Buscando candidatos...
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                            Nenhum candidato encontrado. Tente ajustar seus filtros.
                          </p>
                          <button
                            onClick={fetchCandidates}
                            className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow"
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
        </motion.div>

        <footer className="mt-8 text-center">
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            MediaWorks Dashboard • {new Date().getFullYear()} • Todos os direitos reservados
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;