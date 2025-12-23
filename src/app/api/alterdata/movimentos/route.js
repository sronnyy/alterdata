import { NextResponse } from 'next/server';

const ALTERDATA_API_URL = 'https://dp.pack.alterdata.com.br/api/v1/movimentos';
const ALTERDATA_EMPRESAS_URL = 'https://dp.pack.alterdata.com.br/api/v1/empresas';
const ALTERDATA_FUNCIONARIOS_URL = 'https://dp.pack.alterdata.com.br/api/v1/funcionarios';
const ALTERDATA_EVENTOS_URL = 'https://dp.pack.alterdata.com.br/api/v1/eventos';
const ALTERDATA_TIPOS_MOVIMENTO_URL = 'https://dp.pack.alterdata.com.br/api/v1/tipos-movimento';
const FLASH_COMPANIES_URL = 'https://api.flashapp.services/core/v1/companies';

// Função auxiliar para formatar data para ISO
function formatDateISO(dateStr) {
  if (!dateStr) return null;
  
  // Se já está no formato ISO
  if (dateStr.includes('T')) {
    return dateStr;
  }
  
  // Se está no formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return `${dateStr}T03:00:00Z`;
  }
  
  return dateStr;
}

// Função auxiliar para obter período do mês/ano
function getPeriodFromYearMonth(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Último dia do mês
  
  return {
    inicio: startDate.toISOString(),
    fim: endDate.toISOString()
  };
}

// Mapeamento de nomes de empresas Flash para nomes de empresas AlterData
// Quando o nome na Flash é diferente do nome na AlterData
const MAPEAMENTO_EMPRESAS_FLASH_ALTERDATA = {
  '2T SERVICE': 'TEODORO CONSTRUÇÕES SERVIÇOS E ADM IMOBILIARIA LTD',
  // Adicionar outros mapeamentos aqui conforme necessário
};

// Mapeamento de eventCode Flash para código Verba AlterData
// Baseado na tabela de mapeamento fornecida
const EVENT_CODE_TO_VERBA_ALTERDATA = {
  '1032': '143', // Grupo de Eventos #3 → Dias de Atestado
  '421': '412',  // H.E. Dia de Trabalho 1o.P. Diurno → Hora Extra c/ 50%
  '423': '413',  // H.E. Dia Útil Não Trab. 1o.P. Diurno → Hora Extra c/ 100%
  '426': '413',  // H.E. Folga Semanal 1o.P. Diurno → Hora Extra c/ 100%
  '429': '413',  // H.E. Feriado 1o.P. Diurno → Hora Extra c/ 100%
  '432': '412',  // H.E. Dia de Trabalho 1o.P. Noturno → Hora Extra c/ 50%
  '434': '413',  // H.E. Dia Útil Não Trab. 1o.P. Noturno → Hora Extra c/ 100%
  '437': '413',  // H.E. Folga Semanal 1o.P. Noturno → Hora Extra c/ 100%
  '440': '413',  // H.E. Feriado 1o.P. Noturno → Hora Extra c/ 100%
  '443': '314',  // H.E. Redução de Intervalo → Intrajornada
  '505': '460',  // Horas Negativas a Descontar → Atrasos
  '510': '399',  // Total de horas de faltas que foram para desconto completo → Faltas
  '852': '313',  // Qtde Horas DSR para Descontar → Desconto de DSR sobre faltas
  '604': '19',   // ADN - Adicional Noturno → Noturno 30% (padrão: 19, alternativo: 319 para Ad. Norturno 20%)
};

// Cache de eventos já buscados: código verba → { eventoId, tipomovimentoId, nome }
const cacheEventosAlterData = {};

