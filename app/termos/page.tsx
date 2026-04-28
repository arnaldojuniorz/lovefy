export default function TermosPage() {
  return (
    <main style={{minHeight:'100vh', background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding:'40px 16px'}}>
      <div style={{maxWidth:'800px', margin:'0 auto'}}>

        <div style={{textAlign:'center', marginBottom:'48px'}}>
          <a href="/" style={{color:'#ff6b9d', textDecoration:'none', fontSize:'14px', display:'block', marginBottom:'24px'}}>← Voltar</a>
          <h1 style={{color:'#fff', fontSize:'32px', fontWeight:'bold', margin:'0 0 8px'}}>Termos de Uso</h1>
          <p style={{color:'rgba(255,255,255,0.5)', fontSize:'14px', margin:'0'}}>Última atualização: Abril de 2026</p>
        </div>

        <div style={{background:'#16213e', borderRadius:'24px', padding:'40px', border:'1px solid rgba(255,255,255,0.08)'}}>
          {[
            {
              titulo: '1. Aceitação dos termos',
              texto: 'Ao usar o Lovefy, você concorda com estes Termos de Uso. Se não concordar com alguma parte, não utilize nossos serviços.'
            },
            {
              titulo: '2. Descrição do serviço',
              texto: 'O Lovefy é uma plataforma digital que transforma mensagens de afeto em experiências interativas e personalizadas, entregues no formato de cartas digitais e arquivos PDF para impressão. O acesso ao conteúdo é feito de forma instantânea e automática através de link exclusivo ou QR Code, sem necessidade de cadastro ou login na plataforma.'
            },
            {
              titulo: '3. Planos e Preços',
              texto: 'O Lovefy oferece os seguintes produtos: Carta Digital (Para Sempre): R$ 9,90 (acesso vitalício e ilimitado ao link da carta interativa). Carta PDF para Impressão: R$ 6,90 (arquivo em alta resolução pronto para impressão).'
            },
            {
              titulo: '4. Uso aceitável',
              texto: 'Você concorda em usar o Lovefy apenas para fins legais e pessoais. É expressamente proibido: criar conteúdo ofensivo, discriminatório, ameaçador ou ilegal; utilizar o serviço para envio de spam ou fins comerciais não autorizados; tentar burlar ou fraudar o sistema de pagamento; violar direitos autorais ou de imagem de terceiros.'
            },
            {
              titulo: '5. Pagamento, Entrega e Reembolso',
              texto: 'Processamento: Os pagamentos são processados com segurança pela plataforma Mercado Pago. Entrega: Após a confirmação do pagamento, o link da carta digital ou o arquivo PDF é gerado e disponibilizado automaticamente na tela de conclusão do pedido, não sendo enviado por e-mail ou armazenado em conta de usuário. Reembolso: Devido à natureza digital e imediata da entrega do conteúdo personalizado, não oferecemos reembolso ou cancelamento após a finalização da compra. Em caso de erro técnico comprovado que impeça o acesso ao link ou arquivo, analisaremos o caso individualmente através do e-mail contatolovefy@gmail.com.'
            },
            {
              titulo: '6. Edição e Revisão das Cartas',
              texto: 'A carta é gerada exatamente com o texto e nome inseridos no momento da criação. Após a confirmação do pagamento, o conteúdo não pode ser editado ou alterado. Certifique-se de revisar cuidadosamente todas as informações, ortografia e layout antes de prosseguir para o checkout.'
            },
            {
              titulo: '7. Propriedade Intelectual',
              texto: 'Conteúdo do Usuário: O conteúdo textual e afetivo inserido para a criação da carta pertence a você, o usuário. Plataforma: O Lovefy retém todos os direitos sobre o código-fonte, design visual, layout, identidade visual da marca e a tecnologia de geração das cartas.'
            },
            {
              titulo: '8. Limitação de Responsabilidade',
              texto: 'O Lovefy não se responsabiliza por: conteúdo ofensivo ou inapropriado criado pelos usuários; uso indevido dos links ou PDFs compartilhados com terceiros pelo próprio usuário; indisponibilidade temporária do serviço devido a manutenção técnica ou falhas de conexão com a internet; perda de acesso ao link por parte do usuário após a exibição na tela (recomendamos salvar o link ou QR Code imediatamente).'
            },
            {
              titulo: '9. Alterações nos Termos',
              texto: 'Podemos modificar estes Termos de Uso a qualquer momento para refletir melhorias no serviço ou mudanças legais. A versão mais recente estará sempre disponível em nossa plataforma. O uso continuado do serviço após a publicação de alterações constitui aceitação dos novos termos.'
            },
            {
              titulo: '10. Contato',
              texto: 'Para dúvidas, suporte ou questões legais sobre estes termos: contatolovefy@gmail.com'
            },
          ].map(item => (
            <div key={item.titulo} style={{marginBottom:'32px'}}>
              <h2 style={{color:'#ff6b9d', fontSize:'16px', fontWeight:'600', margin:'0 0 12px'}}>{item.titulo}</h2>
              <p style={{color:'rgba(255,255,255,0.7)', lineHeight:'1.7', margin:'0', fontSize:'14px'}}>{item.texto}</p>
            </div>
          ))}
        </div>

        <p style={{textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:'12px', marginTop:'32px'}}>
          © 2026 Lovefy. Feito com amor.
        </p>
      </div>
    </main>
  )
}