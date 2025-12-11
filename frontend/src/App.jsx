import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BedDouble, LogOut, Search, MessageCircle, Banknote, UserMinus, MousePointer2, Users, Calendar, ShieldCheck, Lock, RefreshCw, Loader2, Send, Trash2, Camera, Plus, Minus, Home, LayoutGrid, List, Edit2, ArrowRight, CheckCircle, LayoutDashboard, Settings } from 'lucide-react';
import Tesseract from 'tesseract.js';

// --- CONFIGURATION ---
const API = "https://hostel-backend-0dev.onrender.com/api"; 

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('hostelUser')) || null);
  const [showLanding, setShowLanding] = useState(!user);

  const handleLogin = (userData) => {
    localStorage.setItem('hostelUser', JSON.stringify(userData));
    setUser(userData);
    setShowLanding(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('hostelUser');
    setUser(null);
    setShowLanding(true);
  };

  if (showLanding && !user) return <LandingPage onEnter={() => setShowLanding(false)} />;
  if (!user) return <LoginPage onLogin={handleLogin} onBack={() => setShowLanding(true)} />;
  
  if (user.username === 'admin') return <AdminPanel user={user} onLogout={handleLogout} />;
  if (user && !user.setup_complete) return <SetupPage user={user} onUpdate={handleLogin} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}

// --- NEW LANDING PAGE ---
function LandingPage({ onEnter }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Decoration */}
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-blue-400 opacity-20 rounded-full blur-3xl"></div>

            <div className="relative z-10 text-center max-w-lg">
                <div className="mb-8 flex justify-center">
                    <div className="bg-white/20 p-6 rounded-3xl backdrop-blur-md shadow-2xl border border-white/30">
                        <Home size={64} className="text-white drop-shadow-md"/>
                    </div>
                </div>
                
                <h1 className="text-5xl font-extrabold mb-4 tracking-tight drop-shadow-lg">Hostel Manager</h1>
                <p className="text-lg text-white/90 mb-10 leading-relaxed font-light">
                    The smartest way to manage your rooms, track rent payments, and organize tenants. Simple, fast, and secure.
                </p>

                <div className="grid grid-cols-1 gap-4 mb-10 w-full">
                    <div className="bg-white/10 p-4 rounded-xl flex items-center gap-4 backdrop-blur-sm border border-white/10">
                        <LayoutDashboard className="text-yellow-300" size={24}/>
                        <span className="font-medium">Visual Room Dashboard</span>
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl flex items-center gap-4 backdrop-blur-sm border border-white/10">
                        <Banknote className="text-green-300" size={24}/>
                        <span className="font-medium">Automatic Rent Tracking</span>
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl flex items-center gap-4 backdrop-blur-sm border border-white/10">
                        <MessageCircle className="text-blue-300" size={24}/>
                        <span className="font-medium">WhatsApp Integration</span>
                    </div>
                </div>

                <button onClick={onEnter} className="group w-full bg-white text-indigo-600 py-4 rounded-2xl font-bold text-xl shadow-xl hover:bg-indigo-50 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3">
                    Get Started <ArrowRight className="group-hover:translate-x-1 transition-transform"/>
                </button>
                
                <p className="mt-6 text-xs text-white/50">Version 1.0 • Secure & Cloud Based</p>
            </div>
        </div>
    );
}