// Função para buscar um evento específico da AlterData por código
// Baseada na tabela de mapeamento fornecida
async function buscarEventoAlterDataPorCodigo(codigoVerba) {
  // Se já está em cache, retornar do cache
  if (cacheEventosAlterData[codigoVerba]) {
    return cacheEventosAlterData[codigoVerba];
  }
  
  const token = process.env.ALTERDATA_API_TOKEN;
  
  if (!token) {
    throw new Error('ALTERDATA_API_TOKEN não configurado no .env');
  }
  
  console.log('📋 [ALTERDATA MOVIMENTOS API] ==========================================');
  console.log(`🔍 [ALTERDATA MOVIMENTOS API] Buscando evento AlterData por código: ${codigoVerba}`);
  
  try {
    // Buscar evento específico por código usando filtro
    const eventosUrl = new URL(ALTERDATA_EVENTOS_URL);
    eventosUrl.searchParams.append('filter[eventos][codigo][EQ]', codigoVerba);
    eventosUrl.searchParams.append('page[offset]', '0');
    eventosUrl.searchParams.append('page[limit]', '1');
    eventosUrl.searchParams.append('include', 'tipomovimento');
    
    console.log(`📋 [ALTERDATA MOVIMENTOS API] URL: ${eventosUrl.toString()}`);
    console.log('📋 [ALTERDATA MOVIMENTOS API] ==========================================');
    
    const response = await fetch(eventosUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.api+json'
      }
    });
    
    console.log(`📋 [ALTERDATA MOVIMENTOS API] Status da resposta: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [ALTERDATA MOVIMENTOS API] ===== ERRO NA RESPOSTA =====');
      console.error(errorText);
      console.error('❌ [ALTERDATA MOVIMENTOS API] ============================');
      throw new Error(`Erro ao buscar evento AlterData: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log('📋 [ALTERDATA MOVIMENTOS API] ===== RESPOSTA COMPLETA DA API DE EVENTOS =====');
    console.log(JSON.stringify(data, null, 2));
    console.log('📋 [ALTERDATA MOVIMENTOS API] ===============================================');
    
    const eventos = Array.isArray(data.data) ? data.data : [];
    
    console.log(`📋 [ALTERDATA MOVIMENTOS API] Total de eventos na resposta: ${eventos.length}`);
    
    if (eventos.length === 0) {
      console.error(`❌ [ALTERDATA MOVIMENTOS API] Evento com código "${codigoVerba}" não encontrado`);
      throw new Error(`Evento com código "${codigoVerba}" não encontrado na AlterData`);
    }
    
    const evento = eventos[0];
    
    console.log('📋 [ALTERDATA MOVIMENTOS API] ===== DETALHES DO EVENTO ENCONTRADO =====');
    console.log(JSON.stringify({
      id: evento.id,
      type: evento.type,
      codigo: evento.attributes?.codigo,
      nome: evento.attributes?.nome,
      descricao: evento.attributes?.descricao,
      attributesCompletos: evento.attributes,
      relationships: evento.relationships,
      tipomovimentoId: evento.relationships?.tipomovimento?.data?.id
    }, null, 2));
    console.log('📋 [ALTERDATA MOVIMENTOS API] ===========================================');
    
    const tipomovimentoId = evento.relationships?.tipomovimento?.data?.id || '1'; // Padrão: 1 (Folha)
    
    const eventoInfo = {
      eventoId: evento.id,
      tipomovimentoId: tipomovimentoId,
      nome: evento.attributes?.nome || `Evento ${codigoVerba}`,
      codigo: codigoVerba
    };
    
    console.log('📋 [ALTERDATA MOVIMENTOS API] ===== INFORMAÇÕES PROCESSADAS DO EVENTO =====');
    console.log(JSON.stringify(eventoInfo, null, 2));
    console.log('📋 [ALTERDATA MOVIMENTOS API] =============================================');
    
    // Armazenar no cache
    cacheEventosAlterData[codigoVerba] = eventoInfo;
    
    console.log(`✅ [ALTERDATA MOVIMENTOS API] Evento encontrado: código ${codigoVerba} → ID ${eventoInfo.eventoId} (${eventoInfo.nome})`);
    console.log('📋 [ALTERDATA MOVIMENTOS API] ==========================================');
    
    return eventoInfo;
    
  } catch (error) {
    console.error(`❌ [ALTERDATA MOVIMENTOS API] Erro ao buscar evento por código ${codigoVerba}:`, error.message);
    throw error;
  }
}

