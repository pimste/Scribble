import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

const VERIFICATION_EXPIRY_MS = 10 * 60 * 1000;

function getVerificationSecret() {
  const secret = process.env.VERIFICATION_CODE_SECRET;
  if (!secret) {
    throw new Error('VERIFICATION_CODE_SECRET ontbreekt');
  }
  return secret;
}

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL || 'Scribble <no-reply@scribbleapp.nl>';
}

function hashVerificationCode(email: string, code: string, salt: string, secret: string) {
  return createHash('sha256')
    .update(`${email}:${code}:${salt}:${secret}`)
    .digest('hex');
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function createVerificationToken(email: string, code: string) {
  const secret = getVerificationSecret();
  const salt = randomUUID();
  const exp = Date.now() + VERIFICATION_EXPIRY_MS;
  const codeHash = hashVerificationCode(email, code, salt, secret);

  const payload = base64UrlEncode(JSON.stringify({ email, exp, salt, codeHash }));
  const signature = signPayload(payload, secret);

  return `${payload}.${signature}`;
}

function verifyVerificationToken(token: string, email: string, code: string) {
  const secret = getVerificationSecret();
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payload, signature] = parts;
  const expectedSignature = signPayload(payload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) return false;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return false;

  const decoded = JSON.parse(base64UrlDecode(payload)) as {
    email: string;
    exp: number;
    salt: string;
    codeHash: string;
  };

  if (Date.now() > decoded.exp) return false;
  if (decoded.email !== email) return false;

  const suppliedCodeHash = hashVerificationCode(email, code, decoded.salt, secret);
  return suppliedCodeHash === decoded.codeHash;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY ontbreekt' }, { status: 500 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'E-mail is verplicht' }, { status: 400 });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationToken = createVerificationToken(email, code);

    // Send email via Resend
    console.log('Attempting to send email to:', email, 'with code:', code);
    const result = await resend.emails.send({
      from: getFromAddress(),
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

    return NextResponse.json({ success: true, verificationToken });
  } catch (error: any) {
    console.error('Error sending verification code:', error);
    return NextResponse.json(
      { error: 'Verificatiecode versturen mislukt' },
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
    const verificationToken = searchParams.get('token');

    if (!email || !code || !verificationToken) {
      return NextResponse.json(
        { error: 'E-mail, code en verificatietoken zijn verplicht' },
        { status: 400 }
      );
    }

    const isValid = verifyVerificationToken(verificationToken, email, code);
    if (!isValid) {
      return NextResponse.json({ error: 'Ongeldige of verlopen code' }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch (error: any) {
    console.error('Error verifying code:', error);
    return NextResponse.json(
      { error: 'Code verifiëren mislukt' },
      { status: 500 }
    );
  }
}

