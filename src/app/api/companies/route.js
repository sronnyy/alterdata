import { NextResponse } from 'next/server';

const FLASH_API_URL = 'https://api.flashapp.services/core/v1/companies';
const API_TOKEN = 'cXVhbGlmaWVkLXJvc2UtdGFyZmZ1bC03ZDIzMzBlNTo0YzY4YWU2Y2M0MzgxNTIyNDBmNDRlNzgwYzljYjMwNzkxNGEzNDJmYjA4NWE4OTQ0M2E3ZTkyZDFkNDMxNjZhMjJmZTMyZjgxMzAyMzZjZWY4NjgyODk3YjQ5OGVhNzIwYzlmY2I2NjlkMGIyNDE1ZDI4ZjU4YjBhZjkyYTA3NQ==';

export async function GET(request) {
  console.log('📋 [COMPANIES API] Iniciando busca de empresas...');
  const startTime = Date.now();
  
  try {
    console.log('📋 [COMPANIES API] Fazendo requisição para:', FLASH_API_URL);
    
    const response = await fetch(FLASH_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-flash-auth': API_TOKEN,
      },
    });

    const responseTime = Date.now() - startTime;
    console.log(`📋 [COMPANIES API] Resposta recebida em ${responseTime}ms - Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [COMPANIES API] Erro na API Flash:', response.status, errorText.substring(0, 200));
      return NextResponse.json({ error: `Erro na API Flash: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    const records = Array.isArray(data) ? data : (data.records || data.data || []);
    const totalCount = records.length;
    
    console.log(`✅ [COMPANIES API] Empresas encontradas: ${totalCount}`);
    console.log('📋 [COMPANIES API] IDs das empresas:', records.map(c => c.id || c._id).join(', '));
    
    // Retornar os dados no formato esperado
    return NextResponse.json({
      records: records,
      metadata: {
        currentPage: 1,
        perPage: 100,
        totalCount: totalCount,
        totalPages: 1,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [COMPANIES API] Erro ao buscar empresas (${responseTime}ms):`, error.message);
    console.error('❌ [COMPANIES API] Stack:', error.stack);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

