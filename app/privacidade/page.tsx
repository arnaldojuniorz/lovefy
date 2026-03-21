export default function PrivacidadePage() {
  return (
    <main style={{minHeight:'100vh', background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding:'40px 16px'}}>
      <div style={{maxWidth:'800px', margin:'0 auto'}}>

        <div style={{textAlign:'center', marginBottom:'48px'}}>
          <a href="/" style={{color:'#ff6b9d', textDecoration:'none', fontSize:'14px', display:'block', marginBottom:'24px'}}>← Voltar</a>
          <h1 style={{color:'#fff', fontSize:'32px', fontWeight:'bold', margin:'0 0 8px'}}>Política de Privacidade</h1>
          <p style={{color:'rgba(255,255,255,0.5)', fontSize:'14px', margin:'0'}}>Última atualização: Janeiro de 2025</p>
        </div>

        <div style={{background:'#16213e', borderRadius:'24px', padding:'40px', border:'1px solid rgba(255,255,255,0.08)'}}>
          {[
            {
              titulo: '1. Informações que coletamos',
              texto: 'Coletamos as informações que você nos fornece diretamente ao criar uma carta: nome do destinatário, nome do remetente, mensagem, data importante, fotos enviadas, nome e e-mail do pagador. Também coletamos dados de pagamento processados pelo Mercado Pago.'
            },
            {
              titulo: '2. Como usamos suas informações',
              texto: 'Usamos suas informações para: gerar e entregar sua carta personalizada, processar o pagamento, enviar o link da carta por e-mail, fornecer suporte ao cliente e melhorar nossos serviços.'
            },
            {
              titulo: '3. Compartilhamento de dados',
              texto: 'Não vendemos suas informações pessoais. Compartilhamos dados apenas com: Mercado Pago (processamento de pagamentos), Supabase (armazenamento seguro de dados) e Resend (envio de e-mails transacionais).'
            },
            {
              titulo: '4. Armazenamento e segurança',
              texto: 'Seus dados são armazenados com segurança na plataforma Supabase com criptografia. As fotos são armazenadas em servidores seguros. Cartas com plano de 24 horas são automaticamente excluídas após o período.'
            },
            {
              titulo: '5. Seus direitos',
              texto: 'Você tem direito a: acessar seus dados pessoais, solicitar correção de informações incorretas, solicitar exclusão dos seus dados, retirar consentimento a qualquer momento. Para exercer esses direitos, entre em contato: contato@lovefy.app.br'
            },
            {
              titulo: '6. Cookies',
              texto: 'Usamos cookies essenciais para o funcionamento do site. Não utilizamos cookies de rastreamento ou publicidade.'
            },
            {
              titulo: '7. Menores de idade',
              texto: 'Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente dados de menores.'
            },
            {
              titulo: '8. Alterações nesta política',
              texto: 'Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas por e-mail ou aviso no site.'
            },
            {
              titulo: '9. Contato',
              texto: 'Para dúvidas sobre esta política, entre em contato: contato@lovefy.app.br'
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