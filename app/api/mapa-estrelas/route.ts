import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { data, latitude, longitude } = await request.json()

    if (!data) {
      return NextResponse.json({ error: 'Data é obrigatória' }, { status: 400 })
    }

    const appId = process.env.ASTRONOMY_API_ID
    const appSecret = process.env.ASTRONOMY_API_SECRET

    if (!appId || !appSecret) {
      return NextResponse.json({ error: 'Credenciais não configuradas' }, { status: 500 })
    }

    // Credenciais em base64
    const credentials = Buffer.from(`${appId}:${appSecret}`).toString('base64')

    // Data formatada
    const dataObj = new Date(data)
    const ano = dataObj.getUTCFullYear()
    const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0')
    const dia = String(dataObj.getUTCDate()).padStart(2, '0')
    const dataFormatada = `${ano}-${mes}-${dia}`

    // Coordenadas padrão (São Paulo) se não fornecidas
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
      console.error('Erro AstronomyAPI:', error)
      return NextResponse.json({ error: 'Erro ao gerar mapa' }, { status: 500 })
    }

    const result = await response.json()
    const imageUrl = result?.data?.imageUrl

    if (!imageUrl) {
      return NextResponse.json({ error: 'Imagem não gerada' }, { status: 500 })
    }

    return NextResponse.json({ imageUrl })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}