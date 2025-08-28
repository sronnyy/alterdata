import "./globals.css";
import Providers from "@/components/Provider/Provider"; // Componente que usa "use client"
import { Toaster } from "react-hot-toast";


export const metadata = {
  title: "Prefeitura de Terra Boa",
  description: "Terra Boa - PR",
};

export default function RootLayout({ children }) {
  
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50">

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
                  color: "#000",
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