import { NextResponse } from 'next/server';

const ALTERDATA_API_URL = 'https://dp.pack.alterdata.com.br/api/v1/empresas';

export async function GET(request) {
  const startTime = Date.now();
  console.log('🏢 [ALTERDATA EMPRESAS API] ==========================================');
  console.log('🏢 [ALTERDATA EMPRESAS API] Iniciando busca de empresas...');
  
  try {
    const { searchParams } = new URL(request.url);
    const ativa = searchParams.get('ativa'); // true/false para filtrar empresas ativas
    const offset = searchParams.get('offset') || '0';
    const limit = searchParams.get('limit') || '100';
    
    const token = process.env.ALTERDATA_API_TOKEN;
    
    if (!token) {
      console.error('❌ [ALTERDATA EMPRESAS API] ALTERDATA_API_TOKEN não configurado');
      return NextResponse.json(
        { error: 'Token de autenticação AlterData não configurado' },
        { status: 500 }
      );
    }
    
    // Construir URL com parâmetros
    const url = new URL(ALTERDATA_API_URL);
    if (ativa !== null) {
      url.searchParams.append('filter[empresas][ativa][EQ]', ativa);
    }
    url.searchParams.append('page[offset]', offset);
    url.searchParams.append('page[limit]', limit);
    
    console.log('🏢 [ALTERDATA EMPRESAS API] URL:', url.toString());
    console.log('🏢 [ALTERDATA EMPRESAS API] Parâmetros:', {
      ativa: ativa || 'não informado',
      offset,
      limit
    });
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.api+json'
      }
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`🏢 [ALTERDATA EMPRESAS API] Resposta recebida em ${responseTime}ms - Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [ALTERDATA EMPRESAS API] Erro na API:', response.status, errorText);
      return NextResponse.json(
        { 
          error: `Erro na API AlterData: ${response.status}`,
          details: errorText.substring(0, 500)
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    console.log('🏢 [ALTERDATA EMPRESAS API] ===== RESPOSTA COMPLETA DA API DE EMPRESAS =====');
    console.log(JSON.stringify(data, null, 2));
    console.log('🏢 [ALTERDATA EMPRESAS API] =================================================');
    
    // Processar resposta JSON:API
    const empresas = Array.isArray(data.data) ? data.data : [];
    const totalCount = data.meta?.total || empresas.length;
    
    console.log(`✅ [ALTERDATA EMPRESAS API] ${empresas.length} empresa(s) encontrada(s) na resposta`);
    console.log('🏢 [ALTERDATA EMPRESAS API] ===== DETALHES DE CADA EMPRESA =====');
    
    empresas.forEach((empresa, index) => {
      console.log(`🏢 [ALTERDATA EMPRESAS API] Empresa ${index + 1}:`, {
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
    
    console.log('🏢 [ALTERDATA EMPRESAS API] ===========================================');
    
    // Formatar empresas para facilitar uso no frontend
    const empresasFormatadas = empresas.map(empresa => ({
      id: empresa.id,
      type: empresa.type,
      nome: empresa.attributes?.nome || empresa.attributes?.razaoSocial || 'Sem nome',
      cnpj: empresa.attributes?.cnpj || null,
      ativa: empresa.attributes?.ativa !== undefined ? empresa.attributes.ativa : null,
      ...empresa.attributes, // Incluir todos os outros atributos
      relationships: empresa.relationships || {}
    }));
    
    console.log('🏢 [ALTERDATA EMPRESAS API] Empresas formatadas:');
    empresasFormatadas.forEach((emp, idx) => {
      console.log(`  ${idx + 1}. ID: ${emp.id} | Nome: ${emp.nome} | CNPJ: ${emp.cnpj || 'N/A'} | Ativa: ${emp.ativa !== null ? emp.ativa : 'N/A'}`);
    });
    
    console.log('🏢 [ALTERDATA EMPRESAS API] ===== METADADOS DA RESPOSTA =====');
    console.log(JSON.stringify(data.meta, null, 2));
    console.log('🏢 [ALTERDATA EMPRESAS API] ==================================');
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ [ALTERDATA EMPRESAS API] Processamento concluído em ${totalTime}ms`);
    console.log('🏢 [ALTERDATA EMPRESAS API] ==========================================');
    
    return NextResponse.json({
      success: true,
      empresas: empresasFormatadas,
      total: totalCount,
      returned: empresas.length,
      metadata: {
        offset: parseInt(offset),
        limit: parseInt(limit),
        ...data.meta
      },
      raw: data // Incluir resposta raw para debug
    });
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [ALTERDATA EMPRESAS API] Erro (${totalTime}ms):`, error);
    console.error('❌ [ALTERDATA EMPRESAS API] Stack:', error.stack);
    console.log('🏢 [ALTERDATA EMPRESAS API] ==========================================');
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}





