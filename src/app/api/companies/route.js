import { NextResponse } from 'next/server';

const FLASH_API_URL = 'https://api.flashapp.services/core/v1/companies';
const API_TOKEN = 'cXVhbGlmaWVkLXJvc2UtdGFyZmZ1bC03ZDIzMzBlNTo0YzY4YWU2Y2M0MzgxNTIyNDBmNDRlNzgwYzljYjMwNzkxNGEzNDJmYjA4NWE4OTQ0M2E3ZTkyZDFkNDMxNjZhMjJmZTMyZjgxMzAyMzZjZWY4NjgyODk3YjQ5OGVhNzIwYzlmY2I2NjlkMGIyNDE1ZDI4ZjU4YjBhZjkyYTA3NQ==';

export async function GET(request) {
  try {
    const response = await fetch(FLASH_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-flash-auth': API_TOKEN,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API Flash:', response.status, errorText);
      return NextResponse.json({ error: `Erro na API Flash: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    
    // Retornar os dados no formato esperado
    return NextResponse.json({
      records: Array.isArray(data) ? data : (data.records || data.data || []),
      metadata: {
        currentPage: 1,
        perPage: 100,
        totalCount: Array.isArray(data) ? data.length : (data.records || data.data || []).length,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

