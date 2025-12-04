"use client"

/**
 * Agendas Consolidadas do Profissional
 *
 * Exibe todos os agendamentos do profissional em todas as clínicas onde trabalha.
 * Permite filtrar por período, status e clínica.
 */

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, User, Filter, ChevronDown, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface AgendamentoConsolidado {
  id_agendamento: string
  dt_agendamento: string
  nr_duracao_minutos: number
  ds_status: string | null
  ds_motivo: string | null
  st_confirmado: boolean | null
  vl_valor: number | null
  st_pago: boolean | null
  clinica: {
    id_clinica: string
    nm_clinica: string
    nm_cidade: string | null
  } | null
  paciente: {
    id_paciente: string
    nm_paciente: string
    nr_telefone: string | null
  } | null
}

export default function AgendasConsolidadasPage() {
  const { user } = useAuth()
  const [agendamentos, setAgendamentos] = useState<AgendamentoConsolidado[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [dataFim, setDataFim] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date.toISOString().split('T')[0]
  })

  const idProfissional = user?.id_profissional || user?.uid

  useEffect(() => {
    if (!idProfissional) return

    setLoading(true)

    const params = new URLSearchParams({
      dt_inicio: dataInicio + 'T00:00:00',
      dt_fim: dataFim + 'T23:59:59',
    })

    if (filtroStatus !== 'todos') {
      params.append('status', filtroStatus)
    }

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/profissionais/${idProfissional}/agendas/consolidadas/?${params}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    )
      .then(res => res.json())
      .then(data => setAgendamentos(data))
      .catch(err => console.error('Erro ao carregar agendas:', err))
      .finally(() => setLoading(false))
  }, [idProfissional, dataInicio, dataFim, filtroStatus])

  // Agrupar por data
  const agendamentosPorData = agendamentos.reduce((acc, agendamento) => {
    const data = new Date(agendamento.dt_agendamento).toLocaleDateString('pt-BR')
    if (!acc[data]) {
      acc[data] = []
    }
    acc[data].push(agendamento)
    return acc
  }, {} as Record<string, AgendamentoConsolidado[]>)

  const datasOrdenadas = Object.keys(agendamentosPorData).sort((a, b) => {
    const dateA = new Date(a.split('/').reverse().join('-'))
    const dateB = new Date(b.split('/').reverse().join('-'))
    return dateA.getTime() - dateB.getTime()
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Agendas Consolidadas</h1>
        <p className="text-gray-600 mt-1">
          Visualize todos os seus agendamentos em todas as clínicas
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Data Início */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Data Fim */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="agendado">Agendado</option>
              <option value="confirmado">Confirmado</option>
              <option value="realizado">Realizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Total */}
          <div className="flex items-end">
            <div className="w-full px-4 py-2 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-900">
                {agendamentos.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : datasOrdenadas.length > 0 ? (
        <div className="space-y-6">
          {datasOrdenadas.map((data) => (
            <div key={data} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header da Data */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">{data}</h3>
                  <span className="text-sm opacity-90">
                    ({agendamentosPorData[data].length} agendamentos)
                  </span>
                </div>
              </div>

              {/* Lista de Agendamentos do Dia */}
              <div className="divide-y divide-gray-200">
                {agendamentosPorData[data].map((agendamento) => (
                  <div
                    key={agendamento.id_agendamento}
                    className="p-6 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between">
                      {/* Informações Principais */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-gray-400" />
                            <span className="font-semibold text-gray-900">
                              {new Date(agendamento.dt_agendamento).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({agendamento.nr_duracao_minutos} min)
                            </span>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              agendamento.ds_status === 'confirmado'
                                ? 'bg-green-100 text-green-800'
                                : agendamento.ds_status === 'cancelado'
                                ? 'bg-red-100 text-red-800'
                                : agendamento.ds_status === 'realizado'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {agendamento.ds_status || 'Agendado'}
                          </span>
                        </div>

                        {/* Paciente */}
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 font-medium">
                            {agendamento.paciente?.nm_paciente || 'Paciente não especificado'}
                          </span>
                          {agendamento.paciente?.nr_telefone && (
                            <span className="text-sm text-gray-500">
                              • {agendamento.paciente.nr_telefone}
                            </span>
                          )}
                        </div>

                        {/* Clínica */}
                        {agendamento.clinica && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">
                              {agendamento.clinica.nm_clinica}
                            </span>
                            {agendamento.clinica.nm_cidade && (
                              <span className="text-sm text-gray-500">
                                • {agendamento.clinica.nm_cidade}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Motivo */}
                        {agendamento.ds_motivo && (
                          <p className="text-sm text-gray-600">
                            {agendamento.ds_motivo}
                          </p>
                        )}
                      </div>

                      {/* Valor */}
                      {agendamento.vl_valor && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Valor</p>
                          <p className="text-lg font-bold text-gray-900">
                            R$ {agendamento.vl_valor.toFixed(2)}
                          </p>
                          {agendamento.st_pago && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                              Pago
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">
            Nenhum agendamento encontrado para o período selecionado
          </p>
        </div>
      )}
    </div>
  )
}
