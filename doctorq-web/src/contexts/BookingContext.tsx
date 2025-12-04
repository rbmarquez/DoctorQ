"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import {
  BookingWizardState,
  Procedure,
  TimeSlot,
  BookingSummary,
} from "@/types/procedure";

interface BookingContextType {
  // Estado do wizard
  booking: BookingWizardState;

  // Ações para navegar entre etapas
  setEtapa: (etapa: 1 | 2 | 3 | 4) => void;
  proximaEtapa: () => void;
  etapaAnterior: () => void;

  // Ações para atualizar dados do agendamento
  setProcedimento: (
    procedimento: Procedure,
    profissional: BookingWizardState["profissional"]
  ) => void;
  setDataHorario: (data: string, horario: TimeSlot) => void;
  setDadosPaciente: (paciente: BookingWizardState["paciente"]) => void;
  setPagamento: (
    forma: "online" | "na_clinica",
    metodo?: "pix" | "credito" | "debito" | "boleto"
  ) => void;

  // Ações de controle
  resetBooking: () => void;
  finalizarAgendamento: () => Promise<{ sucesso: boolean; id_agendamento?: string }>;

  // Helpers
  getBookingSummary: () => BookingSummary | null;
  isEtapaCompleta: (etapa: number) => boolean;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const INITIAL_STATE: BookingWizardState = {
  etapa_atual: 1,
  etapa_concluida: 0,
};

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<BookingWizardState>(INITIAL_STATE);

  // Persistir estado no localStorage
  useEffect(() => {
    const saved = localStorage.getItem("estetiQ_booking");
    if (saved) {
      try {
        setBooking(JSON.parse(saved));
      } catch (error) {
        console.error("Erro ao carregar agendamento salvo:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("estetiQ_booking", JSON.stringify(booking));
  }, [booking]);

  const setEtapa = (etapa: 1 | 2 | 3 | 4) => {
    setBooking((prev) => ({ ...prev, etapa_atual: etapa }));
  };

  const proximaEtapa = () => {
    setBooking((prev) => {
      const novaEtapa = Math.min(prev.etapa_atual + 1, 4) as 1 | 2 | 3 | 4;
      return {
        ...prev,
        etapa_atual: novaEtapa,
        etapa_concluida: Math.max(prev.etapa_concluida, prev.etapa_atual),
      };
    });
  };

  const etapaAnterior = () => {
    setBooking((prev) => {
      const novaEtapa = Math.max(prev.etapa_atual - 1, 1) as 1 | 2 | 3 | 4;
      return { ...prev, etapa_atual: novaEtapa };
    });
  };

  const setProcedimento = (
    procedimento: Procedure,
    profissional: BookingWizardState["profissional"]
  ) => {
    setBooking((prev) => ({
      ...prev,
      procedimento,
      profissional,
      etapa_concluida: Math.max(prev.etapa_concluida, 1),
    }));
  };

  const setDataHorario = (data: string, horario: TimeSlot) => {
    setBooking((prev) => ({
      ...prev,
      data,
      horario,
      etapa_concluida: Math.max(prev.etapa_concluida, 2),
    }));
  };

  const setDadosPaciente = (paciente: BookingWizardState["paciente"]) => {
    setBooking((prev) => ({
      ...prev,
      paciente,
      etapa_concluida: Math.max(prev.etapa_concluida, 3),
    }));
  };

  const setPagamento = (
    forma: "online" | "na_clinica",
    metodo?: "pix" | "credito" | "debito" | "boleto"
  ) => {
    setBooking((prev) => ({
      ...prev,
      forma_pagamento: forma,
      metodo_pagamento: metodo,
      etapa_concluida: Math.max(prev.etapa_concluida, 4),
    }));
  };

  const resetBooking = () => {
    setBooking(INITIAL_STATE);
    localStorage.removeItem("estetiQ_booking");
  };

  const finalizarAgendamento = async (): Promise<{
    sucesso: boolean;
    id_agendamento?: string;
  }> => {
    try {
      // Validar dados necessários
      if (!booking.procedimento || !booking.profissional || !booking.data || !booking.horario || !booking.paciente) {
        throw new Error("Dados incompletos para finalizar agendamento");
      }

      // Importar função de criar agendamento
      const { criarAgendamento } = await import("@/lib/api");

      // Combinar data + horário em timestamp ISO 8601
      const dataHorarioISO = `${booking.data}T${booking.horario.hr_inicio}:00`;

      // Criar agendamento via API
      const agendamento = await criarAgendamento({
        id_paciente: booking.paciente.id_user!, // ID do usuário logado
        id_profissional: booking.profissional.id_profissional!,
        id_clinica: booking.profissional.id_clinica || "00000000-0000-0000-0000-000000000000", // TODO: Pegar da clínica real
        id_procedimento: booking.procedimento.id_procedimento,
        dt_agendamento: dataHorarioISO,
        nr_duracao_minutos: booking.horario.duracao_minutos || 60,
        ds_motivo: booking.procedimento.nm_procedimento,
        ds_observacoes: booking.paciente.ds_observacoes,
        vl_valor: booking.profissional.vl_preco_procedimento,
        ds_forma_pagamento: booking.forma_pagamento,
      });

      // Limpar estado após sucesso
      resetBooking();

      return { sucesso: true, id_agendamento: agendamento.id_agendamento };
    } catch (error: any) {
      console.error("Erro ao finalizar agendamento:", error);
      return { sucesso: false };
    }
  };

  const getBookingSummary = (): BookingSummary | null => {
    if (!booking.procedimento || !booking.profissional || !booking.data || !booking.horario) {
      return null;
    }

    // Formatar data em português
    const dataObj = new Date(booking.data);
    const diasSemana = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    const diaSemana = diasSemana[dataObj.getDay()];
    const dia = dataObj.getDate();
    const mes = meses[dataObj.getMonth()];
    const ano = dataObj.getFullYear();

    const ds_data_formatada = `${diaSemana}, ${dia} de ${mes} de ${ano}`;

    return {
      procedimento: {
        nm_procedimento: booking.procedimento.nm_procedimento,
        ds_categoria: booking.procedimento.ds_categoria,
        nr_tempo_procedimento_min: booking.procedimento.nr_tempo_procedimento_min,
      },
      profissional: {
        nm_profissional: booking.profissional.nm_profissional,
        ds_foto_url: booking.profissional.ds_foto_url,
        nm_clinica: "Clínica de Estética", // TODO: Vir do backend
        ds_endereco: "Av. Paulista, 1000 - São Paulo, SP", // TODO: Vir do backend
      },
      data_hora: {
        dt_data: booking.data,
        hr_inicio: booking.horario.hr_inicio,
        hr_fim: booking.horario.hr_fim,
        ds_data_formatada,
      },
      valores: {
        vl_procedimento: booking.profissional.vl_preco_procedimento,
        vl_desconto: 0,
        vl_total: booking.profissional.vl_preco_procedimento,
      },
      pagamento: {
        forma: booking.forma_pagamento || "na_clinica",
        metodo: booking.metodo_pagamento,
      },
    };
  };

  const isEtapaCompleta = (etapa: number): boolean => {
    return booking.etapa_concluida >= etapa;
  };

  const value: BookingContextType = {
    booking,
    setEtapa,
    proximaEtapa,
    etapaAnterior,
    setProcedimento,
    setDataHorario,
    setDadosPaciente,
    setPagamento,
    resetBooking,
    finalizarAgendamento,
    getBookingSummary,
    isEtapaCompleta,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}
