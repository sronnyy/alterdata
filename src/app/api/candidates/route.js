import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FLASH_API = 'https://api.flashapp.services/hiring/v1/candidates';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const page = searchParams.get('page') ?? '1';
    const pageSize = searchParams.get('pageSize') ?? '10';
    const name = searchParams.get('name') ?? '';
    const documentNumber = searchParams.get('documentNumber') ?? '';
    const email = searchParams.get('email') ?? '';
    const phone = searchParams.get('phone') ?? '';
    const nationality = searchParams.get('nationality') ?? '';
    // novos parâmetros suportados pela API
    const candidateIds = searchParams.get('candidateIds') ?? '';
    const cnpj = searchParams.get('cnpj') ?? '';
    const managerId = searchParams.get('managerId') ?? '';
    const companyId = searchParams.get('companyId') ?? '';

    const apiUrl = new URL(FLASH_API);
    apiUrl.searchParams.set('page', page);
    apiUrl.searchParams.set('pageSize', pageSize);
    if (name) apiUrl.searchParams.set('name', name);
    if (documentNumber) apiUrl.searchParams.set('documentNumber', documentNumber);
    if (email) apiUrl.searchParams.set('email', email);
    if (phone) apiUrl.searchParams.set('phone', phone);
    if (nationality) apiUrl.searchParams.set('nationality', nationality);
    if (candidateIds) apiUrl.searchParams.set('candidateIds', candidateIds);
    if (cnpj) apiUrl.searchParams.set('cnpj', cnpj);
    if (managerId) apiUrl.searchParams.set('managerId', managerId);
    if (companyId) apiUrl.searchParams.set('companyId', companyId);

    const token = process.env.FLASH_AUTH ?? '';
    if (!token) {
      return NextResponse.json(
        { error: 'Missing FLASH_AUTH token. Configure .env.local with FLASH_AUTH.' },
        { status: 400 }
      );
    }

    const response = await fetch(apiUrl.toString(), {
      cache: 'no-store',
      headers: {
        // .env.local -> FLASH_AUTH=seu_token_aqui
        'x-flash-auth': token,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const txt = await response.text().catch(() => '');
      return NextResponse.json(
        { error: `Flash API ${response.status}`, details: txt || undefined },
        { status: response.status }
      );
    }

    const data = await response.json();

    const formatCPF = (cpf) => {
      if (!cpf) return '';
      const only = String(cpf).replace(/\D/g, '');
      if (only.length !== 11) return only;
      return only.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    // Ajuste para suportar resposta com `candidates` (conforme documentação)
    const rawCandidates = Array.isArray(data?.records)
      ? data.records
      : Array.isArray(data?.candidates)
      ? data.candidates
      : Array.isArray(data)
      ? data
      : [];

    const m = data?.metadata ?? {};
    const currentPage = Number(m.currentPage ?? m.page ?? page);
    const perPage = Number(m.perPage ?? m.pageSize ?? pageSize);
    const totalCount = Number(m.totalCount ?? m.total ?? m.count ?? rawCandidates.length ?? 0);
    const totalPages = Number(m.totalPages ?? (perPage ? Math.ceil(totalCount / perPage) : 1));

    return NextResponse.json({
      records: rawCandidates.map((c) => ({
        id: c.id,
        name: c.name,
        cpf: formatCPF(c.documentNumber),
        email: c.email || '',
        phone: c.phone || c.phoneNumber || '',
        nationality: c.nationality || '',
        companyId: c.companyId || '',
      })),
      metadata: { currentPage, perPage, totalCount, totalPages },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}