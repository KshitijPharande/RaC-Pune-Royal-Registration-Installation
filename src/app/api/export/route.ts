import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getAllRegistrations } from '@/lib/storage';
import { createExcelWorkbook } from '@/lib/excel';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const registrations = await getAllRegistrations();
    const wb = createExcelWorkbook(registrations);
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const filename = `RCP_Pune_Royal_11th_Installation_Registrations_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error('Error generating Excel file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate Excel file' },
      { status: 500 }
    );
  }
}
