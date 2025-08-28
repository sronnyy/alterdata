// api/auth/signup/route.js (versão melhorada)
import bcrypt from "bcryptjs";
import pool from "@/app/api/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export async function POST(request) {
  try {
    const { email, password, nome, role = 'user' } = await request.json();
    
    // Validações básicas
    if (!email || !password || !nome) {
      return new Response(
        JSON.stringify({ error: "Todos os campos são obrigatórios" }),
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    // Verifica permissão para criar admin
    if (role === 'admin' && (!session || session.user.role !== 'admin')) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem criar contas de admin" }),
        { status: 403 }
      );
    }

    const connection = await pool.getConnection();
    try {
      // Verifica email existente
      const [existingUser] = await connection.query(
        'SELECT id FROM User WHERE email = ?',
        [email]
      );

      if (existingUser.length > 0) {
        return new Response(
          JSON.stringify({ error: "Email já cadastrado" }),
          { status: 400 }
        );
      }

      // Valida role
      const validRoles = ['user', 'admin'];
      if (!validRoles.includes(role)) {
        return new Response(
          JSON.stringify({ error: "Tipo de usuário inválido" }),
          { status: 400 }
        );
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Cria usuário
      const [result] = await connection.query(
        'INSERT INTO User (email, password, nome, role) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, nome, role]
      );

      // Retorna dados do novo usuário (sem senha)
      const [newUser] = await connection.query(
        'SELECT id, email, nome, role FROM User WHERE id = ?',
        [result.insertId]
      );

      return new Response(
        JSON.stringify({ 
          success: true,
          user: newUser[0] 
        }),
        { status: 201 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Erro no signup:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno no servidor" }),
      { status: 500 }
    );
  }
}