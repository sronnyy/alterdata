'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        // Mapeia os erros específicos do NextAuth
        let errorMessage;
        switch (result.error) {
          case 'CredentialsSignin':
            errorMessage = 'E-mail ou senha incorretos';
            break;
          case 'AccessDenied':
            errorMessage = 'Sua conta está desativada';
            break;
          case 'Configuration':
            errorMessage = 'Problema de configuração do servidor';
            break;
          default:
            errorMessage = 'Erro ao fazer login. Tente novamente.';
        }

        setError(errorMessage);
        // toast.error(errorMessage);
      } else {
        toast.success('Login realizado com sucesso! Redirecionando...',);
        setTimeout(() => {
          router.push('/admin');
          setLoading(false);

        }, 1000);
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente mais tarde.');
      toast.error('Erro inesperado. Tente novamente mais tarde.');
    } finally {
      setLoading(false);

    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center p-4 relative">
      <header className="absolute top-4 left-4 flex items-center gap-3">
        <img src="/images/image.png" alt="ALTERDATA" className="h-8 w-auto" />
        <span className="text-xl font-semibold">ALTERDATA</span>
      </header>
      <motion.form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl border border-gray-100"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <div className="mb-2"></div>
          <h2 className="text-3xl font-semibold text-center text-gray-900 mb-2">
            Bem-vindo!
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Entre para acessar o painel.
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100"
          >
            {error}
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="space-y-6">
          <div>
            <div className="relative">
              <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all hover:border-gray-300"
                placeholder="seuemail@gmail.com"
                required
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all hover:border-gray-300"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-gray-900 text-white py-3.5 rounded-lg font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </motion.button>
        </motion.div>

      
      </motion.form>
    </div>
  );
};

export default LoginForm;