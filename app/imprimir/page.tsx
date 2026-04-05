'use client'

import { useState } from 'react'

const PRECO_IMPRESSAO = 9.90

export default function ImprimirPage() {
  const [etapa, setEtapa] = useState(1)
  const [loading, setLoading] = useState(false)
  const [dados, setDados] = useState({
    destinatario: '',
    remetente: '',
    mensagem: '',
    data_importante: '',
    cor: '#ff6b9d',
    estilo: 'classico',
    musica_link: '',
    nome_pagador: '',
    email_pagador: '',
  })

  function atualizar(campo: string, valor: string) {
    setDados(prev => ({ ...prev, [campo]: valor }))
  }

  async function handlePagar() {
    if (!dados.nome_pagador || !dados.email_pagador) {
      alert('Preencha seu nome e e-mail!')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/cartas-impressao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || 'Erro ao salvar carta')
        setLoading(false)
        return
      }

      window.location.href = `/checkout?carta_id=${result.carta_id}&plano=impressao&tipo=impressao&nome=${encodeURIComponent(dados.nome_pagador)}&email=${encodeURIComponent(dados.email_pagador)}`

    } catch {
      alert('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '40px 16px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <a href="/" style={{ color: '#ff6b9d', textDecoration: 'none', fontSize: '14px', display: 'block', marginBottom: '16px' }}>← Voltar</a>
          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '700', margin: '0 0 8px' }}>Carta para impressão</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '0' }}>Um presente simples, mas inesquecível</p>
        </div>

        {/* Barra de progresso */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ flex: 1, height: '4px', borderRadius: '4px', background: n <= etapa ? '#ff6b9d' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} />
          ))}
        </div>

        {/* Etapa 1 */}
        {etapa === 1 && (
          <div className="bg-[#16213e] rounded-3xl p-8">
            <h1 className="text-2xl font-bold text-white mb-2">Para quem é essa carta? 💌</h1>
            <p className="text-white/50 text-sm mb-8">Preencha os dados principais</p>

            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-sm block mb-2">Para quem é essa carta? *</label>
                <input type="text" value={dados.destinatario} onChange={e => atualizar('destinatario', e.target.value)}
                  placeholder="Ex: Ana"
                  className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors" />
              </div>

              <div>
                <label className="text-white/70 text-sm block mb-2">Seu nome *</label>
                <input type="text" value={dados.remetente} onChange={e => atualizar('remetente', e.target.value)}
                  placeholder="Ex: Lucas"
                  className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors" />
              </div>

              <div>
                <label className="text-white/70 text-sm block mb-2">Sua mensagem *</label>
                <textarea value={dados.mensagem} onChange={e => atualizar('mensagem', e.target.value)}
                  placeholder="Escreva tudo que você sente..."
                  rows={8}
                  className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors resize-none" />
              </div>

              <div>
                <label className="text-white/70 text-sm block mb-2">Data importante <span className="text-white/30">(opcional)</span></label>
                <input type="date" value={dados.data_importante} onChange={e => atualizar('data_importante', e.target.value)}
                  className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors" />
              </div>
            </div>

            <button
              onClick={() => {
                if (!dados.destinatario || !dados.remetente || !dados.mensagem) {
                  alert('Preencha os campos obrigatórios!')
                  return
                }
                setEtapa(2)
              }}
              className="w-full mt-8 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-4 rounded-xl hover:brightness-110 transition-all"
            >
              Continuar →
            </button>
          </div>
        )}

        {/* Etapa 2 */}
        {etapa === 2 && (
          <div className="bg-[#16213e] rounded-3xl p-8">
            <h1 className="text-2xl font-bold text-white mb-2">Estilo da carta 🎨</h1>
            <p className="text-white/50 text-sm mb-8">Personalize o visual</p>

            <div className="space-y-6">
              <div>
                <p className="text-white/70 text-sm mb-3">Escolha o estilo:</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'classico', emoji: '✨', nome: 'Clássico' },
                    { id: 'moderno', emoji: '🌟', nome: 'Moderno' },
                  ].map(e => (
                    <div key={e.id} onClick={() => atualizar('estilo', e.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all text-center ${dados.estilo === e.id ? 'border-pink-500 bg-pink-500/10' : 'border-white/10 bg-[#0f3460] hover:border-white/30'}`}>
                      <div className="text-2xl mb-2">{e.emoji}</div>
                      <div className="text-white/80 text-sm font-medium">{e.nome}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-white/70 text-sm mb-3">Escolha a cor:</p>
                <div className="flex gap-4">
                  {[
                    { cor: '#ff6b9d', nome: 'Rosa' },
                    { cor: '#f5e6d3', nome: 'Bege' },
                    { cor: '#ffffff', nome: 'Branco' },
                    { cor: '#1a1a1a', nome: 'Preto' },
                  ].map(c => (
                    <div key={c.cor} onClick={() => atualizar('cor', c.cor)} title={c.nome}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', background: c.cor, cursor: 'pointer', border: dados.cor === c.cor ? '3px solid rgba(255,255,255,0.8)' : '2px solid transparent', transform: dados.cor === c.cor ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s', boxShadow: (c.cor === '#ffffff' || c.cor === '#f5e6d3') ? '0 0 0 1px rgba(255,255,255,0.2)' : 'none' }} />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white/70 text-sm block mb-2">Link do Spotify <span className="text-white/30">(opcional)</span></label>
                <input type="text" value={dados.musica_link} onChange={e => atualizar('musica_link', e.target.value)}
                  placeholder="https://open.spotify.com/track/..."
                  className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors text-sm" />
                <p className="text-white/30 text-xs mt-2">Um QR Code será adicionado à carta</p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setEtapa(1)} className="flex-1 bg-white/10 text-white font-semibold py-4 rounded-xl hover:bg-white/20 transition-all">← Voltar</button>
              <button onClick={() => setEtapa(3)} className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-4 rounded-xl hover:brightness-110 transition-all">Continuar →</button>
            </div>
          </div>
        )}

        {/* Etapa 3 */}
        {etapa === 3 && (
          <div className="bg-[#16213e] rounded-3xl p-8">
            <h1 className="text-2xl font-bold text-white mb-2">Quase lá! 💳</h1>
            <p className="text-white/50 text-sm mb-6">Preencha seus dados para finalizar</p>

            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-sm block mb-2">Seu nome *</label>
                <input type="text" value={dados.nome_pagador} onChange={e => atualizar('nome_pagador', e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors" />
              </div>

              <div>
                <label className="text-white/70 text-sm block mb-2">Seu e-mail *</label>
                <input type="email" value={dados.email_pagador} onChange={e => atualizar('email_pagador', e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors" />
              </div>

              <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-semibold mb-1">Carta para Impressão</p>
                    <p className="text-white/50 text-xs">PDF em alta qualidade</p>
                  </div>
                  <p className="text-pink-400 text-2xl font-black">
                    R$ {PRECO_IMPRESSAO.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setEtapa(2)} disabled={loading}
                className="flex-1 bg-white/10 text-white font-semibold py-4 rounded-xl hover:bg-white/20 transition-all disabled:opacity-50">
                ← Voltar
              </button>
              <button onClick={handlePagar} disabled={loading}
                className="flex-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
                style={{ flex: 2 }}>
                {loading ? 'Aguarde...' : `Pagar R$ ${PRECO_IMPRESSAO.toFixed(2).replace('.', ',')} 💳`}
              </button>
            </div>

            <p className="text-center text-white/30 text-xs mt-4">🔒 Pagamento seguro pelo Mercado Pago</p>
          </div>
        )}

      </div>
    </main>
  )
}