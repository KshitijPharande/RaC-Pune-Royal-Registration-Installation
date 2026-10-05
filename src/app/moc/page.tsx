import React from 'react';
import Navbar from '@/components/Navbar';
import MocDashboard from '@/components/MocDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MOC Stage Desk | 11th Installation - Rotaract Club of Pune Royal',
  description:
    'Real-time live attendee protocol dashboard for Stage Anchors & MOC at the 11th Installation of Rotaract Club of Pune Royal.',
};

export default function MocPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 w-full pb-12">
        <MocDashboard />
      </main>
    </div>
  );
}
