import { NextResponse } from 'next/server';

const ALTERDATA_API_URL = 'https://dp.pack.alterdata.com.br/api/v1/funcionarios';

export async function GET(request) {
  const startTime = Date.now();
  console.log('👤 [ALTERDATA FUNCIONARIOS API] ==========================================');
  console.log('👤 [ALTERDATA FUNCIONARIOS API] Iniciando busca de funcionários...');
  
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId'); // ID da empresa no AlterData
    const funcionarioId = searchParams.get('funcionarioId'); // ID específico do funcionário (opcional)
    const include = searchParams.get('include') || '';
    
    const token = process.env.ALTERDATA_API_TOKEN;
    
    if (!token) {
      console.error('❌ [ALTERDATA FUNCIONARIOS API] ALTERDATA_API_TOKEN não configurado');
      return NextResponse.json(
        { error: 'Token de autenticação AlterData não configurado' },
        { status: 500 }
      );
    }
    
    // Se empresaId foi fornecido, buscar todos os funcionários dessa empresa
    if (empresaId) {
      console.log('👤 [ALTERDATA FUNCIONARIOS API] Buscando funcionários da empresa ID:', empresaId);
      
      // Construir URL com filtro correto conforme documentação
      // filter[funcionarios][empresa.id][EQ]=empresaId
      const url = new URL(ALTERDATA_API_URL);
      url.searchParams.append('filter[funcionarios][empresa.id][EQ]', empresaId);
      url.searchParams.append('filter[funcionarios][status][EQ]', 'ativo'); // Filtrar apenas ativos
      url.searchParams.append('page[offset]', '0');
      url.searchParams.append('page[limit]', '100'); // Limite padrão
      
      // Campos opcionais
      if (include) {
        url.searchParams.append('include', include);
      }
      
      // Campos a retornar
      url.searchParams.append('fields[funcionarios]', 'codigo,nome,status,afastamentodescricao');
      
      // Ordenar por código
      url.searchParams.append('sort[funcionarios]', 'codigo');
      
      console.log('👤 [ALTERDATA FUNCIONARIOS API] URL:', url.toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.api+json'
        }
      });
      
      const responseTime = Date.now() - startTime;
      console.log(`👤 [ALTERDATA FUNCIONARIOS API] Resposta recebida em ${responseTime}ms - Status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [ALTERDATA FUNCIONARIOS API] Erro na API:', response.status, errorText);
        return NextResponse.json(
          { 
            error: `Erro na API AlterData: ${response.status}`,
            details: errorText.substring(0, 500)
          },
          { status: response.status }
        );
      }
      
      const data = await response.json();
      const funcionarios = Array.isArray(data.data) ? data.data : [];
      
      console.log(`✅ [ALTERDATA FUNCIONARIOS API] ${funcionarios.length} funcionário(s) encontrado(s) para empresa ${empresaId}`);
      
      // Formatar funcionários conforme estrutura da resposta
      const funcionariosFormatados = funcionarios.map(func => ({
        id: func.id,
        type: func.type,
        nome: func.attributes?.nome || 'Sem nome',
        codigo: func.attributes?.codigo || null, // Matrícula/código
        status: func.attributes?.status || null,
        afastamentoDescricao: func.attributes?.afastamentodescricao || null,
        dataAtualizacao: func.attributes?.dataAtualizacao || null,
        ...func.attributes,
        links: func.links || {}
      }));
      
      const totalTime = Date.now() - startTime;
      console.log(`✅ [ALTERDATA FUNCIONARIOS API] Processamento concluído em ${totalTime}ms`);
      console.log('👤 [ALTERDATA FUNCIONARIOS API] ==========================================');
      
      return NextResponse.json({
        success: true,
        funcionarios: funcionariosFormatados,
        total: data.meta?.totalResourceCount || funcionariosFormatados.length,
        returned: funcionariosFormatados.length,
        empresaId: empresaId,
        metadata: {
          ...data.meta,
          links: data.links
        }
      });
    }
    
    // Se funcionarioId foi fornecido, buscar funcionário específico
    if (funcionarioId) {
      console.log('👤 [ALTERDATA FUNCIONARIOS API] Buscando funcionário ID:', funcionarioId);
      
      const url = new URL(ALTERDATA_API_URL);
      url.searchParams.append('filter[funcionarios][id][EQ]', funcionarioId);
      if (include) {
        url.searchParams.append('include', include);
      }
      
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
        return NextResponse.json(
          { 
            error: `Erro na API AlterData: ${response.status}`,
            details: errorText.substring(0, 500)
          },
          { status: response.status }
        );
      }
      
      const data = await response.json();
      const funcionario = Array.isArray(data.data) ? data.data[0] : data.data;
      
      if (!funcionario) {
        return NextResponse.json(
          { error: 'Funcionário não encontrado' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        funcionario: {
          id: funcionario.id,
          nome: funcionario.attributes?.nome || funcionario.attributes?.name || 'Sem nome',
          matricula: funcionario.attributes?.matricula || funcionario.attributes?.registrationNumber || null,
          ...funcionario.attributes
        }
      });
    }
    
    // Se nenhum parâmetro foi fornecido, retornar erro
    return NextResponse.json(
      { error: 'empresaId ou funcionarioId é obrigatório' },
      { status: 400 }
    );
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [ALTERDATA FUNCIONARIOS API] Erro (${totalTime}ms):`, error);
    console.error('❌ [ALTERDATA FUNCIONARIOS API] Stack:', error.stack);
    console.log('👤 [ALTERDATA FUNCIONARIOS API] ==========================================');
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

