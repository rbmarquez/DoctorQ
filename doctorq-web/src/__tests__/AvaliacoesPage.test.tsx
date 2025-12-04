import type React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AvaliacoesPage from "@/app/(public)/marketplace/avaliacoes/page";
import {
  useAvaliacoes,
  criarAvaliacao,
  revalidarAvaliacoes,
  type Avaliacao,
} from "@/lib/api/hooks/useAvaliacoes";
import { useAuth } from "@/hooks/useAuth";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

jest.mock("next-auth/react", () => ({
  __esModule: true,
  useSession: jest.fn(() => ({ data: null, status: "unauthenticated" })),
}));

jest.mock("@/lib/api/hooks/useAvaliacoes");
jest.mock("@/hooks/useAuth");

const mockedUseAvaliacoes = useAvaliacoes as jest.MockedFunction<typeof useAvaliacoes>;
const mockedCriarAvaliacao = criarAvaliacao as jest.MockedFunction<typeof criarAvaliacao>;
const mockedRevalidarAvaliacoes = revalidarAvaliacoes as jest.MockedFunction<
  typeof revalidarAvaliacoes
>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

type UseAvaliacoesReturn = ReturnType<typeof useAvaliacoes>;

const createUseAvaliacoesMock = (overrides: Partial<UseAvaliacoesReturn> = {}): UseAvaliacoesReturn =>
  ({
    avaliacoes: [],
    total: 0,
    page: 1,
    size: 20,
    totalPages: 0,
    meta: { totalItems: 0, itemsPerPage: 20, totalPages: 0, currentPage: 1 },
    isLoading: false,
    isError: false,
    error: null,
    mutate: jest.fn(),
    ...overrides,
  }) as UseAvaliacoesReturn;

beforeEach(() => {
  jest.clearAllMocks();
});

it("exibe o estado de carregamento", () => {
  mockedUseAvaliacoes.mockReturnValue(createUseAvaliacoesMock({ isLoading: true }));
  mockedUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false, user: null });

  render(<AvaliacoesPage />);

  expect(screen.getByText("Carregando avaliações...")).toBeInTheDocument();
});

it("renderiza avaliações quando os dados são carregados", () => {
  const avaliacao: Avaliacao = {
    id_avaliacao: "1",
    id_paciente: "paciente-1",
    nr_nota: 4,
    ds_comentario: "Ótimo atendimento",
    st_aprovada: true,
    st_visivel: true,
    st_verificada: true,
    nr_likes: 3,
    nr_nao_util: 0,
    st_recomenda: true,
    st_verificado: true,
    dt_criacao: new Date().toISOString(),
    dt_atualizacao: new Date().toISOString(),
    nm_user: "Paciente Teste",
  };

  mockedUseAvaliacoes.mockReturnValue(
    createUseAvaliacoesMock({
      avaliacoes: [avaliacao],
      meta: { totalItems: 1, itemsPerPage: 20, totalPages: 1, currentPage: 1 },
    })
  );
  mockedUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false, user: null });

  render(<AvaliacoesPage />);

  expect(screen.getByText("Paciente Teste")).toBeInTheDocument();
  expect(screen.getByText("Ótimo atendimento")).toBeInTheDocument();
  expect(screen.getByText("Verificado")).toBeInTheDocument();
});

it("exibe mensagem de erro e permite tentar novamente", async () => {
  mockedUseAvaliacoes.mockReturnValue(
    createUseAvaliacoesMock({
      error: new Error("Falha ao carregar"),
      isError: true,
    })
  );
  mockedUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false, user: null });
  mockedRevalidarAvaliacoes.mockResolvedValue(undefined);

  render(<AvaliacoesPage />);

  expect(
    screen.getByText("Não foi possível carregar as avaliações")
  ).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

  expect(mockedRevalidarAvaliacoes).toHaveBeenCalledTimes(1);
});

it("permite enviar uma nova avaliação após autenticação", async () => {
  mockedUseAvaliacoes.mockReturnValue(createUseAvaliacoesMock());
  mockedUseAuth.mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    user: { id_user: "user-123" } as any,
  });

  mockedCriarAvaliacao.mockResolvedValue({
    id_avaliacao: "nova-avaliacao",
    id_paciente: "user-123",
    nr_nota: 5,
    ds_comentario: "Comentário enviado",
    st_aprovada: true,
    st_visivel: true,
    st_verificada: false,
    nr_likes: 0,
    nr_nao_util: 0,
    st_recomenda: true,
    dt_criacao: new Date().toISOString(),
    dt_atualizacao: new Date().toISOString(),
  });
  mockedRevalidarAvaliacoes.mockResolvedValue(undefined);

  render(<AvaliacoesPage />);

  const comentarioInput = screen.getByLabelText("Comentário");
  await userEvent.type(comentarioInput, "Minha experiência foi excelente!");

  const submitButton = screen.getByRole("button", { name: "Enviar avaliação" });
  await userEvent.click(submitButton);

  await waitFor(() => {
    expect(mockedCriarAvaliacao).toHaveBeenCalledWith({
      id_paciente: "user-123",
      nr_nota: 5,
      ds_comentario: "Minha experiência foi excelente!",
    });
  });

  expect(mockedRevalidarAvaliacoes).toHaveBeenCalledTimes(1);
  expect(
    screen.getByText("Avaliação enviada com sucesso! Obrigado por compartilhar sua experiência.")
  ).toBeInTheDocument();
});