// Função para buscar empresas da AlterData
async function buscarEmpresasAlterData() {
  const token = process.env.ALTERDATA_API_TOKEN;
  
  if (!token) {
    throw new Error('ALTERDATA_API_TOKEN não configurado no .env');
  }
  
  const url = new URL(ALTERDATA_EMPRESAS_URL);
  url.searchParams.append('page[offset]', '0');
  url.searchParams.append('page[limit]', '1000'); // Buscar muitas empresas
  
  console.log('📋 [ALTERDATA MOVIMENTOS API] ==========================================');
  console.log('📋 [ALTERDATA MOVIMENTOS API] Buscando empresas da AlterData...');
  console.log(`📋 [ALTERDATA MOVIMENTOS API] URL: ${url.toString()}`);
  console.log('📋 [ALTERDATA MOVIMENTOS API] ==========================================');
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.api+json'
    }
  });
  
  console.log(`📋 [ALTERDATA MOVIMENTOS API] Status da resposta: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [ALTERDATA MOVIMENTOS API] ===== ERRO NA RESPOSTA =====');
    console.error(errorText);
    console.error('❌ [ALTERDATA MOVIMENTOS API] ============================');
    throw new Error(`Erro ao buscar empresas da AlterData: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  
  console.log('📋 [ALTERDATA MOVIMENTOS API] ===== RESPOSTA COMPLETA DA API DE EMPRESAS =====');
  console.log(JSON.stringify(data, null, 2));
  console.log('📋 [ALTERDATA MOVIMENTOS API] =================================================');
  
  const empresas = Array.isArray(data.data) ? data.data : [];
  
  console.log(`📋 [ALTERDATA MOVIMENTOS API] Total de empresas na resposta: ${empresas.length}`);
  console.log('📋 [ALTERDATA MOVIMENTOS API] ===== DETALHES DAS EMPRESAS =====');
  
  empresas.forEach((empresa, index) => {
    console.log(`📋 [ALTERDATA MOVIMENTOS API] Empresa ${index + 1}:`, {
      id: empresa.id,
      type: empresa.type,
      nome: empresa.attributes?.nome || empresa.attributes?.razaoSocial || 'Sem nome',
      razaoSocial: empresa.attributes?.razaoSocial,
      cnpj: empresa.attributes?.cnpj,
      ativa: empresa.attributes?.ativa,
      attributesCompletos: empresa.attributes,
      relationships: empresa.relationships
    });
  });
  
  console.log('📋 [ALTERDATA MOVIMENTOS API] ===========================================');
  
  // Formatar empresas: { nome: { id, externoid, ... } }
  const empresasMap = {};
  empresas.forEach(empresa => {
    const nome = empresa.attributes?.nome || empresa.attributes?.razaoSocial || '';
    if (nome) {
      // Normalizar nome para comparação (remover espaços extras, converter para maiúsculas)
      const nomeNormalizado = nome.trim().toUpperCase();
      empresasMap[nomeNormalizado] = {
        id: empresa.id,
        externoid: empresa.attributes?.externoid || empresa.attributes?.externoId || null,
        nomeOriginal: nome,
        nomeNormalizado: nomeNormalizado
      };
    }
  });
  
  // Log do mapeamento de empresas com externoid
  console.log('📋 [ALTERDATA MOVIMENTOS API] ===== MAPEAMENTO DE EMPRESAS COM EXTERNOID =====');
  Object.entries(empresasMap).forEach(([nome, dados]) => {
    console.log(`📋 [ALTERDATA MOVIMENTOS API] "${nome}": ID=${dados.id}, EXTERNOID=${dados.externoid}`);
  });
  console.log('📋 [ALTERDATA MOVIMENTOS API] ================================================');
  
  console.log(`✅ [ALTERDATA MOVIMENTOS API] ${Object.keys(empresasMap).length} empresa(s) carregada(s) da AlterData`);
  console.log('📋 [ALTERDATA MOVIMENTOS API] ==========================================');
  
  return empresasMap;
}

