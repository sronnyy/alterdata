# Scripts de Integração AlterData

## Buscar Empresas da AlterData

Script para consultar empresas cadastradas na plataforma AlterData.

### Uso via API Route

Acesse via HTTP GET:

```bash
# Buscar todas as empresas
GET /api/alterdata/empresas

# Filtrar apenas empresas ativas
GET /api/alterdata/empresas?ativa=true

# Com paginação
GET /api/alterdata/empresas?offset=0&limit=50
```

### Uso via Script Node.js

```bash
# Buscar todas as empresas (até 100)
node scripts/buscar-empresas-alterdata.js

# Filtrar apenas empresas ativas
node scripts/buscar-empresas-alterdata.js --ativa true

# Filtrar apenas empresas inativas
node scripts/buscar-empresas-alterdata.js --ativa false

# Com paginação
node scripts/buscar-empresas-alterdata.js --offset 0 --limit 50

# Salvar resultado em arquivo JSON
node scripts/buscar-empresas-alterdata.js --save
```

### Parâmetros

- `--ativa`: Filtrar por empresas ativas (true/false)
- `--offset`: Página da paginação (padrão: 0)
- `--limit`: Quantidade de itens por página (padrão: 100)
- `--save`: Salvar resultado em arquivo JSON

### Exemplo de Resposta

```json
{
  "success": true,
  "empresas": [
    {
      "id": "1",
      "nome": "Nome da Empresa",
      "cnpj": "12345678000190",
      "ativa": true,
      ...
    }
  ],
  "total": 10,
  "returned": 10
}
```

### Requisitos

- Variável `ALTERDATA_API_TOKEN` configurada no `.env.local`

