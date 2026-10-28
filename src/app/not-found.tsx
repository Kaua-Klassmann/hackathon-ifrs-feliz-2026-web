import { StatusScreen } from "@/components/status-screen";

export default function NotFound() {
  return (
    <StatusScreen
      title="Página não encontrada."
      description="A página que você procura não existe ou foi movida."
      action={{ label: "Voltar ao início", href: "/" }}
    />
  );
}
