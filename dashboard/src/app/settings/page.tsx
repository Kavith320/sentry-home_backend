'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { fetchSystemSettings, updateSystemSettings, SystemSettings } from '@/lib/api';
import { isSoundEnabled, setSoundEnabled } from '@/lib/sound';
import { Settings, Database, Radio, Save, CheckCircle2, Lock, Volume2, VolumeX, RefreshCw, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const [mongodbUri, setMongodbUri] = useState('mongodb://127.0.0.1:27017/sentry-home');
  const [mqttBrokerUrl, setMqttBrokerUrl] = useState('mqtt://broker.hivemq.com:1883');
  const [mqttTelemetryTopic, setMqttTelemetryTopic] = useState('sentry-home/telemetry');
  const [port, setPort] = useState('3000');

  // UI preferences
  const [pollingInterval, setPollingInterval] = useState(3000);
  const [soundOn, setSoundOn] = useState(true);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const loadSettings = async () => {
    try {
      const data = await fetchSystemSettings();
      setMongodbUri(data.mongodbUri);
      setMqttBrokerUrl(data.mqttBrokerUrl);
      setMqttTelemetryTopic(data.mqttTelemetryTopic);
      setPort(data.port);

      setSoundOn(isSoundEnabled());
      const savedPoll = localStorage.getItem('sentry_polling_interval');
      if (savedPoll) setPollingInterval(parseInt(savedPoll, 10));
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMsg('');

    try {
      // 1. Update backend .env and runtime
      await updateSystemSettings({
        mongodbUri,
        mqttBrokerUrl,
        mqttTelemetryTopic
      });

      // 2. Save local UI preferences
      setSoundEnabled(soundOn);
      localStorage.setItem('sentry_polling_interval', String(pollingInterval));

      setSaveMsg('System environment parameters updated successfully!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: any) {
      setSaveMsg(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="System Environment Settings" />

      <div className="p-8 space-y-8 max-w-4xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-lg">System Parameter Control</h3>
                <p className="text-xs text-slate-400">
                  View and update runtime environment configurations (excluding network ports)
                </p>
              </div>
            </div>

            <button
              onClick={loadSettings}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Reload</span>
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Database & Broker Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span>Backend Database & MQTT Ingestion Services</span>
              </h4>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    MongoDB Connection URI (<code className="text-cyan-400">MONGODB_URI</code>)
                  </label>
                  <input
                    type="text"
                    value={mongodbUri}
                    onChange={(e) => setMongodbUri(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Database instance URI for Gateways, Sensors, and TelemetryLogs.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      MQTT Broker URL (<code className="text-cyan-400">MQTT_BROKER_URL</code>)
                    </label>
                    <input
                      type="text"
                      value={mqttBrokerUrl}
                      onChange={(e) => setMqttBrokerUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Telemetry Ingestion Topic (<code className="text-cyan-400">MQTT_TELEMETRY_TOPIC</code>)
                    </label>
                    <input
                      type="text"
                      value={mqttTelemetryTopic}
                      onChange={(e) => setMqttTelemetryTopic(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Read-Only Port Protection Notice */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
              <div className="flex items-center space-x-2 text-slate-300 font-bold text-xs">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Protected Port Parameter (<code className="text-amber-400">PORT={port}</code>)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Network HTTP server port is fixed to <code className="text-slate-200 font-mono">{port}</code> to prevent process disconnection. All other database and broker variables above can be updated dynamically.
              </p>
            </div>

            {/* Frontend Preferences Section */}
            <div className="space-y-4 pt-2 border-t border-slate-800/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-2">
                <Radio className="w-4 h-4" />
                <span>Dashboard Frontend User Preferences</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Auto-Polling Interval (ms)</label>
                  <input
                    type="number"
                    step="500"
                    min="1000"
                    max="60000"
                    value={pollingInterval}
                    onChange={(e) => setPollingInterval(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Security Audio Alerts</label>
                  <button
                    type="button"
                    onClick={() => setSoundOn(!soundOn)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      soundOn
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        : 'bg-slate-950 text-slate-500 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {soundOn ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
                      <span>{soundOn ? 'Audio Chimes Active' : 'Audio Chimes Muted'}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                      {soundOn ? 'Enabled' : 'Disabled'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Status Message Toast */}
            {saveMsg && (
              <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 active:scale-95"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Environment Parameters</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
