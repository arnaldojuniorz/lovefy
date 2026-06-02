'use client'

import { useState } from 'react'

export default function ImprimirPage() {
  const [etapa, setEtapa]     = useState(1)
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')
  const [dados, setDados]     = useState({
    destinatario:    '',
    remetente:       '',
    mensagem:        '',
    data_importante: '',
    musica_link:     '',
    nome_pagador:    '',
    email_pagador:   '',
  })

  function atualizar(campo: string, valor: string) {
    setDados(prev => ({ ...prev, [campo]: valor }))
  }

  function avancarEtapa() {
    if (!dados.destinatario || !dados.remetente || !dados.mensagem) {
      setErro('Preencha os campos obrigatorios.')
      return
    }
    setErro('')
    setEtapa(2)
  }

  async function handlePagar() {
    if (!dados.nome_pagador || !dados.email_pagador) {
      setErro('Preencha seu nome e e-mail.')
      return
    }
    setErro('')
    setLoading(true)
    try {
      const response = await fetch('/api/cartas-impressao', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...dados,
          cor:    '#ffffff',
          estilo: 'moderno',
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        setErro(result.error || 'Erro ao salvar carta')
        setLoading(false)
        return
      }
      window.location.href = `/checkout?carta_id=${result.carta_id}&plano=impressao&tipo=impressao&nome=${encodeURIComponent(dados.nome_pagador)}&email=${encodeURIComponent(dados.email_pagador)}`
    } catch {
      setErro('Erro de conexao. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '40px 16px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <a href="/" style={{ color: '#ff6b9d', textDecoration: 'none', fontSize: '14px', display: 'block', marginBottom: '16px' }}>Voltar</a>
          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '700', margin: '0 0 8px' }}>Carta para impressão</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '0' }}>Um presente simples, mas inesquecível</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {[1, 2].map(n => (
            <div key={n} style={{ flex: 1, height: '4px', borderRadius: '4px', background: n <= etapa ? '#ff6b9d' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} />
          ))}
        </div>

        {erro && (
          <div style={{ background: 'rgba(255,107,157,0.1)', border: '1px solid rgba(255,107,157,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', textAlign: 'center' }}>
            <p style={{ color: '#ff6b9d', fontSize: '14px', margin: 0 }}>{erro}</p>
          </div>
        )}

        {etapa === 1 && (
          <div className="bg-[#16213e] rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Para quem é essa carta?</h2>
            <p className="text-white/50 text-sm mb-8">Preencha os dados principais</p>

            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-sm block mb-2">Para quem é essa carta? *</label>
                <input
                  type="text"
                  value={dados.destinatario}
                  onChange={e => atualizar('destinatario', e.target.value)}
                  placeholder="Ex: Ana"
                  className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-2">Seu nome *</label>
                <input
                  type="text"
                  value={dados.remetente}
                  onChange={e => atualizar('remetente', e.target.value)}
                  placeholder="Ex: Lucas"
                  className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-2">Sua mensagem *</label>
                <textarea
                  value={dados.mensagem}
                  onChange={e => atualizar('mensagem', e.target.value)}
                  placeholder="Escreva tudo que voce sente..."
                  rows={8}
                  className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-2">Data importante (opcional)</label>
                <input
                  type="date"
                  value={dados.data_importante}
                  onChange={e => atualizar('data_importante', e.target.value)}
                  className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-2">Link do Spotify (opcional)</label>
                <input
                  type="text"
                  value={dados.musica_link}
                  onChange={e => atualizar('musica_link', e.target.value)}
                  placeholder="https://open.spotify.com/track/..."
                  className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors text-sm"
                />
                <p className="text-white/30 text-xs mt-2">Um QR Code será incluído na carta</p>
              </div>
            </div>

            <button
              onClick={avancarEtapa}
              className="w-full mt-8 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-4 rounded-xl hover:brightness-110 transition-all"
            >
              Continuar
            </button>
          </div>
        )}

        {etapa === 2 && (
          <div className="bg-[#16213e] rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Quase lá!</h2>
            <p className="text-white/50 text-sm mb-6">Preencha seus dados para finalizar</p>

            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-sm block mb-2">Seu nome *</label>
                <input
                  type="text"
                  value={dados.nome_pagador}
                  onChange={e => atualizar('nome_pagador', e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-2">Seu e-mail *</label>
                <input
                  type="email"
                  value={dados.email_pagador}
                  onChange={e => atualizar('email_pagador', e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors"
                />
              </div>

              <div style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>Carta para impressão</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>PDF em alta qualidade - Fundo branco</p>
                  </div>
                  <p style={{ color: '#f472b6', fontSize: '24px', fontWeight: '900' }}>R$ 6,90</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button
                onClick={() => { setErro(''); setEtapa(1) }}
                disabled={loading}
                style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: '600', padding: '16px', borderRadius: '12px', border: 'none', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
              >
                Voltar
              </button>
              <button
                onClick={handlePagar}
                disabled={loading}
                style={{ flex: 2, background: 'linear-gradient(135deg, #ec4899, #f43f5e)', color: '#fff', fontWeight: '600', padding: '16px', borderRadius: '12px', border: 'none', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
              >
                {loading ? 'Aguarde...' : 'Pagar R$ 6,90'}
              </button>
            </div>

            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '16px' }}>Pagamento seguro pelo Mercado Pago</p>
          </div>
        )}

      </div>
    </main>
  )
}