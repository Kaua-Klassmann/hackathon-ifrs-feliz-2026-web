/**
 * Camada central de ícones — ponto ÚNICO de substituição.
 *
 * `iconLibrary` é um campo do preset do shadcn (hoje: `lucide`, preset b1VlIttI).
 * Trocar o preset regenera `src/components/ui/**` já com a biblioteca nova, mas
 * NÃO toca no código de aplicação. Se as telas importassem de `lucide-react`
 * direto, uma troca de preset produziria duas linguagens visuais na mesma tela
 * (o X do Dialog numa biblioteca, o LogOut do menu em outra) sem nenhum erro de
 * build avisando.
 *
 * Por isso: `lucide-react` só pode ser importado em `src/components/ui/**`
 * (gerado pela CLI) e neste arquivo. Todo o resto importa daqui.
 *
 * Ao trocar de biblioteca, edite SÓ este arquivo, remapeando os nomes:
 *   export { IconCheck as Check } from "@tabler/icons-react";
 *
 * Os nomes são os do lucide de propósito: 20 dos 39 são glifos de navegação
 * escolhidos item a item no menu, e apelidá-los semanticamente criaria uma
 * camada de tradução sem ganho. O objetivo aqui é ponto único de substituição,
 * não vocabulário semântico.
 */

export {
  // Navegação e layout
  Activity,
  Armchair,
  Banknote,
  Calendar,
  ChartBar,
  CheckSquare,
  ChevronRight,
  Command,
  FileText,
  Fingerprint,
  Footprints,
  Forklift,
  Gauge,
  GraduationCap,
  History,
  Kanban,
  LayoutDashboard,
  ListTodo,
  Lock,
  Mail,
  MessageSquare,
  ReceiptText,
  Server,
  ShoppingBag,
  SquareArrowUpRight,
  Stethoscope,
  Users,
  // Conta e sessão
  CircleUser,
  EllipsisVertical,
  LogOut,
  // Tema
  Monitor,
  Moon,
  Sun,
  // Ações e estado
  ArrowUpDown,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  CircleAlert,
  CircleCheck,
  Clock,
  Clock3,
  Cog,
  CreditCard,
  Download,
  Droplet,
  Eye,
  EyeOff,
  Globe,
  Grid,
  Loader,
  MoreHorizontal,
  PersonStanding,
  Pill,
  Plus,
  RotateCw,
  Rows3,
  ScanEye,
  Search,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

/**
 * Tipo agnóstico de biblioteca.
 *
 * `src/navigation/sidebar/sidebar-items.ts` tipa a estrutura inteira de
 * navegação nisto — o acoplamento não era só de import, era de tipo.
 */
export type { LucideIcon as Icon } from "lucide-react";
