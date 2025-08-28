import { NextResponse } from "next/server";
import pool from "@/app/api/lib/db";
import nodemailer from "nodemailer";

// Flag para controle do rate limit (true = desativado, false = ativado)
const RATE_LIMIT_DISABLED = false;

// Cache em memória para rate limiting (5 requisições por minuto por IP)
const requestCache = new Map();

function checkRateLimit(ip) {
  // Se o rate limit estiver desativado, sempre retorna true
  if (RATE_LIMIT_DISABLED) return true;

  const now = Date.now();
  const WINDOW_MS = 60 * 1000; // 1 minuto
  const MAX_REQUESTS = 10;

  // Limpa registros antigos
  if (!requestCache.has(ip)) {
    requestCache.set(ip, []);
  }
  const timestamps = requestCache.get(ip).filter((t) => now - t < WINDOW_MS);

  // Verifica limite
  if (timestamps.length >= MAX_REQUESTS) {
    return false;
  }

  // Registra nova requisição
  timestamps.push(now);
  requestCache.set(ip, timestamps);
  return true;
}

// Validação de CPF (mantida igual)
function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, "");

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }

  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }

  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

// Configuração do transporter de e-mail (mantida igual)
const transporter = nodemailer.createTransport({
  host: "mail.terraboa.pr.gov.br",
  port: 465,
  secure: true,
  auth: {
    user: "concurso@terraboa.pr.gov.br",
    pass: process.env.WEBMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function POST(request) {
  try {
    // Rate Limiting (agora controlado pela flag RATE_LIMIT_DISABLED)
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em 1 minuto." },
        { status: 429 }
      );
    }

    // Validação básica (mantida igual)
    const data = await request.json();
    if (!data.cargo || !data.cpf || !data.protocolo) {
      return NextResponse.json(
        { error: "Cargo, CPF e Protocolo são obrigatórios" },
        { status: 400 }
      );
    }

    // Validação de CPF (mantida igual)
    if (!validarCPF(data.cpf)) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }

    // Conexão com o banco (mantida igual)
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Verifica CPF duplicado (mantida igual)
      const [cpfCheck] = await connection.query(
        `SELECT 1 FROM inscricoes WHERE cpf = ? FOR UPDATE`,
        [data.cpf]
      );

      if (cpfCheck.length > 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: "CPF já cadastrado" },
          { status: 400 }
        );
      }

      // Verifica protocolo duplicado (mantida igual)
      const [protocoloCheck] = await connection.query(
        `SELECT 1 FROM inscricoes WHERE protocolo = ? FOR UPDATE`,
        [data.protocolo]
      );

      // if (protocoloCheck.length > 0) {
      //   await connection.rollback();
      //   return NextResponse.json(
      //     { error: "Protocolo já existe" },
      //     { status: 400 }
      //   );
      // }

      // Obtém ID do cargo (mantida igual)
      const [cargoRes] = await connection.query(
        `SELECT id FROM cargos WHERE nome = ? LIMIT 1`,
        [data.cargo.trim()]
      );

      if (cargoRes.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: "Cargo não encontrado" },
          { status: 400 }
        );
      }

      // Insere dados (mantida igual)
      // No backend, modifique a parte da inserção para:
      const [insertResult] = await connection.query(
        `INSERT INTO inscricoes SET ?`,
        {
          protocolo: data.protocolo,
          cargo_id: cargoRes[0].id,
          cargo: data.cargo,
          nome_completo: data.nome_completo,
          data_nascimento: data.data_nascimento,
          cpf: data.cpf,
          rg: data.rg,
          cep: data.cep,
          endereco: data.endereco,
          numero: data.numero,
          bairro: data.bairro,
          cidade: data.cidade,
          telefone: data.telefone,
          email: data.email,
          condicao_especial: data.condicao_especial,
          afrodescendente: data.afrodescendente ? 1 : 0, // Modificado
          lactante: data.lactante ? 1 : 0, // Modificado
          pcd: data.pcd,
          outros_pcd: data.outros_pcd,
        }
      );

      await connection.commit();

      // Envia e-mail de confirmação (mantido igual)
      try {
        await transporter.sendMail({
          from: `"Prefeitura de Terra Boa" <concurso@terraboa.pr.gov.br>`,
          to: data.email,
          subject: "✅ Confirmação de Inscrição - PSS 01/2025",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width">
              <title>Confirmação de Inscrição</title>
              <style>
                body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; color: #333333; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; }
                .header { padding: 30px 20px; text-align: center; background-color: #f8fafc; }
                .logo { max-width: 180px; height: auto; }
                .content { padding: 30px 20px; }
                .card { background: #ffffff; border-radius: 8px; padding: 25px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
                .divider { height: 1px; background-color: #e2e8f0; margin: 25px 0; }
                .footer { text-align: center; padding: 20px; color: #64748b; font-size: 13px; }
                .text-primary { color: #1e40af; }
                .text-center { text-align: center; }
                .mb-4 { margin-bottom: 16px; }
                .mt-4 { margin-top: 16px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="header">
                    <img style="max-width: 180px; height: auto; margin: 0 auto;" src="https://selecoaterraboa.vercel.app/images/email.png" alt="Prefeitura de Terra Boa" class="logo">
                    <h2 style="margin-top: 20px; color: #1e40af;">Processo Seletivo Simplificado 01/2025</h2>
                  </div>               
                </div>
        
                <div class="content">
                  <div class="card">
                    <h3 style="margin-top: 0;">Olá, ${data.nome_completo}</h3>
                    <p>Sua inscrição para o cargo de <strong>${
                      data.cargo
                    }</strong> foi recebida com sucesso.</p>
                    
                    <div class="divider"></div>
                    
                    <h4 class="text-primary">Dados da Inscrição</h4>
                    <table style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0; width: 120px;"><strong>Protocolo:</strong></td>
                        <td style="padding: 8px 0;">${data.protocolo}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;"><strong>Data:</strong></td>
                        <td style="padding: 8px 0;">${new Date().toLocaleDateString(
                          "pt-BR",
                          { day: "2-digit", month: "long", year: "numeric" }
                        )}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;"><strong>CPF:</strong></td>
                        <td style="padding: 8px 0;">${data.cpf.replace(
                          /(\d{3})(\d{3})(\d{3})(\d{2})/,
                          "$1.$2.$3-$4"
                        )}</td>
                      </tr>
                    </table>
                  </div>
        
                  <div class="card" style="background-color: #f8fafc;">
                    <h4 class="text-primary" style="margin-top: 0;">Próximos Passos</h4>
                    <ol style="padding-left: 20px; margin-bottom: 0;">
                      <li style="margin-bottom: 8px;">Acompanhe o cronograma no site oficial</li>
                      <li>Esteja atento(a) à convocações</li>
                    </ol>
                  </div>
                </div>
        
                <div class="footer">
                  <p>Prefeitura Municipal de Terra Boa - Paraná</p>
                  <p>CNPJ: 75.793.786/0001-40</p>
                  <p class="mt-4">Esta é uma mensagem automática, por favor não responda.</p>
                  <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      } catch (emailError) {
        console.error("Erro ao enviar e-mail:", emailError);
      }

      return NextResponse.json(
        {
          success: true,
          protocolo: data.protocolo,
          message: "Inscrição realizada com sucesso",
        },
        { status: 201 }
      );
    } catch (error) {
      await connection.rollback();
      console.error("Erro na transação:", error);
      return NextResponse.json(
        { error: "Erro interno no servidor" },
        { status: 500 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Erro na inscrição:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
