export default function TermosPage() {
  return (
    <main style={{minHeight:'100vh', background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding:'40px 16px'}}>
      <div style={{maxWidth:'800px', margin:'0 auto'}}>

        <div style={{textAlign:'center', marginBottom:'48px'}}>
          <a href="/" style={{color:'#ff6b9d', textDecoration:'none', fontSize:'14px', display:'block', marginBottom:'24px'}}>← Voltar</a>
          <h1 style={{color:'#fff', fontSize:'32px', fontWeight:'bold', margin:'0 0 8px'}}>Termos de Uso</h1>
          <p style={{color:'rgba(255,255,255,0.5)', fontSize:'14px', margin:'0'}}>Última atualização: Janeiro de 2025</p>
        </div>

        <div style={{background:'#16213e', borderRadius:'24px', padding:'40px', border:'1px solid rgba(255,255,255,0.08)'}}>
          {[
            {
              titulo: '1. Aceitação dos termos',
              texto: 'Ao usar o Lovefy, você concorda com estes Termos de Uso. Se não concordar, não utilize nossos serviços.'
            },
            {
              titulo: '2. Descrição do serviço',
              texto: 'O Lovefy é uma plataforma para criação de cartas digitais personalizadas e cartas para impressão em PDF. Oferecemos três planos: Carta Digital 24h (R$ 6,90), Carta Digital Vitalícia (R$ 12,90) e Carta para Impressão (R$ 9,90).'
            },
            {
              titulo: '3. Uso aceitável',
              texto: 'Você concorda em usar o Lovefy apenas para fins legais e pessoais. É proibido: criar conteúdo ofensivo, discriminatório ou ilegal, usar o serviço para fins comerciais sem autorização, tentar burlar o sistema de pagamento, criar cartas com conteúdo que viole direitos de terceiros.'
            },
            {
              titulo: '4. Pagamento e reembolso',
              texto: 'Os pagamentos são processados pelo Mercado Pago. Após a criação da carta, não oferecemos reembolso, pois o serviço já foi prestado. Em caso de erro técnico comprovado da nossa parte, analisaremos o caso individualmente. Entre em contato: contatolovefy@gmail.com'
            },
            {
              titulo: '5. Edição de cartas',
              texto: 'Após a confirmação do pagamento, a carta não pode ser editada. Revise todas as informações antes de finalizar a compra.'
            },
            {
              titulo: '6. Plano 24 horas',
              texto: 'O plano de 24 horas permite acesso à carta por 24 horas após a ativação. Após esse período, a carta será desativada automaticamente. Não há prorrogação ou reembolso por não utilização dentro do prazo.'
            },
            {
              titulo: '7. Propriedade intelectual',
              texto: 'O conteúdo das cartas pertence ao usuário que as criou. O Lovefy retém direitos sobre o design, código e marca da plataforma.'
            },
            {
              titulo: '8. Limitação de responsabilidade',
              texto: 'O Lovefy não se responsabiliza por: conteúdo criado pelos usuários, uso indevido das cartas por terceiros, indisponibilidade temporária do serviço, perda de dados por fatores externos.'
            },
            {
              titulo: '9. Alterações nos termos',
              texto: 'Podemos modificar estes termos a qualquer momento. Continuando a usar o serviço após as alterações, você aceita os novos termos.'
            },
            {
              titulo: '10. Contato',
              texto: 'Para dúvidas sobre estes termos: contatolovefy@gmail.com'
            },
          ].map(item => (
            <div key={item.titulo} style={{marginBottom:'32px'}}>
              <h2 style={{color:'#ff6b9d', fontSize:'16px', fontWeight:'600', margin:'0 0 12px'}}>{item.titulo}</h2>
              <p style={{color:'rgba(255,255,255,0.7)', lineHeight:'1.7', margin:'0', fontSize:'14px'}}>{item.texto}</p>
            </div>
          ))}
        </div>

        <p style={{textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:'12px', marginTop:'32px'}}>
          © 2025 Lovefy. Feito com amor
        </p>
      </div>
    </main>
  )
}