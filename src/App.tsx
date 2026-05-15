/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  Users, 
  Package, 
  Play, 
  Timer as TimerIcon, 
  CheckCircle2, 
  AlertCircle,
  ShieldAlert,
  Dna,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import { generateMission } from './services/geminiService';
import { Mission, Agent, Task } from './types';

// Components
const NeonButton = ({ onClick, children, disabled, variant = 'primary' }: { 
  onClick?: () => void, 
  children: React.ReactNode, 
  disabled?: boolean,
  variant?: 'primary' | 'danger' | 'success' 
}) => {
  const colors = {
    primary: 'border-cyan-500 text-cyan-400 hover:bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.5)]',
    danger: 'border-red-500 text-red-500 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.5)]',
    success: 'border-green-500 text-green-500 hover:bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.5)]',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 border-2 rounded-lg font-mono font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${colors[variant]}`}
    >
      {children}
    </button>
  );
};

const Header = () => (
  <header className="mb-12 text-center">
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-2 px-3 py-1 mb-4 border border-cyan-500/30 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono uppercase tracking-[0.2em]"
    >
      <ShieldAlert size={14} className="animate-pulse" />
      Classified // Clearance Level 9
    </motion.div>
    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-cyan-400 mb-2 uppercase tracking-tighter">
      OOP Mission Generator
    </h1>
    <p className="text-zinc-500 font-mono text-sm tracking-tight max-w-2xl mx-auto leading-relaxed">
      Write the name of the students in the agents side, and list of available classroom materials to interact with in the other side. 
      <br />
      <span className="text-cyan-400 mt-2 block font-bold">Hit Generate Mission to generate task list.</span>
    </p>
  </header>
);

export default function App() {
  const [personnel, setPersonnel] = useState<string[]>(['Agent Alpha', 'Agent Beta', 'Agent Gamma']);
  const [materials, setMaterials] = useState<string[]>(['Bin', 'Laptop', 'Whiteboard', 'Window']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mission, setMission] = useState<Mission | null>(null);
  const [isMissionStarted, setIsMissionStarted] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isMissionComplete, setIsMissionComplete] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const personnelScrollRef = useRef<HTMLDivElement>(null);
  const materialsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (personnelScrollRef.current) {
      personnelScrollRef.current.scrollTop = personnelScrollRef.current.scrollHeight;
    }
  }, [personnel.length]);

  useEffect(() => {
    if (materialsScrollRef.current) {
      materialsScrollRef.current.scrollTop = materialsScrollRef.current.scrollHeight;
    }
  }, [materials.length]);

  useEffect(() => {
    if (mission && isMissionStarted && timeLeft > 0 && !isMissionComplete) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsMissionComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mission, isMissionStarted, isMissionComplete, timeLeft]);

  const handleGenerate = async () => {
    const validPersonnel = personnel.map(p => p.trim()).filter(p => p);
    const validMaterials = materials.map(m => m.trim()).filter(m => m);

    if (validPersonnel.length === 0 || validMaterials.length === 0) {
      setError("MANDATORY_DATA_MISSING: PERSONNEL and MATERIALS required.");
      return;
    }
    setError(null);
    setIsGenerating(true);
    try {
      const generated = await generateMission(validPersonnel, validMaterials);
      setMission(generated);
      setIsMissionStarted(false);
      setCompletedTaskIds(new Set());
      setTimeLeft(300);
    } catch (err: any) {
      const errorMsg = err?.message || "UNABLE_TO_SYNTHESIZE_MISSION";
      let finalMsg = errorMsg;
      
      if (errorMsg.includes("SECRET_ACCESS_DENIED") || errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("PERMISSION_DENIED")) {
        finalMsg = "SYSTEM_ACCESS_DENIED: The API key in your Secrets panel is invalid or not yet configured. Please ensure you have added a Gemini API key in the AI Studio Secrets panel.";
      } else if (!errorMsg.includes("MISSION_GENERATION_FAILED")) {
        finalMsg = `MISSION_SYNTHESIS_ERROR: ${errorMsg}`;
      }
      
      setError(finalMsg);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const addField = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, '']);
  };

  const updateField = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
    setter(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const removeField = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAgentColor = (id: string) => {
    const agent = mission?.agents.find(a => a.id === id);
    return agent?.color || '#06b6d4';
  };

  const getAgentName = (id: string) => {
    const agent = mission?.agents.find(a => a.id === id);
    return agent?.name || 'UNKNOWN_OBJECT';
  };

  const getAgentClass = (id: string) => {
    const agent = mission?.agents.find(a => a.id === id);
    return agent?.className || 'Class';
  };

  const resetMission = () => {
    setMission(null);
    setIsMissionStarted(false);
    setCompletedTaskIds(new Set());
    setIsMissionComplete(false);
    setTimeLeft(300);
  };

  const toggleTaskCompletion = (taskId: string) => {
    if (!mission) return;
    
    // Check if dependencies are met
    const task = mission.tasks.find(t => t.id === taskId);
    if (!task) return;

    const dependenciesMet = task.dependencyIds.every(depId => completedTaskIds.has(depId));
    if (!dependenciesMet && !completedTaskIds.has(taskId)) {
      // Small feedback for locked task? Maybe just return
      return;
    }

    setCompletedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      
      // Check for mission completion
      if (mission && next.size === mission.tasks.length) {
        setIsMissionComplete(true);
      }

      return next;
    });
  };

  const isTaskLocked = (taskId: string) => {
    const task = mission?.tasks.find(t => t.id === taskId);
    if (!task) return false;
    return task.dependencyIds.some(depId => !completedTaskIds.has(depId));
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="max-w-6xl mx-auto p-6 md:p-12">
        <AnimatePresence mode="wait">
          {!mission ? (
            <motion.div
              id="setup-screen"
              key="setup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center"
            >
              <Header />

                <div className="w-full grid md:grid-cols-2 gap-8 mb-12">
                  {/* Personnel Input */}
                  <div className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-transparent blur opacity-25 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative p-6 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm uppercase tracking-widest">
                          <Users size={18} />
                          Agents_
                        </div>
                        <button 
                          onClick={() => addField(setPersonnel)}
                          className="text-[10px] text-zinc-500 hover:text-cyan-400 font-mono uppercase transition-colors"
                        >
                          + Add Agent
                        </button>
                      </div>
                      <div className="h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar" ref={personnelScrollRef}>
                        {personnel.map((p, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2 font-mono text-cyan-100 focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-zinc-700"
                              placeholder={`Agent ${i + 1} Name`}
                              value={p}
                              onChange={(e) => updateField(setPersonnel, i, e.target.value)}
                            />
                            {personnel.length > 1 && (
                              <button 
                                onClick={() => removeField(setPersonnel, i)}
                                className="px-2 text-zinc-600 hover:text-red-500 transition-colors"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Materials Input */}
                  <div className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 to-transparent blur opacity-25 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative p-6 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <div className="flex items-center gap-2 text-yellow-500 font-mono text-sm uppercase tracking-widest">
                          <Package size={18} />
                          Classroom Materials_
                        </div>
                        <button 
                          onClick={() => addField(setMaterials)}
                          className="text-[10px] text-zinc-500 hover:text-yellow-400 font-mono uppercase transition-colors"
                        >
                          + Add Material
                        </button>
                      </div>
                      <div className="h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar" ref={materialsScrollRef}>
                        {materials.map((m, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2 font-mono text-yellow-100 focus:outline-none focus:border-yellow-500 transition-colors placeholder:text-zinc-700"
                              placeholder={`Material ${i + 1}`}
                              value={m}
                              onChange={(e) => updateField(setMaterials, i, e.target.value)}
                            />
                            {materials.length > 1 && (
                              <button 
                                onClick={() => removeField(setMaterials, i)}
                                className="px-2 text-zinc-600 hover:text-red-500 transition-colors"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-3 font-mono text-xs uppercase"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}

              <NeonButton onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <div className="flex items-center gap-3">
                    <Dna className="animate-spin" />
                    Stand By for Mission Briefing
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Zap />
                    Generate Mission
                  </div>
                )}
              </NeonButton>
            </motion.div>
          ) : (
            <motion.div
              id="mission-screen"
              key="mission"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-transparent to-red-600 opacity-30" />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-red-500 font-mono text-xs uppercase tracking-[0.3em] mb-1">
                    <ShieldAlert size={14} className="animate-pulse" />
                    {isMissionStarted ? 'Active Command' : 'Awaiting Deployment'}
                  </div>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Mission Briefing</h2>
                </div>

                <div className="flex items-center gap-8">
                  {isMissionStarted ? (
                    <>
                      <div className="flex flex-col items-center md:items-end">
                        <div className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-1">Sector_Time_Remaining</div>
                        <div className={`text-5xl font-mono font-black mb-1 transition-opacity ${!showTimer ? 'opacity-0' : 'opacity-100'} ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                          {formatTime(timeLeft)}
                        </div>
                        <button 
                          onClick={() => setShowTimer(!showTimer)}
                          className="text-[10px] text-zinc-500 hover:text-cyan-400 font-mono uppercase transition-colors flex items-center gap-2"
                        >
                          {showTimer ? <><EyeOff size={10}/> Hide Clock</> : <><Eye size={10}/> Show Clock</>}
                        </button>
                      </div>
                      <div className="h-12 w-[1px] bg-zinc-800" />
                      <NeonButton onClick={resetMission} variant="danger">Abort</NeonButton>
                    </>
                  ) : (
                    <NeonButton onClick={() => setIsMissionStarted(true)} variant="primary">Start Mission</NeonButton>
                  )}
                </div>
              </div>

              {/* OOP Intro & Instructions */}
              {!isMissionStarted && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="grid md:grid-cols-2 gap-6"
                >
                  <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl space-y-4">
                    <h3 className="text-cyan-400 font-mono text-xs uppercase tracking-[0.25em] flex items-center gap-2">
                      <Terminal size={14} /> Briefing: OOP Core Concepts
                    </h3>
                    <div className="space-y-4 text-sm text-zinc-400 leading-relaxed font-mono">
                      <p>
                        <span className="text-cyan-300 font-bold block mb-1 uppercase">1. Classes</span>
                        Think of a <span className="text-zinc-200 underline decoration-cyan-500/50">Class</span> as a blueprint or template for a role (e.g., Organizer, Technician).
                      </p>
                      <p>
                        <span className="text-yellow-300 font-bold block mb-1 uppercase">2. Objects</span>
                        An <span className="text-zinc-200 underline decoration-yellow-500/50">Object</span> is a real person based on a class. You name the objects (e.g., Agent Alpha).
                      </p>
                      <p>
                        <span className="text-green-300 font-bold block mb-1 uppercase">3. Methods</span>
                        A <span className="text-zinc-200 underline decoration-green-500/50">Method</span> is a specific action (a function) that an object can perform (e.g., move, stack).
                      </p>
                    </div>
                  </div>

                  <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl space-y-4">
                    <h3 className="text-yellow-500 font-mono text-xs uppercase tracking-[0.25em] flex items-center gap-2">
                      <Play size={14} /> Mission Instructions
                    </h3>
                    <ul className="space-y-3 text-sm text-zinc-400 font-mono">
                      <li className="flex gap-3">
                        <span className="text-yellow-500 shrink-0">01.</span>
                        Review the logic sequences below. Some tasks are <span className="text-red-500">Locked</span> until a teammate completes a dependency.
                      </li>
                      <li className="flex gap-3">
                        <span className="text-yellow-500 shrink-0">02.</span>
                        Physically perform the action in the classroom (e.g., "Sam.open(Window)").
                      </li>
                      <li className="flex gap-3">
                        <span className="text-yellow-500 shrink-0">03.</span>
                        Check the box next to your task to verify it in the system.
                      </li>
                      <li className="flex gap-3">
                        <span className="text-yellow-500 shrink-0">04.</span>
                        The mission is clear once ALL tasks are checked before the timer ends.
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {/* Mission Terminal */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-b from-cyan-500/20 to-transparent blur opacity-20" />
                <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl shadow-inner overflow-hidden min-h-[60vh] flex flex-col">
                  {/* Terminal Header */}
                  <div className="bg-zinc-900/50 border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                      </div>
                      <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Terminal :: encrypted_output.log</div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-mono">
                      <Play size={10} /> Running Logic Engine
                    </div>
                  </div>

                  {/* Terminal Body */}
                  <div className="flex-1 p-8 overflow-y-auto font-mono text-lg space-y-6 max-h-[70vh] custom-scrollbar">
                    {mission.tasks.map((task, idx) => {
                      const isCompleted = completedTaskIds.has(task.id);
                      const isLocked = isTaskLocked(task.id);
                      const color = getAgentColor(task.agentId);
                      const studentName = getAgentName(task.agentId);
                      const className = getAgentClass(task.agentId);
                      
                      return (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ 
                            opacity: isLocked ? 0.3 : 1, 
                            x: 0,
                          }}
                          transition={{ delay: idx * 0.05 }}
                          className={`flex flex-col md:flex-row md:items-start gap-4 p-4 rounded-xl border transition-all ${
                            isCompleted 
                              ? 'bg-green-500/5 border-green-500/20 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]' 
                              : isLocked 
                                ? 'bg-zinc-900/20 border-zinc-900 pointer-events-none' 
                                : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {/* Checkbox */}
                          <div className="pt-1">
                            <input 
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => toggleTaskCompletion(task.id)}
                              disabled={isLocked || !isMissionStarted}
                              className={`w-6 h-6 rounded border-2 transition-all cursor-pointer appearance-none flex items-center justify-center
                                ${isCompleted 
                                  ? 'bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] before:content-["✔"] before:text-black before:text-xs' 
                                  : isLocked || !isMissionStarted
                                    ? 'border-zinc-800 bg-zinc-900' 
                                    : 'border-zinc-600 hover:border-cyan-500 bg-black'
                                }`}
                            />
                          </div>

                          <div className="flex-1 space-y-3">
                            {/* OOP Concept Display */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm md:text-base">
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-600 italic">class</span>
                                <span className="text-cyan-400 font-bold">{className}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span style={{ color }} className="font-black underline decoration-2 underline-offset-4">
                                  {studentName}
                                </span>
                                <span className="text-zinc-600">=</span>
                                <span className="text-zinc-400">new</span>
                                <span className="text-cyan-400">{className}();</span>
                              </div>
                            </div>

                            {/* Method Call */}
                            <div className={`flex items-center gap-2 text-xl md:text-2xl font-mono ${isCompleted ? 'line-through opacity-30' : ''}`}>
                              <span style={{ color }} className="font-bold">{studentName}</span>
                              <span className="text-zinc-500">.</span>
                              <span className="text-yellow-400 font-bold">{task.method}</span>
                              <span className="text-zinc-500">(</span>
                              <span className="text-white italic font-medium">{task.material}</span>
                              <span className="text-zinc-500">);</span>
                            </div>
                            
                            {task.dependencyIds.length > 0 && !isCompleted && (
                              <div className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded inline-flex border transition-colors ${
                                isLocked ? 'text-red-400 bg-red-400/5 border-red-500/30' : 'text-green-400 bg-green-400/5 border-green-500/30'
                              }`}>
                                <ShieldAlert size={10} className={isLocked ? 'text-red-500' : 'text-green-500'} />
                                {isLocked ? `WAITING_FOR: ${task.dependencyIds.map(id => getAgentName(id)).join(', ')}` : 'READY_FOR_EXECUTION'}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                    
                    {/* Removed sector clearance indicator */}
                  </div>
                </div>
              </div>

              {/* Status Bar Removed */}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Overlay */}
        <AnimatePresence>
          {isMissionComplete && (
            <motion.div
              id="success-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-md"
            >
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-green-500/10 blur-[120px] animate-pulse" />
              </div>

              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="relative text-center space-y-8"
              >
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-green-500 text-green-500 mb-4 animate-bounce">
                  <CheckCircle2 size={48} />
                </div>
                
                <h2 className="text-7xl font-black italic uppercase tracking-tighter text-white">
                  CONCEPT UNDERSTOOD <br />
                  <span className="text-green-500">MISSION ACCOMPLISHED</span>
                </h2>
                
                <div className="flex items-center justify-center gap-4 text-zinc-500 font-mono text-sm tracking-[0.4em] uppercase">
                  <span>SECTOR SEAL</span>
                  <span>//</span>
                  <span>DATA VERIFIED</span>
                  <span>//</span>
                  <span>LOGIC OPTIMAL</span>
                </div>

                <div className="pt-12">
                  <NeonButton onClick={resetMission} variant="success">Generate New Mission</NeonButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #18181b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #27272a;
        }
      `}</style>
    </div>
  );
}
