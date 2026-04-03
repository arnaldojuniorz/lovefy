export type Foto = {
  id: string
  storage_path: string
  ordem: number
  is_temp: boolean
}

export type Carta = {
  id: string
  nome_destinatario: string
  nome_remetente: string
  como_se_conheceram: string
  memoria_especial: string
  momento_marcante: string
  localizacao: string
  data_importante: string
  mensagem_principal: string
  estilo_fundo: string
  recursos: string[]
  musica_link: string
  foto_destaque: string
  jogo_palavra1?: string
  jogo_palavra2?: string
  jogo_palavra3?: string
  mapa_estrelas_url?: string
  slug: string
  fotos: Foto[]
}

export function getEstacao(data: string): { nome: string; emoji: string } {
  const mes = new Date(data).getUTCMonth() + 1
  if (mes >= 3 && mes <= 5) return { nome: 'Outono', emoji: '🍂' }
  if (mes >= 6 && mes <= 8) return { nome: 'Inverno', emoji: '❄️' }
  if (mes >= 9 && mes <= 11) return { nome: 'Primavera', emoji: '🌸' }
  return { nome: 'Verão', emoji: '☀️' }
}

export function getSpotifyId(link: string): string | null {
  const match = link?.match(/spotify\.com\/(?:track|intl-[a-z]+\/track)\/([A-Za-z0-9]+)/)
  return match ? match[1] : null
}

export function formatarData(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  })
}

export function calcularTempo(data: string) {
  const diff = Date.now() - new Date(data).getTime()
  return {
    anos:     Math.floor(diff / (365.25 * 24 * 3600 * 1000)),
    meses:    Math.floor((diff % (365.25 * 24 * 3600 * 1000)) / (30.44 * 24 * 3600 * 1000)),
    dias:     Math.floor((diff % (30.44 * 24 * 3600 * 1000)) / (24 * 3600 * 1000)),
    horas:    Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000)),
    minutos:  Math.floor((diff % (3600 * 1000)) / 60000),
    segundos: Math.floor((diff % 60000) / 1000),
  }
}

export const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  .lv-page { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 24px; opacity:0; transform:translateY(30px); transition:opacity 0.8s ease,transform 0.8s ease; }
  .lv-page.visible { opacity:1; transform:translateY(0); }
  .lv-serif { font-family:'Playfair Display',Georgia,serif; }
  .lv-sans { font-family:'Inter',system-ui,sans-serif; }
  @keyframes lv-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes lv-pulse { 0%,100%{box-shadow:0 0 30px rgba(255,107,157,0.3)} 50%{box-shadow:0 0 60px rgba(255,107,157,0.6)} }
  @keyframes lv-blink { 0%,50%{opacity:1} 51%,100%{opacity:0} }
  @keyframes lv-fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lv-heartbeat { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
  @keyframes lv-gradient { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  .lv-float { animation:lv-float 4s ease-in-out infinite; }
  .lv-pulse { animation:lv-pulse 2s ease-in-out infinite; }
  .lv-cursor { display:inline-block; width:2px; height:1.1em; background:#ff6b9d; margin-left:2px; animation:lv-blink 0.8s infinite; vertical-align:text-bottom; }
  .lv-heartbeat { animation:lv-heartbeat 1.5s ease-in-out infinite; }
  .lv-gradient-text { background:linear-gradient(135deg,#ff6b9d,#c44569,#ff8a5c); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .lv-gradient-bg { background:linear-gradient(135deg,#ff6b9d,#c44569,#667eea,#f093fb); background-size:300% 300%; animation:lv-gradient 8s ease infinite; }
  .lv-card { background:rgba(22,33,62,0.9); border:1px solid rgba(255,255,255,0.08); backdrop-filter:blur(20px); border-radius:24px; }
  .lv-btn { background:linear-gradient(135deg,#ff6b9d,#c44569); color:#fff; border:none; cursor:pointer; font-weight:700; transition:all 0.3s; }
  .lv-btn:hover { filter:brightness(1.1); transform:translateY(-2px); }
`