// Função para buscar nome da empresa na Flash
async function buscarNomeEmpresaFlash(companyId) {
  const flashToken = process.env.FLASH_AUTH;
  
  if (!flashToken) {
    throw new Error('FLASH_AUTH não configurado no .env');
  }
  
  try {
    const response = await fetch(`${FLASH_COMPANIES_URL}/${companyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-flash-auth': flashToken,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar empresa na Flash: ${response.status}`);
    }
    
    const company = await response.json();
    const nome = company.name || company.companyName || '';
    
    if (!nome) {
      throw new Error(`Empresa Flash (ID: ${companyId}) não possui nome cadastrado`);
    }
    
    return nome.trim();
  } catch (error) {
    console.error(`❌ [ALTERDATA MOVIMENTOS API] Erro ao buscar empresa Flash:`, error);
    throw new Error(`Não foi possível buscar empresa na Flash: ${error.message}`);
  }
}

// Função para encontrar ID da AlterData pelo nome da empresa
function encontrarIdAlterDataPorNome(nomeFlash, empresasAlterData) {
  const nomeNormalizado = nomeFlash.trim().toUpperCase();
  
  // 1. Verificar se existe mapeamento manual primeiro
  const nomeAlterDataMapeado = MAPEAMENTO_EMPRESAS_FLASH_ALTERDATA[nomeNormalizado];
  if (nomeAlterDataMapeado) {
    const nomeAlterDataNormalizado = nomeAlterDataMapeado.trim().toUpperCase();
    if (empresasAlterData[nomeAlterDataNormalizado]) {
      console.log(`✅ [ALTERDATA MOVIMENTOS API] Mapeamento manual: "${nomeFlash}" → "${nomeAlterDataMapeado}"`);
      return empresasAlterData[nomeAlterDataNormalizado].id;
    }
  }
  
  // 2. Tentar match exato
  if (empresasAlterData[nomeNormalizado]) {
    return empresasAlterData[nomeNormalizado].id;
  }
  
  // 3. Tentar match parcial (caso o nome tenha diferenças pequenas)
  for (const [nomeAlt, dados] of Object.entries(empresasAlterData)) {
    if (nomeAlt.includes(nomeNormalizado) || nomeNormalizado.includes(nomeAlt)) {
      console.log(`⚠️ [ALTERDATA MOVIMENTOS API] Match parcial encontrado: "${nomeFlash}" ≈ "${dados.nomeOriginal}"`);
      return dados.id;
    }
  }
  
  return null;
}

// Função para buscar funcionários da AlterData de uma empresa e criar mapa matrícula → id
async function buscarFuncionariosAlterDataPorEmpresa(empresaIdAlterData) {
  const token = process.env.ALTERDATA_API_TOKEN;
  
  if (!token) {
    throw new Error('ALTERDATA_API_TOKEN não configurado no .env');
  }
  
  console.log(`👤 [ALTERDATA MOVIMENTOS API] Buscando funcionários da empresa AlterData ID: ${empresaIdAlterData}`);
  
  const url = new URL(ALTERDATA_FUNCIONARIOS_URL);
  url.searchParams.append('filter[funcionarios][empresa.id][EQ]', empresaIdAlterData);
  url.searchParams.append('filter[funcionarios][status][EQ]', 'ativo');
  url.searchParams.append('page[offset]', '0');
  url.searchParams.append('page[limit]', '1000'); // Buscar muitos funcionários
  url.searchParams.append('fields[funcionarios]', 'codigo,nome,status');
  url.searchParams.append('sort[funcionarios]', 'codigo');
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.api+json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao buscar funcionários da AlterData: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  const funcionarios = Array.isArray(data.data) ? data.data : [];
  
  // Criar mapa: matrícula (codigo) → id do funcionário
  const mapaMatriculaId = {};
  funcionarios.forEach(func => {
    const codigo = func.attributes?.codigo;
    if (codigo) {
      // Normalizar código (remover espaços, zeros à esquerda podem ser importantes)
      const codigoNormalizado = String(codigo).trim();
      mapaMatriculaId[codigoNormalizado] = func.id;
    }
  });
  
  console.log(`✅ [ALTERDATA MOVIMENTOS API] ${Object.keys(mapaMatriculaId).length} funcionário(s) encontrado(s) na AlterData`);
  console.log(`📋 [ALTERDATA MOVIMENTOS API] Mapa de matrículas:`, Object.keys(mapaMatriculaId).slice(0, 10).join(', '), '...');
  
  return mapaMatriculaId;
}

