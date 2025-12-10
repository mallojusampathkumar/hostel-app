import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BedDouble, LogOut, Search, MessageCircle, Banknote, UserMinus, MousePointer2, Users, Calendar, ShieldCheck, Lock, RefreshCw, Loader2, Send, Trash2, Camera, Upload, Plus, Minus } from 'lucide-react';
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

// --- LOGIN ---
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
        setMsg({ text: "Account created! Please ask Admin to approve you.", type: 'success' });
      } else if (err.response && err.response.data.error === "NOT_APPROVED") {
        setMsg({ text: "Account pending approval. Please contact Admin.", type: 'error' });
      } else {
        setMsg({ text: "Login failed.", type: 'error' });
      }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded shadow-md w-96 border-t-4 border-blue-600">
        <h2 className="text-2xl font-bold mb-4 text-blue-800">Hostel Login</h2>
        {msg.text && <div className={`p-3 rounded mb-4 text-sm ${msg.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>{msg.text}</div>}
        <input className="w-full p-2 border mb-2 rounded" placeholder="Username" onChange={e => setCreds({...creds, username: e.target.value})} />
        <input className="w-full p-2 border mb-4 rounded" type="password" placeholder="Password" onChange={e => setCreds({...creds, password: e.target.value})} />
        <button disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold flex justify-center gap-2">
            {loading ? <Loader2 className="animate-spin"/> : "Login / Register"}
        </button>
      </form>
    </div>
  );
}

// --- ADMIN ---
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
        if(confirm(`🚨 DANGER: Delete owner "${username}"? All data will be lost.`)) {
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
        <div className="min-h-screen bg-gray-100">
            <div className="bg-gray-800 text-white p-4 flex justify-between"> <h1 className="text-xl font-bold flex gap-2"><ShieldCheck /> Super Admin</h1> <button onClick={onLogout} className="bg-red-500 px-3 py-1 rounded text-sm">Logout</button> </div>
            <div className="p-8 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded shadow mb-8 border-l-4 border-red-500">
                    <h3 className="font-bold mb-4 flex gap-2"><Lock size={18}/> Security</h3>
                    <div className="flex gap-4"> <input type="text" className="w-full border p-2 rounded" placeholder="New Password" value={newPass} onChange={(e) => setNewPass(e.target.value)} /> <button onClick={handleChangePassword} className="bg-red-600 text-white px-6 rounded font-bold">Update</button> </div>
                </div>
                <h2 className="text-2xl font-bold mb-6">Hostel Owners</h2>
                <div className="bg-white rounded shadow">
                    <table className="w-full">
                        <thead className="bg-gray-200"><tr><th className="p-4">Username</th><th className="p-4">Hostel</th><th className="p-4">Status</th><th className="p-4">Action</th><th className="p-4">Delete</th></tr></thead>
                        <tbody>
                            {owners.map(owner => (
                                <tr key={owner.id} className="border-b text-center">
                                    <td className="p-4 font-bold">{owner.username}</td>
                                    <td className="p-4">{owner.hostel_name || 'Not Setup'}</td>
                                    <td className="p-4">{owner.is_approved === 1 ? 'Active' : 'Pending'}</td>
                                    <td className="p-4"><button onClick={() => toggleStatus(owner.id, owner.is_approved)} className={`px-4 py-2 rounded text-white font-bold text-sm ${owner.is_approved === 1 ? 'bg-orange-500' : 'bg-green-600'}`}>{owner.is_approved === 1 ? 'Block' : 'Approve'}</button></td>
                                    <td className="p-4"><button onClick={() => handleDeleteOwner(owner.id, owner.username)} className="bg-red-600 text-white p-2 rounded hover:bg-red-800" title="Delete Owner"><Trash2 size={16}/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- SETUP ---
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
      if(c===1) return 'bg-gray-100'; if(c===2) return 'bg-blue-50 text-blue-700';
      if(c===3) return 'bg-purple-50 text-purple-700'; if(c===4) return 'bg-orange-50 text-orange-700'; return 'bg-pink-50 text-pink-700';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" onMouseUp={() => setIsDragging(false)}>
      <div className="bg-white shadow p-4 mb-6 text-center text-2xl font-bold">Setup Hostel</div>
      <div className="flex-1 max-w-6xl w-full mx-auto p-4">
        {step === 1 && (
          <div className="bg-white p-8 rounded shadow max-w-lg mx-auto mt-10">
            <label className="block font-bold mb-2">Hostel Name</label>
            <input className="w-full border p-3 mb-4 rounded" onChange={e => setConfig({...config, hostelName: e.target.value})} />
            <label className="block font-bold mb-2">How many floors?</label>
            <select className="w-full border p-3 mb-4 rounded" onChange={e => setConfig({...config, maxFloor: parseInt(e.target.value)})}>
                {[0,1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n === 0 ? "Ground Only" : `Ground + ${n} Floors`}</option>)}
            </select>
            <label className="block font-bold mb-2 text-blue-800">Default Sharing (Auto-fill)</label>
            <select className="w-full border p-3 mb-4 rounded bg-blue-50" onChange={e => setConfig({...config, defaultCapacity: parseInt(e.target.value)})}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Sharing</option>)}
            </select>
            <label className="block font-bold mb-2">Room Numbers (e.g., 01 to 10)</label>
            <div className="flex gap-2 mb-6"><input className="border p-3 w-1/2 rounded" placeholder="Start (e.g., 01)" onChange={e => setRange({...range, start: e.target.value})} /><input className="border p-3 w-1/2 rounded" placeholder="End (e.g., 10)" onChange={e => setRange({...range, end: e.target.value})} /></div>
            <button onClick={handleGenerate} className="w-full bg-blue-600 text-white p-3 rounded font-bold">Next: Review Rooms</button>
          </div>
        )}
        {step === 2 && (
          <div className="flex gap-6 h-[calc(100vh-150px)]">
            <div className="flex-1 overflow-y-auto bg-white p-6 rounded shadow border select-none">
                 <div className="mb-2 text-sm text-gray-500 flex gap-2 items-center"><MousePointer2 size={16}/> Click & Drag to select multiple rooms</div>
                 <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                     {generatedRooms.map((r, i) => (
                         <div key={i} onMouseDown={(e)=>handleMouseDown(i, e)} onMouseEnter={()=>handleMouseEnter(i)} className={`p-3 border-2 cursor-pointer flex flex-col items-center justify-center h-20 rounded transition ${selectedIndices.has(i) ? 'bg-blue-600 text-white border-blue-800' : getColor(r.capacity)}`} > <span className="font-bold">{r.roomNo}</span> <span className="text-xs">{r.capacity} Beds</span> </div>
                     ))}
                 </div>
            </div>
            <div className="w-64 flex flex-col gap-2">
              <div className="bg-white p-4 rounded shadow border"> <h3 className="font-bold mb-2">Set Beds</h3> {[1,2,3,4,5].map(n => <button key={n} onClick={()=>applyCap(n)} className="w-full p-2 border mb-1 bg-gray-50 hover:bg-gray-100 font-bold text-gray-700">{n} Sharing</button>)} </div>
              <button disabled={loading} onClick={submitSetup} className="w-full bg-green-600 text-white py-3 rounded font-bold text-lg mt-auto flex justify-center gap-2"> {loading ? <Loader2 className="animate-spin"/> : "Save & Finish"} </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- DASHBOARD ---
function Dashboard({ user, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); 
  const [modalData, setModalData] = useState(null); 
  const [rentFilter, setRentFilter] = useState('all');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { fetchDashboard(); }, []);
  const fetchDashboard = () => { axios.get(`${API}/dashboard/${user.id}`).then(res => setRooms(res.data)); };
  
  const handleReset = async () => {
      if(confirm("⚠ DELETE ALL DATA? Use this to fix layout mistakes.")) {
          await axios.post(`${API}/reset-hostel`, { userId: user.id });
          localStorage.setItem('hostelUser', JSON.stringify({ ...user, setup_complete: 0 }));
          window.location.reload();
      }
  };

  const handleAddBed = async (roomId) => {
      try { await axios.post(`${API}/rooms/add-bed`, { roomId }); fetchDashboard(); } 
      catch(e) { alert("Error adding bed"); }
  };

  const handleRemoveBed = async (roomId) => {
      try { await axios.post(`${API}/rooms/remove-bed`, { roomId }); fetchDashboard(); } 
      catch(e) { alert(e.response.data.error || "Error removing bed"); }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-10">
        <h1 className="text-xl font-bold tracking-wider">{user.hostel_name || 'Hostel Admin'}</h1>
        <div className="flex gap-2">
            <button onClick={() => setShowImport(true)} className="bg-green-500 px-3 py-1 rounded text-sm font-bold flex gap-1 items-center hover:bg-green-600 border border-green-400"><Camera size={14}/> Import Data</button>
            <button onClick={handleReset} className="bg-orange-500 px-3 py-1 rounded text-sm font-bold flex gap-1 items-center hover:bg-orange-600"><RefreshCw size={14}/> Reset Layout</button>
            <button onClick={onLogout} className="bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600 flex gap-1 items-center"><LogOut size={14} /> Logout</button>
        </div>
      </div>
      <div className="bg-white shadow p-2 flex justify-center gap-4"> <button onClick={() => setActiveTab('overview')} className={`px-6 py-2 rounded-full font-bold ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>Overview</button> <button onClick={() => setActiveTab('rent')} className={`px-6 py-2 rounded-full font-bold ${activeTab === 'rent' ? 'bg-green-600 text-white' : 'text-gray-500'}`}>Rent Collection</button> </div>

      <div className="p-6 max-w-7xl mx-auto w-full">
        {Object.entries(groupBy(rooms, 'floor')).map(([floor, floorRooms]) => (
            <div key={floor} className="mb-8">
                <h2 className="text-lg font-bold text-gray-500 mb-3 border-b-2">{parseInt(floor) === 0 ? "GROUND FLOOR" : `FLOOR ${floor}`}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {floorRooms.map(room => (
                        <div key={room.id} className="bg-white p-3 rounded-lg shadow border-t-4 border-blue-500 relative">
                            <div className="font-bold text-center mb-2">{room.number}</div>
                            <div className="flex justify-center gap-2 flex-wrap mb-2">
                                {room.beds.map((bed, i) => {
                                    if(activeTab === 'rent' && !bed.isOccupied) return null; 
                                    const isPaid = bed.lastRentPaid === getCurrentMonth();
                                    if(activeTab === 'rent' && rentFilter === 'paid' && !isPaid) return null;
                                    if(activeTab === 'rent' && rentFilter === 'unpaid' && isPaid) return null;
                                    
                                    let color = 'bg-green-500';
                                    if(activeTab === 'rent') color = isPaid ? 'bg-green-600' : 'bg-red-600';
                                    else if(bed.isOccupied) color = bed.leaveDate ? 'bg-orange-500' : 'bg-red-500';
                                    
                                    return <div key={i} onClick={() => setModalData({ type: activeTab==='rent'?'rent':'booking', room, bed })} className={`w-8 h-8 rounded-full cursor-pointer flex items-center justify-center text-white text-xs font-bold shadow-sm ${color}`}>{i + 1}</div>;
                                })}
                            </div>
                            
                            {/* +/- BUTTONS */}
                            {activeTab === 'overview' && (
                                <div className="flex justify-center gap-2 border-t pt-2 mt-2">
                                    <button onClick={() => handleAddBed(room.id)} className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200" title="Add Bed"><Plus size={14}/></button>
                                    <button onClick={() => handleRemoveBed(room.id)} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200" title="Remove Last Bed"><Minus size={14}/></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>
      {modalData && modalData.type === 'booking' && <BookingModal data={modalData} hostelName={user.hostel_name} close={() => { setModalData(null); fetchDashboard(); }} />}
      {modalData && modalData.type === 'rent' && <RentModal data={modalData} close={() => { setModalData(null); fetchDashboard(); }} />}
      {showImport && <ImportModal user={user} close={() => setShowImport(false)} />}
    </div>
  );
}

// --- NEW IMPORT MODAL (PARSING DATE) ---
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
        // Regex to look for date (DD-MM-YYYY or similar)
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
                    // Convert typical indian format DD-MM-YYYY to ISO YYYY-MM-DD
                    try {
                        const parts = dateMatch[0].split(/[./-]/);
                        if(parts.length === 3) isoDate = `${parts[2].length===2?'20'+parts[2]:parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
                    } catch(e){}
                }

                if(name) detected.push({ 
                    roomNo: roomMatch[0], 
                    name: name, 
                    mobile: mobileMatch ? mobileMatch[0] : "",
                    joinDate: isoDate // Send this to backend
                });
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 border-b pb-2"> <h2 className="text-xl font-bold flex gap-2"><Camera/> Import from Image</h2> <button onClick={close} className="font-bold text-gray-500 text-xl">✕</button> </div>
                <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200"> <p className="text-sm text-blue-800 mb-2"><b>Instructions:</b> Take a photo of your register.</p> <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/> </div>
                {scanStatus === "scanning" && <div className="text-center py-10"><Loader2 className="animate-spin mx-auto mb-2 text-blue-600" size={40}/><p>Scanning Text...</p></div>}
                {scanStatus === "done" && (
                    <div className="grid grid-cols-2 gap-4">
                        <div> <label className="font-bold text-sm block mb-1">Raw Text</label> <textarea className="w-full h-64 border p-2 text-xs font-mono bg-gray-50" value={scannedText} onChange={(e) => { setScannedText(e.target.value); parseText(e.target.value); }} /> </div>
                        <div>
                            <label className="font-bold text-sm block mb-1">Detected Data ({parsedData.length})</label>
                            <div className="h-64 overflow-y-auto border bg-gray-50 p-2 text-sm">
                                {parsedData.length === 0 ? <p className="text-gray-400 italic">No rooms detected.</p> : (
                                    <table className="w-full">
                                        <thead><tr className="text-left text-xs text-gray-500"><th>Room</th><th>Name</th><th>Date</th></tr></thead>
                                        <tbody>
                                            {parsedData.map((d, i) => ( <tr key={i} className="border-b"> <td className="font-bold text-blue-700">{d.roomNo}</td> <td>{d.name}</td> <td className="text-xs text-gray-500">{d.joinDate || "Today"}</td> </tr> ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {parsedData.length > 0 && <button disabled={loading} onClick={handleImport} className="w-full bg-green-600 text-white py-3 rounded font-bold mt-4 flex justify-center gap-2 hover:bg-green-700"> {loading ? <Loader2 className="animate-spin"/> : `Import ${parsedData.length} Tenants`} </button>}
            </div>
        </div>
    );
}

// --- MODALS ---
function BookingModal({ data, close, hostelName }) {
  const { bed, room } = data;
  const [formData, setFormData] = useState({ clientName: '', clientMobile: '', joinDate: '', leaveDate: '', advance: '', maintenance: '' });
  const [newLeaveDate, setNewLeaveDate] = useState(bed.leaveDate || '');
  const [loading, setLoading] = useState(false);

  const refundableCalc = (parseFloat(formData.advance) || 0) - (parseFloat(formData.maintenance) || 0);

  const handleSubmit = async (e) => { 
      e.preventDefault(); 
      setLoading(true);
      try { await axios.post(`${API}/book`, { ...formData, bedId: bed.id }); close(); } 
      catch(e){ alert("Error"); setLoading(false); }
  };
  
  const handleUpdateDate = async () => { await axios.post(`${API}/update-leave`, { bedId: bed.id, leaveDate: newLeaveDate }); close(); };
  const handleVacate = async () => { if(confirm("Vacate tenant?")) { await axios.post(`${API}/vacate`, { bedId: bed.id }); close(); } };

  const welcomeMsg = `Welcome to ${hostelName}! Room: ${room.number}, Bed: ${bed.bed_index+1}. Rent is due on the ${new Date(bed.joinDate).getDate()}th.`;

  if (bed.isOccupied) {
      const refundAmt = (bed.advance || 0) - (bed.maintenance || 0);
      return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4 border-b pb-2"> <h2 className="text-xl font-bold">Room {room.number}</h2> <button onClick={close}>✕</button> </div>
                <div className="space-y-2 mb-4 bg-gray-50 p-4 rounded"> 
                    <div>Name: <b>{bed.clientName}</b></div> <div>Mobile: {bed.clientMobile}</div> <div>Join: {bed.joinDate}</div> <div className="text-green-600 font-bold">Refundable: ₹{refundAmt}</div>
                </div>
                <a href={`https://wa.me/91${bed.clientMobile}?text=${encodeURIComponent(welcomeMsg)}`} target="_blank" className="flex items-center justify-center gap-2 w-full bg-green-100 text-green-700 py-2 rounded font-bold mb-4 border border-green-300"> <Send size={16}/> Send Welcome Message </a>
                <div className="mb-4"> <label className="text-xs font-bold">Set Leaving Date (Turns Orange)</label> <div className="flex gap-2"> <input type="date" className="border p-2 rounded flex-1" value={newLeaveDate} onChange={e => setNewLeaveDate(e.target.value)} /> <button onClick={handleUpdateDate} className="bg-blue-600 text-white px-4 rounded font-bold">Save</button> </div> </div>
                <button onClick={handleVacate} className="w-full bg-red-100 text-red-600 py-3 rounded font-bold flex items-center justify-center gap-2"> <UserMinus size={18} /> Vacate Tenant </button>
            </div>
        </div>
      )
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Book Room {room.number}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
            <input required placeholder="Name" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, clientName: e.target.value})} />
            <input placeholder="Mobile" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, clientMobile: e.target.value})} />
            <div className="flex gap-2"><input type="date" required className="w-full border p-2 rounded" onChange={e => setFormData({...formData, joinDate: e.target.value})} /><input type="date" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, leaveDate: e.target.value})} /></div>
            <div className="flex gap-2"><input type="number" required placeholder="Paid Advance ₹" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, advance: e.target.value})} /><input type="number" required placeholder="Maintenance ₹" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, maintenance: e.target.value})} /></div>
            <div className="text-center bg-gray-100 p-2 rounded text-sm"> Refundable Advance: <span className="font-bold text-green-600">₹{refundableCalc > 0 ? refundableCalc : 0}</span> </div>
            <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded font-bold flex justify-center gap-2"> {loading ? <Loader2 className="animate-spin"/> : "Confirm Booking"} </button>
        </form>
        <button onClick={close} className="mt-2 text-gray-500 w-full text-center">Cancel</button>
      </div>
    </div>
  );
}