// --- LOGIN PAGE (Updated UI) ---
function LoginPage({ onLogin, onBack }) {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    setLoading(true);
    try {
      const res = await axios.post(`${API}/login`, creds);
      onLogin(res.data); // Auto logs in even if new register
    } catch (err) {
      setMsg({ text: err.response?.data?.error || "Login failed.", type: 'error' });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-100">
        <button onClick={onBack} className="text-slate-400 mb-4 hover:text-slate-600 font-bold text-sm">← Back</button>
        <h2 className="text-3xl font-bold mb-2 text-slate-800">Sign In</h2>
        <p className="text-slate-500 mb-8 text-sm">Enter your username to continue or create a new account automatically.</p>
        
        {msg.text && <div className={`p-3 rounded-xl mb-6 text-sm font-bold text-center ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>{msg.text}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Username</label>
                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700" placeholder="e.g. hostel_admin" onChange={e => setCreds({...creds, username: e.target.value})} />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Password</label>
                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700" type="password" placeholder="••••••••" onChange={e => setCreds({...creds, password: e.target.value})} />
            </div>
            <button disabled={loading} className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex justify-center gap-2 mt-2">
                {loading ? <Loader2 className="animate-spin"/> : "Continue →"}
            </button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-6">New user? Just enter a username and password to auto-register.</p>
      </div>
    </div>
  );
}

// --- ADMIN (Same as before) ---
function AdminPanel({ user, onLogout }) {
    const [owners, setOwners] = useState([]);
    const [newPass, setNewPass] = useState("");
    useEffect(() => { loadOwners(); }, []);
    const loadOwners = () => { axios.get(`${API}/admin/users`).then(res => setOwners(res.data)); }
    const toggleStatus = async (userId, currentStatus) => { await axios.post(`${API}/admin/approve`, { userId, status: currentStatus === 1 ? 0 : 1 }); loadOwners(); };
    const handleDeleteOwner = async (userId) => { if(confirm(`Delete Owner?`)) { await axios.post(`${API}/admin/delete-owner`, { userId }); loadOwners(); } };
    const handleChangePassword = async () => { if(confirm("Change Admin password?")) { await axios.post(`${API}/admin/change-password`, { newPassword: newPass }); onLogout(); } };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <nav className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-20 flex justify-between items-center"><h1 className="font-bold flex gap-2 items-center"><ShieldCheck/> Admin Console</h1> <button onClick={onLogout} className="bg-red-600 px-4 py-1 rounded text-sm font-bold">Logout</button></nav>
            <div className="p-8 max-w-4xl mx-auto space-y-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm flex gap-4 items-end border border-slate-100">
                    <div className="flex-1"><label className="text-xs font-bold text-slate-400">ADMIN PASSWORD</label><input className="w-full border p-2 rounded bg-slate-50" value={newPass} onChange={e => setNewPass(e.target.value)} /></div>
                    <button onClick={handleChangePassword} className="bg-slate-900 text-white px-6 py-2 rounded font-bold">Update</button>
                </div>
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
                    <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 uppercase"><tr><th className="p-4">User</th><th className="p-4">Hostel</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead>
                        <tbody>{owners.map(o => (<tr key={o.id} className="border-b hover:bg-slate-50"><td className="p-4 font-bold">{o.username}</td><td className="p-4">{o.hostel_name}</td><td className="p-4">{o.is_approved===1?'Active':'Blocked'}</td><td className="p-4 flex gap-2"><button onClick={()=>toggleStatus(o.id, o.is_approved)} className={`px-3 py-1 rounded text-white font-bold text-xs ${o.is_approved?'bg-orange-500':'bg-green-600'}`}>{o.is_approved?'Block':'Approve'}</button><button onClick={()=>handleDeleteOwner(o.id)} className="bg-red-100 text-red-600 p-2 rounded"><Trash2 size={16}/></button></td></tr>))}</tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- SETUP (Same as before) ---
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
      for (let r = start; r <= end; r++) { rooms.push({ floor: f, roomNo: `${f===0?'G':f}${r.toString().padStart(2, '0')}`, capacity: config.defaultCapacity }); }
    }
    setGeneratedRooms(rooms); setStep(2);
  };

  const handleMouseDown = (i, e) => { e.preventDefault(); setIsDragging(true); setSelectedIndices(new Set([i])); };
  const handleMouseEnter = (i) => { if (isDragging) { const s = new Set(selectedIndices); s.add(i); setSelectedIndices(s); } };
  const applyCap = (cap) => { const u = generatedRooms.map((r, i) => selectedIndices.has(i) ? { ...r, capacity: cap } : r); setGeneratedRooms(u); setSelectedIndices(new Set()); };
  const submitSetup = async () => { setLoading(true); await axios.post(`${API}/setup`, { userId: user.id, hostelName: config.hostelName, totalFloors: config.maxFloor + 1, rooms: generatedRooms }); onUpdate({ ...user, setup_complete: 1, hostel_name: config.hostelName }); };
  const getColor = (c) => { if(c===1) return 'bg-slate-100'; if(c===2) return 'bg-blue-50 text-blue-700'; if(c===3) return 'bg-purple-50 text-purple-700'; return 'bg-orange-50 text-orange-700'; };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6 items-center justify-center font-sans">
        {step === 1 ? (
          <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md space-y-6 border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800">Setup Hostel</h2>
            <div><label className="text-xs font-bold text-slate-400">HOSTEL NAME</label><input className="w-full border-b-2 p-2 outline-none font-bold text-lg focus:border-blue-500" onChange={e => setConfig({...config, hostelName: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-400">FLOORS</label><select className="w-full border-b-2 p-2 outline-none bg-white font-bold" onChange={e => setConfig({...config, maxFloor: parseInt(e.target.value)})}>{[0,1,2,3,4,5,6,7,8].map(n => <option value={n}>{n===0?'Ground':`G + ${n}`}</option>)}</select></div>
                <div><label className="text-xs font-bold text-slate-400">DEFAULT BEDS</label><select className="w-full border-b-2 p-2 outline-none bg-white font-bold" onChange={e => setConfig({...config, defaultCapacity: parseInt(e.target.value)})}>{[1,2,3,4,5].map(n => <option value={n}>{n}</option>)}</select></div>
            </div>
            <div><label className="text-xs font-bold text-slate-400">ROOM RANGE (e.g. 01 - 10)</label><div className="flex gap-4"><input className="w-full border-b-2 p-2 text-center font-bold" placeholder="01" onChange={e => setRange({...range, start: e.target.value})} /><input className="w-full border-b-2 p-2 text-center font-bold" placeholder="10" onChange={e => setRange({...range, end: e.target.value})} /></div></div>
            <button onClick={handleGenerate} className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg hover:bg-indigo-700">Next Step</button>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Review Rooms</h2><button disabled={loading} onClick={submitSetup} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">{loading?<Loader2 className="animate-spin"/>:"Finish"}</button></div>
            <div className="flex-1 overflow-y-auto grid grid-cols-5 gap-2 p-2 border rounded-xl mb-4 bg-slate-50 select-none" onMouseUp={() => setIsDragging(false)}>{generatedRooms.map((r, i) => <div key={i} onMouseDown={(e)=>{e.preventDefault(); setIsDragging(true); setSelectedIndices(new Set([i]))}} onMouseEnter={()=>{if(isDragging){const s=new Set(selectedIndices);s.add(i);setSelectedIndices(s)}}} className={`p-2 border rounded-lg text-center cursor-pointer ${selectedIndices.has(i)?'bg-blue-600 text-white':getColor(r.capacity)}`}><div className="font-bold">{r.roomNo}</div><div className="text-xs">{r.capacity} Beds</div></div>)}</div>
            <div className="flex gap-2 justify-center">{[1,2,3,4,5].map(n => <button key={n} onClick={()=>{const u=generatedRooms.map((r,i)=>selectedIndices.has(i)?{...r,capacity:n}:r);setGeneratedRooms(u);setSelectedIndices(new Set())}} className="bg-slate-100 px-4 py-2 rounded-lg font-bold hover:bg-slate-200 border">{n}</button>)}</div>
          </div>
        )}
    </div>
  );
}

// --- DASHBOARD (Same as before + Import) ---
function Dashboard({ user, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('overview'); 
  const [modalData, setModalData] = useState(null); 
  const [rentFilter, setRentFilter] = useState('all');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { fetchDashboard(); }, []);
  const fetchDashboard = () => { axios.get(`${API}/dashboard/${user.id}`).then(res => setRooms(res.data)); };
  
  const handleReset = async () => { if(confirm("⚠ WARNING: This will WIPE all data.")) { await axios.post(`${API}/reset-hostel`, { userId: user.id }); localStorage.setItem('hostelUser', JSON.stringify({ ...user, setup_complete: 0 })); window.location.reload(); } };
  const handleAddBed = async (roomId) => { await axios.post(`${API}/rooms/add-bed`, { roomId }); fetchDashboard(); };
  const handleRemoveBed = async (roomId) => { try { await axios.post(`${API}/rooms/remove-bed`, { roomId }); fetchDashboard(); } catch(e) { alert("Cannot remove occupied bed"); } };

  const allBeds = rooms.flatMap(room => room.beds.map(bed => ({ ...bed, roomNo: room.number, roomId: room.id })));
  const occupiedBeds = allBeds.filter(b => b.isOccupied);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Home size={20} className="text-indigo-600"/> {user.hostel_name}</h1>
          <div className="flex gap-2">
            <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200"><button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode==='grid'?'bg-white shadow text-blue-600':'text-slate-400'}`}><LayoutGrid size={18}/></button><button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode==='list'?'bg-white shadow text-blue-600':'text-slate-400'}`}><List size={18}/></button></div>
            <button onClick={() => setShowImport(true)} className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg text-sm font-bold border border-emerald-200 flex gap-2 items-center"><Camera size={16}/></button>
            <button onClick={handleReset} className="bg-orange-50 text-orange-600 px-3 py-2 rounded-lg text-sm font-bold border border-orange-200"><RefreshCw size={16}/></button>
            <button onClick={onLogout} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-bold border border-red-200"><LogOut size={16}/></button>
          </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 py-6">
          <div className="flex justify-center mb-6">
              <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
                  <button onClick={() => setActiveTab('overview')} className={`px-6 py-2 rounded-lg text-sm font-bold ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Overview</button>
                  <button onClick={() => setActiveTab('rent')} className={`px-6 py-2 rounded-lg text-sm font-bold ${activeTab === 'rent' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Rent Collection</button>
              </div>
          </div>

          {activeTab === 'rent' && (<div className="flex justify-end mb-4"><select className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg p-2 font-medium outline-none" onChange={(e) => setRentFilter(e.target.value)}><option value="all">Show All</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select></div>)}

          {viewMode === 'grid' && (
            <div className="space-y-8">
                {Object.entries(groupBy(rooms, 'floor')).map(([floor, floorRooms]) => (
                    <div key={floor}>
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">{floor === '0' ? "Ground Floor" : `Floor ${floor}`}</h2>
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
                                            
                                            let bgClass = 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-emerald-100 hover:text-emerald-600 hover:border-emerald-300';
                                            if(activeTab === 'rent') bgClass = isPaid ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200 animate-pulse';
                                            else if(bed.isOccupied) bgClass = bed.leaveDate ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200';
                                            
                                            return <div key={i} onClick={() => setModalData({ type: activeTab==='rent'?'rent':'booking', room, bed })} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer border transition-all ${bgClass}`}>{i + 1}</div>;
                                        })}
                                    </div>
                                    {activeTab === 'overview' && (<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex flex-col gap-1"><button onClick={() => handleAddBed(room.id)} className="w-5 h-5 bg-blue-50 text-blue-600 rounded flex items-center justify-center"><Plus size={10}/></button><button onClick={() => handleRemoveBed(room.id)} className="w-5 h-5 bg-red-50 text-red-600 rounded flex items-center justify-center"><Minus size={10}/></button></div>)}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          )}

          {viewMode === 'list' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs"><tr><th className="p-4">Room</th><th className="p-4">Name</th><th className="p-4">Mobile</th><th className="p-4">Join Date</th><th className="p-4">Advance</th><th className="p-4">Maint.</th><th className="p-4">Refundable</th><th className="p-4 text-center">Action</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                          {occupiedBeds.map((bed, i) => {
                              const refund = (bed.advance || 0) - (bed.maintenance || 0);
                              return (
                                  <tr key={i} className="hover:bg-slate-50">
                                      <td className="p-4 font-bold text-indigo-600">{bed.roomNo} <span className="text-slate-400 text-xs">({bed.index+1})</span></td>
                                      <td className="p-4 font-bold">{bed.clientName}</td>
                                      <td className="p-4 text-slate-500">{bed.clientMobile}</td>
                                      <td className="p-4 text-slate-500">{bed.joinDate}</td>
                                      <td className="p-4">₹{bed.advance}</td>
                                      <td className="p-4">₹{bed.maintenance}</td>
                                      <td className="p-4 font-bold text-green-600">₹{refund}</td>
                                      <td className="p-4 text-center"><button onClick={() => setModalData({ type: 'booking', room: { number: bed.roomNo }, bed })} className="bg-slate-100 text-slate-600 px-3 py-1 rounded hover:bg-blue-50 hover:text-blue-600 font-bold border border-slate-200">Manage</button></td>
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

// --- IMPORT MODAL & BOOKING MODAL & RENT MODAL (Same as before, styling tweaked) ---
// (Copy-paste the previous Modal codes here - BookingModal, ImportModal, RentModal - No logic changes, just styling if you wish)
// To save space, I will assume you use the modals from the previous update but they will inherit the new Tailwind CSS automatically.
// Make sure to include them in the final file! 

function ImportModal({ user, close }) {
    const [scanStatus, setScanStatus] = useState(""); const [scannedText, setScannedText] = useState(""); const [parsedData, setParsedData] = useState([]); const [loading, setLoading] = useState(false);
    const handleImageUpload = (e) => { const file = e.target.files[0]; if(!file) return; setScanStatus("scanning"); Tesseract.recognize(file, 'eng').then(({ data: { text } }) => { setScannedText(text); setScanStatus("done"); parseText(text); }); };
    const parseText = (text) => { const lines = text.split('\n'); const detected = []; const dateRegex = /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/; lines.forEach(line => { const cleanLine = line.trim(); if(cleanLine.length < 5) return; const roomMatch = cleanLine.match(/\b\d{3}\b/); const mobileMatch = cleanLine.match(/\b\d{10}\b/); const dateMatch = cleanLine.match(dateRegex); if(roomMatch) { let name = cleanLine.replace(roomMatch[0], "").replace(mobileMatch ? mobileMatch[0] : "", "").replace(dateMatch ? dateMatch[0] : "", "").trim(); name = name.replace(/[^a-zA-Z ]/g, ""); let isoDate = null; if(dateMatch) { try { const parts = dateMatch[0].split(/[./-]/); if(parts.length === 3) isoDate = `${parts[2].length===2?'20'+parts[2]:parts[2]}-${parts[1]}-${parts[0]}`; } catch(e){} } if(name) detected.push({ roomNo: roomMatch[0], name: name, mobile: mobileMatch ? mobileMatch[0] : "", joinDate: isoDate }); } }); setParsedData(detected); };
    const handleImport = async () => { setLoading(true); try { const res = await axios.post(`${API}/import-data`, { userId: user.id, tenants: parsedData }); alert(res.data.message); if(res.data.errors.length > 0) alert("Errors:\n" + res.data.errors.join("\n")); window.location.reload(); } catch(e) { alert("Import failed."); setLoading(false); } };
    return (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"><div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Camera className="text-indigo-600"/> Smart Import</h2><button onClick={close} className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300">✕</button></div><div className="p-6 overflow-y-auto"><div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-6 text-center border-dashed border-2"><Camera size={40} className="mx-auto text-blue-300 mb-3"/><p className="text-sm text-blue-800 font-bold mb-1">Upload Register Photo</p><input type="file" accept="image/*" onChange={handleImageUpload} className="mx-auto block text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-indigo-600 file:text-white"/></div>{scanStatus === "scanning" && <div className="text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={40}/><p>AI Scanning...</p></div>}{scanStatus === "done" && (<div className="grid md:grid-cols-2 gap-4"><div><label className="font-bold text-xs uppercase text-slate-400">Raw</label><textarea className="w-full h-40 border p-2 text-xs bg-slate-50 rounded" value={scannedText} onChange={(e) => { setScannedText(e.target.value); parseText(e.target.value); }} /></div><div><label className="font-bold text-xs uppercase text-slate-400">Detected ({parsedData.length})</label><div className="h-40 overflow-y-auto border bg-white rounded p-2"><table className="w-full text-xs text-left"><thead><tr><th>Room</th><th>Name</th></tr></thead><tbody>{parsedData.map((d, i)=><tr key={i} className="border-b"><td>{d.roomNo}</td><td>{d.name}</td></tr>)}</tbody></table></div></div></div>)}{parsedData.length > 0 && <button disabled={loading} onClick={handleImport} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold mt-4 shadow-lg">{loading?<Loader2 className="animate-spin mx-auto"/>:`Import ${parsedData.length} Tenants`}</button>}</div></div></div>);
}

function BookingModal({ data, close, hostelName }) {
  const { bed, room } = data;
  const isEditMode = bed.isOccupied; 
  const defaultMaint = localStorage.getItem('defaultMaintenance') || '';
  const [formData, setFormData] = useState({ clientName: bed.clientName || '', clientMobile: bed.clientMobile || '', joinDate: bed.joinDate || '', leaveDate: bed.leaveDate || '', advance: bed.advance || '', maintenance: bed.maintenance || defaultMaint });
  const [editing, setEditing] = useState(!isEditMode); const [loading, setLoading] = useState(false);
  const refundableCalc = (parseFloat(formData.advance) || 0) - (parseFloat(formData.maintenance) || 0);
  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); if(formData.maintenance) localStorage.setItem('defaultMaintenance', formData.maintenance); try { if(isEditMode) { await axios.post(`${API}/update-tenant`, { bedId: bed.id, advance: formData.advance, maintenance: formData.maintenance, leaveDate: formData.leaveDate }); } else { await axios.post(`${API}/book`, { ...formData, bedId: bed.id }); } close(); } catch(e){ alert("Error"); setLoading(false); } };
  const handleVacate = async () => { if(confirm("Vacate?")) { await axios.post(`${API}/vacate`, { bedId: bed.id }); close(); } };
  return (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"><div className="bg-indigo-600 p-4 text-white flex justify-between items-center"><h2 className="font-bold text-lg">{isEditMode?'Manage':'New Booking'}</h2><button onClick={close}>✕</button></div><form onSubmit={handleSubmit} className="p-6 space-y-4"><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-400">NAME</label>{isEditMode?<div className="font-bold">{formData.clientName}</div>:<input required className="w-full border-b p-2 outline-none" placeholder="Name" onChange={e => setFormData({...formData, clientName: e.target.value})} />}</div><div><label className="text-xs font-bold text-slate-400">MOBILE</label>{isEditMode?<div className="font-bold">{formData.clientMobile}</div>:<input className="w-full border-b p-2 outline-none" placeholder="Mobile" onChange={e => setFormData({...formData, clientMobile: e.target.value})} />}</div></div><div className="bg-slate-50 p-4 rounded-xl space-y-3 border"><div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-indigo-600">PAYMENT</span>{isEditMode && !editing && <button type="button" onClick={() => setEditing(true)} className="text-xs flex gap-1 items-center text-indigo-600 underline"><Edit2 size={12}/> Edit</button>}</div><div className="grid grid-cols-2 gap-3"><div><label className="text-xs text-slate-500">Advance</label><input type="number" disabled={!editing} value={formData.advance} className={`w-full p-2 rounded border ${editing?'bg-white':'bg-transparent font-bold'}`} onChange={e => setFormData({...formData, advance: e.target.value})} /></div><div><label className="text-xs text-slate-500">Maint.</label><input type="number" disabled={!editing} value={formData.maintenance} className={`w-full p-2 rounded border ${editing?'bg-white':'bg-transparent font-bold'}`} onChange={e => setFormData({...formData, maintenance: e.target.value})} /></div></div><div className="pt-2 border-t flex justify-between"><span className="text-sm font-bold text-slate-500">Refundable:</span><span className="text-xl font-bold text-green-600">₹{refundableCalc}</span></div></div><div className="bg-orange-50 p-4 rounded-xl border border-orange-100"><label className="text-xs font-bold text-orange-600 block">LEAVING DATE</label><div className="flex gap-2"><input type="date" disabled={!editing && isEditMode} value={formData.leaveDate || ''} className="w-full p-2 rounded border border-orange-200 bg-white text-sm" onChange={e => setFormData({...formData, leaveDate: e.target.value})} />{isEditMode && editing && <button type="button" onClick={() => setFormData({...formData, leaveDate: ''})} className="text-xs text-red-500 underline">Clear</button>}</div></div>{(editing || !isEditMode) && (<button disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg flex justify-center gap-2">{loading?<Loader2 className="animate-spin"/>:(isEditMode?"Save Changes":"Confirm")}</button>)}</form>{isEditMode && (<div className="p-4 bg-slate-50 border-t flex gap-2"><a href={`https://wa.me/91${bed.clientMobile}?text=Hello ${bed.clientName},`} target="_blank" className="flex-1 bg-green-100 text-green-700 py-2 rounded-lg font-bold text-sm text-center flex items-center justify-center gap-2"><Send size={14}/> WhatsApp</a><button onClick={handleVacate} className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2"><UserMinus size={14}/> Vacate</button></div>)}</div></div>);
}

function RentModal({ data, close }) {
  const { bed } = data; const joinDay = new Date(bed.joinDate).getDate(); const dueDate = new Date(new Date().getFullYear(), new Date().getMonth(), joinDay).toDateString();
  const handleMarkPaid = async () => { await axios.post(`${API}/pay-rent`, { bedId: bed.id, monthString: getCurrentMonth() }); window.open(`https://wa.me/91${bed.clientMobile}?text=Rent%20Received!`, '_blank'); close(); };
  return (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div className="bg-white rounded-3xl shadow-xl w-full max-w-sm text-center overflow-hidden"><div className="bg-emerald-500 p-6 text-white"><h2 className="text-2xl font-bold mb-1">{bed.clientName}</h2><p className="opacity-90 text-sm">Room {data.room.number}</p></div><div className="p-6 space-y-4"><div><p className="text-xs font-bold text-slate-400 uppercase">Rent Due Date</p><p className="text-lg font-bold text-slate-700">{dueDate}</p></div><a href={`https://wa.me/91${bed.clientMobile}?text=Rent%20Due!`} target="_blank" className="flex items-center justify-center gap-2 w-full border py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"><MessageCircle size={18}/> Reminder</a><button onClick={handleMarkPaid} className="flex items-center justify-center gap-2 w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700"><Banknote size={18}/> Mark Paid</button><button onClick={close} className="text-sm text-slate-400 hover:text-slate-600">Close</button></div></div></div>);
}

function groupBy(xs, key) { return xs.reduce((rv, x) => { (rv[x[key]] = rv[x[key]] || []).push(x); return rv; }, {}); }