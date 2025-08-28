import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extrair parâmetros de consulta
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '10';
    const name = searchParams.get('name') || '';
    const documentNumber = searchParams.get('documentNumber') || '';
    const email = searchParams.get('email') || '';
    const phone = searchParams.get('phone') || '';
    const nationality = searchParams.get('nationality') || '';

    // Construir URL da API com parâmetros de consulta
    const apiUrl = new URL('https://api.flashapp.services/core/v1/employees');
    apiUrl.searchParams.append('page', page);
    apiUrl.searchParams.append('pageSize', pageSize);
    if (name) apiUrl.searchParams.append('name', name);
    if (documentNumber) apiUrl.searchParams.append('documentNumber', documentNumber);
    if (email) apiUrl.searchParams.append('email', email);
    if (phone) apiUrl.searchParams.append('phone', phone);
    if (nationality) apiUrl.searchParams.append('nationality', nationality);

    // Fazer chamada para a API externa
    const response = await fetch(apiUrl.toString(), {
      headers: {
        'x-flash-auth': 'cXVhbGlmaWVkLXJvc2UtdGFyZmZ1bC03ZDIzMzBlNTo0YzY4YWU2Y2M0MzgxNTIyNDBmNDRlNzgwYzljYjMwNzkxNGEzNDJmYjA4NWE4OTQ0M2E3ZTkyZDFkNDMxNjZhMjJmZTMyZjgxMzAyMzZjZWY4NjgyODk3YjQ5OGVhNzIwYzlmY2I2NjlkMGIyNDE1ZDI4ZjU4YjBhZjkyYTA3NQ=='
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Formatar os dados para retornar apenas o necessário
    const formatCPF = (cpf) => {
      if (!cpf) return '';
      cpf = cpf.replace(/\D/g, '');
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    const formattedData = {
      records: data.records.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        cpf: formatCPF(candidate.documentNumber),
        email: candidate.email || '',
        phone: candidate.phoneNumber || '',
        nationality: candidate.nationality || '',
        companyId: candidate.companyId || ''
      })),
      metadata: data.metadata
    };

    return NextResponse.json(formattedData);
    
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}