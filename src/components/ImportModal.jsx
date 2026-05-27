import { useState } from 'react'
import { Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { readJsonFile, importTrip } from '../lib/importTrip'
import Button from './ui/Button'
import Modal from './ui/Modal'
import Spinner from './ui/Spinner'

export default function ImportModal({ open, onClose, onImportSuccess }) {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.json')) {
        setError('Por favor, selecione um arquivo JSON')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleImport = async () => {
    if (!file || !user) return

    setLoading(true)
    setError('')
    setSuccess(null)

    try {
      // Ler JSON
      const data = await readJsonFile(file)

      // Validar estrutura básica
      if (!data.trip || !data.trip.nome) {
        throw new Error('JSON inválido: faltam dados da viagem')
      }

      // Importar
      const result = await importTrip(data, user.id)

      setSuccess({
        tripId: result.tripId,
        tripName: data.trip.nome,
        accommodationsCount: result.accommodationsCount,
        flightsCount: result.flightsCount,
        activitiesCount: result.activitiesCount,
        errors: result.errors
      })

      // Resetar após sucesso
      setFile(null)
      setTimeout(() => {
        onImportSuccess?.(result.tripId)
        onClose()
      }, 2000)
    } catch (err) {
      setError(err.message || 'Erro ao importar viagem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="📥 Importar Viagem">
      <div className="flex flex-col gap-4">
        {!success ? (
          <>
            {/* Input de arquivo */}
            <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-accent/50 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="pointer-events-none">
                <Upload size={32} className="mx-auto mb-2 text-gray-500" />
                <p className="text-white font-medium">
                  {file ? file.name : 'Clique ou arraste um arquivo JSON'}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {file ? '✓ Arquivo selecionado' : 'Formato: bariloche-2026-import.json'}
                </p>
              </div>
            </div>

            {/* Estrutura esperada */}
            <div className="bg-white/5 rounded-lg p-3 text-xs text-gray-400">
              <p className="font-medium text-white mb-2">Estrutura esperada:</p>
              <code className="block whitespace-pre-wrap">
                {`{
  "trip": { ... },
  "accommodations": [ ... ],
  "flights": [ ... ],
  "car_rental": { ... },
  "activities": [ ... ]
}`}
              </code>
            </div>

            {/* Erro */}
            {error && (
              <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Botão */}
            <Button
              onClick={handleImport}
              disabled={!file || loading}
              loading={loading}
              className="w-full"
            >
              {loading ? 'Importando...' : 'Importar Viagem'}
            </Button>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="flex justify-center mb-4">
              <CheckCircle size={48} className="text-green-400" />
            </div>
            <p className="text-white font-medium mb-3">Viagem importada com sucesso!</p>
            <div className="bg-white/5 rounded-lg p-3 text-sm text-left mb-4">
              <p className="text-white font-medium mb-2">{success.tripName}</p>
              <div className="text-gray-400 text-xs space-y-1">
                <p>✓ {success.accommodationsCount} hospedagem(ns)</p>
                <p>✓ {success.flightsCount} voo(s)</p>
                <p>✓ {success.activitiesCount} atividade(s)</p>
                {success.errors.length > 0 && (
                  <p className="text-yellow-400 mt-2">⚠ {success.errors.length} aviso(s)</p>
                )}
              </div>
            </div>
            <p className="text-gray-500 text-xs">Fechando em breve...</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
