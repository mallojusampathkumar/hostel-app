import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Search, MessageCircle, Banknote, UserMinus, MousePointer2, Users, Calendar, ShieldCheck, Lock, RefreshCw, Loader2, Send, Trash2, Camera, Plus, Minus, Home, LayoutGrid, List, Edit2, ArrowRight, LayoutDashboard, UserCircle, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import Tesseract from 'tesseract.js';

const API = "https://hostel-backend-0dev.onrender.com/api"; 
const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('hostelUser')) || null);
  const [showLanding, setShowLanding] = useState(!user);

  const handleLogin = (userData) => { localStorage.setItem('hostelUser', JSON.stringify(userData)); setUser(userData); setShowLanding(false); };
  const handleLogout = () => { localStorage.removeItem('hostelUser'); setUser(null); setShowLanding(true); };

  if (showLanding && !user) return <LandingPage onEnter={() => setShowLanding(false)} />;
  if (!user) return <LoginPage onLogin={handleLogin} onBack={() => setShowLanding(true)} />;
  if (user.username === 'admin') return <AdminPanel user={user} onLogout={handleLogout} />;
  if (user && !user.setup_complete) return <SetupPage user={user} onUpdate={handleLogin} />;
  return <Dashboard user={user} onLogout={handleLogout} onUpdateUser={handleLogin}/>;
}

// --- LANDING & LOGIN (Same as before) ---
function LandingPage({ onEnter }) {
    return (<div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white flex flex-col items-center justify-center p-6 font-sans"><h1 className="text-5xl font-extrabold mb-4">Hostel Manager</h1><p className="text-lg mb-8">Manage rooms, track rent, finance & profits.</p><button onClick={onEnter} className="bg-white text-indigo-600 py-3 px-8 rounded-full font-bold shadow-lg">Get Started</button></div>);
}
function LoginPage({ onLogin, onBack }) {
  const [creds, setCreds] = useState({ username: '', password: '', email: '' });
  const [forgotPass, setForgotPass] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); try { const res = await axios.post(`${API}/login`, creds); onLogin(res.data); } catch (err) { setMsg({ text: err.response?.data?.error || "Login failed.", type: 'error' }); } finally { setLoading(false); } };
  const handleForgot = async (e) => { e.preventDefault(); setLoading(true); try { await axios.post(`${API}/forgot-password`, { email: creds.email }); setMsg({ text: "Password sent!", type: 'success' }); } catch(e) { setMsg({ text: e.response?.data?.error || "Error.", type: 'error' }); } setLoading(false); };
  return (<div className="flex items-center justify-center h-screen bg-slate-100 p-4 font-sans"><div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm"><button onClick={onBack} className="text-slate-400 mb-6 text-sm">← Back</button>{forgotPass ? (<form onSubmit={handleForgot}><h2 className="text-2xl font-bold mb-4">Reset Password</h2><input type="email" className="w-full p-3 border rounded mb-3" placeholder="Email" onChange={e => setCreds({...creds, email: e.target.value})} /><button className="w-full bg-indigo-600 text-white p-3 rounded font-bold">{loading?"Sending...":"Send"}</button><button type="button" onClick={()=>setForgotPass(false)} className="w-full mt-2 text-sm text-slate-500">Cancel</button></form>) : (<form onSubmit={handleSubmit}><h2 className="text-2xl font-bold mb-4">Sign In</h2>{msg.text && <p className={`mb-4 p-2 rounded text-center text-sm ${msg.type==='error'?'bg-red-100 text-red-600':'bg-green-100 text-green-600'}`}>{msg.text}</p>}<input className="w-full p-3 border rounded mb-3" placeholder="Username" onChange={e => setCreds({...creds, username: e.target.value})} /><input className="w-full p-3 border rounded mb-3" type="password" placeholder="Password" onChange={e => setCreds({...creds, password: e.target.value})} /><input className="w-full p-3 border rounded mb-3" placeholder="Email (Optional)" onChange={e => setCreds({...creds, email: e.target.value})} /><button className="w-full bg-indigo-600 text-white p-3 rounded font-bold">{loading?"Loading...":"Login / Register"}</button><button type="button" onClick={()=>setForgotPass(true)} className="w-full mt-4 text-sm text-indigo-500">Forgot Password?</button></form>)}</div></div>);
}

