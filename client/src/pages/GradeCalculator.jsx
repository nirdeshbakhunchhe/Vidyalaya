// GradeCalculator.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaCalculator, 
  FaBullseye, 
  FaChartLine, 
  FaPercentage, 
  FaInfoCircle,
  FaUndoAlt
} from 'react-icons/fa';
import StudentShell from '../components/StudentShell';

const GradeCalculator = () => {
  const [mode, setMode] = useState('required'); // 'required' or 'predict'

  // Input states
  const [targetGrade, setTargetGrade] = useState(90);
  
  // Assessments arrays: [{ id, name, grade, weight }]
  const [assessments, setAssessments] = useState([
    { id: 1, name: 'Assignments', grade: 85, weight: 30 },
    { id: 2, name: 'Quizzes', grade: 80, weight: 20 },
    { id: 3, name: 'Midterm / Past Grade', grade: 75, weight: 20 }
  ]);

  const [finalWeight, setFinalWeight] = useState(30);
  const [expectedFinalGrade, setExpectedFinalGrade] = useState(85); // For predict mode

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Auto calculate when inputs change
  useEffect(() => {
    calculate();
  }, [assessments, targetGrade, mode, finalWeight, expectedFinalGrade]);

  const handleAssessmentChange = (id, field, value) => {
    const numValue = parseFloat(value) || 0;
    setAssessments(prev => prev.map(a => a.id === id ? { ...a, [field]: numValue } : a));
  };

  const addAssessment = () => {
    setAssessments(prev => [
      ...prev,
      { id: Date.now(), name: `Assessment ${prev.length + 1}`, grade: 0, weight: 10 }
    ]);
  };

  const removeAssessment = (id) => {
    setAssessments(prev => prev.filter(a => a.id !== id));
  };

  const calculate = () => {
    setError('');
    
    // Total weight check
    const currentWeightSum = assessments.reduce((acc, curr) => acc + curr.weight, 0);
    const totalWeight = currentWeightSum + finalWeight;

    if (totalWeight !== 100) {
      setError(`Total weight must equal 100%. Currently it is ${totalWeight}%.`);
    }

    // Calculate current earned points
    let earnedPoints = 0;
    assessments.forEach(a => {
      earnedPoints += (a.grade * (a.weight / 100));
    });

    if (mode === 'required') {
      // We want to find x such that: earnedPoints + (x * finalWeight / 100) = targetGrade
      if (finalWeight === 0) {
        setResult(earnedPoints); // User got exactly what they earned
        return;
      }
      const neededPoints = targetGrade - earnedPoints;
      const requiredScore = (neededPoints / finalWeight) * 100;
      setResult(requiredScore);
    } else {
      // Predict mode: earnedPoints + (expectedFinal * finalWeight / 100)
      const predicted = earnedPoints + (expectedFinalGrade * (finalWeight / 100));
      setResult(predicted);
    }
  };

  const resetDefaults = () => {
    setAssessments([
      { id: 1, name: 'Assignments', grade: 85, weight: 30 },
      { id: 2, name: 'Quizzes', grade: 80, weight: 20 },
      { id: 3, name: 'Midterm / Past Grade', grade: 75, weight: 20 }
    ]);
    setFinalWeight(30);
    setTargetGrade(90);
    setExpectedFinalGrade(85);
  };

  // UI Helpers
  const getProgressColor = (value) => {
    if (value > 100) return 'text-red-500';
    if (value >= 90) return 'text-green-500';
    if (value >= 80) return 'text-blue-500';
    if (value >= 70) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <StudentShell>
      <div className="px-4 sm:px-6 py-8 bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-green-500 rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-lg border border-teal-500/20">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="2" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            </svg>
          </div>
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-sm ring-1 ring-white/15">
                  <FaCalculator className="text-2xl text-white" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Grade Predictor</h2>
              </div>
              <p className="text-teal-50 max-w-xl text-lg opacity-90 leading-relaxed">
                Calculate what you need on your final exam to reach your target grade, or predict your final score based on your current progress.
              </p>
            </div>
            <button 
              onClick={resetDefaults}
              className="flex items-center space-x-2 bg-white/15 hover:bg-white/20 backdrop-blur-md px-5 py-3 rounded-xl transition-all font-medium text-white shadow-sm border border-white/15"
            >
              <FaUndoAlt className="text-sm" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form Setup */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Mode Switcher */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Select Calculator Mode</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setMode('required')}
                className={`relative overflow-hidden flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                  mode === 'required' 
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50'
                }`}
              >
                {mode === 'required' && <div className="absolute top-3 right-3 w-3 h-3 bg-teal-500 rounded-full animate-pulse" />}
                <FaBullseye className={`text-4xl mb-3 ${mode === 'required' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className={`font-semibold text-lg ${mode === 'required' ? 'text-teal-700 dark:text-teal-300' : 'text-slate-600 dark:text-slate-400'}`}>
                  Target Grade
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-500 mt-1 text-center">Find out what you need on the final</span>
              </button>

              <button
                onClick={() => setMode('predict')}
                className={`relative overflow-hidden flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                  mode === 'predict' 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50'
                }`}
              >
                {mode === 'predict' && <div className="absolute top-3 right-3 w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />}
                <FaChartLine className={`text-4xl mb-3 ${mode === 'predict' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className={`font-semibold text-lg ${mode === 'predict' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>
                  Predict Final
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-500 mt-1 text-center">Estimate final course grade</span>
              </button>
            </div>
          </div>

          {/* Current Progress Input */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Current Assessments</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter your grades and their respective weights.</p>
              </div>
              <button 
                onClick={addAssessment}
                className="text-sm px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 font-medium transition-colors"
              >
                + Add Item
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider px-2">
                <div className="col-span-12 sm:col-span-5">Assessment Name</div>
                <div className="col-span-6 sm:col-span-3">Grade (%)</div>
                <div className="col-span-6 sm:col-span-3">Weight (%)</div>
                <div className="col-span-12 sm:col-span-1 text-right">Delete</div>
              </div>

              {assessments.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 items-center bg-white dark:bg-slate-900 group rounded-2xl p-2 border border-slate-200/70 dark:border-slate-800 shadow-[0_1px_0_0_rgba(15,23,42,0.03)]"
                >
                  <div className="col-span-12 sm:col-span-5 relative">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleAssessmentChange(item.id, 'name', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder-slate-400"
                      placeholder="e.g., Midterm"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-3 relative">
                    <input
                      type="number"
                      value={item.grade}
                      onChange={(e) => handleAssessmentChange(item.id, 'grade', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-8 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    />
                    <FaPercentage className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  </div>
                  <div className="col-span-6 sm:col-span-3 relative">
                    <input
                      type="number"
                      value={item.weight}
                      onChange={(e) => handleAssessmentChange(item.id, 'weight', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-8 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    />
                    <FaPercentage className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  </div>
                  <div className="col-span-12 sm:col-span-1 text-right">
                    <button
                      onClick={() => removeAssessment(item.id)}
                      className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:bg-red-900/20 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Final Info */}
            <div className="bg-teal-50 dark:bg-teal-900/10 border-t border-teal-100 dark:border-teal-900/30 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
               <div>
                  <h4 className="font-semibold text-teal-800 dark:text-teal-200">Final Assessment Info</h4>
                  <p className="text-xs text-teal-600 dark:text-teal-400/70 mt-1">Weight for the event you wish to predict for.</p>
               </div>
               
               <div className="flex items-center space-x-4">
                 <div className="flex flex-col">
                   <label className="text-xs font-bold text-slate-500 mb-1">Final Weight</label>
                   <div className="relative w-32">
                     <input
                       type="number"
                       value={finalWeight}
                       onChange={(e) => setFinalWeight(parseFloat(e.target.value) || 0)}
                       className="w-full bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700 rounded-xl pl-4 pr-8 py-2.5 text-sm text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                     />
                     <FaPercentage className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                   </div>
                 </div>

                 {mode === 'predict' && (
                     <div className="flex flex-col">
                     <label className="text-xs font-bold text-slate-500 mb-1">Expected Score</label>
                     <div className="relative w-32">
                        <input
                           type="number"
                           value={expectedFinalGrade}
                           onChange={(e) => setExpectedFinalGrade(parseFloat(e.target.value) || 0)}
                           className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-xl pl-4 pr-8 py-2.5 text-sm text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <FaPercentage className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                     </div>
                     </div>
                 )}
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Results & Inputs specific to mode */}
        <div className="space-y-6">
          <div className="bg-black rounded-3xl p-8 shadow-xl text-white relative overflow-hidden border border-slate-800">
             
             <h3 className="text-xl font-bold mb-6 flex items-center space-x-2 relative z-10">
               <span className="bg-black px-3 py-1.5 rounded-lg text-sm mr-2 block border border-white/15">
                 Result
               </span>
               {mode === 'required' ? 'Required Final Score' : 'Predicted Final Grade'}
             </h3>

             {mode === 'required' && (
                <div className="mb-8 relative z-10">
                  <label className="block text-sm text-white/90 mb-2">My Target Final Grade:</label>
                  <div className="relative max-w-xs">
                     <input
                        type="number"
                        value={targetGrade}
                        onChange={(e) => setTargetGrade(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white/10 dark:bg-slate-800/10 border border-white/25 rounded-xl pl-4 pr-10 py-3 text-xl text-white font-bold focus:ring-2 focus:ring-teal-400 outline-none transition-all placeholder-white/40 shadow-inner"
                     />
                     <FaPercentage className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-sm" />
                  </div>
                </div>
             )}

             <div className="relative z-10">
                {error ? (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm flex items-start space-x-3">
                     <FaInfoCircle className="mt-0.5 text-red-400 shrink-0" />
                     <p>{error}</p>
                  </div>
                ) : (
                  <div className="text-center bg-black border border-white/10 rounded-2xl p-8">
                     <p className="text-slate-300 text-sm mb-2 uppercase tracking-wider font-semibold">
                        {mode === 'required' ? 'You need to score' : 'You will achieve'}
                     </p>
                     
                     <div className="flex items-end justify-center space-x-1 mb-2">
                        <span className={`text-6xl font-black tabular-nums tracking-tight ${getProgressColor(result)}`}>
                           {result !== null ? result.toFixed(1) : '--'}
                        </span>
                        <span className="text-3xl text-slate-400 mb-1">%</span>
                     </div>

                     <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-[200px] mx-auto">
                        {mode === 'required' 
                           ? (result > 100 ? "This target is impossible with current weights." : (result <= 0 ? "You've already passed this target!" : "On your final exam to reach your target."))
                           : "Assuming you score your expected final grade."}
                     </p>
                  </div>
                )}
             </div>
          </div>

          {!error && (
             <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                 <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-sm flex items-center space-x-2">
                     <FaInfoCircle className="text-slate-400" />
                     <span>Weight Summary</span>
                 </h4>
                 
                 {/* Progress Bar of Weights */}
                 <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                    {assessments.map((a, i) => {
                       const colors = ['bg-emerald-400', 'bg-blue-400', 'bg-amber-400', 'bg-purple-400', 'bg-rose-400'];
                       const c = colors[i % colors.length];
                       return <div key={a.id} className={`${c} h-full transition-all`} style={{ width: `${a.weight}%` }} title={`${a.name}: ${a.weight}%`} />
                    })}
                    <div className="bg-slate-400 dark:bg-slate-600 h-full transition-all" style={{ width: `${finalWeight}%` }} title={`Final: ${finalWeight}%`} />
                 </div>
                 <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5"/> Assessments</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-slate-400 mr-1.5"/> Final Output</span>
                 </div>
             </div>
          )}
        </div>
        </div>
      </div>
    </StudentShell>
  );
};

export default GradeCalculator;