// Função para mapear verba Flash para movimento AlterData
async function mapBudgetToMovimento(event, funcionario, alterDataCompanyId, mapaMatriculaId, year, month) {
  const period = getPeriodFromYearMonth(parseInt(year), parseInt(month));
  
  // Usar o eventCode que já vem da API de verbas (já é o código correto da AlterData)
  const codigoVerbaAlterData = String(event.eventCode || '');
  
  console.log(`🔍 [ALTERDATA MOVIMENTOS API] Mapeamento de verba:`);
  console.log(`   EventCode (AlterData): ${codigoVerbaAlterData}`);
  
  if (!codigoVerbaAlterData) {
    throw new Error('EventCode não informado no evento');
  }
  
  // Buscar evento específico pelo código AlterData
  const eventoInfo = await buscarEventoAlterDataPorCodigo(codigoVerbaAlterData);
  
  if (!eventoInfo || !eventoInfo.eventoId) {
    throw new Error(
      `Evento com código AlterData "${codigoVerbaAlterData}" não encontrado.`
    );
  }
  
  const tipomovimentoId = eventoInfo.tipomovimentoId || '1'; // Padrão: 1 (Folha)
  const eventoIdAlterData = eventoInfo.eventoId;
  
  console.log(`   Evento encontrado:`, {
    codigoAlterData: codigoVerbaAlterData,
    idAlterData: eventoIdAlterData,
    nome: eventoInfo.nome,
    tipomovimento: tipomovimentoId
  });
  
  console.log(`   Mapeamento final:`, {
    eventoId: eventoIdAlterData,
    tipomovimentoId: tipomovimentoId
  });
  
  // Pegar matrícula do funcionário Flash
  const matriculaFlash = funcionario.externalId || funcionario.employeeId;
  
  if (!matriculaFlash) {
    throw new Error('Funcionário não possui externalId (matrícula) cadastrado');
  }
  
  // Normalizar matrícula para comparação
  const matriculaNormalizada = String(matriculaFlash).trim();
  
  // Buscar ID do funcionário na AlterData usando a matrícula
  const funcionarioIdAlterData = mapaMatriculaId[matriculaNormalizada];
  
  if (!funcionarioIdAlterData) {
    const matriculasDisponiveis = Object.keys(mapaMatriculaId).slice(0, 10).join(', ');
    throw new Error(
      `Funcionário com matrícula "${matriculaNormalizada}" não encontrado na AlterData. ` +
      `Matrículas disponíveis: ${matriculasDisponiveis}...`
    );
  }
  
  console.log(`✅ [ALTERDATA MOVIMENTOS API] Matrícula "${matriculaNormalizada}" → ID AlterData: ${funcionarioIdAlterData}`);
  
  // Formatar valor - verificar se é evento de dias ou horas
  const isDiasType = event.type && event.type.toUpperCase() === 'DIAS';
  const isDiasDescription = event.description && (
    event.description.toLowerCase().includes('dia') || 
    event.description.toLowerCase().includes('atestado') ||
    event.description.toLowerCase().includes('falt')
  );
  const isDiasEvent = isDiasType || isDiasDescription;
  
  let valor = null;
  
  if (isDiasEvent) {
    // Para eventos de dias, usar event.value (quantidade de dias)
    if (event.value && event.value !== null && event.value !== '') {
      const diasValue = parseFloat(event.value);
      if (!isNaN(diasValue) && diasValue > 0) {
        valor = String(diasValue); // Número de dias como string
        console.log(`   Valor (dias): ${valor}`);
      }
    } else if (event.decimal && event.decimal !== null) {
      // Se tiver decimal, pode ser quantidade de dias
      const diasValue = parseFloat(event.decimal);
      if (!isNaN(diasValue) && diasValue > 0) {
        valor = String(Math.round(diasValue)); // Arredondar para inteiro
        console.log(`   Valor (dias do decimal): ${valor}`);
      }
    } else {
      // Se não houver valor, usar padrão de 1 dia para eventos de dias
      console.log(`   ⚠️ Evento de dias sem valor definido, usando padrão: 1 dia`);
      valor = '1'; // Padrão: 1 dia
    }
  } else {
    // Para eventos de horas, usar formato horas:minutos
    if (event.hm && event.hm !== null && event.hm !== '' && event.hm !== '0:00') {
      // Formato já está em horas:minutos (ex: "7:45")
      valor = event.hm;
      console.log(`   Valor formatado (horas): ${valor}`);
    } else if (event.decimal && event.decimal !== null) {
      // Converter decimal para horas:minutos (ex: 7.75 = 7:45)
      const decimalValue = parseFloat(event.decimal);
      if (!isNaN(decimalValue) && decimalValue > 0) {
        const hours = Math.floor(decimalValue);
        const minutes = Math.round((decimalValue - hours) * 60);
        valor = `${hours}:${String(minutes).padStart(2, '0')}`;
        console.log(`   Valor formatado (horas do decimal): ${valor}`);
      }
    } else if (event.value && event.value !== null) {
      // Tentar usar value se for string no formato horas:minutos
      const eventValueStr = String(event.value);
      if (eventValueStr.includes(':') && eventValueStr !== '0:00') {
        valor = eventValueStr;
        console.log(`   Valor formatado (horas do value): ${valor}`);
      }
    }
    
    if (!valor) {
      throw new Error(`Evento requer valor (horas ou dias), mas nenhum foi encontrado. Campos disponíveis: type=${event.type || 'N/A'}, hm=${event.hm || 'N/A'}, decimal=${event.decimal || 'N/A'}, value=${event.value || 'N/A'}, description=${event.description || 'N/A'}`);
    }
  }
  
  return {
    data: {
      type: 'movimentos',
      relationships: {
        funcionario: {
          data: {
            id: String(funcionarioIdAlterData),
            type: 'funcionarios'
          }
        },
        empresa: {
          data: {
            id: String(alterDataCompanyId),
            type: 'empresas'
          }
        },
        tipomovimento: {
          data: {
            id: String(tipomovimentoId),
            type: 'tipos-movimento'
          }
        },
        evento: {
          data: {
            id: String(eventoIdAlterData), // ← USAR ID do evento encontrado pelo código
            type: 'eventos'
          }
        }
      },
      attributes: {
        databaixa: null,
        faltas: [],
        created: new Date().toISOString(),
        valor: valor,
        inicio: period.inicio,
        fim: period.fim,
        horaquantidade: null,
        comentario: event.description || null
      }
    }
  };
}