// --- SUPER ADMIN (Fixed Buttons) ---
function AdminPanel({ user, onLogout }) {
    const [owners, setOwners] = useState([]);
    useEffect(() => { axios.get(`${API}/admin/users`).then(res => setOwners(res.data)); }, []);
    const toggleStatus = async (userId, currentStatus) => { await axios.post(`${API}/admin/approve`, { userId, status: currentStatus === 1 ? 0 : 1 }); window.location.reload(); };
    const handleDelete = async (userId) => { if(confirm("Delete Owner & ALL Data?")) { await axios.post(`${API}/admin/delete-owner`, { userId }); window.location.reload(); } };
    return (<div className="min-h-screen bg-slate-50 p-8 font-sans"><div className="flex justify-between mb-8"><h1 className="text-2xl font-bold">Super Admin</h1><button onClick={onLogout} className="bg-red-600 text-white px-4 py-2 rounded">Logout</button></div><div className="bg-white rounded-xl shadow overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-100 border-b"><tr><th className="p-4">Owner</th><th className="p-4">Hostel</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead><tbody>{owners.map(o => (<tr key={o.id} className="border-b"><td className="p-4 font-bold">{o.username}</td><td className="p-4">{o.hostel_name}</td><td className="p-4">{o.is_approved===1?<span className="text-green-600 font-bold">Active</span>:<span className="text-red-500 font-bold">Blocked</span>}</td><td className="p-4 flex gap-2"><button onClick={()=>toggleStatus(o.id, o.is_approved)} className="bg-blue-100 text-blue-600 px-3 py-1 rounded font-bold text-sm">{o.is_approved?'Block':'Approve'}</button><button onClick={()=>handleDelete(o.id)} className="bg-red-100 text-red-600 px-3 py-1 rounded font-bold text-sm">Delete</button></td></tr>))}</tbody></table></div></div>);
}

