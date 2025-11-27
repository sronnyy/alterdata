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

// Mapeamento de código Verba AlterData para tipomovimento e evento
// Este mapeamento será preenchido dinamicamente ao buscar as verbas da API
// Chave: codigo do evento (ex: "314"), Valor: { tipomovimento, eventoId, nome }
let VERBA_ALTERDATA_TO_TIPOMOVIMENTO_EVENTO = {};

// Função para buscar todas as verbas (eventos) da AlterData e criar mapeamento
async function buscarVerbasAlterData() {
  const token = process.env.ALTERDATA_API_TOKEN;
  
  if (!token) {
    throw new Error('ALTERDATA_API_TOKEN não configurado no .env');
  }
  
  console.log('📋 [ALTERDATA MOVIMENTOS API] ==========================================');
  console.log('📋 [ALTERDATA MOVIMENTOS API] Buscando verbas/eventos da AlterData...');
  console.log('📋 [ALTERDATA MOVIMENTOS API] ==========================================');
  
  try {
    // Buscar eventos - tentar com parâmetros simples primeiro
    let eventosData = null;
    let eventosResponse = null;
    
    // Tentativa 1: Busca simples sem include
    try {
      const eventosUrl = new URL(ALTERDATA_EVENTOS_URL);
      eventosUrl.searchParams.append('page[offset]', '0');
      eventosUrl.searchParams.append('page[limit]', '100');
      
      console.log('📋 [ALTERDATA MOVIMENTOS API] URL Eventos (tentativa 1):', eventosUrl.toString());
      
      eventosResponse = await fetch(eventosUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.api+json'
        }
      });
      
      if (eventosResponse.ok) {
        eventosData = await eventosResponse.json();
        console.log('✅ [ALTERDATA MOVIMENTOS API] Eventos buscados com sucesso (tentativa 1)');
      } else {
        throw new Error(`Status ${eventosResponse.status}`);
      }
    } catch (error1) {
      console.warn('⚠️ [ALTERDATA MOVIMENTOS API] Tentativa 1 falhou:', error1.message);
      
      // Tentativa 2: Com campos específicos
      try {
        const eventosUrl2 = new URL(ALTERDATA_EVENTOS_URL);
        eventosUrl2.searchParams.append('page[offset]', '0');
        eventosUrl2.searchParams.append('page[limit]', '50'); // Limite ainda menor
        eventosUrl2.searchParams.append('fields[eventos]', 'codigo,nome');
        
        console.log('📋 [ALTERDATA MOVIMENTOS API] URL Eventos (tentativa 2):', eventosUrl2.toString());
        
        eventosResponse = await fetch(eventosUrl2.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/vnd.api+json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.api+json'
          }
        });
        
        if (eventosResponse.ok) {
          eventosData = await eventosResponse.json();
          console.log('✅ [ALTERDATA MOVIMENTOS API] Eventos buscados com sucesso (tentativa 2)');
        } else {
          const errorText = await eventosResponse.text();
          console.error('❌ [ALTERDATA MOVIMENTOS API] Erro ao buscar eventos (tentativa 2):', eventosResponse.status, errorText);
          throw new Error(`Erro ao buscar eventos: ${eventosResponse.status} - ${errorText}`);
        }
      } catch (error2) {
        const errorText = await eventosResponse?.text() || error2.message;
        console.error('❌ [ALTERDATA MOVIMENTOS API] Erro ao buscar eventos:', errorText);
        throw new Error(`Erro ao buscar eventos: ${errorText}`);
      }
    }
    console.log('📋 [ALTERDATA MOVIMENTOS API] ===== RESPOSTA COMPLETA DE EVENTOS =====');
    console.log(JSON.stringify(eventosData, null, 2));
    console.log('📋 [ALTERDATA MOVIMENTOS API] ==========================================');
    
    const eventos = Array.isArray(eventosData.data) ? eventosData.data : [];
    console.log(`📋 [ALTERDATA MOVIMENTOS API] Total de eventos encontrados: ${eventos.length}`);
    
    // Log detalhado de cada evento
    eventos.forEach((evento, index) => {
      console.log(`📋 [ALTERDATA MOVIMENTOS API] Evento ${index + 1}:`, {
        id: evento.id,
        type: evento.type,
        codigo: evento.attributes?.codigo,
        nome: evento.attributes?.nome,
        descricao: evento.attributes?.descricao,
        tipomovimentoId: evento.relationships?.tipomovimento?.data?.id,
        attributesCompletos: evento.attributes,
        relationshipsCompletos: evento.relationships
      });
    });
    
    // Buscar tipos de movimento
    const tiposMovimentoUrl = new URL(ALTERDATA_TIPOS_MOVIMENTO_URL);
    tiposMovimentoUrl.searchParams.append('page[offset]', '0');
    tiposMovimentoUrl.searchParams.append('page[limit]', '1000');
    
    console.log('📋 [ALTERDATA MOVIMENTOS API] URL Tipos de Movimento:', tiposMovimentoUrl.toString());
    
    const tiposResponse = await fetch(tiposMovimentoUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.api+json'
      }
    });
    
    if (!tiposResponse.ok) {
      const errorText = await tiposResponse.text();
      console.error('❌ [ALTERDATA MOVIMENTOS API] Erro ao buscar tipos de movimento:', tiposResponse.status, errorText);
      throw new Error(`Erro ao buscar tipos de movimento: ${tiposResponse.status} - ${errorText}`);
    }
    
    const tiposData = await tiposResponse.json();
    console.log('📋 [ALTERDATA MOVIMENTOS API] ===== RESPOSTA COMPLETA DE TIPOS DE MOVIMENTO =====');
    console.log(JSON.stringify(tiposData, null, 2));
    console.log('📋 [ALTERDATA MOVIMENTOS API] ===================================================');
    
    const tiposMovimento = Array.isArray(tiposData.data) ? tiposData.data : [];
    console.log(`📋 [ALTERDATA MOVIMENTOS API] Total de tipos de movimento encontrados: ${tiposMovimento.length}`);
    
    // Log detalhado de cada tipo de movimento
    tiposMovimento.forEach((tipo, index) => {
      console.log(`📋 [ALTERDATA MOVIMENTOS API] Tipo de Movimento ${index + 1}:`, {
        id: tipo.id,
        type: tipo.type,
        codigo: tipo.attributes?.codigo,
        nome: tipo.attributes?.nome,
        descricao: tipo.attributes?.descricao,
        attributesCompletos: tipo.attributes,
        relationshipsCompletos: tipo.relationships
      });
    });
    
    // Criar mapeamento: código verba → { tipomovimentoId, eventoId }
    // O eventCode Flash corresponde ao codigo do evento na AlterData
    const mapeamento = {};
    
    eventos.forEach(evento => {
      const codigo = evento.attributes?.codigo;
      const tipomovimentoId = evento.relationships?.tipomovimento?.data?.id;
      const eventoId = evento.id;
      
      if (codigo) {
        mapeamento[String(codigo)] = {
          tipomovimento: tipomovimentoId || null,
          eventoId: eventoId, // ID do evento na AlterData
          nomeEvento: evento.attributes?.nome,
          codigoEvento: codigo,
          dadosCompletos: {
            evento: evento,
            tipomovimento: tiposMovimento.find(t => t.id === tipomovimentoId)
          }
        };
      }
    });
    
    console.log('📋 [ALTERDATA MOVIMENTOS API] ===== MAPEAMENTO CRIADO =====');
    console.log('📋 [ALTERDATA MOVIMENTOS API] Código Verba (eventCode Flash) → { tipomovimento, eventoId, nome }');
    Object.entries(mapeamento).forEach(([codigo, dados]) => {
      console.log(`📋 [ALTERDATA MOVIMENTOS API]   ${codigo} → { tipomovimento: ${dados.tipomovimento}, eventoId: ${dados.eventoId}, nome: "${dados.nomeEvento}" }`);
    });
    console.log('📋 [ALTERDATA MOVIMENTOS API] ==============================');
    
    VERBA_ALTERDATA_TO_TIPOMOVIMENTO_EVENTO = mapeamento;
    
    return mapeamento;
    
  } catch (error) {
    console.error('❌ [ALTERDATA MOVIMENTOS API] Erro ao buscar verbas:', error);
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
    throw new Error(`Erro ao buscar empresas da AlterData: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  const empresas = Array.isArray(data.data) ? data.data : [];
  
  // Formatar empresas: { nome: id }
  const empresasMap = {};
  empresas.forEach(empresa => {
    const nome = empresa.attributes?.nome || empresa.attributes?.razaoSocial || '';
    if (nome) {
      // Normalizar nome para comparação (remover espaços extras, converter para maiúsculas)
      const nomeNormalizado = nome.trim().toUpperCase();
      empresasMap[nomeNormalizado] = {
        id: empresa.id,
        nomeOriginal: nome,
        nomeNormalizado: nomeNormalizado
      };
    }
  });
  
  console.log(`✅ [ALTERDATA MOVIMENTOS API] ${Object.keys(empresasMap).length} empresa(s) carregada(s) da AlterData`);
  
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
  
  // Tentar match exato primeiro
  if (empresasAlterData[nomeNormalizado]) {
    return empresasAlterData[nomeNormalizado].id;
  }
  
  // Tentar match parcial (caso o nome tenha diferenças pequenas)
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
function mapBudgetToMovimento(event, funcionario, alterDataCompanyId, mapaMatriculaId, year, month) {
  const period = getPeriodFromYearMonth(parseInt(year), parseInt(month));
  
  // 1. Converter eventCode Flash para código Verba AlterData usando a tabela de mapeamento
  const eventCodeFlash = String(event.eventCode || '');
  
  console.log(`🔍 [ALTERDATA MOVIMENTOS API] Mapeamento de verba:`);
  console.log(`   EventCode Flash: ${eventCodeFlash}`);
  
  if (!eventCodeFlash) {
    throw new Error('EventCode não informado no evento');
  }
  
  // Converter usando a tabela de mapeamento (se existir), senão usar o próprio eventCode
  const codigoVerbaAlterData = EVENT_CODE_TO_VERBA_ALTERDATA[eventCodeFlash] || eventCodeFlash;
  
  console.log(`   Código Verba AlterData: ${codigoVerbaAlterData} ${EVENT_CODE_TO_VERBA_ALTERDATA[eventCodeFlash] ? '(mapeado)' : '(direto)'}`);
  
  // 2. Buscar evento pelo código AlterData
  const eventoInfo = VERBA_ALTERDATA_TO_TIPOMOVIMENTO_EVENTO[codigoVerbaAlterData];
  
  if (!eventoInfo) {
    const eventosDisponiveis = Object.keys(VERBA_ALTERDATA_TO_TIPOMOVIMENTO_EVENTO).slice(0, 20).join(', ');
    throw new Error(
      `Evento com código AlterData "${codigoVerbaAlterData}" não encontrado na API. ` +
      `Códigos disponíveis: ${eventosDisponiveis || 'nenhuma (buscar verbas primeiro)'}...`
    );
  }
  
  const tipomovimentoId = eventoInfo.tipomovimento;
  const eventoIdAlterData = eventoInfo.eventoId; // ID do evento na AlterData (não o código)
  
  if (!eventoIdAlterData) {
    throw new Error(
      `Evento com código "${codigoVerbaAlterData}" não possui ID válido na AlterData.`
    );
  }
  
  // Se tipomovimento não vier no relacionamento, usar padrão "1" (Folha)
  const tipomovimentoFinal = tipomovimentoId || '1';
  
  if (!tipomovimentoId) {
    console.log(`   ⚠️ Tipomovimento não encontrado no relacionamento, usando padrão: "1" (Folha)`);
  }
  
  console.log(`   Evento encontrado:`, {
    eventCodeFlash: eventCodeFlash,
    codigoAlterData: codigoVerbaAlterData,
    idAlterData: eventoIdAlterData,
    nome: eventoInfo.nomeEvento,
    tipomovimento: tipomovimentoFinal
  });
  
  console.log(`   Mapeamento final:`, {
    eventoId: eventoIdAlterData, // ← Usar ID do evento na AlterData
    tipomovimentoId: tipomovimentoFinal
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
  
  // Formatar valor - usar horas:minutos se disponível, senão usar valor decimal
  let valor = event.hm || '0:00';
  if (!event.hm && event.decimal) {
    // Converter decimal para horas:minutos (ex: 7.75 = 7:45)
    const decimalValue = parseFloat(event.decimal);
    const hours = Math.floor(decimalValue);
    const minutes = Math.round((decimalValue - hours) * 60);
    valor = `${hours}:${String(minutes).padStart(2, '0')}`;
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
            id: String(tipomovimentoFinal),
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
    
    // Buscar verbas da AlterData primeiro (para ter o mapeamento completo)
    console.log('📋 [ALTERDATA MOVIMENTOS API] Buscando verbas/eventos da AlterData...');
    await buscarVerbasAlterData();
    
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
        const movimento = mapBudgetToMovimento(
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