// Função para enviar movimento para API AlterData
async function sendMovimentoToAlterData(movimento) {
  const token = process.env.ALTERDATA_API_TOKEN;
  
  if (!token) {
    throw new Error('ALTERDATA_API_TOKEN não configurado no .env');
  }
  
  // Log detalhado do body sendo enviado
  console.log('📤 [ALTERDATA MOVIMENTOS API] ===== BODY SENDO ENVIADO =====');
  console.log(JSON.stringify(movimento, null, 2));
  console.log('📤 [ALTERDATA MOVIMENTOS API] ===============================');
  
  const response = await fetch(ALTERDATA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(movimento)
  });
  
  // Ler resposta como texto primeiro para poder logar
  const responseText = await response.text();
  
  console.log(`📥 [ALTERDATA MOVIMENTOS API] Status da resposta: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    console.error('❌ [ALTERDATA MOVIMENTOS API] ===== RESPOSTA DE ERRO =====');
    console.error(responseText);
    console.error('❌ [ALTERDATA MOVIMENTOS API] ============================');
    throw new Error(`Erro na API AlterData: ${response.status} - ${responseText}`);
  }
  
  // Log da resposta de sucesso
  console.log('✅ [ALTERDATA MOVIMENTOS API] ===== RESPOSTA DE SUCESSO =====');
  console.log(responseText);
  console.log('✅ [ALTERDATA MOVIMENTOS API] ===============================');
  
  return JSON.parse(responseText);
}

export async function POST(request) {
  const startTime = Date.now();
  console.log('📤 [ALTERDATA MOVIMENTOS API] ==========================================');
  console.log('📤 [ALTERDATA MOVIMENTOS API] Iniciando envio de movimentos...');
  
  try {
    const body = await request.json();
    const { movimentos, empresaId, year, month } = body;
    
    console.log('📤 [ALTERDATA MOVIMENTOS API] Parâmetros recebidos:', {
      totalMovimentos: movimentos?.length || 0,
      empresaId,
      year,
      month
    });
    
    // Validar parâmetros obrigatórios
    if (!movimentos || !Array.isArray(movimentos) || movimentos.length === 0) {
      console.error('❌ [ALTERDATA MOVIMENTOS API] Array de movimentos vazio ou inválido');
      return NextResponse.json(
        { error: 'Array de movimentos é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!empresaId || !year || !month) {
      console.error('❌ [ALTERDATA MOVIMENTOS API] Parâmetros obrigatórios faltando:', { empresaId, year, month });
      return NextResponse.json(
        { error: 'empresaId, year e month são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Buscar empresas da AlterData uma vez no início
    console.log('📋 [ALTERDATA MOVIMENTOS API] Buscando empresas da AlterData...');
    const empresasAlterData = await buscarEmpresasAlterData();
    
    // Buscar nome da empresa na Flash
    console.log(`📋 [ALTERDATA MOVIMENTOS API] Buscando nome da empresa Flash (ID: ${empresaId})...`);
    const nomeEmpresaFlash = await buscarNomeEmpresaFlash(empresaId);
    console.log(`✅ [ALTERDATA MOVIMENTOS API] Nome da empresa Flash: "${nomeEmpresaFlash}"`);
    
    // Encontrar ID da AlterData pelo nome
    const alterDataCompanyId = encontrarIdAlterDataPorNome(nomeEmpresaFlash, empresasAlterData);
    
    if (!alterDataCompanyId) {
      const empresasDisponiveis = Object.values(empresasAlterData).map(e => e.nomeOriginal).join(', ');
      const errorMsg = `Empresa "${nomeEmpresaFlash}" não encontrada na AlterData. Empresas disponíveis: ${empresasDisponiveis.substring(0, 200)}...`;
      console.error(`❌ [ALTERDATA MOVIMENTOS API] ${errorMsg}`);
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      );
    }
    
    console.log(`✅ [ALTERDATA MOVIMENTOS API] Empresa encontrada na AlterData: ID ${alterDataCompanyId} (nome: "${nomeEmpresaFlash}")`);
    
    // Buscar funcionários da empresa na AlterData e criar mapa matrícula → id
    console.log(`👤 [ALTERDATA MOVIMENTOS API] Buscando funcionários da empresa AlterData...`);
    const mapaMatriculaId = await buscarFuncionariosAlterDataPorEmpresa(alterDataCompanyId);
    
    if (Object.keys(mapaMatriculaId).length === 0) {
      const errorMsg = `Nenhum funcionário encontrado na empresa AlterData (ID: ${alterDataCompanyId})`;
      console.error(`❌ [ALTERDATA MOVIMENTOS API] ${errorMsg}`);
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      );
    }
    
    const results = [];
    const errors = [];
    
    console.log(`📤 [ALTERDATA MOVIMENTOS API] Processando ${movimentos.length} movimento(s)...`);
    
    // Processar cada movimento
    for (let i = 0; i < movimentos.length; i++) {
      const movimentoData = movimentos[i];
      
      try {
        const { event, funcionario } = movimentoData;
        
        if (!event || !funcionario) {
          const errorMsg = 'Dados incompletos: event ou funcionario faltando';
          console.warn(`⚠️ [ALTERDATA MOVIMENTOS API] [${i + 1}/${movimentos.length}] ${errorMsg}`);
          errors.push({
            funcionario: funcionario?.employeeName || funcionario?.externalId || 'Desconhecido',
            error: errorMsg
          });
          continue;
        }
        
        console.log(`📤 [ALTERDATA MOVIMENTOS API] [${i + 1}/${movimentos.length}] Processando: ${funcionario.employeeName || funcionario.externalId} - ${event.description || event.eventCode}`);
        
        // Pegar matrícula do funcionário
        const matriculaFlash = funcionario.externalId || funcionario.employeeId;
        
        // Log dos dados antes de mapear
        console.log(`📋 [ALTERDATA MOVIMENTOS API] [${i + 1}/${movimentos.length}] Dados do movimento:`, {
          matriculaFlash: matriculaFlash,
          funcionarioName: funcionario.employeeName,
          eventCode: event.eventCode,
          eventDescription: event.description,
          valor: event.hm || event.decimal,
          empresaNomeFlash: nomeEmpresaFlash,
          empresaIdAlterData: alterDataCompanyId
        });
        
        // Mapear para formato AlterData (usando mapa de matrícula → id)
        const movimento = await mapBudgetToMovimento(
          event,
          funcionario,
          alterDataCompanyId,
          mapaMatriculaId,
          year,
          month
        );
        
        // Enviar para API AlterData
        const response = await sendMovimentoToAlterData(movimento);
        
        console.log(`✅ [ALTERDATA MOVIMENTOS API] [${i + 1}/${movimentos.length}] Movimento enviado com sucesso. ID: ${response.data?.id}`);
        
        results.push({
          funcionario: funcionario.employeeName || funcionario.externalId || funcionario.employeeId,
          eventCode: event.eventCode,
          description: event.description,
          success: true,
          movimentoId: response.data?.id,
          message: 'Movimento enviado com sucesso'
        });
        
      } catch (error) {
        console.error(`❌ [ALTERDATA MOVIMENTOS API] [${i + 1}/${movimentos.length}] Erro:`, error.message);
        errors.push({
          funcionario: movimentoData.funcionario?.employeeName || movimentoData.funcionario?.externalId || 'Desconhecido',
          eventCode: movimentoData.event?.eventCode,
          description: movimentoData.event?.description,
          error: error.message || 'Erro desconhecido'
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ [ALTERDATA MOVIMENTOS API] Processamento concluído em ${totalTime}ms`);
    console.log(`✅ [ALTERDATA MOVIMENTOS API] Sucessos: ${results.length} | Erros: ${errors.length}`);
    console.log('📤 [ALTERDATA MOVIMENTOS API] ==========================================');
    
    return NextResponse.json({
      success: errors.length === 0,
      total: movimentos.length,
      successCount: results.length,
      errorCount: errors.length,
      results: results,
      errors: errors
    });
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [ALTERDATA MOVIMENTOS API] Erro geral (${totalTime}ms):`, error);
    console.error('❌ [ALTERDATA MOVIMENTOS API] Stack:', error.stack);
    console.log('📤 [ALTERDATA MOVIMENTOS API] ==========================================');
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

