'use client'

export default function Home() {
  function toggleFaq(button: HTMLButtonElement) {
    const content = button.nextElementSibling as HTMLElement
    const icon = button.querySelector('.faq-icon') as HTMLElement
    const isHidden = content.classList.contains('hidden')
    document.querySelectorAll('.faq-content').forEach(c => c.classList.add('hidden'))
    document.querySelectorAll('.faq-icon').forEach(i => i.classList.remove('rotate-180'))
    if (isHidden) {
      content.classList.remove('hidden')
      icon.classList.add('rotate-180')
    }
  }

  return (
    <>
      <style>{`
        body { font-family: 'Roboto', sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #ffffff; margin: 0; padding: 0; }
        .gradient-text { background: linear-gradient(135deg, #ff6b9d 0%, #c44569 50%, #ff8a5c 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .btn-primary { background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); box-shadow: 0 4px 20px rgba(255,107,157,0.35); transition: all 0.3s ease; }
        .btn-primary:hover { filter: brightness(1.1); box-shadow: 0 6px 25px rgba(255,107,157,0.5); transform: translateY(-2px); }
        .btn-secondary { background: rgba(255,255,255,0.1); border: 2px solid rgba(255,107,157,0.5); transition: all 0.3s ease; }
        .btn-secondary:hover { background: rgba(255,255,255,0.2); transform: translateY(-2px); }
        .card { background: #16213e; box-shadow: 0 8px 32px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); }
        .text-muted { color: rgba(255,255,255,0.5); }
        .envelope { animation: float 3s ease-in-out infinite; }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes pulse-glow { 0%,100% { box-shadow: 0 4px 20px rgba(255,107,157,0.35); } 50% { box-shadow: 0 4px 30px rgba(255,107,157,0.6); } }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .feature-icon { background: linear-gradient(135deg, rgba(255,107,157,0.2) 0%, rgba(196,69,105,0.2) 100%); border: 1px solid rgba(255,107,157,0.3); }
        .pricing-popular { border: 2px solid #ff6b9d; position: relative; }
        .pricing-popular::before { content: 'MAIS POPULAR'; position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700;900&display=swap" rel="stylesheet" />

      <div className="min-h-full w-full">

        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/10" style={{background:'rgba(26,26,46,0.8)'}}>
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <span className="text-xl font-bold gradient-text">Lovefy</span>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-white/70 hover:text-white transition-colors font-medium">Recursos</a>
              <a href="#pricing" className="text-white/70 hover:text-white transition-colors font-medium">Preços</a>
              <a href="#faq" className="text-white/70 hover:text-white transition-colors font-medium">FAQ</a>
            </div>
            <div className="flex gap-3">
              <a href="/criar" className="btn-primary px-4 py-2 rounded-full font-semibold text-sm text-white">Carta Digital</a>
              <a href="/imprimir" className="btn-secondary px-4 py-2 rounded-full font-semibold text-sm text-white">Carta Impressão</a>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-32 pb-20 px-4 relative overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
                  Transforme seu <span className="gradient-text">amor</span> em uma experiência <span className="gradient-text">inesquecível</span>
                </h1>
                <p className="text-lg md:text-xl text-muted font-light mb-8 max-w-xl mx-auto lg:mx-0">
                  Crie uma carta digital personalizada ou para impressão. Surpreenda quem você ama!
                </p>
                <div className="flex gap-4 justify-center lg:justify-start flex-wrap">
                  <a href="/criar" className="btn-primary px-8 py-4 rounded-full font-semibold text-lg pulse-glow inline-flex items-center gap-2 text-white">
                    Criar carta digital
                  </a>
                  <a href="/imprimir" className="btn-secondary px-8 py-4 rounded-full font-semibold text-lg inline-flex items-center gap-2 text-white">
                    Criar carta para impressão
                  </a>
                </div>
                <div className="flex items-center gap-6 justify-center lg:justify-start mt-8 flex-wrap">
                  {['Sem criar conta', 'Sem baixar app', 'Entrega instantânea'].map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <span style={{color:'#4ecdc4'}}>✓</span>
                      <span className="text-sm text-muted">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="envelope text-9xl">💌</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-4" style={{background:'rgba(255,107,157,0.2)',color:'#ff6b9d'}}>Recursos Exclusivos</span>
              <h2 className="text-3xl md:text-4xl font-black mb-4">Tudo que você precisa para <span className="gradient-text">emocionar</span></h2>
              <p className="text-muted text-lg max-w-2xl mx-auto">Cada carta é uma experiência completa, com recursos que vão muito além de uma simples mensagem</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { emoji: '🎵', titulo: 'Música Personalizada', desc: 'Escolha a música que marcou a história de vocês' },
                { emoji: '📸', titulo: 'Galeria de Fotos', desc: 'Adicione até 5 fotos especiais' },
                { emoji: '🌟', titulo: 'Mapa das Estrelas', desc: 'O céu no dia especial de vocês' },
                { emoji: '⏱️', titulo: 'Contador de Dias', desc: 'Quantos dias de amor vocês já compartilharam' },
                { emoji: '🎮', titulo: 'Jogo de Palavras', desc: 'Um mini-game interativo e divertido' },
                { emoji: '🔗', titulo: 'Link Exclusivo', desc: 'URL personalizada com os nomes do casal' },
                { emoji: '📱', titulo: 'QR Code', desc: 'Compartilhe através de um QR Code' },
                { emoji: '🖨️', titulo: 'Carta para Impressão', desc: 'PDF em alta qualidade para imprimir' },
                { emoji: '✨', titulo: 'Efeito Animado', desc: 'Animações mágicas para o receptor' },
              ].map(item => (
                <div key={item.titulo} className="card rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300">
                  <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-2xl">{item.emoji}</div>
                  <h3 className="text-xl font-bold mb-2">{item.titulo}</h3>
                  <p className="text-muted font-light">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="py-20 px-4" style={{background:'rgba(22,33,62,0.3)'}}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-4" style={{background:'rgba(255,107,157,0.2)',color:'#ff6b9d'}}>Super Simples</span>
              <h2 className="text-3xl md:text-4xl font-black mb-4">Como <span className="gradient-text">funciona</span></h2>
              <p className="text-muted text-lg max-w-2xl mx-auto">Em apenas 3 passos você cria uma experiência emocionante</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { n: '1', titulo: 'Preencha o Formulário', desc: 'Conte sobre a pessoa especial, sua história e escolha os elementos da carta' },
                { n: '2', titulo: 'Receba sua Carta', desc: 'Em segundos geramos uma carta digital exclusiva com link e QR Code' },
                { n: '3', titulo: 'Compartilhe o Amor', desc: 'Envie pelo WhatsApp, Instagram ou qualquer lugar e emocione quem você ama' },
              ].map(item => (
                <div key={item.n} className="text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-6" style={{background:'linear-gradient(135deg, #ff6b9d, #c44569)'}}>
                    {item.n}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.titulo}</h3>
                  <p className="text-muted font-light">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-4" style={{background:'rgba(255,107,157,0.2)',color:'#ff6b9d'}}>Preços Acessíveis</span>
              <h2 className="text-3xl md:text-4xl font-black mb-4">Simples e <span className="gradient-text">acessível</span></h2>
              <p className="text-muted text-lg">Amor não tem preço, mas cabe no seu bolso</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Carta Digital */}
              <div className="card rounded-3xl p-8 flex flex-col pricing-popular">
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">Carta Digital</h3>
                  <p className="text-muted text-sm">Guarde essa memória eternamente</p>
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-black gradient-text">R$ 9,90</span>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  {[
                    'Carta digital completa',
                    'Todos os recursos',
                    'Link e QR Code',
                    'Galeria com até 5 fotos',
                    'Mapa das estrelas',
                    'Jogo de palavras',
                    'Link ativo para sempre!',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <span style={{color:'#4ecdc4'}}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a href="/criar" className="btn-primary w-full py-4 rounded-full font-semibold pulse-glow text-center text-white block">
                  Criar agora
                </a>
              </div>

              {/* Carta Impressão */}
              <div className="card rounded-3xl p-8 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">Carta para Impressão</h3>
                  <p className="text-muted text-sm">Presente físico inesquecível</p>
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-black gradient-text">R$ 6,90</span>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  {[
                    'PDF em alta qualidade',
                    'Formato A4 profissional',
                    'Layout elegante',
                    'QR Code com música',
                    'Pronto para imprimir!',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <span style={{color:'#4ecdc4'}}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a href="/imprimir" className="w-full py-4 rounded-full font-semibold text-center block transition-all hover:bg-pink-500/10" style={{border:'2px solid #ff6b9d', color:'#ff6b9d'}}>
                  Criar agora
                </a>
              </div>

            </div>
            <p className="text-center text-muted text-sm mt-8">A carta não pode ser editada após a criação</p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-4" style={{background:'rgba(255,107,157,0.2)',color:'#ff6b9d'}}>Dúvidas</span>
              <h2 className="text-3xl md:text-4xl font-black mb-4">Perguntas <span className="gradient-text">Frequentes</span></h2>
            </div>
            <div className="space-y-4">
              {[
                { p: 'Preciso criar conta para usar?', r: 'Não! Você não precisa criar conta nem baixar nenhum aplicativo. Basta preencher o formulário e fazer o pagamento.' },
                { p: 'Qual a diferença entre carta digital e impressão?', r: 'A carta digital é acessada por um link ou QR Code com animações interativas. A carta para impressão gera um PDF em alta qualidade para você imprimir e entregar fisicamente.' },
                { p: 'Como a pessoa vai acessar a carta digital?', r: 'Você receberá um link exclusivo e um QR Code para compartilhar pelo WhatsApp, Instagram ou qualquer outro meio.' },
                { p: 'O pagamento é seguro?', r: 'Sim! O pagamento é processado pelo Mercado Pago, uma das plataformas mais seguras do Brasil.' },
                { p: 'Posso usar para qualquer tipo de relacionamento?', r: 'Sim! A Lovefy é perfeita para namorados, noivos, casados, pais, mães, amigos... Qualquer pessoa especial merece uma carta!' },
              ].map(item => (
                <div key={item.p} className="card rounded-xl overflow-hidden">
                  <button
                    className="faq-btn w-full px-6 py-4 text-left flex items-center justify-between font-semibold"
                    onClick={e => toggleFaq(e.currentTarget)}
                  >
                    <span>{item.p}</span>
                    <span className="faq-icon transition-transform">▼</span>
                  </button>
                  <div className="faq-content px-6 pb-4 hidden">
                    <p className="text-muted font-light">{item.r}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="card rounded-3xl p-12">
              <h2 className="text-3xl md:text-4xl font-black mb-4">Pronto para <span className="gradient-text">emocionar</span> quem você ama?</h2>
              <p className="text-muted text-lg mb-8 max-w-xl mx-auto">Escolha o formato ideal e crie agora sua carta personalizada</p>
              <div className="flex gap-4 justify-center flex-wrap">
                <a href="/criar" className="btn-primary px-10 py-4 rounded-full font-semibold text-lg inline-flex items-center gap-2 pulse-glow text-white">
                  Criar carta digital
                </a>
                <a href="/imprimir" className="btn-secondary px-10 py-4 rounded-full font-semibold text-lg inline-flex items-center gap-2 text-white">
                  Criar carta para impressão
                </a>
              </div>
              <p className="text-sm text-muted mt-6">Pagamento 100% seguro • Entrega instantânea</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-white/10">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="text-xl font-bold gradient-text">Lovefy</span>
            <div className="flex items-center gap-6 text-sm text-muted">
              <a href="/termos" className="hover:text-white transition-colors">Termos de Uso</a>
              <a href="/privacidade" className="hover:text-white transition-colors">Privacidade</a>
              <a href="/contato" className="hover:text-white transition-colors">Contato</a>
            </div>
            <div className="text-sm text-muted">© 2026 Lovefy. Feito com amor</div>
          </div>
        </footer>

      </div>
    </>
  )
}