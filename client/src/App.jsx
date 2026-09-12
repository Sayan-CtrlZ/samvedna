import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import EmergencyHelplines from './components/EmergencyHelplines';
import VoiceCheckin from './components/VoiceCheckin';
import ChatAssistant from './components/ChatAssistant';
import WellbeingMetrics from './components/WellbeingMetrics';
import EmergencySosModal from './components/EmergencySosModal';

export default function App() {
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  // Check health on load
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('/health');
        if (res.ok) setIsOnline(true);
      } catch (e) {
        setIsOnline(false);
      }
    }
    checkHealth();
  }, []);

  const [latestVoiceResult, setLatestVoiceResult] = useState(null);

  const handleCheckinComplete = (result, source = 'text') => {
    if (result) {
      setMetrics(result);
      if (source === 'voice') {
        setLatestVoiceResult({
          id: Date.now(),
          transcript: result.transcript || result.text_content,
          ai_response: result.ai_response,
          status: result.status,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#e9eef5] p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <Header
          onTriggerSos={() => setIsSosOpen(true)}
          isOnline={isOnline}
        />

        {/* Emergency Helpline Bar */}
        <EmergencyHelplines />

        {/* Main Workspace Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Voice & Chat Hub */}
          <div className="lg:col-span-7 space-y-6">
            <VoiceCheckin
              onCheckinComplete={handleCheckinComplete}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
            <ChatAssistant
              onCheckinComplete={handleCheckinComplete}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              latestVoiceResult={latestVoiceResult}
            />
          </div>

          {/* Right Column: Wellbeing Assessment Metrics */}
          <div className="lg:col-span-5">
            <WellbeingMetrics metrics={metrics} />
          </div>
        </div>

        {/* Emergency SOS Modal */}
        <EmergencySosModal isOpen={isSosOpen} onClose={() => setIsSosOpen(false)} />

        {/* Soft Footer */}
        <footer className="mt-12 text-center text-xs text-slate-400 py-4">
          <p>SAMVEDNA • National Atrocity Support Framework • Section 15A Protection</p>
        </footer>
      </div>
    </div>
  );
}
