import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Plane } from 'lucide-react'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email) return
    setLoading(true)
    try {
      await signIn(email)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Erro ao enviar magic link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center">
            <Plane size={32} className="text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-white">Trips</h1>
          <p className="text-gray-400 text-sm text-center">Seu app pessoal de viagens</p>
        </div>

        {sent ? (
          <div className="bg-accent/10 border border-accent/30 rounded-2xl p-6 text-center">
            <p className="text-white font-medium mb-2">Link enviado!</p>
            <p className="text-gray-400 text-sm">Verifique seu email <span className="text-white">{email}</span> e clique no link para entrar.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" loading={loading} className="w-full py-3">
              Entrar com Magic Link
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
