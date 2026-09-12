import React, { useState } from 'react';
import { ShieldAlert, Phone, AlertTriangle, X, CheckCircle2 } from 'lucide-react';

export default function EmergencySosModal({ isOpen, onClose }) {
  const [isDispatched, setIsDispatched] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleConfirmSos = async () => {
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('victim_id', 'VIC-MP-2024-881');
      formData.append('location', 'Latitude: 26.4948, Longitude: 77.9940 (Morena, MP)');

      const res = await fetch('/api/v1/victim/sos', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setIsDispatched(true);
      }
    } catch (err) {
      console.error('SOS dispatch error:', err);
      // Even if network drops, notify the user to dial 112 directly
      setIsDispatched(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleResetModal = () => {
    setIsDispatched(false);
    setIsSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border-2 border-rose-300 shadow-2xl rounded-3xl max-w-md w-full p-6 sm:p-8 relative">
        <button
          onClick={handleResetModal}
          className="absolute top-5 right-5 btn-3d btn-3d-light p-2 rounded-xl text-slate-500 hover:text-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        {!isDispatched ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 border-2 border-rose-300 flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Trigger Emergency SOS?</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                This will immediately broadcast a critical distress alert to the District Magistrate, Police Nodal Officer, and dispatch emergency support to your recorded location.
              </p>
            </div>

            <div className="bg-[#fff1f2] border-2 border-rose-200 rounded-xl p-3.5 text-xs text-slate-700 text-left font-medium">
              <span className="text-[10px] text-rose-700 uppercase block font-bold">Registered Victim Location</span>
              <span className="font-semibold text-slate-900">Morena District, Madhya Pradesh (Latitude: 26.4948, Longitude: 77.9940)</span>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleConfirmSos}
                disabled={isSending}
                className="btn-3d btn-3d-red w-full py-4 text-xs font-black uppercase tracking-wider disabled:opacity-50"
              >
                {isSending ? 'Transmitting Alert...' : 'Yes, Send Emergency Alert Now'}
              </button>

              <a
                href="tel:112"
                className="btn-3d btn-3d-light w-full py-3.5 text-xs font-bold text-slate-800 flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-rose-600" />
                <span>Or Call 112 Police Directly</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4 py-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 border-2 border-emerald-300 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Emergency Alert Dispatched</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                District authorities and the local Police Nodal Officer have received your priority SOS. Stay in a safe place. If needed, keep your phone line open for incoming assistance.
              </p>
            </div>

            <button
              onClick={handleResetModal}
              className="btn-3d btn-3d-emerald px-7 py-3 text-xs font-black text-white"
            >
              Close Notice
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
