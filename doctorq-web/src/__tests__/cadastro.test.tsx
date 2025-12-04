import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CadastroPage from "@/app/cadastro/page";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

const pushMock = jest.fn();
const originalFetch = global.fetch;

beforeAll(() => {
  class ResizeObserver {
    observe() {
      return undefined;
    }
    unobserve() {
      return undefined;
    }
    disconnect() {
      return undefined;
    }
  }

  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    value: ResizeObserver,
  });

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

beforeEach(() => {
  jest.clearAllMocks();

  const { useRouter, useSearchParams } = jest.requireMock("next/navigation");
  useRouter.mockReturnValue({
    push: pushMock,
  });

  useSearchParams.mockReturnValue({
    get: () => null,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  global.fetch = originalFetch;
});

describe("CadastroPage form validation", () => {
  it("keeps submit disabled until all fields are valid and termos are aceitos", async () => {
    const user = userEvent.setup();
    render(<CadastroPage />);

    const nomeInput = screen.getByLabelText("Nome");
    const sobrenomeInput = screen.getByLabelText("Sobrenome");
    const emailInput = screen.getByLabelText(/^Email$/i);
    const emailConfirmInput = screen.getByLabelText("Confirmação de email");
    const senhaInput = screen.getByLabelText("Senha");
    const submitButton = screen.getByRole("button", { name: /criar conta/i });

    expect(submitButton).toBeDisabled();

    await user.type(nomeInput, "Ana");
    await user.type(sobrenomeInput, "Silva");
    await user.type(emailInput, "ana@example.com");
    await user.type(emailConfirmInput, "ana@example.com");
    await user.type(senhaInput, "seguranca1");

    expect(submitButton).toBeDisabled();

    const termosCheckbox = screen.getByRole("checkbox", {
      name: /ao continuar/i,
    });
    await user.click(termosCheckbox);

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });

  it("exibe mensagem de erro quando emails não coincidem e envia dados válidos", async () => {
    const user = userEvent.setup();

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as unknown as Response);
    (global as unknown as { fetch: typeof fetchMock }).fetch = fetchMock;

    render(<CadastroPage />);

    const nomeInput = screen.getByLabelText("Nome");
    const sobrenomeInput = screen.getByLabelText("Sobrenome");
    const emailInput = screen.getByLabelText(/^Email$/i);
    const emailConfirmInput = screen.getByLabelText("Confirmação de email");
    const senhaInput = screen.getByLabelText("Senha");
    const termosCheckbox = screen.getByRole("checkbox", {
      name: /ao continuar/i,
    });
    const submitButton = screen.getByRole("button", { name: /criar conta/i });

    await user.type(nomeInput, "Beatriz");
    await user.type(sobrenomeInput, "Lima");
    await user.type(emailInput, "bia@example.com");
    await user.type(emailConfirmInput, "outra@example.com");
    await user.type(senhaInput, "segura123");
    await user.click(termosCheckbox);

    expect(submitButton).toBeDisabled();

    await user.clear(emailConfirmInput);
    await user.type(emailConfirmInput, "bia@example.com");

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(requestInit).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const body = JSON.parse((requestInit as RequestInit).body as string);
    expect(body).toMatchObject({
      nm_email: "bia@example.com",
      nm_completo: "Beatriz Lima",
      senha: "segura123",
      nm_papel: "usuario",
    });

    await waitFor(
      () => {
        expect(pushMock).toHaveBeenCalledWith("/login?registered=true");
      },
      { timeout: 2500 },
    );
  });
});
