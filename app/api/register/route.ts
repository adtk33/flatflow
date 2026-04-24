import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  console.log('REGISTER - start')
  
  try {
    console.log('REGISTER - parsing body')
    const body = await request.json()
    const { name, email, password } = body
    console.log('REGISTER - email:', email)

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('REGISTER - checking existing user')
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      )
    }

    console.log('REGISTER - hashing password')
    const hashedPassword = await bcrypt.hash(password, 10)

    console.log('REGISTER - creating user')
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword }
    })

    console.log('REGISTER - success:', user.id)
    return NextResponse.json(
      { message: 'User created', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('REGISTER ERROR name:', (error as any)?.name)
    console.error('REGISTER ERROR message:', (error as any)?.message)
    console.error('REGISTER ERROR code:', (error as any)?.code)
    console.error('REGISTER ERROR full:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}