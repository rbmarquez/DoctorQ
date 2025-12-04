export interface ProcedureDetail {
  id: string;
  slug: string;
  nome: string;
  resumo: string;
  descricaoCompleta: string;
  preco: {
    valorBase: number;
    moeda: string;
    pacotes?: Array<{
      nome: string;
      valor: number;
      descricao: string;
    }>;
  };
  duracaoMinutos: number;
  avaliacao: number;
  totalAvaliacoes: number;
  localizacao: string;
  imagem: string;
  beneficios: string[];
  indicadoPara: string[];
  etapas: string[];
  cuidadosPosProcedimento: string[];
  materiaisUtilizados: string[];
  diferenciais: string[];
  profissionaisRecomendados: Array<{
    id: string;
    nome: string;
    especialidade: string;
    experiencia: string;
    avaliacao: number;
    totalAvaliacoes: number;
  }>;
  faqs: Array<{
    pergunta: string;
    resposta: string;
  }>;
}

export const PROCEDURES_CATALOG: ProcedureDetail[] = [
  {
    id: "1",
    slug: "limpeza-pele-profunda",
    nome: "Limpeza de Pele Profunda",
    resumo: "Remoção completa de impurezas com extração manual e máscara calmante.",
    descricaoCompleta:
      "A Limpeza de Pele Profunda é indicada para todos os tipos de pele e utiliza extração manual combinada com vapor de ozônio e alta frequência para remover impurezas acumuladas. O protocolo termina com máscara calmante e aplicação de séruns antioxidantes para recuperar o equilíbrio natural da pele.",
    preco: {
      valorBase: 150,
      moeda: "BRL",
      pacotes: [
        {
          nome: "Protocolo Detox (3 sessões)",
          valor: 420,
          descricao: "Ideal para peles oleosas com tendência à acne.",
        },
        {
          nome: "Programa Renovação (5 sessões)",
          valor: 680,
          descricao: "Combina limpeza profunda com hidratação avançada.",
        },
      ],
    },
    duracaoMinutos: 60,
    avaliacao: 4.8,
    totalAvaliacoes: 156,
    localizacao: "São Paulo, SP",
    imagem:
      "https://images.unsplash.com/photo-1559598467-0ef4847c7f33?auto=format&fit=crop&w=1200&q=80",
    beneficios: [
      "Reduz cravos, espinhas e textura irregular",
      "Estimula renovação celular e microcirculação",
      "Promove equilíbrio na produção de oleosidade",
      "Melhora a absorção de dermocosméticos",
    ],
    indicadoPara: [
      "Peles com excesso de oleosidade",
      "Pacientes em protocolos de acne",
      "Preparação para outros procedimentos faciais",
    ],
    etapas: [
      "Higienização e análise da pele",
      "Esfoliação física e/ou química controlada",
      "Abertura de poros com vapor de ozônio",
      "Extração manual com técnicas suaves",
      "Alta frequência e máscara calmante",
      "Finalização com sérum antioxidante e FPS",
    ],
    cuidadosPosProcedimento: [
      "Evitar exposição solar direta por 48 horas",
      "Manter hidratação com produtos calmantes",
      "Não manipular a pele com as mãos sujas",
      "Aplicar protetor solar FPS 50 a cada 2 horas",
    ],
    materiaisUtilizados: [
      "Dermocosméticos de limpeza e hidratação",
      "Equipamento de vapor de ozônio",
      "Aparelho de alta frequência",
      "Máscaras calmantes e antioxidantes",
    ],
    diferenciais: [
      "Protocolo personalizado conforme análise facial com IA",
      "Registro fotográfico antes e depois no prontuário digital",
      "Profissionais certificados pelo Conselho Regional",
    ],
    profissionaisRecomendados: [
      {
        id: "1",
        nome: "Dra. Ana Silva",
        especialidade: "Dermatologia Estética",
        experiencia: "12 anos de atuação em clínicas de referência",
        avaliacao: 4.9,
        totalAvaliacoes: 342,
      },
      {
        id: "2",
        nome: "Dra. Mariana Costa",
        especialidade: "Estética Facial",
        experiencia: "15 anos com foco em protocolos faciais",
        avaliacao: 4.8,
        totalAvaliacoes: 278,
      },
    ],
    faqs: [
      {
        pergunta: "Com qual frequência devo fazer a limpeza de pele?",
        resposta:
          "O ideal é realizar a limpeza de pele profunda a cada 30 ou 45 dias para manter equilíbrio e resultados duradouros. O profissional pode ajustar o intervalo conforme o quadro da pele.",
      },
      {
        pergunta: "A limpeza de pele deixa marcas?",
        resposta:
          "Quando realizada por profissionais capacitados, a extração é cuidadosa e não deixa marcas. Pode ocorrer leve vermelhidão por até 24h, amenizada com produtos calmantes.",
      },
    ],
  },
  {
    id: "2",
    slug: "limpeza-pele-peeling",
    nome: "Limpeza de Pele com Peeling Químico Suave",
    resumo: "Combina extração com peeling químico para acelerar renovação celular.",
    descricaoCompleta:
      "Procedimento que une limpeza profunda tradicional à aplicação de peeling químico superficial com ácido mandélico e salicílico, indicado para peles com manchas leves e textura irregular. Promove renovação e luminosidade imediata.",
    preco: {
      valorBase: 220,
      moeda: "BRL",
      pacotes: [
        {
          nome: "Ciclo Revitalizante (3 sessões)",
          valor: 630,
          descricao: "Alterna concentrações para resultados progressivos.",
        },
        {
          nome: "Programa Controle de Oleosidade (4 sessões)",
          valor: 820,
          descricao: "Inclui dermocosméticos home care específicos.",
        },
      ],
    },
    duracaoMinutos: 90,
    avaliacao: 4.9,
    totalAvaliacoes: 203,
    localizacao: "São Paulo, SP",
    imagem:
      "https://images.unsplash.com/photo-1556228578-3f3b6838322c?auto=format&fit=crop&w=1200&q=80",
    beneficios: [
      "Uniformiza o tom da pele e reduz manchas leves",
      "Diminui poros dilatados e brilho excessivo",
      "Estimula produção de colágeno e elastina",
      "Resultados visíveis já na primeira sessão",
    ],
    indicadoPara: [
      "Peles com manchas pós-acne",
      "Peles oleosas e com textura irregular",
      "Pacientes que buscam efeito glow imediato",
    ],
    etapas: [
      "Limpeza profunda e avaliação da pele",
      "Esfoliação física controlada",
      "Extração manual com técnicas específicas",
      "Aplicação de peeling químico combinando ácidos",
      "Máscara calmante e neutralização",
      "Finalização com hidratante reparador e fotoproteção",
    ],
    cuidadosPosProcedimento: [
      "Suspender ácidos e retinoides por 5 dias",
      "Hidratar a pele com produtos regeneradores",
      "Usar FPS 50 com reaplicação a cada 3 horas",
      "Evitar sauna, piscina e esfoliantes por 7 dias",
    ],
    materiaisUtilizados: [
      "Ácido mandélico e salicílico",
      "Peeling químico profissional controlado",
      "Neutralizante específico",
      "Máscaras calmantes e dermocosméticos reparadores",
    ],
    diferenciais: [
      "Protocolo validado por dermatologistas parceiros DoctorQ",
      "Monitoramento digital de evolução com fotos automáticas",
      "Integração com recomendações de home care personalizadas",
    ],
    profissionaisRecomendados: [
      {
        id: "3",
        nome: "Dr. Pedro Santos",
        especialidade: "Cirurgia Plástica e Harmonização",
        experiencia: "8 anos com foco em rejuvenescimento facial",
        avaliacao: 5.0,
        totalAvaliacoes: 421,
      },
      {
        id: "1",
        nome: "Dra. Ana Silva",
        especialidade: "Dermatologia Estética",
        experiencia: "12 anos de atuação em clínicas de referência",
        avaliacao: 4.9,
        totalAvaliacoes: 342,
      },
    ],
    faqs: [
      {
        pergunta: "O peeling causa descamação intensa?",
        resposta:
          "A descamação é leve e controlada, ocorrendo entre o 2º e 4º dia após o procedimento. O uso de hidratantes calmantes recomendados mantém o conforto da pele.",
      },
      {
        pergunta: "Posso combinar com outros procedimentos?",
        resposta:
          "Sim. Após avaliação profissional, é possível combinar com LED, hidratação injetável ou protocolos antiacne para potencializar resultados.",
      },
    ],
  },
  {
    id: "3",
    slug: "limpeza-pele-hidratacao",
    nome: "Limpeza de Pele + Hidratação Intensiva",
    resumo: "Limpeza completa seguida de infusão de ativos hidratantes e antioxidantes.",
    descricaoCompleta:
      "Protocolo indicado para peles desidratadas e sensibilizadas. Após a limpeza profunda, é realizada infusão de ativos com tecnologia de eletroporação e máscara bioestimulante para restaurar a barreira cutânea.",
    preco: {
      valorBase: 180,
      moeda: "BRL",
      pacotes: [
        {
          nome: "Plano Hidratação Essencial (3 sessões)",
          valor: 510,
          descricao: "Resultados progressivos para peles secas e sensíveis.",
        },
        {
          nome: "Boost Glow (4 sessões)",
          valor: 720,
          descricao: "Inclui LED regenerador e máscara de biocelulose.",
        },
      ],
    },
    duracaoMinutos: 75,
    avaliacao: 4.7,
    totalAvaliacoes: 89,
    localizacao: "Rio de Janeiro, RJ",
    imagem:
      "https://images.unsplash.com/photo-1522336572468-97b06e8ef143?auto=format&fit=crop&w=1200&q=80",
    beneficios: [
      "Restaura a barreira cutânea e repõe ativos essenciais",
      "Reduz sinais de sensibilidade e ardência",
      "Promove efeito glow imediato e duradouro",
      "Pode ser realizado em qualquer estação do ano",
    ],
    indicadoPara: [
      "Peles sensibilizadas por ácidos ou clima frio",
      "Pós-procedimentos como lasers fracionados",
      "Pacientes com rotina intensa e sinais de fadiga",
    ],
    etapas: [
      "Limpeza suave e análise da barreira cutânea",
      "Esfoliação enzimática para remover células mortas",
      "Extração manual com técnica delicada",
      "Eletroporação com ativos hidratantes e antioxidantes",
      "Máscara bioestimulante de biocelulose",
      "Finalização com hidratante reparador e filtro solar",
    ],
    cuidadosPosProcedimento: [
      "Evitar banhos muito quentes por 24 horas",
      "Manter rotina intensa de hidratação por 7 dias",
      "Priorizar dermocosméticos sem fragrância durante a recuperação",
      "Usar protetor solar FPS 50 com reaplicação regular",
    ],
    materiaisUtilizados: [
      "Ativos com ácido hialurônico e pantenol",
      "Tecnologia de eletroporação",
      "Máscara de biocelulose hidratante",
      "LED regenerador opcional",
    ],
    diferenciais: [
      "Protocolos aprovados por equipe médica DoctorQ",
      "Relatório digital com orientações de home care personalizado",
      "Integração com agenda inteligente para manutenção mensal",
    ],
    profissionaisRecomendados: [
      {
        id: "2",
        nome: "Dra. Mariana Costa",
        especialidade: "Estética Facial",
        experiencia: "15 anos com foco em protocolos faciais",
        avaliacao: 4.8,
        totalAvaliacoes: 278,
      },
      {
        id: "4",
        nome: "Dra. Rafaela Martins",
        especialidade: "Dermocosmética Avançada",
        experiencia: "10 anos com protocolos regenerativos",
        avaliacao: 4.9,
        totalAvaliacoes: 198,
      },
    ],
    faqs: [
      {
        pergunta: "Posso fazer antes de um evento importante?",
        resposta:
          "Sim! O protocolo proporciona efeito glow no mesmo dia e não exige tempo de recuperação, sendo ideal para preparar a pele antes de eventos.",
      },
      {
        pergunta: "É indicado para gestantes?",
        resposta:
          "Os ativos utilizados são seguros para gestantes, mas sempre recomendamos avaliação prévia com o profissional responsável pelo pré-natal.",
      },
    ],
  },
];

const PROCEDURE_MAP = new Map(PROCEDURES_CATALOG.map((procedure) => [procedure.id, procedure]));

export function getProcedureById(id: string): ProcedureDetail | undefined {
  return PROCEDURE_MAP.get(id);
}
