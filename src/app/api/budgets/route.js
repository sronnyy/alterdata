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

    // Log detalhado dos primeiros registros para análise
    if (registros.length > 0) {
      console.log('📋 [BUDGETS API] ===== ANÁLISE DOS DADOS DA API =====');
      console.log('📋 [BUDGETS API] Exemplo do primeiro registro completo:');
      console.log(JSON.stringify(registros[0], null, 2));
      console.log('📋 [BUDGETS API] Campos disponíveis no primeiro registro:');
      console.log(Object.keys(registros[0]));
      console.log('📋 [BUDGETS API] Valores relevantes do primeiro registro:');
      const firstRec = registros[0];
      console.log({
        date: firstRec.date,
        eventCode: firstRec.eventCode,
        eventDescription: firstRec.eventDescription,
        eventValue: firstRec.eventValue,
        eventDecimalValue: firstRec.eventDecimalValue,
        eventValueInHoursAndMinutes: firstRec.eventValueInHoursAndMinutes,
        eventType: firstRec.eventType,
        employeeId: firstRec.employeeId,
        externalId: firstRec.externalId,
      });
      
      // Verificar se há registros com "Dias de Atestado"
      const atestadoRecords = registros.filter(r => 
        r.eventDescription && r.eventDescription.toLowerCase().includes('atestado')
      );
      if (atestadoRecords.length > 0) {
        console.log(`📋 [BUDGETS API] Encontrados ${atestadoRecords.length} registros de "Dias de Atestado"`);
        console.log('📋 [BUDGETS API] Exemplo de registro de atestado:');
        console.log(JSON.stringify(atestadoRecords[0], null, 2));
      }
      console.log('📋 [BUDGETS API] ==========================================');
    }

    // Agrupa verbas por funcionário
    const funcionarios = {};

    registros.forEach((rec) => {
      const empId = rec.employeeId;

      if (!funcionarios[empId]) {
        funcionarios[empId] = {
          employeeId: empId,
          externalId: rec.externalId || null,
          events: [],
        };
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
    console.log(`✅ [BUDGETS API] ${totalFuncionarios} funcionários únicos encontrados`);

    // Buscar nomes dos funcionários usando o employeeId em paralelo (máxima velocidade)
    const employeeIds = Object.keys(funcionarios);
    const employeeNamesMap = {};

    console.log(`👤 [EMPLOYEES API] Buscando nomes para ${employeeIds.length} funcionários em paralelo...`);
    const namesStartTime = Date.now();

    // Função otimizada para buscar nome de um funcionário
    async function buscarNomeFuncionario(empId) {
      try {
        const employeeResponse = await fetch(
          `https://api.flashapp.services/core/v1/employees/${empId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'x-flash-auth': API_TOKEN,
              'User-Agent': 'Mozilla/5.0 (compatible; FlashApp-Client/1.0)',
            },
          }
        );

        if (employeeResponse.ok) {
          const employeeData = await employeeResponse.json();
          return employeeData.name ? { empId, name: employeeData.name } : null;
        }
        return null;
      } catch (error) {
        return null;
      }
    }

    // Processar TODAS as requisições em paralelo (sem lotes sequenciais)
    // Usando Promise.allSettled para garantir que todas executem simultaneamente
    const promises = employeeIds.map(empId => buscarNomeFuncionario(empId));
    const results = await Promise.allSettled(promises);

    // Processar resultados
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value?.name) {
        employeeNamesMap[result.value.empId] = result.value.name;
      }
    });

    const namesTotalTime = Date.now() - namesStartTime;
    const totalNomesEncontrados = Object.keys(employeeNamesMap).length;
    console.log(`✅ [EMPLOYEES API] ${totalNomesEncontrados}/${employeeIds.length} nomes encontrados em ${namesTotalTime}ms`);

    // Adicionar nomes aos funcionários
    const records = Object.values(funcionarios).map((func) => ({
      ...func,
      employeeName: employeeNamesMap[func.employeeId] || null,
    }));

    const totalTime = Date.now() - startTime;
    const totalCount = records.length;
    console.log(`✅ [BUDGETS API] Processo concluído em ${totalTime}ms`);
    console.log(`✅ [BUDGETS API] Total de funcionários retornados: ${totalCount}`);
    console.log('💰 [BUDGETS API] ==========================================');

    // Retornar TODOS os registros (paginação será feita no frontend)
    return NextResponse.json({
      records: records,
      metadata: {
        currentPage: 1,
        perPage: totalCount,
        totalCount: totalCount,
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