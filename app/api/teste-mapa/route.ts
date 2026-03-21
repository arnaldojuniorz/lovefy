import { NextResponse } from 'next/server'

export async function GET() {
  const appId = process.env.ASTRONOMY_API_ID
  const appSecret = process.env.ASTRONOMY_API_SECRET
  
  return NextResponse.json({
    temId: !!appId,
    temSecret: !!appSecret,
    idPrimeiros: appId?.substring(0, 8),
  })
}