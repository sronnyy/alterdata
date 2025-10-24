import "./globals.css";
import Providers from "@/components/Provider/Provider"; // Componente que usa "use client"
import { Toaster } from "react-hot-toast";


export const metadata = {
  title: "AlterData",
  description: "Sistema de Gestão",
};

export default function RootLayout({ children }) {
  
  return (
    <html lang="pt-BR">
      <body className="bg-white text-gray-900">

          <Providers>
            <Toaster
              position="top-left"
              reverseOrder={true}
              toastOptions={{
                style: {
                  margin: "0.5rem",
                  padding: "1rem",
                  borderRadius: "8px",
                  background: "#fff",
                  color: "#111827",
                },
              }}
              gutter={8}
            />

            {children}
          </Providers>
      </body>
    </html>
  );
}