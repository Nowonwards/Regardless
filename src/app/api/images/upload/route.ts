import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = await getServerSession(authOptions);
    if (!sessionToken?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Optimize image into standard JPEG format using sharp
    const optimizedBuffer = await sharp(buffer)
      .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
      .toBuffer();

    // Ensure public/uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `manual_slide_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, optimizedBuffer);

    const publicUrl = `/uploads/${fileName}`;
    const base64Url = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;

    return NextResponse.json({
      url: publicUrl,
      dataUrl: base64Url,
      fileName,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
