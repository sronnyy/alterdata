// app/api/attendance/route.js
import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.flashapp.services/time-and-attendance/v1/attendance/day';
const API_TOKEN = 'MFrg9F957GMqDaLAN7jqYsWQAJ0/710kF5/TR3AC2Kc=';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  // Parâmetros obrigatórios da API
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]; // Data atual como padrão
  const companyId = searchParams.get('companyId') || '';
  
  // Parâmetros opcionais
  const employeeId = searchParams.get('employeeId') || '';
  const externalId = searchParams.get('externalId') || '';

  try {
    // Construir URL com parâmetros
    const url = new URL(API_BASE_URL);
    url.searchParams.append('date', date);
    url.searchParams.append('companyId', companyId);
    if (employeeId) url.searchParams.append('employeeId', employeeId);
    if (externalId) url.searchParams.append('externalId', externalId);

    const response = await fetch(url.toString(), {
      headers: {
        'x-flash-auth': API_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API attendance response not OK:', response.status, errorText);
      throw new Error(`API attendance falhou: ${response.status}`);
    }

    const data = await response.json();
    
    // Adaptar a resposta para a estrutura esperada pelo frontend
    return NextResponse.json({
      records: data.records || data || [],
      metadata: {
        currentPage: 1,
        perPage: 50,
        totalCount: Array.isArray(data.records || data) ? (data.records || data).length : 0,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar marcações:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar marcações',
      details: error.message 
    }, { status: 500 });
  }
}