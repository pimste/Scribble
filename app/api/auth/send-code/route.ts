import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expires: number }>();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code with 10-minute expiration
    verificationCodes.set(email, {
      code,
      expires: Date.now() + 10 * 60 * 1000,
    });

    // Send email via Resend
    console.log('Attempting to send email to:', email, 'with code:', code);
    const result = await resend.emails.send({
      from: 'Scribble <onboarding@resend.dev>',
      to: email,
      subject: 'Your Scribble Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Scribble!</h1>
          <p style="font-size: 16px; color: #666;">Your verification code is:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h2 style="font-size: 32px; letter-spacing: 8px; margin: 0; color: #333;">${code}</h2>
          </div>
          <p style="font-size: 14px; color: #999;">This code will expire in 10 minutes.</p>
          <p style="font-size: 14px; color: #999;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });

    console.log('Resend API response:', result);

    if (result.error) {
      console.error('Resend error:', result.error);
      throw new Error(result.error.message || 'Failed to send email');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending verification code:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}

// Endpoint to verify code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const code = searchParams.get('code');

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    if (Date.now() > storedData.expires) {
      verificationCodes.delete(email);
      return NextResponse.json({ error: 'Code has expired' }, { status: 400 });
    }

    if (storedData.code !== code) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    // Code is valid, delete it
    verificationCodes.delete(email);

    return NextResponse.json({ valid: true });
  } catch (error: any) {
    console.error('Error verifying code:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}

