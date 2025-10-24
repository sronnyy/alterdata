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

  // Validar parâmetros obrigatórios
  if (!year || !month || !companyId) {
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

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-flash-auth': API_TOKEN,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API Flash:', response.status, errorText);
      return NextResponse.json({ error: `Erro na API Flash: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar verbas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}