function RentModal({ data, close }) {
  const { bed } = data;
  const joinDay = new Date(bed.joinDate).getDate();
  const dueDate = new Date(new Date().getFullYear(), new Date().getMonth(), joinDay).toDateString();
  const handleMarkPaid = async () => { await axios.post(`${API}/pay-rent`, { bedId: bed.id, monthString: getCurrentMonth() }); window.open(`https://wa.me/91${bed.clientMobile}?text=Rent%20Received!`, '_blank'); close(); };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-2 text-blue-900">{bed.clientName}</h2>
        <div className="bg-gray-50 p-4 rounded mb-4"> <div>Due Date: <b>{dueDate}</b></div> <div>Total Paid: ₹{bed.advance}</div> </div>
        <a href={`https://wa.me/91${bed.clientMobile}?text=Rent%20Due!`} target="_blank" className="flex items-center justify-center gap-2 w-full border-2 border-green-500 text-green-600 py-2 rounded font-bold mb-2"> <MessageCircle size={18} /> Send Reminder </a>
        <button onClick={handleMarkPaid} className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3 rounded font-bold"> <Banknote size={18} /> Mark Paid & WhatsApp </button>
        <button onClick={close} className="mt-2 w-full text-center text-gray-500">Close</button>
      </div>
    </div>
  );
}

function groupBy(xs, key) { return xs.reduce((rv, x) => { (rv[x[key]] = rv[x[key]] || []).push(x); return rv; }, {}); }