import { NextResponse } from 'next/server';

const FLASH_API_URL = 'https://api.flashapp.services/time-and-attendance/v1/budgets';
const API_TOKEN = 'cXVhbGlmaWVkLXJvc2UtdGFyZmZ1bC03ZDIzMzBlNTo0YzY4YWU2Y2M0MzgxNTIyNDBmNDRlNzgwYzljYjMwNzkxNGEzNDJmYjA4NWE4OTQ0M2E3ZTkyZDFkNDMxNjZhMjJmZTMyZjgxMzAyMzZjZWY4NjgyODk3YjQ5OGVhNzIwYzlmY2I2NjlkMGIyNDE1ZDI4ZjU4YjBhZjkyYTA3NQ==';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');
  const companyId = searchParams.get('companyId');
  const employeeIds = searchParams.get('employeeIds');
  const externalIds = searchParams.get('externalIds');
  const budgetConfigId = searchParams.get('budgetConfigId');

  console.log('💰 [BUDGETS API] ==========================================');
  console.log('💰 [BUDGETS API] Iniciando busca de verbas');
  console.log('💰 [BUDGETS API] Parâmetros recebidos:', {
    year,
    month,
    companyId,
    employeeIds: employeeIds || 'não informado',
    externalIds: externalIds || 'não informado',
    budgetConfigId: budgetConfigId || 'não informado'
  });
  const startTime = Date.now();

  // Validar parâmetros obrigatórios
  if (!year || !month || !companyId) {
    console.error('❌ [BUDGETS API] Parâmetros obrigatórios faltando:', { year, month, companyId });
    return NextResponse.json({ error: 'Parâmetros year, month e companyId são obrigatórios.' }, { status: 400 });
  }

  // Construir a URL da API Flash
  const url = new URL(FLASH_API_URL);
  url.searchParams.append('year', year);
  url.searchParams.append('month', month);
  url.searchParams.append('companyId', companyId);
  if (employeeIds) url.searchParams.append('employeeIds', employeeIds);
  if (externalIds) url.searchParams.append('externalIds', externalIds);
  if (budgetConfigId) url.searchParams.append('budgetConfigId', budgetConfigId);

  console.log('💰 [BUDGETS API] URL construída:', url.toString());

  try {
    console.log('💰 [BUDGETS API] Fazendo requisição para buscar verbas...');
    const budgetsStartTime = Date.now();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-flash-auth': API_TOKEN,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; FlashApp-Client/1.0)',
      },
    });

    // Lê o texto da resposta uma única vez
    const responseText = await response.text();
    const budgetsResponseTime = Date.now() - budgetsStartTime;
    console.log(`💰 [BUDGETS API] Resposta de verbas recebida em ${budgetsResponseTime}ms - Status: ${response.status}`);
    
    if (!response.ok) {
      console.error('❌ [BUDGETS API] Erro na API Flash:', response.status, responseText.substring(0, 500));
      
      // Verifica se a resposta é HTML (CAPTCHA/WAF)
      if (responseText.includes('<!DOCTYPE html>') || responseText.includes('Human Verification')) {
        return NextResponse.json({ 
          error: 'A API está bloqueando requisições. Tente novamente em alguns instantes.',
          code: 'RATE_LIMIT'
        }, { status: 429 });
      }
      
      return NextResponse.json({ 
        error: `Erro na API Flash: ${response.status}`,
        details: responseText.substring(0, 200)
      }, { status: response.status });
    }

    // Verifica se a resposta é HTML (CAPTCHA/WAF) mesmo com status OK
    if (responseText.includes('<!DOCTYPE html>') || responseText.includes('Human Verification')) {
      return NextResponse.json({ 
        error: 'A API está bloqueando requisições. Tente novamente em alguns instantes.',
        code: 'RATE_LIMIT'
      }, { status: 429 });
    }

    // Verifica se a resposta é JSON válida
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta:', parseError);
      return NextResponse.json({ 
        error: 'Resposta inválida da API',
        details: responseText.substring(0, 200)
      }, { status: 500 });
    }

    // Verifica se existe a chave "data"
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      console.log('⚠️ [BUDGETS API] Nenhuma verba encontrada para os parâmetros informados');
      return NextResponse.json({
        records: [],
        metadata: {
          currentPage: 1,
          perPage: 50,
          totalCount: 0,
          totalPages: 1,
        },
      });
    }

    const registros = data.data;
    console.log(`✅ [BUDGETS API] Total de registros de verbas recebidos: ${registros.length}`);

    // Agrupa verbas por funcionário
    const funcionarios = {};

    console.log('💰 [BUDGETS API] Agrupando verbas por funcionário...');
    registros.forEach((rec) => {
      const empId = rec.employeeId;

      if (!funcionarios[empId]) {
        funcionarios[empId] = {
          employeeId: empId,
          externalId: rec.externalId || null,
          events: [],
        };
        console.log(`💰 [BUDGETS API] Novo funcionário encontrado: employeeId=${empId}, externalId=${rec.externalId || 'N/A'}`);
      }

      funcionarios[empId].events.push({
        date: rec.date || null,
        eventCode: rec.eventCode || null,
        description: rec.eventDescription || null,
        value: rec.eventValue || null,
        decimal: rec.eventDecimalValue || null,
        hm: rec.eventValueInHoursAndMinutes || null,
        type: rec.eventType || null,
      });
    });

    const totalFuncionarios = Object.keys(funcionarios).length;
    console.log(`✅ [BUDGETS API] Total de funcionários únicos: ${totalFuncionarios}`);
    console.log('💰 [BUDGETS API] EmployeeIds encontrados:', Object.keys(funcionarios).join(', '));

    // Buscar nomes dos funcionários usando o employeeId
    const employeeIds = Object.keys(funcionarios);
    const employeeNamesMap = {};

    console.log(`👤 [EMPLOYEES API] Iniciando busca de nomes para ${employeeIds.length} funcionários...`);

    // Função auxiliar para fazer delay
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Buscar cada funcionário usando seu employeeId com delay para evitar rate limiting
    for (let i = 0; i < employeeIds.length; i++) {
      const empId = employeeIds[i];
      const externalId = funcionarios[empId].externalId;
      
      console.log(`👤 [EMPLOYEES API] [${i + 1}/${employeeIds.length}] Buscando nome para employeeId=${empId}, externalId=${externalId || 'N/A'}`);
      
      // Adiciona delay entre requisições (exceto na primeira)
      if (i > 0) {
        await delay(300); // 300ms de delay entre requisições
      }

      try {
        const employeeUrl = `https://api.flashapp.services/core/v1/employees/${empId}`;
        const employeeStartTime = Date.now();
        
        const employeeResponse = await fetch(employeeUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-flash-auth': API_TOKEN,
            'User-Agent': 'Mozilla/5.0 (compatible; FlashApp-Client/1.0)',
          },
        });

        const employeeResponseTime = Date.now() - employeeStartTime;

        if (employeeResponse.ok) {
          const employeeData = await employeeResponse.json();
          if (employeeData.name) {
            employeeNamesMap[empId] = employeeData.name;
            console.log(`✅ [EMPLOYEES API] Nome encontrado para ${empId}: "${employeeData.name}" (${employeeResponseTime}ms)`);
          } else {
            console.warn(`⚠️ [EMPLOYEES API] Nome não encontrado no retorno para ${empId}`);
          }
        } else if (employeeResponse.status === 405 || employeeResponse.status === 429) {
          // Se receber erro de rate limiting ou método não permitido, para de buscar nomes
          console.warn(`❌ [EMPLOYEES API] Rate limit atingido ao buscar funcionários. Parando busca de nomes.`);
          break;
        } else {
          console.warn(`⚠️ [EMPLOYEES API] Não foi possível buscar o nome para employeeId ${empId}. Status: ${employeeResponse.status} (${employeeResponseTime}ms)`);
        }
      } catch (error) {
        // Continua sem o nome se houver erro
        console.error(`❌ [EMPLOYEES API] Erro ao buscar funcionário ${empId}:`, error.message);
        // Se for erro de conexão, adiciona delay maior antes de continuar
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
          console.warn(`⚠️ [EMPLOYEES API] Erro de conexão detectado. Aguardando 1s antes de continuar...`);
          await delay(1000);
        }
      }
    }

    const totalNomesEncontrados = Object.keys(employeeNamesMap).length;
    console.log(`✅ [EMPLOYEES API] Busca de nomes concluída: ${totalNomesEncontrados}/${employeeIds.length} nomes encontrados`);
    if (totalNomesEncontrados < employeeIds.length) {
      const semNome = employeeIds.filter(id => !employeeNamesMap[id]);
      console.log(`⚠️ [EMPLOYEES API] Funcionários sem nome: ${semNome.join(', ')}`);
    }

    // Adicionar nomes aos funcionários
    console.log('💰 [BUDGETS API] Adicionando nomes aos funcionários...');
    const records = Object.values(funcionarios).map((func) => {
      const nome = employeeNamesMap[func.employeeId] || null;
      const totalEventos = func.events.length;
      console.log(`💰 [BUDGETS API] Funcionário: ${func.externalId || func.employeeId} - Nome: ${nome || 'N/A'} - Eventos: ${totalEventos}`);
      return {
        ...func,
        employeeName: nome,
      };
    });

    const totalTime = Date.now() - startTime;
    console.log(`✅ [BUDGETS API] Processo concluído em ${totalTime}ms`);
    console.log(`✅ [BUDGETS API] Total de funcionários retornados: ${records.length}`);
    console.log('💰 [BUDGETS API] ==========================================');

    return NextResponse.json({
      records: records,
      metadata: {
        currentPage: 1,
        perPage: 50,
        totalCount: records.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [BUDGETS API] Erro ao buscar verbas (${totalTime}ms):`, error.message);
    console.error('❌ [BUDGETS API] Stack:', error.stack);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}