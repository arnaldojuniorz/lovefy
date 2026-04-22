export default function PrivacidadePage() {
  return (
    <main style={{minHeight:'100vh', background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding:'40px 16px'}}>
      <div style={{maxWidth:'800px', margin:'0 auto'}}>

        <div style={{textAlign:'center', marginBottom:'48px'}}>
          <a href="/" style={{color:'#ff6b9d', textDecoration:'none', fontSize:'14px', display:'block', marginBottom:'24px'}}>← Voltar</a>
          <h1 style={{color:'#fff', fontSize:'32px', fontWeight:'bold', margin:'0 0 8px'}}>Política de Privacidade</h1>
          <p style={{color:'rgba(255,255,255,0.5)', fontSize:'14px', margin:'0'}}>Última atualização: Abril de 2026</p>
        </div>

        <div style={{background:'#16213e', borderRadius:'24px', padding:'40px', border:'1px solid rgba(255,255,255,0.08)'}}>
          {[
            {
              titulo: '1. Informações que coletamos',
              texto: 'Para gerar sua carta personalizada, coletamos apenas os dados estritamente necessários: nome do destinatário, nome do remetente, mensagem, data especial (opcional), fotos (opcional) e dados do pagador (nome e e-mail informados no Mercado Pago). Importante: o Lovefy não exige login. Dados financeiros sensíveis são processados exclusivamente pelo Mercado Pago e não são acessados pela plataforma.'
            },
            {
              titulo: '2. Como usamos suas informações',
              texto: 'Utilizamos os dados exclusivamente para: gerar sua carta digital ou PDF, processar o pagamento via Mercado Pago, exibir o link ou QR Code na conclusão do pedido, prestar suporte técnico e melhorar a experiência de uso de forma anônima. Não utilizamos seus dados para marketing.'
            },
            {
              titulo: '3. Compartilhamento de dados',
              texto: 'Não vendemos ou compartilhamos dados para fins publicitários. Os dados são compartilhados apenas com serviços essenciais: Mercado Pago (pagamento), Supabase (armazenamento seguro) e Resend (comunicação de suporte ou notificações críticas).'
            },
            {
              titulo: '4. Armazenamento, Segurança e Prazo de Retenção',
              texto: 'Cartas digitais: dados armazenados com criptografia enquanto o link estiver ativo. Cartas PDF: dados mantidos apenas pelo tempo necessário para entrega. Utilizamos HTTPS e boas práticas de segurança para proteção contra acessos não autorizados.'
            },
            {
              titulo: '5. Seus direitos como titular dos dados',
              texto: 'Você pode solicitar: acesso aos dados, correção, exclusão e revogação do consentimento conforme a LGPD. Para exercer seus direitos, entre em contato pelo e-mail: contatolovefy@gmail.com'
            },
            {
              titulo: '6. Cookies',
              texto: 'Utilizamos apenas cookies essenciais para funcionamento técnico da plataforma. Não usamos cookies de rastreamento ou publicidade.'
            },
            {
              titulo: '7. Menores de Idade',
              texto: 'O serviço não é direcionado a menores de 18 anos. Caso identifiquemos dados de menores sem consentimento, eles serão excluídos.'
            },
            {
              titulo: '8. Alterações nesta Política',
              texto: 'Esta política pode ser atualizada periodicamente. A data da última atualização estará sempre visível nesta página.'
            },
            {
              titulo: '9. Contato',
              texto: 'Para dúvidas sobre privacidade ou exercício de direitos: contatolovefy@gmail.com'
            },
          ].map(item => (
            <div key={item.titulo} style={{marginBottom:'32px'}}>
              <h2 style={{color:'#ff6b9d', fontSize:'16px', fontWeight:'600', margin:'0 0 12px'}}>{item.titulo}</h2>
              <p style={{color:'rgba(255,255,255,0.7)', lineHeight:'1.7', margin:'0', fontSize:'14px'}}>{item.texto}</p>
            </div>
          ))}
        </div>

        <p style={{textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:'12px', marginTop:'32px'}}>
          © 2026 Lovefy. Feito com amor e respeito à sua privacidade.
        </p>
      </div>
    </main>
  )
}