import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BedDouble, LogOut, Search, MessageCircle, Banknote, UserMinus, MousePointer2, Users, Calendar, ShieldCheck, Lock, RefreshCw, Loader2, Send, Trash2, Camera, Upload, Plus, Minus, Home, LayoutGrid, List, Edit2 } from 'lucide-react';
import Tesseract from 'tesseract.js';

// --- CONFIGURATION ---
const API = "https://hostel-backend-0dev.onrender.com/api"; 

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('hostelUser')) || null);

  const handleLogin = (userData) => {
    localStorage.setItem('hostelUser', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('hostelUser');
    setUser(null);
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;
  if (user.username === 'admin') return <AdminPanel user={user} onLogout={handleLogout} />;
  if (user && !user.setup_complete) return <SetupPage user={user} onUpdate={handleLogin} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}

// --- LOGIN (Modern UI) ---
function LoginPage({ onLogin }) {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    setLoading(true);
    try {
      const res = await axios.post(`${API}/login`, creds);
      onLogin(res.data);
    } catch (err) {
      if (err.response && err.response.data.error === "REGISTRATION_SUCCESS") {
        setMsg({ text: "Account created! Waiting for Admin approval.", type: 'success' });
      } else if (err.response && err.response.data.error === "NOT_APPROVED") {
        setMsg({ text: "Account pending approval.", type: 'error' });
      } else {
        setMsg({ text: "Invalid credentials.", type: 'error' });
      }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-100 to-blue-100 font-sans">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-96 border border-white/50 backdrop-blur-sm">
        <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-full text-white shadow-lg shadow-blue-300">
                <Home size={32} />
            </div>
        </div>
        <h2 className="text-3xl font-bold mb-2 text-slate-800 text-center">Welcome Back</h2>
        <p className="text-slate-500 text-center mb-8 text-sm">Manage your hostel efficiently</p>
        
        {msg.text && (
            <div className={`p-3 rounded-lg mb-6 text-sm font-medium text-center ${msg.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                {msg.text}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Username</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800" placeholder="Enter username" onChange={e => setCreds({...creds, username: e.target.value})} />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Password</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800" type="password" placeholder="••••••••" onChange={e => setCreds({...creds, password: e.target.value})} />
            </div>
            <button disabled={loading} className="w-full bg-blue-600 text-white p-3.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:shadow-blue-200 active:scale-95 transition-all flex justify-center gap-2 mt-4">
                {loading ? <Loader2 className="animate-spin"/> : "Sign In"}
            </button>
        </form>
      </div>
    </div>
  );
}

// --- ADMIN (Modern UI + Delete) ---
function AdminPanel({ user, onLogout }) {
    const [owners, setOwners] = useState([]);
    const [newPass, setNewPass] = useState("");
    
    useEffect(() => { loadOwners(); }, []);
    
    const loadOwners = () => { axios.get(`${API}/admin/users`).then(res => setOwners(res.data)); }

    const toggleStatus = async (userId, currentStatus) => {
        await axios.post(`${API}/admin/approve`, { userId, status: currentStatus === 1 ? 0 : 1 });
        loadOwners();
    };

    const handleDeleteOwner = async (userId, username) => {
        if(confirm(`🚨 DANGER: Delete owner "${username}"?\n\nThis will permanently delete ALL data.`)) {
            try {
                await axios.post(`${API}/admin/delete-owner`, { userId });
                alert("Owner Deleted Successfully.");
                loadOwners();
            } catch(e) { alert("Error deleting owner."); }
        }
    };

    const handleChangePassword = async () => {
        if (!newPass) return alert("Enter password");
        if (confirm("Change Admin password?")) {
            await axios.post(`${API}/admin/change-password`, { newPassword: newPass });
            alert("Updated! Log in again."); onLogout();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <nav className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-20">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <h1 className="text-lg font-bold flex items-center gap-3"><ShieldCheck className="text-blue-400"/> Super Admin Console</h1>
                    <button onClick={onLogout} className="bg-slate-700 hover:bg-red-600 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
                        <LogOut size={16}/> Logout
                    </button>
                </div>
            </nav>

            <div className="p-8 max-w-6xl mx-auto space-y-8">
                {/* Security Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6">
                    <div className="bg-orange-100 p-3 rounded-full text-orange-600"><Lock size={24}/></div>
                    <div className="flex-1 w-full">
                        <h3 className="font-bold text-slate-800">Security Settings</h3>
                        <p className="text-sm text-slate-500 mb-3">Update the master password for the admin account.</p>
                        <div className="flex gap-3"> 
                            <input type="text" className="flex-1 border border-slate-200 p-2 rounded-lg bg-slate-50 focus:ring-2 focus:ring-orange-200 outline-none" placeholder="New Strong Password" value={newPass} onChange={(e) => setNewPass(e.target.value)} /> 
                            <button onClick={handleChangePassword} className="bg-slate-900 text-white px-6 rounded-lg font-bold hover:bg-black transition-colors">Update</button> 
                        </div>
                    </div>
                </div>

                {/* Owners Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-xl font-bold text-slate-800">Registered Owners</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="p-4 text-left">Owner Info</th>
                                    <th className="p-4 text-left">Hostel Name</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-center">Actions</th>
                                    <th className="p-4 text-center">Delete</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {owners.map(owner => (
                                    <tr key={owner.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{owner.username}</div>
                                            <div className="text-xs text-slate-400">ID: #{owner.id}</div>
                                        </td>
                                        <td className="p-4 text-slate-600">{owner.hostel_name || <span className="italic text-slate-400">Not Setup</span>}</td>
                                        <td className="p-4 text-center">
                                            {owner.is_approved === 1 
                                                ? <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">Active</span>
                                                : <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">Pending</span>
                                            }
                                        </td>
                                        <td className="p-4 flex justify-center gap-2">
                                            <button onClick={() => toggleStatus(owner.id, owner.is_approved)} className={`px-4 py-2 rounded-lg text-white font-bold text-xs shadow-sm transition-transform active:scale-95 ${owner.is_approved === 1 ? 'bg-slate-400 hover:bg-slate-500' : 'bg-green-600 hover:bg-green-700'}`}>
                                                {owner.is_approved === 1 ? 'Block Access' : 'Approve Access'}
                                            </button>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => handleDeleteOwner(owner.id, owner.username)} className="bg-red-50 text-red-600 border border-red-100 p-2 rounded-lg hover:bg-red-100 transition-colors" title="Delete Owner"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SETUP (Modern UI + All Floors) ---
function SetupPage({ user, onUpdate }) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({ hostelName: '', maxFloor: 3, defaultCapacity: 2 });
  const [range, setRange] = useState({ start: '101', end: '110' });
  const [generatedRooms, setGeneratedRooms] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    let rooms = [];
    const start = parseInt(range.start.slice(-2)); const end = parseInt(range.end.slice(-2));
    for (let f = 0; f <= config.maxFloor; f++) {
      for (let r = start; r <= end; r++) {
        const roomPrefix = f === 0 ? 'G' : f;
        const roomNo = `${roomPrefix}${r.toString().padStart(2, '0')}`;
        rooms.push({ floor: f, roomNo: roomNo, capacity: config.defaultCapacity });
      }
    }
    setGeneratedRooms(rooms); setStep(2);
  };

  const handleMouseDown = (i, e) => { e.preventDefault(); setIsDragging(true); setSelectedIndices(new Set([i])); };
  const handleMouseEnter = (i) => { if (isDragging) { const s = new Set(selectedIndices); s.add(i); setSelectedIndices(s); } };
  const applyCap = (cap) => { const u = generatedRooms.map((r, i) => selectedIndices.has(i) ? { ...r, capacity: cap } : r); setGeneratedRooms(u); setSelectedIndices(new Set()); };
  
  const submitSetup = async () => { 
      setLoading(true);
      try {
        await axios.post(`${API}/setup`, { userId: user.id, hostelName: config.hostelName, totalFloors: config.maxFloor + 1, rooms: generatedRooms }); 
        onUpdate({ ...user, setup_complete: 1, hostel_name: config.hostelName }); 
      } catch(e) { alert("Error saving setup"); setLoading(false); }
  };
  
  const getColor = (c) => {
      if(c===1) return 'bg-slate-100 border-slate-200 text-slate-500'; 
      if(c===2) return 'bg-blue-50 border-blue-200 text-blue-600';
      if(c===3) return 'bg-purple-50 border-purple-200 text-purple-600'; 
      if(c===4) return 'bg-orange-50 border-orange-200 text-orange-600'; 
      return 'bg-pink-50 border-pink-200 text-pink-600';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" onMouseUp={() => setIsDragging(false)}>
      <div className="bg-white/80 backdrop-blur-md shadow-sm p-4 sticky top-0 z-10 border-b border-slate-200">
          <div className="max-w-6xl mx-auto text-center font-bold text-slate-800 text-lg">Initial Setup</div>
      </div>
      
      <div className="flex-1 max-w-4xl w-full mx-auto p-6">
        {step === 1 && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Hostel Details</h2>
            
            <div className="grid gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">Hostel Name</label>
                    <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setConfig({...config, hostelName: e.target.value})} placeholder="e.g. Sunshine Residency" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-500 mb-2">Total Floors</label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" onChange={e => setConfig({...config, maxFloor: parseInt(e.target.value)})}>
                            {[0,1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n === 0 ? "Ground Only" : `G + ${n}`}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-blue-600 mb-2">Default Sharing</label>
                        <select className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl outline-none text-blue-700 font-medium" onChange={e => setConfig({...config, defaultCapacity: parseInt(e.target.value)})}>
                            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Sharing</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">Room Range (per floor)</label>
                    <div className="flex gap-4 items-center">
                        <input className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center" placeholder="01" onChange={e => setRange({...range, start: e.target.value})} />
                        <span className="text-slate-400 font-bold">TO</span>
                        <input className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center" placeholder="10" onChange={e => setRange({...range, end: e.target.value})} />
                    </div>
                </div>
            </div>
            
            <button onClick={handleGenerate} className="w-full mt-8 bg-blue-600 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">Next Step &rarr;</button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-150px)]">
            <div className="flex-1 overflow-y-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-100 select-none custom-scrollbar">
                 <div className="mb-4 text-xs font-bold uppercase text-slate-400 flex gap-2 items-center"><MousePointer2 size={14}/> Click & Drag to select rooms</div>
                 <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                     {generatedRooms.map((r, i) => (
                         <div key={i} onMouseDown={(e)=>handleMouseDown(i, e)} onMouseEnter={()=>handleMouseEnter(i)} 
                            className={`p-2 border-2 cursor-pointer flex flex-col items-center justify-center h-20 rounded-xl transition-all duration-100
                                ${selectedIndices.has(i) ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' : getColor(r.capacity)}`}
                         >
                            <span className="font-bold text-lg">{r.roomNo}</span>
                            <span className="text-[10px] opacity-80">{r.capacity} Beds</span>
                         </div>
                     ))}
                 </div>
            </div>
            <div className="w-full md:w-64 flex flex-col gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"> 
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><LayoutGrid size={18}/> Set Capacity</h3> 
                  <div className="space-y-2">
                    {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={()=>applyCap(n)} className="w-full py-2 px-4 rounded-lg text-sm font-bold transition-all bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200">
                            {n} Sharing
                        </button>
                    ))}
                  </div>
              </div>
              <button disabled={loading} onClick={submitSetup} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 transition-all flex justify-center gap-2 mt-auto"> 
                {loading ? <Loader2 className="animate-spin"/> : "Finish Setup"} 
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- DASHBOARD (Modern UI + List View + +/- Beds) ---
function Dashboard({ user, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [activeTab, setActiveTab] = useState('overview'); 
  const [modalData, setModalData] = useState(null); 
  const [rentFilter, setRentFilter] = useState('all');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { fetchDashboard(); }, []);
  const fetchDashboard = () => { axios.get(`${API}/dashboard/${user.id}`).then(res => setRooms(res.data)); };
  
  const handleReset = async () => {
      if(confirm("⚠ WARNING: This will WIPE all data. Continue?")) {
          await axios.post(`${API}/reset-hostel`, { userId: user.id });
          localStorage.setItem('hostelUser', JSON.stringify({ ...user, setup_complete: 0 }));
          window.location.reload();
      }
  };

  const handleAddBed = async (roomId) => { try { await axios.post(`${API}/rooms/add-bed`, { roomId }); fetchDashboard(); } catch(e) { alert("Error adding bed"); } };
  const handleRemoveBed = async (roomId) => { try { await axios.post(`${API}/rooms/remove-bed`, { roomId }); fetchDashboard(); } catch(e) { alert(e.response.data.error || "Error"); } };

  // Helper for List View
  const allBeds = rooms.flatMap(room => room.beds.map(bed => ({ ...bed, roomNo: room.number, roomId: room.id })));
  const occupiedBeds = allBeds.filter(b => b.isOccupied);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"><Home size={18}/></div>
                {user.hostel_name || 'My Hostel'}
            </h1>
            
            <div className="flex gap-2 w-full md:w-auto">
                {/* VIEW TOGGLE */}
                <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode==='grid'?'bg-white shadow text-blue-600':'text-slate-400'}`}><LayoutGrid size={18}/></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode==='list'?'bg-white shadow text-blue-600':'text-slate-400'}`}><List size={18}/></button>
                </div>

                <button onClick={() => setShowImport(true)} className="flex-1 md:flex-none bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center justify-center gap-2">
                    <Camera size={16}/> Import
                </button>
                <button onClick={handleReset} className="bg-orange-50 text-orange-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-orange-100 border border-orange-200 transition-colors" title="Reset Layout">
                    <RefreshCw size={16}/>
                </button>
                <button onClick={onLogout} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-100 border border-red-200 transition-colors" title="Logout">
                    <LogOut size={16}/>
                </button>
            </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 py-6">
          <div className="flex justify-center mb-8">
              <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
                  <button onClick={() => setActiveTab('overview')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Overview</button>
                  <button onClick={() => setActiveTab('rent')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'rent' ? 'bg-green-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Rent Collection</button>
              </div>
          </div>

          {activeTab === 'rent' && (
              <div className="flex justify-end mb-4">
                  <select className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg p-2 font-medium focus:ring-2 focus:ring-green-500 outline-none" onChange={(e) => setRentFilter(e.target.value)}>
                      <option value="all">Show All Tenants</option>
                      <option value="paid">Paid This Month</option>
                      <option value="unpaid">Unpaid / Due</option>
                  </select>
              </div>
          )}

          {/* --- GRID VIEW --- */}
          {viewMode === 'grid' && (
            <div className="space-y-10">
                {Object.entries(groupBy(rooms, 'floor')).map(([floor, floorRooms]) => (
                    <div key={floor}>
                        <div className="flex items-center gap-4 mb-4">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{parseInt(floor) === 0 ? "Ground Floor" : `Floor ${floor}`}</h2>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {floorRooms.map(room => (
                                <div key={room.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow relative group">
                                    <div className="text-center font-bold text-slate-700 text-lg mb-3">{room.number}</div>
                                    
                                    <div className="flex justify-center flex-wrap gap-2 mb-2">
                                        {room.beds.map((bed, i) => {
                                            if(activeTab === 'rent' && !bed.isOccupied) return null; 
                                            const isPaid = bed.lastRentPaid === getCurrentMonth();
                                            if(activeTab === 'rent' && rentFilter === 'paid' && !isPaid) return null;
                                            if(activeTab === 'rent' && rentFilter === 'unpaid' && isPaid) return null;
                                            
                                            let bgClass = 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-green-100 hover:text-green-600 hover:border-green-300';
                                            if(activeTab === 'rent') bgClass = isPaid ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200 animate-pulse';
                                            else if(bed.isOccupied) bgClass = bed.leaveDate ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200';
                                            
                                            return (
                                                <div key={i} onClick={() => setModalData({ type: activeTab==='rent'?'rent':'booking', room, bed })} 
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border cursor-pointer transition-all ${bgClass}`}
                                                >
                                                    {i + 1}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* +/- BEDS BUTTONS */}
                                    {activeTab === 'overview' && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                            <button onClick={() => handleAddBed(room.id)} className="w-5 h-5 bg-blue-50 text-blue-600 rounded flex items-center justify-center hover:bg-blue-100" title="Add Bed"><Plus size={10}/></button>
                                            <button onClick={() => handleRemoveBed(room.id)} className="w-5 h-5 bg-red-50 text-red-600 rounded flex items-center justify-center hover:bg-red-100" title="Remove Bed"><Minus size={10}/></button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          )}

          {/* --- LIST VIEW --- */}
          {viewMode === 'list' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-100 text-slate-500 uppercase font-bold text-xs">
                          <tr>
                              <th className="p-4">Room</th>
                              <th className="p-4">Name</th>
                              <th className="p-4">Mobile</th>
                              <th className="p-4">Join Date</th>
                              <th className="p-4">Advance</th>
                              <th className="p-4">Maint.</th>
                              <th className="p-4">Refundable</th>
                              <th className="p-4 text-center">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {occupiedBeds.map((bed, i) => {
                              const refund = (bed.advance || 0) - (bed.maintenance || 0);
                              return (
                                  <tr key={i} className="hover:bg-slate-50">
                                      <td className="p-4 font-bold text-blue-600">{bed.roomNo} <span className="text-slate-400 text-xs">({bed.index+1})</span></td>
                                      <td className="p-4 font-bold">{bed.clientName}</td>
                                      <td className="p-4 text-slate-500">{bed.clientMobile}</td>
                                      <td className="p-4 text-slate-500">{bed.joinDate}</td>
                                      <td className="p-4">₹{bed.advance}</td>
                                      <td className="p-4">₹{bed.maintenance}</td>
                                      <td className="p-4 font-bold text-green-600">₹{refund}</td>
                                      <td className="p-4 text-center">
                                          <button onClick={() => setModalData({ type: 'booking', room: { number: bed.roomNo }, bed })} className="bg-slate-100 text-slate-600 px-3 py-1 rounded hover:bg-blue-50 hover:text-blue-600 font-bold border border-slate-200">Manage</button>
                                      </td>
                                  </tr>
                              );
                          })}
                          {occupiedBeds.length === 0 && <tr><td colSpan="8" className="p-8 text-center text-slate-400">No active tenants found.</td></tr>}
                      </tbody>
                  </table>
              </div>
          )}
      </div>

      {modalData && modalData.type === 'booking' && <BookingModal data={modalData} hostelName={user.hostel_name} close={() => { setModalData(null); fetchDashboard(); }} />}
      {modalData && modalData.type === 'rent' && <RentModal data={modalData} close={() => { setModalData(null); fetchDashboard(); }} />}
      {showImport && <ImportModal user={user} close={() => setShowImport(false)} />}
    </div>
  );
}

// --- IMPORT MODAL (OCR + Modern UI) ---
function ImportModal({ user, close }) {
    const [scanStatus, setScanStatus] = useState(""); 
    const [scannedText, setScannedText] = useState("");
    const [parsedData, setParsedData] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if(!file) return;
        setScanStatus("scanning");
        
        Tesseract.recognize(file, 'eng').then(({ data: { text } }) => {
            setScannedText(text);
            setScanStatus("done");
            parseText(text);
        });
    };

    const parseText = (text) => {
        const lines = text.split('\n');
        const detected = [];
        const dateRegex = /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/;

        lines.forEach(line => {
            const cleanLine = line.trim();
            if(cleanLine.length < 5) return;
            const roomMatch = cleanLine.match(/\b\d{3}\b/);
            const mobileMatch = cleanLine.match(/\b\d{10}\b/);
            const dateMatch = cleanLine.match(dateRegex);

            if(roomMatch) {
                let name = cleanLine.replace(roomMatch[0], "").replace(mobileMatch ? mobileMatch[0] : "", "").replace(dateMatch ? dateMatch[0] : "", "").trim();
                name = name.replace(/[^a-zA-Z ]/g, "");
                
                let isoDate = null;
                if(dateMatch) {
                    try {
                        const parts = dateMatch[0].split(/[./-]/);
                        if(parts.length === 3) isoDate = `${parts[2].length===2?'20'+parts[2]:parts[2]}-${parts[1]}-${parts[0]}`; 
                    } catch(e){}
                }

                if(name) detected.push({ roomNo: roomMatch[0], name: name, mobile: mobileMatch ? mobileMatch[0] : "", joinDate: isoDate });
            }
        });
        setParsedData(detected);
    };

    const handleImport = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${API}/import-data`, { userId: user.id, tenants: parsedData });
            alert(res.data.message);
            if(res.data.errors.length > 0) alert("Errors:\n" + res.data.errors.join("\n"));
            window.location.reload();
        } catch(e) { alert("Import failed."); setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Camera className="text-blue-600"/> Smart Import</h2>
                    <button onClick={close} className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300">✕</button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center border-dashed border-2">
                        <Camera size={40} className="mx-auto text-blue-300 mb-3"/>
                        <p className="text-sm text-blue-800 font-bold mb-1">Take a photo of your handwritten register</p>
                        <p className="text-xs text-blue-500 mb-4">Ensure good lighting. We will auto-detect Room No, Name & Mobile.</p>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="mx-auto block text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700"/>
                    </div>

                    {scanStatus === "scanning" && (
                        <div className="py-12 text-center">
                            <Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={40}/>
                            <p className="text-slate-500 font-medium">Scanning text using AI...</p>
                        </div>
                    )}

                    {scanStatus === "done" && (
                        <div className="mt-6 grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Detected Data ({parsedData.length} records)</label>
                                <div className="border border-slate-200 rounded-xl overflow-hidden h-64 overflow-y-auto bg-slate-50">
                                    {parsedData.length === 0 ? <div className="p-10 text-center text-slate-400 text-sm">No valid data found. Try editing the raw text.</div> : (
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-white text-xs text-slate-400 uppercase">
                                                <tr><th className="p-2">Room</th><th className="p-2">Name</th><th className="p-2">Date</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {parsedData.map((d, i) => (
                                                    <tr key={i} className="bg-white">
                                                        <td className="p-2 font-bold text-blue-600">{d.roomNo}</td>
                                                        <td className="p-2">{d.name}</td>
                                                        <td className="p-2 text-xs text-slate-400">{d.joinDate || "Now"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Raw Text (Editable)</label>
                                <textarea className="w-full h-64 p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none resize-none font-mono text-slate-600" value={scannedText} onChange={(e) => { setScannedText(e.target.value); parseText(e.target.value); }} />
                            </div>
                        </div>
                    )}
                </div>

                {parsedData.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <button disabled={loading} onClick={handleImport} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-emerald-100 transition-all flex justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin"/> : `Import ${parsedData.length} Tenants to Database`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- BOOKING MODAL (Edit Feature + Auto Maint) ---
function BookingModal({ data, close, hostelName }) {
  const { bed, room } = data;
  const isEditMode = bed.isOccupied; 
  const defaultMaint = localStorage.getItem('defaultMaintenance') || '';

  const [formData, setFormData] = useState({ 
      clientName: bed.clientName || '', 
      clientMobile: bed.clientMobile || '', 
      joinDate: bed.joinDate || '', 
      leaveDate: bed.leaveDate || '', 
      advance: bed.advance || '', 
      maintenance: bed.maintenance || defaultMaint // Auto-fill
  });
  
  const [editing, setEditing] = useState(!isEditMode); // If occupied, viewing mode first
  const [loading, setLoading] = useState(false);

  const refundableCalc = (parseFloat(formData.advance) || 0) - (parseFloat(formData.maintenance) || 0);

  const handleSubmit = async (e) => { 
      e.preventDefault(); 
      setLoading(true);
      
      // Save maintenance as new default
      if(formData.maintenance) localStorage.setItem('defaultMaintenance', formData.maintenance);

      try { 
          if(isEditMode) {
              await axios.post(`${API}/update-tenant`, { 
                  bedId: bed.id, 
                  advance: formData.advance, 
                  maintenance: formData.maintenance, 
                  leaveDate: formData.leaveDate 
              });
          } else {
              await axios.post(`${API}/book`, { ...formData, bedId: bed.id }); 
          }
          close(); 
      } 
      catch(e){ alert("Error saving data"); setLoading(false); }
  };
  
  const handleVacate = async () => { if(confirm("Vacate tenant?")) { await axios.post(`${API}/vacate`, { bedId: bed.id }); close(); } };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
            <h2 className="font-bold text-lg">{isEditMode ? 'Manage Tenant' : 'New Booking'} - Room {room.number}</h2>
            <button onClick={close}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Read-Only Info (Name/Mobile/Join can't be changed easily to prevent fraud, or enable if needed) */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Name</label>
                    {isEditMode ? <div className="font-bold text-slate-800">{formData.clientName}</div> : 
                    <input required className="w-full border-b p-2 outline-none" placeholder="Name" onChange={e => setFormData({...formData, clientName: e.target.value})} />}
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Mobile</label>
                    {isEditMode ? <div className="font-bold text-slate-800">{formData.clientMobile}</div> : 
                    <input className="w-full border-b p-2 outline-none" placeholder="Mobile" onChange={e => setFormData({...formData, clientMobile: e.target.value})} />}
                </div>
            </div>

            {/* Editable Fields */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-blue-600 uppercase">Payment Details</span>
                    {isEditMode && !editing && <button type="button" onClick={() => setEditing(true)} className="text-xs flex gap-1 items-center text-blue-600 underline"><Edit2 size={12}/> Edit</button>}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-slate-500">Advance (₹)</label>
                        <input type="number" disabled={!editing} value={formData.advance} className={`w-full p-2 rounded border ${editing?'bg-white border-blue-300':'bg-transparent border-transparent font-bold'}`} onChange={e => setFormData({...formData, advance: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500">Maintenance (₹)</label>
                        <input type="number" disabled={!editing} value={formData.maintenance} className={`w-full p-2 rounded border ${editing?'bg-white border-blue-300':'bg-transparent border-transparent font-bold'}`} onChange={e => setFormData({...formData, maintenance: e.target.value})} />
                    </div>
                </div>
                
                <div className="pt-2 border-t flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500">Refundable Amount:</span>
                    <span className="text-xl font-bold text-green-600">₹{refundableCalc}</span>
                </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <label className="text-xs font-bold text-orange-600 uppercase mb-1 block">Leaving Date (Notice)</label>
                <div className="flex gap-2">
                    <input type="date" disabled={!editing && isEditMode} value={formData.leaveDate || ''} className="w-full p-2 rounded border border-orange-200 bg-white text-sm" onChange={e => setFormData({...formData, leaveDate: e.target.value})} />
                    {isEditMode && editing && <button type="button" onClick={() => setFormData({...formData, leaveDate: ''})} className="text-xs text-red-500 underline">Clear</button>}
                </div>
            </div>

            {(editing || !isEditMode) && (
                <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg flex justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin"/> : (isEditMode ? "Save Changes" : "Confirm Booking")}
                </button>
            )}
        </form>

        {isEditMode && (
            <div className="p-4 bg-slate-50 border-t flex gap-2">
                <a href={`https://wa.me/91${bed.clientMobile}?text=Hello ${bed.clientName},`} target="_blank" className="flex-1 bg-green-100 text-green-700 py-2 rounded-lg font-bold text-sm text-center flex items-center justify-center gap-2"><Send size={14}/> WhatsApp</a>
                <button onClick={handleVacate} className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2"><UserMinus size={14}/> Vacate</button>
            </div>
        )}
      </div>
    </div>
  );
}

// --- RENT MODAL ---
function RentModal({ data, close }) {
  const { bed } = data;
  const joinDay = new Date(bed.joinDate).getDate();
  const dueDate = new Date(new Date().getFullYear(), new Date().getMonth(), joinDay).toDateString();
  const handleMarkPaid = async () => { await axios.post(`${API}/pay-rent`, { bedId: bed.id, monthString: getCurrentMonth() }); window.open(`https://wa.me/91${bed.clientMobile}?text=Rent%20Received!`, '_blank'); close(); };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm text-center overflow-hidden">
        <div className="bg-green-500 p-6 text-white"><h2 className="text-2xl font-bold">{bed.clientName}</h2><p>Room {data.room.number}</p></div>
        <div className="p-6 space-y-4">
            <div><p className="text-xs font-bold text-slate-400 uppercase">Due Date</p><p className="text-lg font-bold">{dueDate}</p></div>
            <a href={`https://wa.me/91${bed.clientMobile}?text=Rent%20Due!`} target="_blank" className="flex items-center justify-center gap-2 w-full border py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50"><MessageCircle size={18}/> Reminder</a>
            <button onClick={handleMarkPaid} className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-green-700"><Banknote size={18}/> Mark Paid</button>
            <button onClick={close} className="text-sm text-slate-400 hover:text-slate-600">Close</button>
        </div>
      </div>
    </div>
  );
}

function groupBy(xs, key) { return xs.reduce((rv, x) => { (rv[x[key]] = rv[x[key]] || []).push(x); return rv; }, {}); }