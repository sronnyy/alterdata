import { NextResponse } from 'next/server';

// Funções auxiliares
function extractFromDocuments(documents, sectionName, fieldName) {
  const doc = documents.find(d => 
    d.sectionName === sectionName && d.fieldName === fieldName
  );
  return doc ? doc.value : '';
}

function onlyDigits(str) {
  return str ? str.replace(/\D/g, '') : '';
}

function formatDateISO(dateStr) {
  if (!dateStr) return '';
  
  // Se já está no formato ISO (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Se está no formato DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  }
  
  return dateStr;
}

function mapCandidateToAlterData(candidate) {
  const { documents = [] } = candidate;
  
  return {
    // Dados pessoais básicos
    nome: candidate.name || '',
    cpf: onlyDigits(candidate.cpf || ''),
    rg: extractFromDocuments(documents, 'Documentos Pessoais', 'RG'),
    dataNascimento: formatDateISO(extractFromDocuments(documents, 'Dados Pessoais', 'Data de Nascimento')),
    
    // Contato
    email: candidate.email || '',
    telefone: onlyDigits(candidate.phone || ''),
    
    // Endereço
    cep: onlyDigits(extractFromDocuments(documents, 'Endereço', 'CEP')),
    endereco: extractFromDocuments(documents, 'Endereço', 'Logradouro'),
    numero: extractFromDocuments(documents, 'Endereço', 'Número'),
    bairro: extractFromDocuments(documents, 'Endereço', 'Bairro'),
    cidade: extractFromDocuments(documents, 'Endereço', 'Cidade'),
    uf: extractFromDocuments(documents, 'Endereço', 'UF'),
    
    // Dados profissionais
    cargo: extractFromDocuments(documents, 'Dados Profissionais', 'Cargo Pretendido'),
    salario: extractFromDocuments(documents, 'Dados Profissionais', 'Pretensão Salarial'),
    
    // Informações adicionais
    estadoCivil: extractFromDocuments(documents, 'Dados Pessoais', 'Estado Civil'),
    nacionalidade: candidate.nationality || 'Brasileira',
    
    // Dados bancários
    banco: extractFromDocuments(documents, 'Dados Bancários', 'Banco'),
    agencia: extractFromDocuments(documents, 'Dados Bancários', 'Agência'),
    conta: extractFromDocuments(documents, 'Dados Bancários', 'Conta'),
    
    // Metadados
    candidateId: candidate.id,
    dataSubmissao: new Date().toISOString()
  };
}

function validateRequiredFields(data) {
  const required = ['nome', 'cpf', 'email'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new Error(`Campos obrigatórios faltando: ${missing.join(', ')}`);
  }
  
  // Validação de CPF (formato básico)
  if (data.cpf && data.cpf.length !== 11) {
    throw new Error('CPF deve ter 11 dígitos');
  }
  
  // Validação de email
  if (data.email && !data.email.includes('@')) {
    throw new Error('Email inválido');
  }
}

async function submitToAlterData(candidateData) {
  // Simular envio para API do AlterData
  // Em produção, aqui seria feita a integração real
  
  console.log('Enviando dados para AlterData:', candidateData);
  
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simular resposta de sucesso
  return {
    success: true,
    alterDataId: `ALT_${Date.now()}`,
    message: 'Candidato enviado com sucesso para o AlterData'
  };
}

export async function POST(request) {
  try {
    const { candidateIds } = await request.json();
    
    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json(
        { error: 'IDs de candidatos são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar dados dos candidatos da API Flash
    const token = process.env.FLASH_AUTH;
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação não configurado' },
        { status: 500 }
      );
    }

    const results = [];
    const errors = [];

    for (const candidateId of candidateIds) {
      try {
        // Buscar dados do candidato
        const response = await fetch(
          `https://api.flashapp.services/hiring/v1/candidates?candidateIds=${candidateId}`,
          {
            headers: {
              'x-flash-auth': token,
              'Accept': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Erro ao buscar candidato ${candidateId}: ${response.status}`);
        }

        const data = await response.json();
        const candidate = data.records?.[0];

        if (!candidate) {
          throw new Error(`Candidato ${candidateId} não encontrado`);
        }

        // Mapear dados para formato AlterData
        const alterDataPayload = mapCandidateToAlterData(candidate);
        
        // Validar campos obrigatórios
        validateRequiredFields(alterDataPayload);
        
        // Enviar para AlterData
        const submitResult = await submitToAlterData(alterDataPayload);
        
        results.push({
          candidateId,
          candidateName: candidate.name,
          success: true,
          alterDataId: submitResult.alterDataId,
          message: submitResult.message
        });

      } catch (error) {
        console.error(`Erro ao processar candidato ${candidateId}:`, error);
        errors.push({
          candidateId,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: results.length > 0,
      processed: candidateIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error('Erro no endpoint submit:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}