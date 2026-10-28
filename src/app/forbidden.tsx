import { StatusScreen } from "@/components/status-screen";

export default function Forbidden() {
  return (
    <StatusScreen
      title="Acesso negado."
      description="Você não tem permissão para acessar esta página."
      action={{ label: "Voltar ao início", href: "/" }}
    />
  );
}