// --- SETUP (Same) ---
function SetupPage({ user, onUpdate }) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({ hostelName: '', maxFloor: 3, defaultCapacity: 2 });
  const [range, setRange] = useState({ start: '101', end: '110' });
  const [generatedRooms, setGeneratedRooms] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const handleGenerate = () => { let rooms = []; const start = parseInt(range.start.slice(-2)); const end = parseInt(range.end.slice(-2)); for (let f = 0; f <= config.maxFloor; f++) { for (let r = start; r <= end; r++) { rooms.push({ floor: f, roomNo: `${f===0?'G':f}${r.toString().padStart(2, '0')}`, capacity: config.defaultCapacity }); } } setGeneratedRooms(rooms); setStep(2); };
  const handleToggle = (i) => { const s = new Set(selectedIndices); if(s.has(i)) s.delete(i); else s.add(i); setSelectedIndices(s); };
  const submitSetup = async () => { setLoading(true); await axios.post(`${API}/setup`, { userId: user.id, hostelName: config.hostelName, totalFloors: config.maxFloor + 1, rooms: generatedRooms }); onUpdate({ ...user, setup_complete: 1, hostel_name: config.hostelName }); };
  return (<div className="min-h-screen bg-slate-50 flex flex-col p-6 items-center justify-center font-sans">{step === 1 ? (<div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md space-y-6"><h2 className="text-2xl font-bold text-slate-800">Setup Hostel</h2><input className="w-full border-b-2 p-2" placeholder="Hostel Name" onChange={e => setConfig({...config, hostelName: e.target.value})} /><div className="grid grid-cols-2 gap-4"><select className="w-full border-b-2 p-2 bg-white" onChange={e => setConfig({...config, maxFloor: parseInt(e.target.value)})}>{[0,1,2,3,4,5,6,7,8].map(n => <option value={n}>{n===0?'Ground':`G + ${n}`}</option>)}</select><select className="w-full border-b-2 p-2 bg-white" onChange={e => setConfig({...config, defaultCapacity: parseInt(e.target.value)})}>{[1,2,3,4,5].map(n => <option value={n}>{n} Sharing</option>)}</select></div><div className="flex gap-4"><input className="w-full border-b-2 p-2 text-center" placeholder="01" onChange={e => setRange({...range, start: e.target.value})} /><input className="w-full border-b-2 p-2 text-center" placeholder="10" onChange={e => setRange({...range, end: e.target.value})} /></div><button onClick={handleGenerate} className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-bold">Next Step</button></div>) : (<div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col"><h2 className="text-xl font-bold mb-4">Tap Rooms to Select</h2><div className="flex-1 overflow-y-auto grid grid-cols-5 gap-2 p-2 border rounded-xl mb-4 bg-slate-50">{generatedRooms.map((r, i) => <div key={i} onClick={()=>handleToggle(i)} className={`p-2 border rounded-lg text-center cursor-pointer ${selectedIndices.has(i)?'bg-indigo-600 text-white':''}`}><div className="font-bold">{r.roomNo}</div><div className="text-xs">{r.capacity} Beds</div></div>)}</div><div className="flex gap-2 justify-center pb-2">{[1,2,3,4,5].map(n => <button key={n} onClick={()=>{const u=generatedRooms.map((r,i)=>selectedIndices.has(i)?{...r,capacity:n}:r);setGeneratedRooms(u);setSelectedIndices(new Set())}} className="flex-1 bg-slate-100 py-3 rounded-lg font-bold border">{n}</button>)}</div><button onClick={submitSetup} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">{loading?<Loader2 className="animate-spin mx-auto"/>:"Finish"}</button></div>)}</div>);
}

