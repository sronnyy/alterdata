import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import pool from "@/app/api/lib/db";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const connection = await pool.getConnection();
        try {
          const [users] = await connection.query(
            "SELECT * FROM User WHERE email = ?",
            [credentials.email]
          );

          if (users.length === 0) return null;

          const user = users[0];
          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) return null;

          if (user.sessionToken) {
            const [activeSession] = await connection.query(
              "SELECT sessionToken FROM User WHERE id = ? AND sessionToken IS NOT NULL",
              [user.id]
            );

            if (activeSession.length === 0) {
              return null;
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.nome,
            role: user.role,
          };
        } finally {
          connection.release();
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (trigger === "update" || user) {
        const connection = await pool.getConnection();
        try {
          const [dbUser] = await connection.query(
            "SELECT role FROM User WHERE id = ?",
            [token.sub || user?.id]
          );
          if (dbUser.length > 0) {
            token.role = dbUser[0].role;
          }
        } finally {
          connection.release();
        }
      }

      if (user) {
        token.sessionToken = crypto.randomUUID();
        token.role = user.role;

        const connection = await pool.getConnection();
        try {
          await connection.query(
            "UPDATE User SET sessionToken = ? WHERE id = ?",
            [token.sessionToken, user.id]
          );
        } finally {
          connection.release();
        }
      }
      return token;
    },
    async session({ session, token }) {
      const connection = await pool.getConnection();
      try {
        const [user] = await connection.query(
          "SELECT sessionToken FROM User WHERE id = ?",
          [token.sub]
        );

        if (user.length === 0 || user[0].sessionToken !== token.sessionToken) {
          return null;
        }

        session.user.role = token.role;
        session.user.id = token.sub;
        return session;
      } finally {
        connection.release();
      }
    },
  },
  pages: {
    signIn: '/', // Página de login personalizada
  }
};