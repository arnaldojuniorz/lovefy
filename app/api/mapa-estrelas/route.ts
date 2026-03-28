import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { data, latitude, longitude, carta_id } = await request.json()

    if (!data) {
      return NextResponse.json({ error: 'Data é obrigatória' }, { status: 400 })
    }

    // Se tem carta_id, verifica se já foi gerado antes
    if (carta_id) {
      const { data: carta } = await supabaseAdmin
        .from('cartas')
        .select('mapa_estrelas_url')
        .eq('id', carta_id)
        .single()

      if (carta?.mapa_estrelas_url) {
        return NextResponse.json({ imageUrl: carta.mapa_estrelas_url })
      }
    }

    const appId = process.env.ASTRONOMY_API_ID
    const appSecret = process.env.ASTRONOMY_API_SECRET

    if (!appId || !appSecret) {
      return NextResponse.json({ error: 'Credenciais não configuradas' }, { status: 500 })
    }

    const credentials = Buffer.from(`${appId}:${appSecret}`).toString('base64')

    const dataObj = new Date(data)
    const ano = dataObj.getUTCFullYear()
    const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0')
    const dia = String(dataObj.getUTCDate()).padStart(2, '0')
    const dataFormatada = `${ano}-${mes}-${dia}`

    const lat = latitude || -23.5505
    const lon = longitude || -46.6333

    const body = {
      style: 'navy',
      observer: {
        latitude: lat,
        longitude: lon,
        date: dataFormatada,
      },
      view: {
        type: 'area',
        parameters: {
          position: {
            equatorial: {
              rightAscension: 0,
              declination: 0,
            },
          },
          zoom: 2,
        },
      },
    }

    const response = await fetch('https://api.astronomyapi.com/api/v2/studio/star-chart', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[mapa-estrelas] erro API:', response.status, error)
      return NextResponse.json({ error: 'Erro ao gerar mapa' }, { status: 500 })
    }

    const result = await response.json()
    const imageUrl = result?.data?.imageUrl

    if (!imageUrl) {
      return NextResponse.json({ error: 'Imagem não gerada' }, { status: 500 })
    }

    // Salva no banco para não gerar de novo
    if (carta_id) {
      await supabaseAdmin
        .from('cartas')
        .update({ mapa_estrelas_url: imageUrl })
        .eq('id', carta_id)
    }

    return NextResponse.json({ imageUrl })

  } catch (error) {
    console.error('[mapa-estrelas] erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}