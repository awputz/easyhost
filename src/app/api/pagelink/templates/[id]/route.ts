import { NextRequest, NextResponse } from 'next/server'
import { TEMPLATES } from '../route'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const template = TEMPLATES.find(t => t.id === id)

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  return NextResponse.json(template)
}
