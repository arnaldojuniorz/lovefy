'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [faqAberto, setFaqAberto] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const faqs = [
    {
      p: 'Vai ficar brega?',
      r: 'Nada disso. O Lovefy foi criado com um design moderno, elegante e emocional. Pense no Spotify, mas para histórias de amor. Cada detalhe é pensado para impressionar.'
    },
    {
      p: 'Vai dar muito trabalho?',
      r: 'São menos de 5 minutos. Você preenche um formulário simples, e nós montamos tudo automaticamente. Sem editar imagem, sem programar nada.'
    },
    {
      p: 'E se eu não souber escrever bem?',
      r: 'Não precisa ser escritor. Basta falar do jeito que você fala. O que importa é o sentimento — e você já tem isso.'
    },
    {
      p: 'E se não ficar bom?',
      r: 'Você vê tudo antes de pagar. Monta a carta inteira, visualiza o resultado e só paga se amar. Sem risco nenhum.'
    },
    {
      p: 'E se a pessoa não gostar?',
      r: 'Em mais de 10.000 cartas entregues, nunca vimos isso acontecer. Quando alguém abre uma carta feita com carinho e com a história deles, a emoção é inevitável.'
    },
    {
      p: 'É seguro pagar?',
      r: 'Sim. O pagamento é processado pelo Mercado Pago, a plataforma mais segura e usada do Brasil. Seus dados estão 100% protegidos.'
    },
    {
      p: 'Preciso criar conta ou baixar app?',
      r: 'Não. Nenhuma conta, nenhum download. Só o link da carta — que você envia direto no WhatsApp em segundos.'
    },
  ]

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', system-ui, sans-serif; background: #0f0f1a; color: #fff; }
        .gradient-text { background: linear-gradient(135deg, #ff6b9d 0%, #c44569 50%, #ff8a5c 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .btn-primary { background: linear-gradient(135deg, #ff6b9d, #c44569); box-shadow: 0 4px 24px rgba(255,107,157,0.4); transition: all 0.3s; }
        .btn-primary:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(255,107,157,0.5); }
        .btn-ghost { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); transition: all 0.3s; }
        .btn-ghost:hover { background: rgba(255,255,255,0.12); transform: translateY(-2px); }
        .card { background: #16213e; border: 1px solid rgba(255,255,255,0.07); }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse { 0%,100%{box-shadow:0 4px 24px rgba(255,107,157,0.4)} 50%{box-shadow:0 4px 40px rgba(255,107,157,0.7)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .float { animation: float 4s ease-in-out infinite; }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        .fade-up { animation: fadeUp 0.7s ease-out forwards; }
        .sticky-cta { position: fixed; bottom: 0; left: 0; right: 0; z-index: 100; padding: 12px 16px; background: rgba(15,15,26,0.95); backdrop-filter: blur(12px); border-top: 1px solid rgba(255,255,255,0.08); }
        @media(min-width:768px) { .sticky-cta { display: none; } }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '16px 24px',
        background: scrolled ? 'rgba(15,15,26,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
        transition: 'all 0.3s',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{fontSize: 22, fontWeight: 900}} className="gradient-text">Lovefy</span>
        <div style={{display: 'flex', gap: 24, alignItems: 'center'}}>
          <a href="#como-funciona" style={{color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none', display: 'none'}}>Como funciona</a>
          <a href="#precos" style={{color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none'}}>Preços</a>
          <a href="/criar" className="btn-primary" style={{padding: '10px 20px', borderRadius: 100, fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none'}}>
            Criar carta
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', background: 'radial-gradient(ellipse at 50% 0%, rgba(255,107,157,0.15) 0%, transparent 70%)'}}>
        <div style={{maxWidth: 680, textAlign: 'center'}}>

          <div style={{display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(255,107,157,0.15)', border: '1px solid rgba(255,107,157,0.3)', marginBottom: 32}}>
            <span style={{fontSize: 12}}>💝</span>
            <span style={{color: '#ff6b9d', fontSize: 13, fontWeight: 500}}>Surpreenda ainda hoje</span>
          </div>

          <h1 style={{fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24}}>
            Crie uma carta digital<br />
            <span className="gradient-text">personalizada e interativa</span><br />
            para quem você ama
          </h1>

          <p style={{fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px'}}>
            Em poucos minutos, transforme sua história em uma experiência emocionante — com música, fotos, mapa das estrelas e muito mais.
          </p>

          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
            <a href="/criar" className="btn-primary pulse" style={{padding: '18px 48px', borderRadius: 100, fontSize: 18, fontWeight: 700, color: '#fff', textDecoration: 'none', display: 'inline-block'}}>
              Criar minha carta agora 💌
            </a>
            <p style={{color: 'rgba(255,255,255,0.4)', fontSize: 13}}>
              Crie e veja como ficou antes de pagar • Sem criar conta
            </p>
          </div>

          <div style={{display: 'flex', justifyContent: 'center', gap: 32, marginTop: 48, flexWrap: 'wrap'}}>
            {['Sem baixar app', 'Envio pelo WhatsApp', 'Entrega instantânea'].map(item => (
              <div key={item} style={{display: 'flex', alignItems: 'center', gap: 6}}>
                <span style={{color: '#4ecdc4', fontSize: 14}}>✓</span>
                <span style={{color: 'rgba(255,255,255,0.5)', fontSize: 14}}>{item}</span>
              </div>
            ))}
          </div>

          {/* Preview animado */}
          <div className="float" style={{marginTop: 64, background: '#16213e', borderRadius: 24, padding: 24, border: '1px solid rgba(255,107,157,0.2)', maxWidth: 360, margin: '64px auto 0', boxShadow: '0 24px 80px rgba(0,0,0,0.5)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16}}>
              <div style={{width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#ff6b9d,#c44569)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18}}>💌</div>
              <div style={{textAlign: 'left'}}>
                <p style={{fontWeight: 700, fontSize: 15}}>Ana recebeu uma carta</p>
                <p style={{color: 'rgba(255,255,255,0.4)', fontSize: 12}}>De Lucas • agora mesmo</p>
              </div>
            </div>
            <div style={{background: 'rgba(255,107,157,0.1)', borderRadius: 12, padding: '12px 16px', textAlign: 'left'}}>
              <p style={{color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6}}>
                "Cada dia ao seu lado é o melhor dia da minha vida..."
              </p>
            </div>
            <div style={{display: 'flex', gap: 8, marginTop: 12}}>
              <span style={{background: 'rgba(78,205,196,0.2)', color: '#4ecdc4', fontSize: 11, padding: '4px 10px', borderRadius: 20}}>🎵 Música</span>
              <span style={{background: 'rgba(255,107,157,0.2)', color: '#ff6b9d', fontSize: 11, padding: '4px 10px', borderRadius: 20}}>⭐ Mapa das estrelas</span>
              <span style={{background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 11, padding: '4px 10px', borderRadius: 20}}>📸 Fotos</span>
            </div>
          </div>

        </div>
      </section>

      {/* JORNADA EMOCIONAL */}
      <section style={{padding: '80px 24px', background: 'rgba(22,33,62,0.4)'}}>
        <div style={{maxWidth: 800, margin: '0 auto', textAlign: 'center'}}>
          <p style={{color: '#ff6b9d', fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16}}>A experiência</p>
          <h2 style={{fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, marginBottom: 16}}>
            Não é uma mensagem.<br />
            <span className="gradient-text">É uma experiência que ela nunca vai esquecer.</span>
          </h2>
          <p style={{color: 'rgba(255,255,255,0.5)', fontSize: 16, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 64px'}}>
            Imagina ela abrir o WhatsApp, clicar no link e ouvir a música de vocês tocar automaticamente enquanto vê as fotos, o mapa das estrelas do dia que se conheceram e uma mensagem escrita do seu coração.
          </p>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16}}>
            {[
              { emoji: '🎵', titulo: 'A música de vocês toca', desc: 'Ela ouve assim que abre. Sem precisar clicar em nada.' },
              { emoji: '⭐', titulo: 'O céu daquele dia', desc: 'O mapa exato das estrelas no dia em que se conheceram.' },
              { emoji: '📸', titulo: 'As fotos de vocês', desc: 'Uma galeria com os momentos mais especiais juntos.' },
              { emoji: '💬', titulo: 'Sua mensagem animada', desc: 'Cada palavra aparece como se você estivesse digitando ao vivo.' },
              { emoji: '⏱️', titulo: 'Cada segundo juntos', desc: 'Um contador mostrando quantos dias, horas e minutos de amor.' },
              { emoji: '🎮', titulo: 'Um jogo especial', desc: 'Um quiz personalizado só para vocês dois.' },
            ].map(item => (
              <div key={item.titulo} className="card" style={{borderRadius: 16, padding: 20, textAlign: 'left'}}>
                <div style={{fontSize: 28, marginBottom: 10}}>{item.emoji}</div>
                <p style={{fontWeight: 700, fontSize: 15, marginBottom: 6}}>{item.titulo}</p>
                <p style={{color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.5}}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" style={{padding: '80px 24px'}}>
        <div style={{maxWidth: 700, margin: '0 auto', textAlign: 'center'}}>
          <p style={{color: '#ff6b9d', fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16}}>Super simples</p>
          <h2 style={{fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, marginBottom: 16}}>
            Pronto em <span className="gradient-text">menos de 5 minutos</span>
          </h2>
          <p style={{color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 56}}>
            Você monta tudo, vê o resultado e só paga se amar.
          </p>

          <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
            {[
              { n: '1', titulo: 'Preencha os dados', desc: 'Nome, história, mensagem, música, fotos. Simples e rápido.', detalhe: 'Passo 1 de 4' },
              { n: '2', titulo: 'Monte a carta', desc: 'Escolha os recursos: mapa das estrelas, jogo de palavras, galeria e mais.', detalhe: 'Passo 2 de 4' },
              { n: '3', titulo: 'Veja o preview completo', desc: 'Visualize exatamente como ela vai aparecer para quem você ama.', detalhe: 'Passo 3 de 4' },
              { n: '4', titulo: 'Desbloqueie e envie', desc: 'Gostou? Pague e receba o link na hora. Envie pelo WhatsApp em segundos.', detalhe: 'Passo 4 de 4' },
            ].map((item, i) => (
              <div key={item.n} className="card" style={{borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, textAlign: 'left'}}>
                <div style={{width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #ff6b9d, #c44569)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, flexShrink: 0}}>
                  {item.n}
                </div>
                <div style={{flex: 1}}>
                  <p style={{fontWeight: 700, fontSize: 16, marginBottom: 4}}>{item.titulo}</p>
                  <p style={{color: 'rgba(255,255,255,0.5)', fontSize: 14}}>{item.desc}</p>
                </div>
                <span style={{color: 'rgba(255,107,157,0.6)', fontSize: 12, whiteSpace: 'nowrap'}}>{item.detalhe}</span>
              </div>
            ))}
          </div>

          <div style={{marginTop: 32, padding: '16px 24px', background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)', borderRadius: 12}}>
            <p style={{color: '#4ecdc4', fontSize: 14, fontWeight: 600}}>
              💚 Envie direto no WhatsApp em segundos — ela recebe na hora
            </p>
          </div>
        </div>
      </section>

      {/* ANCORAGEM DE VALOR */}
      <section style={{padding: '80px 24px', background: 'rgba(22,33,62,0.4)'}}>
        <div style={{maxWidth: 600, margin: '0 auto', textAlign: 'center'}}>
          <p style={{color: '#ff6b9d', fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16}}>Perspectiva</p>
          <h2 style={{fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, marginBottom: 32}}>
            Um buquê de flores dura 3 dias.<br />
            <span className="gradient-text">Uma carta Lovefy dura para sempre.</span>
          </h2>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 32}}>
            {[
              { item: 'Buquê de flores', preco: 'R$ 80', dura: 'Dura 3 dias' },
              { item: 'Jantar especial', preco: 'R$ 200', dura: 'Dura 1 noite' },
              { item: 'Carta Lovefy', preco: 'R$ 12,90', dura: 'Dura para sempre', destaque: true },
            ].map(c => (
              <div key={c.item} style={{
                background: c.destaque ? 'linear-gradient(135deg, rgba(255,107,157,0.2), rgba(196,69,105,0.2))' : '#16213e',
                border: c.destaque ? '1px solid rgba(255,107,157,0.4)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: 16,
              }}>
                <p style={{fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8}}>{c.item}</p>
                <p style={{fontSize: 22, fontWeight: 900, color: c.destaque ? '#ff6b9d' : '#fff', marginBottom: 4}}>{c.preco}</p>
                <p style={{fontSize: 12, color: c.destaque ? '#4ecdc4' : 'rgba(255,255,255,0.4)'}}>{c.dura}</p>
              </div>
            ))}
          </div>
          <p style={{color: 'rgba(255,255,255,0.5)', fontSize: 15}}>
            Por menos de R$ 13, você cria uma memória que ela vai guardar para sempre. E ela pode abrir quando quiser — daqui a 10 anos — e sentir tudo de novo.
          </p>
        </div>
      </section>

      {/* PREÇOS */}
      <section id="precos" style={{padding: '80px 24px'}}>
        <div style={{maxWidth: 900, margin: '0 auto'}}>
          <div style={{textAlign: 'center', marginBottom: 56}}>
            <p style={{color: '#ff6b9d', fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16}}>Preços</p>
            <h2 style={{fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, marginBottom: 12}}>
              Escolha seu <span className="gradient-text">presente</span>
            </h2>
            <p style={{color: 'rgba(255,255,255,0.5)', fontSize: 16}}>
              Você só paga se amar o resultado. Veja antes de comprar.
            </p>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20}}>

            {/* 24h */}
            <div className="card" style={{borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column'}}>
              <p style={{fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8}}>Carta Digital</p>
              <h3 style={{fontSize: 20, fontWeight: 700, marginBottom: 4}}>24 Horas</h3>
              <p style={{fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24}}>Link ativo por 24 horas — perfeito para uma surpresa hoje</p>
              <p style={{fontSize: 48, fontWeight: 900, marginBottom: 24}} className="gradient-text">R$ 6,90</p>
              <ul style={{listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, flex: 1}}>
                {['Carta digital completa', 'Todos os recursos', 'Link + QR Code', 'Envio pelo WhatsApp'].map(i => (
                  <li key={i} style={{display: 'flex', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.7)'}}>
                    <span style={{color: '#4ecdc4'}}>✓</span>{i}
                  </li>
                ))}
              </ul>
              <a href="/criar" style={{display: 'block', textAlign: 'center', padding: '14px', borderRadius: 100, border: '1px solid rgba(255,107,157,0.5)', color: '#ff6b9d', fontWeight: 600, fontSize: 15, textDecoration: 'none', transition: 'all 0.3s'}}>
                Criar agora
              </a>
              <p style={{textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 10}}>🔒 Pagamento seguro pelo Mercado Pago</p>
            </div>

            {/* Para Sempre — destaque */}
            <div style={{borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', background: '#16213e', border: '2px solid #ff6b9d', position: 'relative'}}>
              <div style={{position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #ff6b9d, #c44569)', padding: '5px 18px', borderRadius: 100, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', color: '#fff'}}>
                ⭐ MAIS POPULAR
              </div>
              <p style={{fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8}}>Carta Digital</p>
              <h3 style={{fontSize: 20, fontWeight: 700, marginBottom: 4}}>Para Sempre</h3>
              <p style={{fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24}}>Ela pode abrir quando quiser — daqui a 10 anos vai sentir tudo de novo</p>
              <p style={{fontSize: 48, fontWeight: 900, marginBottom: 24}} className="gradient-text">R$ 12,90</p>
              <ul style={{listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, flex: 1}}>
                {['Carta digital completa', 'Todos os recursos', 'Link + QR Code', 'Envio pelo WhatsApp', 'Link ativo para sempre'].map(i => (
                  <li key={i} style={{display: 'flex', gap: 10, fontSize: 14, color: i === 'Link ativo para sempre' ? '#4ecdc4' : 'rgba(255,255,255,0.7)', fontWeight: i === 'Link ativo para sempre' ? 600 : 400}}>
                    <span style={{color: '#4ecdc4'}}>✓</span>{i}
                  </li>
                ))}
              </ul>
              <a href="/criar" className="btn-primary pulse" style={{display: 'block', textAlign: 'center', padding: '16px', borderRadius: 100, color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none'}}>
                Criar agora 💝
              </a>
              <p style={{textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 10}}>🔒 Pagamento seguro pelo Mercado Pago</p>
            </div>

            {/* Impressão */}
            <div className="card" style={{borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column'}}>
              <p style={{fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8}}>Carta Física</p>
              <h3 style={{fontSize: 20, fontWeight: 700, marginBottom: 4}}>Para Impressão</h3>
              <p style={{fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24}}>PDF em alta qualidade para imprimir e entregar pessoalmente</p>
              <p style={{fontSize: 48, fontWeight: 900, marginBottom: 24}} className="gradient-text">R$ 9,90</p>
              <ul style={{listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, flex: 1}}>
                {['PDF em alta qualidade', 'Design profissional', 'QR Code com música', 'Pronto para imprimir'].map(i => (
                  <li key={i} style={{display: 'flex', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.7)'}}>
                    <span style={{color: '#4ecdc4'}}>✓</span>{i}
                  </li>
                ))}
              </ul>
              <a href="/imprimir" style={{display: 'block', textAlign: 'center', padding: '14px', borderRadius: 100, border: '1px solid rgba(255,107,157,0.5)', color: '#ff6b9d', fontWeight: 600, fontSize: 15, textDecoration: 'none'}}>
                Criar agora
              </a>
              <p style={{textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 10}}>🔒 Pagamento seguro pelo Mercado Pago</p>
            </div>

          </div>

          <p style={{textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 24}}>
            Você vê tudo antes de pagar. Sem risco.
          </p>
        </div>
      </section>

      {/* OBJEÇÕES */}
      <section style={{padding: '80px 24px', background: 'rgba(22,33,62,0.4)'}}>
        <div style={{maxWidth: 680, margin: '0 auto'}}>
          <div style={{textAlign: 'center', marginBottom: 48}}>
            <p style={{color: '#ff6b9d', fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16}}>Dúvidas</p>
            <h2 style={{fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900}}>
              Perguntas <span className="gradient-text">frequentes</span>
            </h2>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            {faqs.map((faq, i) => (
              <div key={i} className="card" style={{borderRadius: 14, overflow: 'hidden'}}>
                <button
                  onClick={() => setFaqAberto(faqAberto === i ? null : i)}
                  style={{width: '100%', padding: '18px 20px', textAlign: 'left', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: 15}}
                >
                  <span>{faq.p}</span>
                  <span style={{color: '#ff6b9d', fontSize: 18, transition: 'transform 0.3s', transform: faqAberto === i ? 'rotate(45deg)' : 'rotate(0)'}}>+</span>
                </button>
                {faqAberto === i && (
                  <div style={{padding: '0 20px 18px'}}>
                    <p style={{color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7}}>{faq.r}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{padding: '80px 24px'}}>
        <div style={{maxWidth: 600, margin: '0 auto'}}>
          <div style={{background: 'linear-gradient(135deg, rgba(255,107,157,0.15), rgba(196,69,105,0.1))', border: '1px solid rgba(255,107,157,0.3)', borderRadius: 32, padding: '56px 32px', textAlign: 'center'}}>
            <div style={{fontSize: 48, marginBottom: 16}}>💌</div>
            <h2 style={{fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, marginBottom: 16}}>
              Escolha seu presente agora<br />
              <span className="gradient-text">e entregue em minutos</span>
            </h2>
            <p style={{color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 8}}>
              Perfeito para aniversário, Dia dos Namorados,<br />pedido de namoro ou qualquer dia especial.
            </p>
            <p style={{color: 'rgba(255,255,255,0.3)', fontSize: 14, marginBottom: 32}}>
              "Surpreenda ainda hoje — antes de dormir, ela já pode estar emocionada."
            </p>
            <a href="/criar" className="btn-primary pulse" style={{display: 'inline-block', padding: '18px 48px', borderRadius: 100, fontSize: 18, fontWeight: 700, color: '#fff', textDecoration: 'none', marginBottom: 12}}>
              Criar minha carta agora 💝
            </a>
            <p style={{color: 'rgba(255,255,255,0.3)', fontSize: 13}}>
              Crie e veja como ficou antes de pagar • Sem criar conta • Envio pelo WhatsApp
            </p>
            <p style={{color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 16}}>
              🔒 Pagamento 100% seguro pelo Mercado Pago
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,0.08)'}}>
        <div style={{maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
          <span style={{fontSize: 22, fontWeight: 900}} className="gradient-text">Lovefy</span>
          <div style={{display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center'}}>
            {[['Termos de Uso', '/termos'], ['Privacidade', '/privacidade'], ['Contato', '/contato']].map(([label, href]) => (
              <a key={href} href={href} style={{color: 'rgba(255,255,255,0.4)', fontSize: 14, textDecoration: 'none'}}>{label}</a>
            ))}
          </div>
          <p style={{color: 'rgba(255,255,255,0.2)', fontSize: 13}}>© 2025 Lovefy. Feito com amor 💕</p>
        </div>
      </footer>

      {/* Sticky CTA mobile */}
      <div className="sticky-cta">
        <a href="/criar" className="btn-primary" style={{display: 'block', textAlign: 'center', padding: '16px', borderRadius: 100, fontSize: 16, fontWeight: 700, color: '#fff', textDecoration: 'none'}}>
          Criar minha carta agora 💌
        </a>
        <p style={{textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6}}>
          Veja antes de pagar • Sem criar conta
        </p>
      </div>

    </>
  )
}