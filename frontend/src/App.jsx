import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Search, MessageCircle, Banknote, UserMinus, MousePointer2, Calendar, ShieldCheck, Lock, RefreshCw, Loader2, Send, Trash2, Camera, Plus, Minus, Home, LayoutGrid, List, Edit2, ArrowRight, LayoutDashboard, Mail } from 'lucide-react';
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

// --- LANDING PAGE ---
function LandingPage({ onEnter }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="relative z-10 text-center max-w-lg">
                <div className="mb-8 flex justify-center"><div className="bg-white/20 p-6 rounded-3xl backdrop-blur-md shadow-2xl border border-white/30"><Home size={64} className="text-white drop-shadow-md"/></div></div>
                <h1 className="text-5xl font-extrabold mb-4 tracking-tight drop-shadow-lg">Hostel Manager</h1>
                <p className="text-lg text-white/90 mb-10 font-light">Simple, Professional, Secure.</p>
                <button onClick={onEnter} className="group w-full bg-white text-indigo-600 py-4 rounded-2xl font-bold text-xl shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3">Get Started <ArrowRight/></button>
            </div>
        </div>
    );
}

// --- LOGIN PAGE (With Email & Forgot Password) ---
function LoginPage({ onLogin, onBack }) {
  const [creds, setCreds] = useState({ username: '', password: '', email: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [forgotPass, setForgotPass] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    setLoading(true);
    try {
      // Login or Register
      const res = await axios.post(`${API}/login`, creds);
      onLogin(res.data);
    } catch (err) {
      setMsg({ text: err.response?.data?.error || "Login failed.", type: 'error' });
    } finally { setLoading(false); }
  };

  const handleForgot = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
          await axios.post(`${API}/forgot-password`, { email: creds.email });
          setMsg({ text: "Password sent to your email!", type: 'success' });
      } catch(e) { 
          // 👇 FIXED: Now shows the REAL error from the backend
          setMsg({ text: e.response?.data?.error || "Error sending email.", type: 'error' }); 
      }
      setLoading(false);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-100 p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-100">
        <button onClick={onBack} className="text-slate-400 mb-4 hover:text-slate-600 font-bold text-sm">← Back</button>
        
        {forgotPass ? (
            <form onSubmit={handleForgot} className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800">Reset Password</h2>
                <p className="text-sm text-slate-500">Enter your email to receive a new password.</p>
                {msg.text && <div className={`p-3 rounded text-sm ${msg.type==='success'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{msg.text}</div>}
                <input type="email" required className="w-full p-4 bg-slate-50 border rounded-2xl" placeholder="Email Address" onChange={e => setCreds({...creds, email: e.target.value})} />
                <button disabled={loading} className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-bold">{loading?<Loader2 className="animate-spin"/>:"Send Password"}</button>
                <button type="button" onClick={() => setForgotPass(false)} className="w-full text-slate-500 text-sm mt-2">Back to Login</button>
            </form>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-3xl font-bold text-slate-800">Sign In</h2>
                {msg.text && <div className={`p-3 rounded text-sm ${msg.type==='success'?'bg-green-100':'bg-red-100 text-red-600'}`}>{msg.text}</div>}
                
                <input className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" placeholder="Username" onChange={e => setCreds({...creds, username: e.target.value})} />
                <input className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" type="password" placeholder="Password" onChange={e => setCreds({...creds, password: e.target.value})} />
                
                {/* Email field only shows if they type in it, essentially implies registration if filled, or standard login if not. 
                    Actually, cleaner to just show it always or have a toggle. Keeping it simple: */}
                <input type="email" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" placeholder="Email (Optional for Login)" onChange={e => setCreds({...creds, email: e.target.value})} />
                
                <button disabled={loading} className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg">{loading ? <Loader2 className="animate-spin"/> : "Login / Register"}</button>
                <div className="text-center">
                    <button type="button" onClick={() => setForgotPass(true)} className="text-xs text-indigo-500 font-bold">Forgot Password?</button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
}

// --- ADMIN (Same) ---
function AdminPanel({ user, onLogout }) {
    const [owners, setOwners] = useState([]);
    useEffect(() => { axios.get(`${API}/admin/users`).then(res => setOwners(res.data)); }, []);
    return (<div className="p-10"><h1 className="text-2xl font-bold mb-4">Super Admin</h1><button onClick={onLogout} className="bg-red-500 text-white px-4 py-2 rounded mb-4">Logout</button>{owners.map(o=><div key={o.id} className="border p-2 mb-2 flex justify-between"><span>{o.username} ({o.hostel_name})</span><span>{o.is_approved?'Active':'Blocked'}</span></div>)}</div>);
}

// --- SETUP (Fixed Multi-Select) ---
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

  // 👇 FIXED: Toggle Logic for Multi-Select 👇
  const handleMouseDown = (i, e) => { 
      e.preventDefault(); setIsDragging(true); 
      const newSet = new Set(selectedIndices);
      if(newSet.has(i)) newSet.delete(i); else newSet.add(i);
      setSelectedIndices(newSet); 
  };
  const handleMouseEnter = (i) => { if (isDragging) { const s = new Set(selectedIndices); s.add(i); setSelectedIndices(s); } };

  const applyCap = (cap) => { const u = generatedRooms.map((r, i) => selectedIndices.has(i) ? { ...r, capacity: cap } : r); setGeneratedRooms(u); setSelectedIndices(new Set()); };
  const submitSetup = async () => { setLoading(true); await axios.post(`${API}/setup`, { userId: user.id, hostelName: config.hostelName, totalFloors: config.maxFloor + 1, rooms: generatedRooms }); onUpdate({ ...user, setup_complete: 1, hostel_name: config.hostelName }); };
  const getColor = (c) => { if(c===1) return 'bg-slate-100'; if(c===2) return 'bg-blue-50 text-blue-700'; if(c===3) return 'bg-purple-50 text-purple-700'; return 'bg-orange-50 text-orange-700'; };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6 items-center justify-center font-sans">
        {step === 1 ? (
          <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Setup Hostel</h2>
            <input className="w-full border-b-2 p-2 outline-none font-bold" placeholder="Hostel Name" onChange={e => setConfig({...config, hostelName: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
                <select className="w-full border-b-2 p-2 font-bold bg-white" onChange={e => setConfig({...config, maxFloor: parseInt(e.target.value)})}>{[0,1,2,3,4,5,6,7,8].map(n => <option value={n}>{n===0?'Ground':`G + ${n}`}</option>)}</select>
                <select className="w-full border-b-2 p-2 font-bold bg-white" onChange={e => setConfig({...config, defaultCapacity: parseInt(e.target.value)})}>{[1,2,3,4,5].map(n => <option value={n}>{n} Sharing</option>)}</select>
            </div>
            <div className="flex gap-4"><input className="w-full border-b-2 p-2 text-center font-bold" placeholder="Start (01)" onChange={e => setRange({...range, start: e.target.value})} /><input className="w-full border-b-2 p-2 text-center font-bold" placeholder="End (10)" onChange={e => setRange({...range, end: e.target.value})} /></div>
            <button onClick={handleGenerate} className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg">Next Step</button>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">Tap Rooms to Select</h2>
            <div className="flex-1 overflow-y-auto grid grid-cols-5 gap-2 p-2 border rounded-xl mb-4 bg-slate-50 select-none" onMouseUp={() => setIsDragging(false)}>
                {generatedRooms.map((r, i) => (
                    <div key={i} onMouseDown={(e)=>handleMouseDown(i, e)} onMouseEnter={()=>handleMouseEnter(i)} className={`p-2 border rounded-lg text-center cursor-pointer ${selectedIndices.has(i)?'bg-indigo-600 text-white scale-95':getColor(r.capacity)}`}><div className="font-bold">{r.roomNo}</div><div className="text-xs">{r.capacity} Beds</div></div>
                ))}
            </div>
            <div className="flex gap-2 justify-center pb-2">{[1,2,3,4,5].map(n => <button key={n} onClick={()=>{const u=generatedRooms.map((r,i)=>selectedIndices.has(i)?{...r,capacity:n}:r);setGeneratedRooms(u);setSelectedIndices(new Set())}} className="flex-1 bg-slate-100 py-3 rounded-lg font-bold border">{n}</button>)}</div>
            <button onClick={submitSetup} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg">{loading?<Loader2 className="animate-spin mx-auto"/>:"Finish Setup"}</button>
          </div>
        )}
    </div>
  );
}

// --- DASHBOARD (Same + Rent/Maint features) ---
function Dashboard({ user, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('overview'); 
  const [modalData, setModalData] = useState(null); 
  const [rentFilter, setRentFilter] = useState('all');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { fetchDashboard(); }, []);
  const fetchDashboard = () => { axios.get(`${API}/dashboard/${user.id}`).then(res => setRooms(res.data)); };
  
  const handleReset = async () => { if(confirm("⚠ WIPE DATA?")) { await axios.post(`${API}/reset-hostel`, { userId: user.id }); localStorage.setItem('hostelUser', JSON.stringify({ ...user, setup_complete: 0 })); window.location.reload(); } };
  const handleAddBed = async (roomId) => { await axios.post(`${API}/rooms/add-bed`, { roomId }); fetchDashboard(); };
  const handleRemoveBed = async (roomId) => { try { await axios.post(`${API}/rooms/remove-bed`, { roomId }); fetchDashboard(); } catch(e) { alert("Cannot remove occupied bed"); } };

  const allBeds = rooms.flatMap(room => room.beds.map(bed => ({ ...bed, roomNo: room.number, roomId: room.id })));
  const occupiedBeds = allBeds.filter(b => b.isOccupied);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b px-4 py-3 shadow-sm flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Home size={20} className="text-indigo-600"/> {user.hostel_name}</h1>
          <div className="flex gap-2">
            <div className="bg-slate-100 p-1 rounded-lg flex border"><button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode==='grid'?'bg-white shadow text-blue-600':'text-slate-400'}`}><LayoutGrid size={18}/></button><button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode==='list'?'bg-white shadow text-blue-600':'text-slate-400'}`}><List size={18}/></button></div>
            <button onClick={() => setShowImport(true)} className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg"><Camera size={16}/></button>
            <button onClick={handleReset} className="bg-orange-50 text-orange-600 px-3 py-2 rounded-lg"><RefreshCw size={16}/></button>
            <button onClick={onLogout} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg"><LogOut size={16}/></button>
          </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 py-6">
          <div className="flex justify-center mb-6">
              <div className="bg-white p-1 rounded-xl shadow-sm border inline-flex">
                  <button onClick={() => setActiveTab('overview')} className={`px-6 py-2 rounded-lg text-sm font-bold ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>Overview</button>
                  <button onClick={() => setActiveTab('rent')} className={`px-6 py-2 rounded-lg text-sm font-bold ${activeTab === 'rent' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}`}>Rent Collection</button>
              </div>
          </div>

          {viewMode === 'grid' && (
            <div className="space-y-8">
                {Object.entries(groupBy(rooms, 'floor')).map(([floor, floorRooms]) => (
                    <div key={floor}>
                        <h2 className="text-xs font-bold text-slate-400 uppercase mb-4 border-b pb-2">{floor === '0' ? "Ground Floor" : `Floor ${floor}`}</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {floorRooms.map(room => (
                                <div key={room.id} className="bg-white rounded-xl shadow-sm border p-4 relative group hover:shadow-md transition">
                                    <div className="text-center font-bold text-slate-700 text-lg mb-3">{room.number}</div>
                                    <div className="flex justify-center flex-wrap gap-2 mb-2">
                                        {room.beds.map((bed, i) => {
                                            if(activeTab === 'rent' && !bed.isOccupied) return null;
                                            const isPaid = bed.lastRentPaid === getCurrentMonth();
                                            let bgClass = 'bg-slate-100 text-slate-400 border-slate-200';
                                            if(activeTab === 'rent') bgClass = isPaid ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200 animate-pulse';
                                            else if(bed.isOccupied) bgClass = bed.leaveDate ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200';
                                            return <div key={i} onClick={() => setModalData({ type: activeTab==='rent'?'rent':'booking', room, bed })} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer border ${bgClass}`}>{i + 1}</div>;
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
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs"><tr><th className="p-4">Room</th><th className="p-4">Name</th><th className="p-4">Rent</th><th className="p-4">Action</th></tr></thead>
                      <tbody>{occupiedBeds.map((bed, i) => (<tr key={i} className="hover:bg-slate-50"><td className="p-4 font-bold text-indigo-600">{bed.roomNo}</td><td className="p-4">{bed.clientName}</td><td className="p-4">₹{bed.rentAmount}</td><td className="p-4"><button onClick={() => setModalData({ type: 'booking', room: { number: bed.roomNo }, bed })} className="bg-slate-100 px-3 py-1 rounded border">Manage</button></td></tr>))}</tbody>
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

// --- BOOKING MODAL (Updated with Rent Amount & Pro WhatsApp) ---
function BookingModal({ data, close, hostelName }) {
  const { bed, room } = data;
  const isEditMode = bed.isOccupied; 
  const defaultMaint = localStorage.getItem('defaultMaintenance') || '';
  const [formData, setFormData] = useState({ clientName: bed.clientName || '', clientMobile: bed.clientMobile || '', joinDate: bed.joinDate || '', leaveDate: bed.leaveDate || '', advance: bed.advance || '', maintenance: bed.maintenance || defaultMaint, rentAmount: bed.rentAmount || '' });
  const [editing, setEditing] = useState(!isEditMode); const [loading, setLoading] = useState(false);
  const refundableCalc = (parseFloat(formData.advance) || 0) - (parseFloat(formData.maintenance) || 0);

  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); if(formData.maintenance) localStorage.setItem('defaultMaintenance', formData.maintenance); try { const payload = { ...formData, bedId: bed.id }; if(isEditMode) await axios.post(`${API}/update-tenant`, payload); else await axios.post(`${API}/book`, payload); close(); } catch(e){ alert("Error"); setLoading(false); } };
  const handleVacate = async () => { if(confirm("Vacate?")) { await axios.post(`${API}/vacate`, { bedId: bed.id }); close(); } };

  // PRO WHATSAPP TEXT
  const waWelcome = `*Welcome to ${hostelName}* 🏠\n\nDear ${formData.clientName},\nWe are happy to have you!\n\n🛏 Room: ${room.number} (Bed ${bed.index+1})\n💰 Monthly Rent: ₹${formData.rentAmount}\n📅 Rent Due Date: ${new Date(formData.joinDate).getDate()}th of every month\n\nEnjoy your stay!`;

  return (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"><div className="bg-indigo-600 p-4 text-white flex justify-between items-center"><h2 className="font-bold text-lg">{isEditMode?'Manage Tenant':'New Booking'}</h2><button onClick={close}>✕</button></div>
    <form onSubmit={handleSubmit} className="p-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-bold text-slate-400">NAME</label><input required className="w-full border-b p-2 font-bold" placeholder="Name" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} disabled={isEditMode && !editing} /></div>
            <div><label className="text-xs font-bold text-slate-400">MOBILE</label><input className="w-full border-b p-2" placeholder="Mobile" value={formData.clientMobile} onChange={e => setFormData({...formData, clientMobile: e.target.value})} disabled={isEditMode && !editing} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border">
            <div><label className="text-xs font-bold text-slate-500">Rent (Monthly)</label><input type="number" className="w-full p-1 bg-white border rounded" placeholder="₹ Rent" value={formData.rentAmount} onChange={e => setFormData({...formData, rentAmount: e.target.value})} disabled={!editing} /></div>
            <div><label className="text-xs font-bold text-slate-500">Joining Date</label><input type="date" className="w-full p-1 bg-white border rounded" value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})} disabled={!editing} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border">
            <div><label className="text-xs font-bold text-slate-500">Advance</label><input type="number" className="w-full p-1 bg-white border rounded" value={formData.advance} onChange={e => setFormData({...formData, advance: e.target.value})} disabled={!editing} /></div>
            <div><label className="text-xs font-bold text-slate-500">Maintenance</label><input type="number" className="w-full p-1 bg-white border rounded" value={formData.maintenance} onChange={e => setFormData({...formData, maintenance: e.target.value})} disabled={!editing} /></div>
        </div>
        <div className="flex justify-between items-center pt-2"><span className="text-xs font-bold text-slate-400">REFUNDABLE:</span><span className="font-bold text-green-600 text-lg">₹{refundableCalc}</span></div>
        
        {(editing || !isEditMode) ? (
            <button disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg">{loading?<Loader2 className="animate-spin mx-auto"/>:"Save & Confirm"}</button>
        ) : (
            <div className="grid grid-cols-2 gap-2 mt-4">
                <a href={`https://wa.me/91${formData.clientMobile}?text=${encodeURIComponent(waWelcome)}`} target="_blank" className="bg-green-100 text-green-700 py-2 rounded-lg font-bold text-sm text-center flex items-center justify-center gap-2 border border-green-200"><Send size={14}/> Welcome Msg</a>
                <button type="button" onClick={() => setEditing(true)} className="bg-slate-100 text-slate-700 py-2 rounded-lg font-bold text-sm border border-slate-200"><Edit2 size={14} className="inline"/> Edit Details</button>
                <button type="button" onClick={handleVacate} className="col-span-2 bg-red-50 text-red-600 py-2 rounded-lg font-bold text-sm border border-red-100">Vacate Tenant</button>
            </div>
        )}
    </form></div></div>);
}

function RentModal({ data, close }) {
  const { bed } = data; const joinDay = new Date(bed.joinDate).getDate(); const dueDate = new Date(new Date().getFullYear(), new Date().getMonth(), joinDay).toDateString();
  const handleMarkPaid = async () => { await axios.post(`${API}/pay-rent`, { bedId: bed.id, monthString: getCurrentMonth() }); window.open(`https://wa.me/91${bed.clientMobile}?text=${encodeURIComponent(`*Payment Received* ✅\n\nDear ${bed.clientName},\nWe received your rent of ₹${bed.rentAmount} for this month.\n\nThank you!`)}`, '_blank'); close(); };
  
  const waReminder = `*Rent Reminder* 🔔\n\nHello ${bed.clientName},\n\nThis is a gentle reminder that your rent of ₹${bed.rentAmount} for Room ${data.room.number} is due. Please pay at your earliest convenience to avoid late fees.\n\nThank you!`;

  return (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div className="bg-white rounded-3xl shadow-xl w-full max-w-sm text-center overflow-hidden"><div className="bg-emerald-500 p-6 text-white"><h2 className="text-2xl font-bold mb-1">{bed.clientName}</h2><p className="opacity-90 text-sm">Room {data.room.number} • Rent ₹{bed.rentAmount}</p></div><div className="p-6 space-y-4"><div><p className="text-xs font-bold text-slate-400 uppercase">Rent Due Date</p><p className="text-lg font-bold text-slate-700">{dueDate}</p></div><a href={`https://wa.me/91${bed.clientMobile}?text=${encodeURIComponent(waReminder)}`} target="_blank" className="flex items-center justify-center gap-2 w-full border py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"><MessageCircle size={18}/> Send Reminder</a><button onClick={handleMarkPaid} className="flex items-center justify-center gap-2 w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700"><Banknote size={18}/> Mark Paid</button><button onClick={close} className="text-sm text-slate-400 hover:text-slate-600">Close</button></div></div></div>);
}

// --- IMPORT MODAL (Kept same) ---
function ImportModal({ user, close }) {
    const [scanStatus, setScanStatus] = useState(""); const [scannedText, setScannedText] = useState(""); const [parsedData, setParsedData] = useState([]); const [loading, setLoading] = useState(false);
    const handleImageUpload = (e) => { const file = e.target.files[0]; if(!file) return; setScanStatus("scanning"); Tesseract.recognize(file, 'eng').then(({ data: { text } }) => { setScannedText(text); setScanStatus("done"); parseText(text); }); };
    const parseText = (text) => { const lines = text.split('\n'); const detected = []; const dateRegex = /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/; lines.forEach(line => { const cleanLine = line.trim(); if(cleanLine.length < 5) return; const roomMatch = cleanLine.match(/\b\d{3}\b/); const mobileMatch = cleanLine.match(/\b\d{10}\b/); const dateMatch = cleanLine.match(dateRegex); if(roomMatch) { let name = cleanLine.replace(roomMatch[0], "").replace(mobileMatch ? mobileMatch[0] : "", "").replace(dateMatch ? dateMatch[0] : "", "").trim(); name = name.replace(/[^a-zA-Z ]/g, ""); let isoDate = null; if(dateMatch) { try { const parts = dateMatch[0].split(/[./-]/); if(parts.length === 3) isoDate = `${parts[2].length===2?'20'+parts[2]:parts[2]}-${parts[1]}-${parts[0]}`; } catch(e){} } if(name) detected.push({ roomNo: roomMatch[0], name: name, mobile: mobileMatch ? mobileMatch[0] : "", joinDate: isoDate }); } }); setParsedData(detected); };
    const handleImport = async () => { setLoading(true); try { const res = await axios.post(`${API}/import-data`, { userId: user.id, tenants: parsedData }); alert(res.data.message); if(res.data.errors.length > 0) alert("Errors:\n" + res.data.errors.join("\n")); window.location.reload(); } catch(e) { alert("Import failed."); setLoading(false); } };
    return (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"><div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Camera className="text-indigo-600"/> Smart Import</h2><button onClick={close} className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300">✕</button></div><div className="p-6 overflow-y-auto"><div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-6 text-center border-dashed border-2"><Camera size={40} className="mx-auto text-blue-300 mb-3"/><p className="text-sm text-blue-800 font-bold mb-1">Upload Register Photo</p><input type="file" accept="image/*" onChange={handleImageUpload} className="mx-auto block text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-indigo-600 file:text-white"/></div>{scanStatus === "scanning" && <div className="text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={40}/><p>AI Scanning...</p></div>}{scanStatus === "done" && (<div className="grid md:grid-cols-2 gap-4"><div><label className="font-bold text-xs uppercase text-slate-400">Raw</label><textarea className="w-full h-40 border p-2 text-xs bg-slate-50 rounded" value={scannedText} onChange={(e) => { setScannedText(e.target.value); parseText(e.target.value); }} /></div><div><label className="font-bold text-xs uppercase text-slate-400">Detected ({parsedData.length})</label><div className="h-40 overflow-y-auto border bg-white rounded p-2"><table className="w-full text-xs text-left"><thead><tr><th>Room</th><th>Name</th></tr></thead><tbody>{parsedData.map((d, i)=><tr key={i} className="border-b"><td>{d.roomNo}</td><td>{d.name}</td></tr>)}</tbody></table></div></div></div>)}{parsedData.length > 0 && <button disabled={loading} onClick={handleImport} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold mt-4 shadow-lg">{loading?<Loader2 className="animate-spin mx-auto"/>:`Import ${parsedData.length} Tenants`}</button>}</div></div></div>);
}

function groupBy(xs, key) { return xs.reduce((rv, x) => { (rv[x[key]] = rv[x[key]] || []).push(x); return rv; }, {}); }