// --- MAIN DASHBOARD (Updated with Profile & Finance) ---
function Dashboard({ user, onLogout, onUpdateUser }) {
  const [rooms, setRooms] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('overview'); 
  const [modalData, setModalData] = useState(null); 
  const [showProfile, setShowProfile] = useState(false);
  const [showFinance, setShowFinance] = useState(false);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { axios.get(`${API}/dashboard/${user.id}`).then(res => setRooms(res.data)); }, []);
  const allBeds = rooms.flatMap(room => room.beds.map(bed => ({ ...bed, roomNo: room.number, roomId: room.id })));
  const occupiedBeds = allBeds.filter(b => b.isOccupied);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b px-4 py-3 shadow-sm flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Home size={20} className="text-indigo-600"/> {user.hostel_name}</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowFinance(true)} className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg font-bold flex items-center gap-1 border border-indigo-100"><Wallet size={16}/> Finance</button>
            <button onClick={() => setShowProfile(true)} className="bg-slate-100 text-slate-600 px-3 py-2 rounded-lg"><UserCircle size={18}/></button>
            <button onClick={() => setViewMode(viewMode==='grid'?'list':'grid')} className="bg-slate-100 text-slate-600 px-3 py-2 rounded-lg">{viewMode==='grid'?<List size={18}/>:<LayoutGrid size={18}/>}</button>
            <button onClick={() => setShowImport(true)} className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg"><Camera size={16}/></button>
            <button onClick={onLogout} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg"><LogOut size={16}/></button>
          </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 py-6">
          <div className="flex justify-center mb-6">
              <div className="bg-white p-1 rounded-xl shadow-sm border inline-flex">
                  <button onClick={() => setActiveTab('overview')} className={`px-6 py-2 rounded-lg text-sm font-bold ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>Overview</button>
                  <button onClick={() => setActiveTab('rent')} className={`px-6 py-2 rounded-lg text-sm font-bold ${activeTab === 'rent' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}`}>Rent Manager</button>
              </div>
          </div>

          {viewMode === 'grid' && (
            <div className="space-y-8">
                {Object.entries(groupBy(rooms, 'floor')).map(([floor, floorRooms]) => (
                    <div key={floor}>
                        <h2 className="text-xs font-bold text-slate-400 uppercase mb-4 border-b pb-2">{floor === '0' ? "Ground Floor" : `Floor ${floor}`}</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {floorRooms.map(room => (
                                <div key={room.id} className="bg-white rounded-xl shadow-sm border p-4">
                                    <div className="text-center font-bold text-slate-700 text-lg mb-3">{room.number}</div>
                                    <div className="flex justify-center flex-wrap gap-2 mb-2">
                                        {room.beds.map((bed, i) => {
                                            if(activeTab === 'rent' && !bed.isOccupied) return null;
                                            const isPaid = bed.lastRentPaid === getCurrentMonth();
                                            let bg = activeTab==='rent' ? (isPaid?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700') : (bed.isOccupied ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100');
                                            return <div key={i} onClick={() => setModalData({ type: activeTab==='rent'?'rent':'booking', room, bed })} className={`w-8 h-8 rounded flex items-center justify-center font-bold cursor-pointer text-xs ${bg}`}>{i + 1}</div>;
                                        })}
                                    </div>
                                    {activeTab === 'overview' && <div className="text-center"><button onClick={async()=>{await axios.post(`${API}/rooms/add-bed`, {roomId:room.id}); window.location.reload()}} className="text-indigo-600 text-xs font-bold mr-2">+ Bed</button><button onClick={async()=>{try{await axios.post(`${API}/rooms/remove-bed`, {roomId:room.id}); window.location.reload()}catch(e){alert("Error")}}} className="text-red-500 text-xs font-bold">- Bed</button></div>}
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

      {modalData && modalData.type === 'booking' && <BookingModal data={modalData} hostelName={user.hostel_name} close={() => { setModalData(null); window.location.reload(); }} />}
      {modalData && modalData.type === 'rent' && <RentModal data={modalData} close={() => { setModalData(null); window.location.reload(); }} />}
      {showImport && <ImportModal user={user} close={() => setShowImport(false)} />}
      {showProfile && <ProfileModal user={user} close={() => setShowProfile(false)} onUpdate={onUpdateUser} />}
      {showFinance && <FinanceModal user={user} close={() => setShowFinance(false)} />}
    </div>
  );
}

// --- NEW FEATURE: FINANCE DASHBOARD ---
function FinanceModal({ user, close }) {
    const [data, setData] = useState(null);
    const [newExp, setNewExp] = useState({ title: '', amount: '', category: 'General' });
    const [newWorker, setNewWorker] = useState({ name: '', role: '', salary: '' });
    const [tab, setTab] = useState('summary');

    useEffect(() => { fetchData(); }, []);
    const fetchData = async () => { const res = await axios.get(`${API}/finance/${user.id}`); setData(res.data); };
    
    const addExpense = async () => { await axios.post(`${API}/expenses/add`, { userId: user.id, ...newExp }); fetchData(); setNewExp({ title: '', amount: '', category: 'General' }); };
    const addWorker = async () => { await axios.post(`${API}/workers/add`, { userId: user.id, ...newWorker }); fetchData(); setNewWorker({ name: '', role: '', salary: '' }); };

    if(!data) return <div className="fixed inset-0 flex items-center justify-center bg-white"><Loader2 className="animate-spin"/></div>;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Wallet/> Finance Dashboard</h2>
                    <button onClick={close} className="bg-indigo-700 px-3 py-1 rounded">Close</button>
                </div>
                
                <div className="flex border-b">
                    <button onClick={() => setTab('summary')} className={`flex-1 p-4 font-bold ${tab==='summary'?'text-indigo-600 border-b-2 border-indigo-600':'text-slate-400'}`}>Summary</button>
                    <button onClick={() => setTab('expenses')} className={`flex-1 p-4 font-bold ${tab==='expenses'?'text-indigo-600 border-b-2 border-indigo-600':'text-slate-400'}`}>Expenses</button>
                    <button onClick={() => setTab('workers')} className={`flex-1 p-4 font-bold ${tab==='workers'?'text-indigo-600 border-b-2 border-indigo-600':'text-slate-400'}`}>Workers</button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto bg-slate-50">
                    {tab === 'summary' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border"><p className="text-xs font-bold text-slate-400">TOTAL INCOME</p><p className="text-2xl font-bold text-green-600">₹{data.summary.income}</p></div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border"><p className="text-xs font-bold text-slate-400">EXPENSES + SALARY</p><p className="text-2xl font-bold text-red-500">₹{data.summary.outflow}</p></div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border"><p className="text-xs font-bold text-slate-400">NET PROFIT</p><p className="text-2xl font-bold text-indigo-600">₹{data.summary.profit}</p></div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border"><p className="text-xs font-bold text-slate-400">PENDING RENT</p><p className="text-2xl font-bold text-orange-500">₹{data.rent.pending}</p></div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border">
                                <h3 className="font-bold text-lg mb-4 text-slate-700">Rent Status (This Month)</h3>
                                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden flex">
                                    <div className="bg-green-500 h-full" style={{width: `${(data.rent.collected/data.rent.total)*100}%`}}></div>
                                    <div className="bg-orange-400 h-full flex-1"></div>
                                </div>
                                <div className="flex justify-between text-xs font-bold mt-2 text-slate-500">
                                    <span>Collected: ₹{data.rent.collected}</span>
                                    <span>Total Expected: ₹{data.rent.total}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'expenses' && (
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border flex gap-2">
                                <input className="border p-2 rounded flex-1" placeholder="Title (e.g. Vegetables)" value={newExp.title} onChange={e=>setNewExp({...newExp, title:e.target.value})} />
                                <input className="border p-2 rounded w-24" placeholder="Amount" type="number" value={newExp.amount} onChange={e=>setNewExp({...newExp, amount:e.target.value})} />
                                <button onClick={addExpense} className="bg-indigo-600 text-white px-4 rounded font-bold">Add</button>
                            </div>
                            {data.expenses.map(e => (
                                <div key={e.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
                                    <div><p className="font-bold text-slate-700">{e.title}</p><p className="text-xs text-slate-400">{e.date}</p></div>
                                    <span className="font-bold text-red-500">- ₹{e.amount}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'workers' && (
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border flex gap-2">
                                <input className="border p-2 rounded flex-1" placeholder="Name" value={newWorker.name} onChange={e=>setNewWorker({...newWorker, name:e.target.value})} />
                                <input className="border p-2 rounded flex-1" placeholder="Role (Cook/Cleaner)" value={newWorker.role} onChange={e=>setNewWorker({...newWorker, role:e.target.value})} />
                                <input className="border p-2 rounded w-24" placeholder="Salary" type="number" value={newWorker.salary} onChange={e=>setNewWorker({...newWorker, salary:e.target.value})} />
                                <button onClick={addWorker} className="bg-green-600 text-white px-4 rounded font-bold">Add</button>
                            </div>
                            {data.workers.map(w => (
                                <div key={w.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
                                    <div><p className="font-bold text-slate-700">{w.name}</p><p className="text-xs text-slate-400">{w.role}</p></div>
                                    <span className="font-bold text-slate-700">₹{w.salary}/mo</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- NEW FEATURE: PROFILE MODAL ---
function ProfileModal({ user, close, onUpdate }) {
    const [formData, setFormData] = useState({ hostelName: user.hostel_name, email: user.email, mobile: user.mobile || '' });
    const handleUpdate = async () => { await axios.post(`${API}/profile/update`, { userId: user.id, ...formData }); onUpdate({ ...user, ...formData }); close(); };
    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-2xl w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
                <div className="space-y-4">
                    <div><label className="text-xs font-bold text-slate-400">Hostel Name</label><input className="w-full border p-2 rounded" value={formData.hostelName} onChange={e=>setFormData({...formData, hostelName:e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-slate-400">Email</label><input className="w-full border p-2 rounded" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-slate-400">Mobile</label><input className="w-full border p-2 rounded" value={formData.mobile} onChange={e=>setFormData({...formData, mobile:e.target.value})} /></div>
                    <button onClick={handleUpdate} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Save Changes</button>
                    <button onClick={close} className="w-full text-slate-400 py-2">Cancel</button>
                </div>
            </div>
        </div>
    );
}

// --- RENT MODAL (Updated with History) ---
function RentModal({ data, close }) {
  const { bed } = data; const joinDay = new Date(bed.joinDate).getDate(); const dueDate = new Date(new Date().getFullYear(), new Date().getMonth(), joinDay).toDateString();
  const [history, setHistory] = useState([]);
  
  useEffect(() => { axios.get(`${API}/rent-history/${bed.id}`).then(res => setHistory(res.data)); }, [bed.id]);

  const handleMarkPaid = async () => { await axios.post(`${API}/pay-rent`, { bedId: bed.id, monthString: getCurrentMonth(), amount: bed.rentAmount }); window.open(`https://wa.me/91${bed.clientMobile}?text=${encodeURIComponent(`*Payment Received* ✅\n\nDear ${bed.clientName},\nWe received your rent of ₹${bed.rentAmount} for this month.\n\nThank you!`)}`, '_blank'); close(); };
  
  const waReminder = `*Rent Reminder* 🔔\n\nHello ${bed.clientName},\n\nThis is a gentle reminder that your rent of ₹${bed.rentAmount} for Room ${data.room.number} is due. Please pay at your earliest convenience to avoid late fees.\n\nThank you!`;

  return (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden"><div className="bg-emerald-500 p-6 text-white"><h2 className="text-2xl font-bold mb-1">{bed.clientName}</h2><p className="opacity-90 text-sm">Room {data.room.number} • Rent ₹{bed.rentAmount}</p></div><div className="p-6 space-y-4"><div><p className="text-xs font-bold text-slate-400 uppercase">Rent Due Date</p><p className="text-lg font-bold text-slate-700">{dueDate}</p></div><a href={`https://wa.me/91${bed.clientMobile}?text=${encodeURIComponent(waReminder)}`} target="_blank" className="flex items-center justify-center gap-2 w-full border py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"><MessageCircle size={18}/> Send Reminder</a><button onClick={handleMarkPaid} className="flex items-center justify-center gap-2 w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700"><Banknote size={18}/> Mark Paid</button><div className="bg-slate-50 p-3 rounded-xl"><p className="text-xs font-bold text-slate-400 mb-2 uppercase">Payment History (Last 3)</p>{history.length===0?<p className="text-xs text-slate-400">No records found.</p>:history.map((h,i)=><div key={i} className="flex justify-between text-sm py-1 border-b last:border-0"><span>{h.month}</span><span className="font-bold text-green-600">Paid ₹{h.amount}</span></div>)}</div><button onClick={close} className="text-sm text-slate-400 hover:text-slate-600 w-full">Close</button></div></div></div>);
}

// --- KEEP OTHER COMPONENTS SAME (BookingModal, ImportModal) ---
// Just paste the previous versions of BookingModal and ImportModal here.
// To ensure the file isn't too huge, I assume you have them from previous steps. 
// Just ensure you include them below.

function BookingModal({ data, close, hostelName }) {
  const { bed, room } = data;
  const isEditMode = bed.isOccupied; 
  const defaultMaint = localStorage.getItem('defaultMaintenance') || '';
  const [formData, setFormData] = useState({ clientName: bed.clientName || '', clientMobile: bed.clientMobile || '', joinDate: bed.joinDate || '', leaveDate: bed.leaveDate || '', advance: bed.advance || '', maintenance: bed.maintenance || defaultMaint, rentAmount: bed.rentAmount || '' });
  const [editing, setEditing] = useState(!isEditMode); const [loading, setLoading] = useState(false);
  const refundableCalc = (parseFloat(formData.advance) || 0) - (parseFloat(formData.maintenance) || 0);
  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); if(formData.maintenance) localStorage.setItem('defaultMaintenance', formData.maintenance); try { const payload = { ...formData, bedId: bed.id }; if(isEditMode) await axios.post(`${API}/update-tenant`, payload); else await axios.post(`${API}/book`, payload); close(); } catch(e){ alert("Error"); setLoading(false); } };
  const handleVacate = async () => { if(confirm("Vacate?")) { await axios.post(`${API}/vacate`, { bedId: bed.id }); close(); } };
  const waWelcome = `*Welcome to ${hostelName}* 🏠\n\nDear ${formData.clientName},\nWe are happy to have you!\n\n🛏 Room: ${room.number} (Bed ${bed.index+1})\n💰 Monthly Rent: ₹${formData.rentAmount}\n📅 Rent Due Date: ${new Date(formData.joinDate).getDate()}th of every month\n\nEnjoy your stay!`;
  return (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"><div className="bg-indigo-600 p-4 text-white flex justify-between items-center"><h2 className="font-bold text-lg">{isEditMode?'Manage Tenant':'New Booking'}</h2><button onClick={close}>✕</button></div><form onSubmit={handleSubmit} className="p-6 space-y-3"><div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold text-slate-400">NAME</label><input required className="w-full border-b p-2 font-bold" placeholder="Name" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} disabled={isEditMode && !editing} /></div><div><label className="text-xs font-bold text-slate-400">MOBILE</label><input className="w-full border-b p-2" placeholder="Mobile" value={formData.clientMobile} onChange={e => setFormData({...formData, clientMobile: e.target.value})} disabled={isEditMode && !editing} /></div></div><div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border"><div><label className="text-xs font-bold text-slate-500">Rent (Monthly)</label><input type="number" className="w-full p-1 bg-white border rounded" placeholder="₹ Rent" value={formData.rentAmount} onChange={e => setFormData({...formData, rentAmount: e.target.value})} disabled={!editing} /></div><div><label className="text-xs font-bold text-slate-500">Joining Date</label><input type="date" className="w-full p-1 bg-white border rounded" value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})} disabled={!editing} /></div></div><div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border"><div><label className="text-xs font-bold text-slate-500">Advance</label><input type="number" className="w-full p-1 bg-white border rounded" value={formData.advance} onChange={e => setFormData({...formData, advance: e.target.value})} disabled={!editing} /></div><div><label className="text-xs font-bold text-slate-500">Maintenance</label><input type="number" className="w-full p-1 bg-white border rounded" value={formData.maintenance} onChange={e => setFormData({...formData, maintenance: e.target.value})} disabled={!editing} /></div></div><div className="flex justify-between items-center pt-2"><span className="text-xs font-bold text-slate-400">REFUNDABLE:</span><span className="font-bold text-green-600 text-lg">₹{refundableCalc}</span></div>{(editing || !isEditMode) ? (<button disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg">{loading?<Loader2 className="animate-spin mx-auto"/>:"Save & Confirm"}</button>) : (<div className="grid grid-cols-2 gap-2 mt-4"><a href={`https://wa.me/91${formData.clientMobile}?text=${encodeURIComponent(waWelcome)}`} target="_blank" className="bg-green-100 text-green-700 py-2 rounded-lg font-bold text-sm text-center flex items-center justify-center gap-2 border border-green-200"><Send size={14}/> Welcome Msg</a><button type="button" onClick={() => setEditing(true)} className="bg-slate-100 text-slate-700 py-2 rounded-lg font-bold text-sm border border-slate-200"><Edit2 size={14} className="inline"/> Edit Details</button><button type="button" onClick={handleVacate} className="col-span-2 bg-red-50 text-red-600 py-2 rounded-lg font-bold text-sm border border-red-100">Vacate Tenant</button></div>)}</form></div></div>);
}

function ImportModal({ user, close }) { const [scanStatus, setScanStatus] = useState(""); const [scannedText, setScannedText] = useState(""); const [parsedData, setParsedData] = useState([]); const [loading, setLoading] = useState(false); const handleImageUpload = (e) => { const file = e.target.files[0]; if(!file) return; setScanStatus("scanning"); Tesseract.recognize(file, 'eng').then(({ data: { text } }) => { setScannedText(text); setScanStatus("done"); parseText(text); }); }; const parseText = (text) => { const lines = text.split('\n'); const detected = []; const dateRegex = /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/; lines.forEach(line => { const cleanLine = line.trim(); if(cleanLine.length < 5) return; const roomMatch = cleanLine.match(/\b\d{3}\b/); const mobileMatch = cleanLine.match(/\b\d{10}\b/); const dateMatch = cleanLine.match(dateRegex); if(roomMatch) { let name = cleanLine.replace(roomMatch[0], "").replace(mobileMatch ? mobileMatch[0] : "", "").replace(dateMatch ? dateMatch[0] : "", "").trim(); name = name.replace(/[^a-zA-Z ]/g, ""); let isoDate = null; if(dateMatch) { try { const parts = dateMatch[0].split(/[./-]/); if(parts.length === 3) isoDate = `${parts[2].length===2?'20'+parts[2]:parts[2]}-${parts[1]}-${parts[0]}`; } catch(e){} } if(name) detected.push({ roomNo: roomMatch[0], name: name, mobile: mobileMatch ? mobileMatch[0] : "", joinDate: isoDate }); } }); setParsedData(detected); }; const handleImport = async () => { setLoading(true); try { const res = await axios.post(`${API}/import-data`, { userId: user.id, tenants: parsedData }); alert(res.data.message); if(res.data.errors.length > 0) alert("Errors:\n" + res.data.errors.join("\n")); window.location.reload(); } catch(e) { alert("Import failed."); setLoading(false); } }; return (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"><div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Camera className="text-indigo-600"/> Smart Import</h2><button onClick={close} className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300">✕</button></div><div className="p-6 overflow-y-auto"><div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-6 text-center border-dashed border-2"><Camera size={40} className="mx-auto text-blue-300 mb-3"/><p className="text-sm text-blue-800 font-bold mb-1">Upload Register Photo</p><input type="file" accept="image/*" onChange={handleImageUpload} className="mx-auto block text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-indigo-600 file:text-white"/></div>{scanStatus === "scanning" && <div className="text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={40}/><p>AI Scanning...</p></div>}{scanStatus === "done" && (<div className="grid md:grid-cols-2 gap-4"><div><label className="font-bold text-xs uppercase text-slate-400">Raw</label><textarea className="w-full h-40 border p-2 text-xs bg-slate-50 rounded" value={scannedText} onChange={(e) => { setScannedText(e.target.value); parseText(e.target.value); }} /></div><div><label className="font-bold text-xs uppercase text-slate-400">Detected ({parsedData.length})</label><div className="h-40 overflow-y-auto border bg-white rounded p-2"><table className="w-full text-xs text-left"><thead><tr><th>Room</th><th>Name</th></tr></thead><tbody>{parsedData.map((d, i)=><tr key={i} className="border-b"><td>{d.roomNo}</td><td>{d.name}</td></tr>)}</tbody></table></div></div></div>)}{parsedData.length > 0 && <button disabled={loading} onClick={handleImport} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold mt-4 shadow-lg">{loading?<Loader2 className="animate-spin mx-auto"/>:`Import ${parsedData.length} Tenants`}</button>}</div></div></div>); }

function groupBy(xs, key) { return xs.reduce((rv, x) => { (rv[x[key]] = rv[x[key]] || []).push(x); return rv; }, {}); }