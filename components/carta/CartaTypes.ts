export type Foto = {
  id:           string
  storage_path: string
  ordem:        number
  is_temp:      boolean
}

export type Carta = {
  id:                  string
  slug:                string
  nome_destinatario:   string
  nome_remetente:      string
  data_importante:     string
  mensagem_principal:  string
  estilo_fundo:        string
  estilo_animacao:     string
  recursos:            string[]
  musica_link:         string
  foto_destaque:       string
  qr_code_url:         string | null
  mapa_estrelas_url:   string | null
  jogo_palavra1?:      string
  jogo_palavra2?:      string
  jogo_palavra3?:      string
  fotos:               Foto[]
}

export function getEstacao(data: string): { nome: string; emoji: string } {
  const mes = new Date(data).getUTCMonth() + 1
  if (mes >= 3 && mes <= 5) return { nome: 'Outono',    emoji: '🍂' }
  if (mes >= 6 && mes <= 8) return { nome: 'Inverno',   emoji: '❄️' }
  if (mes >= 9 && mes <= 11) return { nome: 'Primavera', emoji: '🌸' }
  return { nome: 'Verão', emoji: '☀️' }
}

export function getSpotifyId(link: string): string | null {
  const match = link?.match(/spotify\.com\/(?:track|intl-[a-z]+\/track)\/([A-Za-z0-9]+)/)
  return match ? match[1] : null
}

export function formatarData(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

export function calcularTempo(data: string) {
  const diff = Date.now() - new Date(data).getTime()
  return {
    anos:     Math.floor(diff / (365.25 * 24 * 3600 * 1000)),
    meses:    Math.floor((diff % (365.25 * 24 * 3600 * 1000)) / (30.44 * 24 * 3600 * 1000)),
    dias:     Math.floor((diff % (30.44  * 24 * 3600 * 1000)) / (24 * 3600 * 1000)),
    horas:    Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000)),
    minutos:  Math.floor((diff % (3600 * 1000)) / 60000),
    segundos: Math.floor((diff % 60000) / 1000),
  }
}

export const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #121212; }
  .sp-green { color: #1DB954; }
  .sp-card { background: #1a1a1a; border-radius: 12px; }
  .sp-card-dark { background: #181818; border-radius: 16px; }
  @keyframes sp-blink { 0%,50%{opacity:1} 51%,100%{opacity:0} }
  @keyframes sp-pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
  @keyframes sp-fadein { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  .sp-cursor { display:inline-block; width:2px; height:1em; background:#fff; margin-left:2px; animation:sp-blink 0.8s infinite; vertical-align:text-bottom; }
  .sp-fade { animation: sp-fadein 0.6s ease both; }
  .sp-reveal { mask-image: linear-gradient(to bottom, black 60%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent 100%); }
`