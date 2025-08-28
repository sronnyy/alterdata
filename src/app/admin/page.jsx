
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions"; // caminho onde você definiu o NextAuth
import { redirect } from "next/navigation";
import Home from "@/components/AdminComponents/Home"; // Importa a página Home
import { signOut } from 'next-auth/react';


export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <div>
     <Home/>
    </div>
  );
}
