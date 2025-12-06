import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BedDouble, LogOut, Search, MessageCircle, Banknote, UserMinus, MousePointer2, Users, Calendar, ShieldCheck, Lock } from 'lucide-react';

// --- CONFIGURATION ---
// 👇 ENSURE THIS IS YOUR RENDER URL 👇
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
  
  // --- SUPER ADMIN VIEW ---
  if (user.username === 'admin') return <AdminPanel user={user} onLogout={handleLogout} />;
  
  // --- OWNER VIEW ---
  if (user && !user.setup_complete) return <SetupPage user={user} onUpdate={handleLogin} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}

// --- 1. LOGIN COMPONENT ---
function LoginPage({ onLogin }) {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    try {
      const res = await axios.post(`${API}/login`, creds);
      onLogin(res.data);
    } catch (err) {
      if (err.response && err.response.data.error === "REGISTRATION_SUCCESS") {
        setMsg({ text: "Account created! Please ask Admin to approve you.", type: 'success' });
      } else if (err.response && err.response.data.error === "NOT_APPROVED") {
        setMsg({ text: "Account pending approval. Please contact Admin.", type: 'error' });
      } else {
        setMsg({ text: "Login failed. Check username/password.", type: 'error' });
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded shadow-md w-96 border-t-4 border-blue-600">
        <h2 className="text-2xl font-bold mb-4 text-blue-800">Hostel Login</h2>
        
        {msg.text && (
            <div className={`p-3 rounded mb-4 text-sm ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {msg.text}
            </div>
        )}

        <input className="w-full p-2 border mb-2 rounded" placeholder="Username" onChange={e => setCreds({...creds, username: e.target.value})} />
        <input className="w-full p-2 border mb-4 rounded" type="password" placeholder="Password" onChange={e => setCreds({...creds, password: e.target.value})} />
        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold">Login / Register</button>
        <p className="text-xs text-gray-400 mt-4 text-center">New users are auto-registered but require approval.</p>
      </form>
    </div>
  );
}

// --- 2. SUPER ADMIN PANEL ---
function AdminPanel({ user, onLogout }) {
    const [owners, setOwners] = useState([]);
    const [newPass, setNewPass] = useState("");

    useEffect(() => {
        axios.get(`${API}/admin/users`).then(res => setOwners(res.data));
    }, []);

    const toggleStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 1 ? 0 : 1;
        await axios.post(`${API}/admin/approve`, { userId, status: newStatus });
        const res = await axios.get(`${API}/admin/users`);
        setOwners(res.data);
    };

    const handleChangePassword = async () => {
        if (!newPass) return alert("Please enter a new password");
        if (confirm("Are you sure you want to change the Admin password?")) {
            try {
                await axios.post(`${API}/admin/change-password`, { newPassword: newPass });
                alert("Password Updated! Please log in again.");
                onLogout();
            } catch (e) { alert("Error updating password"); }
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
                <h1 className="text-xl font-bold flex items-center gap-2"><ShieldCheck /> Super Admin Panel</h1>
                <button onClick={onLogout} className="flex items-center gap-2 bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600">
                    <LogOut size={14} /> Logout
                </button>
            </div>

            <div className="p-8 max-w-4xl mx-auto">
                {/* Security Section */}
                <div className="bg-white p-6 rounded shadow mb-8 border-l-4 border-red-500">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Lock size={18}/> Security Settings</h3>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">New Admin Password</label>
                            <input type="text" className="w-full border p-2 rounded" placeholder="Enter new strong password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                        </div>
                        <button onClick={handleChangePassword} className="bg-red-600 text-white px-6 py-2 rounded font-bold hover:bg-red-700 h-10">Update Password</button>
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-6">Manage Hostel Owners</h2>
                <div className="bg-white rounded shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="p-4 text-left">ID</th>
                                <th className="p-4 text-left">Username</th>
                                <th className="p-4 text-left">Hostel Name</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {owners.length === 0 && (
                                <tr><td colSpan="5" className="p-4 text-center text-gray-500">No owners registered yet.</td></tr>
                            )}
                            {owners.map(owner => (
                                <tr key={owner.id} className="border-b">
                                    <td className="p-4">{owner.id}</td>
                                    <td className="p-4 font-bold">{owner.username}</td>
                                    <td className="p-4">{owner.hostel_name || 'Not Setup'}</td>
                                    <td className="p-4 text-center">
                                        {owner.is_approved === 1 
                                            ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Active</span>
                                            : <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">Pending</span>
                                        }
                                    </td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => toggleStatus(owner.id, owner.is_approved)}
                                            className={`px-4 py-2 rounded text-white font-bold text-sm ${owner.is_approved === 1 ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
                                        >
                                            {owner.is_approved === 1 ? 'Block' : 'Approve'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- 3. SETUP COMPONENT ---
function SetupPage({ user, onUpdate }) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({ hostelName: '', floors: 3 });
  const [range, setRange] = useState({ start: '101', end: '110' });
  const [generatedRooms, setGeneratedRooms] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);

  const handleGenerate = () => {
    const startNum = parseInt(range.start.slice(-2)); 
    const endNum = parseInt(range.end.slice(-2));     
    let rooms = [];
    for (let f = 1; f <= config.floors; f++) {
      for (let r = startNum; r <= endNum; r++) {
        const roomNum = `${f}${r.toString().padStart(2, '0')}`;
        rooms.push({ floor: f, roomNo: roomNum, capacity: 2 }); 
      }
    }
    setGeneratedRooms(rooms);
    setStep(2);
  };

  const handleMouseDown = (index) => { setIsDragging(true); const newSet = new Set(selectedIndices); newSet.add(index); setSelectedIndices(newSet); };
  const handleMouseEnter = (index) => { if (isDragging) { const newSet = new Set(selectedIndices); newSet.add(index); setSelectedIndices(newSet); } };
  const handleMouseUp = () => setIsDragging(false);
  const applyBulkCapacity = (cap) => { const updated = generatedRooms.map((room, idx) => { if (selectedIndices.has(idx)) return { ...room, capacity: cap }; return room; }); setGeneratedRooms(updated); setSelectedIndices(new Set()); };
  const selectAll = () => { const all = generatedRooms.map((_, i) => i); setSelectedIndices(new Set(all)); };
  
  // 👇 THIS FUNCTION IS FIXED 👇
  const submitSetup = async () => { 
    await axios.post(`${API}/setup`, { userId: user.id, hostelName: config.hostelName, totalFloors: config.floors, rooms: generatedRooms }); 
    // Now we explicitly update the hostel_name in the local user state
    onUpdate({ ...user, setup_complete: 1, hostel_name: config.hostelName }); 
  };
  
  const getCapacityColor = (cap) => { if (cap === 1) return 'bg-gray-100 text-gray-600 border-gray-300'; if (cap === 2) return 'bg-blue-50 text-blue-600 border-blue-200'; if (cap === 3) return 'bg-purple-50 text-purple-600 border-purple-200'; return 'bg-orange-50 text-orange-600 border-orange-200'; };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" onMouseUp={handleMouseUp}>
      <div className="bg-white shadow p-4 mb-6"> <h1 className="text-2xl font-bold text-gray-800 text-center">Setup Hostel</h1> </div>
      <div className="flex-1 max-w-6xl w-full mx-auto p-4">
        {step === 1 && (
          <div className="bg-white p-8 rounded shadow max-w-lg mx-auto mt-10">
            <label className="block mb-2 font-bold">Hostel Name</label>
            <input className="w-full border p-3 mb-4 rounded" onChange={e => setConfig({...config, hostelName: e.target.value})} />
            <label className="block mb-2 font-bold">Total Floors</label>
            <select className="w-full border p-3 mb-4 rounded" onChange={e => setConfig({...config, floors: parseInt(e.target.value)})}> {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} Floors</option>)} </select>
            <label className="block mb-2 font-semibold text-gray-600">Room Range (Floor 1)</label>
            <div className="flex gap-2 mb-6"> <input className="border p-3 w-1/2 rounded" placeholder="Start (101)" onChange={e => setRange({...range, start: e.target.value})} /> <input className="border p-3 w-1/2 rounded" placeholder="End (110)" onChange={e => setRange({...range, end: e.target.value})} /> </div>
            <button onClick={handleGenerate} className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700">Next: Configure Beds</button>
          </div>
        )}
        {step === 2 && (
          <div className="flex gap-6 h-[calc(100vh-150px)]">
            <div className="flex-1 overflow-y-auto bg-white p-6 rounded shadow border">
               <div className="flex justify-between mb-4 items-center"> <p className="text-gray-500 text-sm flex items-center gap-2"> <MousePointer2 size={16}/> Click & Drag to select rooms </p> <button onClick={selectAll} className="text-blue-600 text-sm font-bold underline">Select All</button> </div>
               <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 select-none"> {generatedRooms.map((room, idx) => { const isSelected = selectedIndices.has(idx); return ( <div key={idx} onMouseDown={() => handleMouseDown(idx)} onMouseEnter={() => handleMouseEnter(idx)} className={`relative p-3 rounded border-2 cursor-pointer transition flex flex-col items-center justify-center h-20 ${isSelected ? 'bg-blue-600 border-blue-800 text-white' : getCapacityColor(room.capacity)}`} > <span className="font-bold text-lg">{room.roomNo}</span> <span className="text-xs font-medium">{room.capacity} Beds</span> </div> ); })} </div>
            </div>
            <div className="w-72 flex flex-col gap-4">
              <div className="bg-white p-5 rounded shadow border"> <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Users size={18}/> Set Beds</h3> <div className="grid grid-cols-2 gap-2"> <button onClick={() => applyBulkCapacity(1)} className="p-3 bg-gray-100 hover:bg-gray-200 rounded border font-bold">1 Bed</button> <button onClick={() => applyBulkCapacity(2)} className="p-3 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 font-bold text-blue-700">2 Beds</button> <button onClick={() => applyBulkCapacity(3)} className="p-3 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 font-bold text-purple-700">3 Beds</button> <button onClick={() => applyBulkCapacity(4)} className="p-3 bg-orange-50 hover:bg-orange-100 rounded border border-orange-200 font-bold text-orange-700">4 Beds</button> </div> </div>
              <button onClick={submitSetup} className="w-full bg-green-600 text-white py-3 rounded font-bold shadow hover:bg-green-700 text-lg mt-auto">Save & Finish</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 4. DASHBOARD COMPONENT ---
function Dashboard({ user, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); 
  const [modalData, setModalData] = useState(null); 
  const [rentFilter, setRentFilter] = useState('all');

  useEffect(() => { fetchDashboard(); }, []);
  const fetchDashboard = async () => { try { const res = await axios.get(`${API}/dashboard/${user.id}`); setRooms(res.data); } catch(e) { console.error("Error fetching data"); } };

  const filteredRooms = rooms.map(room => {
    const matchingBeds = room.beds.filter(bed => !searchTerm || (bed.clientName && bed.clientName.toLowerCase().includes(searchTerm.toLowerCase())));
    return { ...room, beds: matchingBeds.length > 0 || !searchTerm ? room.beds : [] };
  }).filter(r => r.beds.length > 0);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-10">
        <h1 className="text-xl font-bold tracking-wider">{user.hostel_name || 'Hostel Admin'}</h1>
        <div className="relative mx-4 flex-1 max-w-md"> <Search className="absolute left-3 top-2.5 text-gray-400" size={18} /> <input className="w-full pl-10 pr-4 py-2 rounded-full text-gray-800 focus:outline-none" placeholder="Search tenant..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /> </div>
        <button onClick={onLogout} className="flex items-center gap-2 bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600"> <LogOut size={14} /> Logout </button>
      </div>
      <div className="bg-white shadow p-2 flex justify-center gap-4"> <button onClick={() => setActiveTab('overview')} className={`px-6 py-2 rounded-full font-bold transition ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Overview</button> <button onClick={() => setActiveTab('rent')} className={`px-6 py-2 rounded-full font-bold transition ${activeTab === 'rent' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Rent Collection</button> </div>

      {activeTab === 'overview' && (
        <div className="p-6 max-w-7xl mx-auto w-full">
            {Object.entries(groupBy(filteredRooms, 'floor')).map(([floor, floorRooms]) => (
                <div key={floor} className="mb-8">
                    <h2 className="text-lg font-bold text-gray-500 mb-3 border-b-2 border-gray-200 inline-block">FLOOR {floor}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {floorRooms.map(room => (
                            <div key={room.id} className="bg-white p-3 rounded-lg shadow border-t-4 border-blue-500">
                                <div className="font-bold text-center mb-2">{room.number}</div>
                                <div className="flex justify-center gap-2 flex-wrap">
                                    {room.beds.map((bed, i) => {
                                        let colorClass = 'bg-green-500';
                                        if (bed.isOccupied) colorClass = bed.leaveDate ? 'bg-orange-500' : 'bg-red-500';
                                        return ( <div key={i} onClick={() => setModalData({ type: 'booking', room, bed })} className={`w-8 h-8 rounded-full cursor-pointer flex items-center justify-center text-white text-xs font-bold transition hover:scale-110 shadow-sm ${colorClass}`}> {i + 1} </div> );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      )}

      {activeTab === 'rent' && (
        <div className="p-6 max-w-7xl mx-auto w-full">
            <div className="flex justify-end mb-4"> <select className="p-2 border rounded" onChange={(e) => setRentFilter(e.target.value)}> <option value="all">Show All</option> <option value="paid">Paid This Month</option> <option value="unpaid">Unpaid / Due</option> </select> </div>
            {Object.entries(groupBy(filteredRooms, 'floor')).map(([floor, floorRooms]) => (
                <div key={floor} className="mb-8">
                    <h2 className="text-lg font-bold text-gray-500 mb-3 border-b-2 border-gray-200 inline-block">FLOOR {floor}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {floorRooms.map(room => (
                            <div key={room.id} className="bg-white p-3 rounded-lg shadow border-t-4 border-green-500">
                                <div className="font-bold text-center mb-2">{room.number}</div>
                                <div className="flex justify-center gap-2 flex-wrap">
                                    {room.beds.map((bed, i) => {
                                        if (!bed.isOccupied) return null;
                                        const isPaid = bed.lastRentPaid === getCurrentMonth();
                                        if (rentFilter === 'paid' && !isPaid) return null;
                                        if (rentFilter === 'unpaid' && isPaid) return null;
                                        return ( <div key={i} onClick={() => setModalData({ type: 'rent', room, bed })} className={`w-8 h-8 rounded-full cursor-pointer flex items-center justify-center text-white text-xs font-bold transition hover:scale-110 shadow-sm ${isPaid ? 'bg-green-600' : 'bg-red-600'}`}> {i + 1} </div> );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      )}

      {modalData && modalData.type === 'booking' && <BookingModal data={modalData} close={() => { setModalData(null); fetchDashboard(); }} />}
      {modalData && modalData.type === 'rent' && <RentModal data={modalData} close={() => { setModalData(null); fetchDashboard(); }} />}
    </div>
  );
}

// --- 5. MODALS ---
function BookingModal({ data, close }) {
  const { bed, room } = data;
  const [formData, setFormData] = useState({ clientName: '', clientMobile: '', joinDate: '', leaveDate: '', advance: '', maintenance: '' });
  const [newLeaveDate, setNewLeaveDate] = useState(bed.leaveDate || '');
  const refundable = (parseFloat(formData.advance) || 0) - (parseFloat(formData.maintenance) || 0);

  const handleSubmit = async (e) => { e.preventDefault(); await axios.post(`${API}/book`, { ...formData, bedId: bed.id }); close(); };
  const handleUpdateDate = async () => { await axios.post(`${API}/update-leave`, { bedId: bed.id, leaveDate: newLeaveDate }); close(); };
  const handleVacate = async () => { if(confirm("Are you sure?")) { await axios.post(`${API}/vacate`, { bedId: bed.id }); close(); } };

  if (bed.isOccupied) {
      const refundAmt = (bed.advance || 0) - (bed.maintenance || 0);
      return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4 border-b pb-2"> <h2 className="text-xl font-bold text-gray-800">Room {room.number} - Bed {bed.index + 1}</h2> <button onClick={close} className="text-gray-500 hover:text-black font-bold">✕</button> </div>
                <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded"> <DetailRow label="Name" value={bed.clientName} isBold /> <DetailRow label="Mobile" value={bed.clientMobile || 'N/A'} /> <DetailRow label="Join Date" value={bed.joinDate} /> <DetailRow label="Refundable" value={`₹${refundAmt}`} color="text-green-600" /> </div>
                <div className="mb-6"> <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"> <Calendar size={12}/> Set Leaving Date (Turns Orange) </label> <div className="flex gap-2 mt-1"> <input type="date" className="border p-2 rounded flex-1" value={newLeaveDate} onChange={e => setNewLeaveDate(e.target.value)} /> <button onClick={handleUpdateDate} className="bg-blue-600 text-white px-4 rounded font-bold hover:bg-blue-700"> Save </button> </div> </div>
                <button onClick={handleVacate} className="w-full bg-red-100 text-red-600 py-3 rounded font-bold hover:bg-red-200 flex items-center justify-center gap-2"> <UserMinus size={18} /> Vacate / Remove Tenant </button>
            </div>
        </div>
      )
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4"> <h2 className="text-xl font-bold">Book Room {room.number}</h2> <button onClick={close} className="text-gray-500 text-xl">✕</button> </div>
        <form onSubmit={handleSubmit} className="space-y-3">
            <input required placeholder="Customer Name" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, clientName: e.target.value})} />
            <input type="tel" placeholder="Mobile No (Optional)" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, clientMobile: e.target.value})} />
            <div className="grid grid-cols-2 gap-2"> <div> <label className="text-xs text-gray-500">Join Date</label> <input type="date" required className="w-full border p-2 rounded" onChange={e => setFormData({...formData, joinDate: e.target.value})} /> </div> <div> <label className="text-xs text-gray-500">Leave (Opt)</label> <input type="date" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, leaveDate: e.target.value})} /> </div> </div>
            <div className="grid grid-cols-2 gap-2"> <input type="number" required placeholder="Paid Advance ₹" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, advance: e.target.value})} /> <input type="number" required placeholder="Maintenance ₹" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, maintenance: e.target.value})} /> </div>
            <div className="bg-gray-100 p-2 rounded text-center text-sm"> Refundable: <span className="font-bold text-green-600">₹{refundable > 0 ? refundable : 0}</span> </div>
            <button className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700">Confirm Booking</button>
        </form>
      </div>
    </div>
  );
}

function RentModal({ data, close }) {
  const { bed } = data;
  const joinDay = new Date(bed.joinDate).getDate();
  const currentMonthDate = new Date();
  const dueDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), joinDay).toDateString();
  const refundAmt = (bed.advance || 0) - (bed.maintenance || 0);
  const waBase = `https://wa.me/91${bed.clientMobile}?text=`;
  const reminderMsg = encodeURIComponent(`Hello ${bed.clientName}, kind reminder that your rent is due on ${dueDate}. Please pay at your earliest convenience. Thank you.`);
  const receivedMsg = encodeURIComponent(`Hello ${bed.clientName}, we have received your rent payment for this month (${getCurrentMonth()}). Thank you!`);
  const handleMarkPaid = async () => { await axios.post(`${API}/pay-rent`, { bedId: bed.id, monthString: getCurrentMonth() }); window.open(waBase + receivedMsg, '_blank'); close(); };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button onClick={close} className="absolute top-4 right-4 text-gray-500 hover:text-black font-bold text-xl">✕</button>
        <h2 className="text-xl font-bold mb-1 text-blue-900">{bed.clientName}</h2> <p className="text-sm text-gray-500 mb-6">Room {data.room.number}</p>
        <div className="bg-gray-50 p-4 rounded mb-6 space-y-2"> <DetailRow label="Due Date" value={dueDate} isBold /> <DetailRow label="Paid Advance" value={`₹${bed.advance}`} /> <DetailRow label="Maintenance" value={`₹${bed.maintenance}`} /> <DetailRow label="Refundable Calc" value={`₹${refundAmt}`} /> </div>
        <div className="space-y-3"> {bed.clientMobile ? ( <a href={waBase + reminderMsg} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full border-2 border-green-500 text-green-600 py-2 rounded font-bold hover:bg-green-50"> <MessageCircle size={18} /> Send Rent Reminder </a> ) : <div className="text-red-500 text-center text-sm">No Mobile Number Provided</div>} <button onClick={handleMarkPaid} className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700"> <Banknote size={18} /> Rent Received & Send Thanks </button> </div>
      </div>
    </div>
  );
}

const DetailRow = ({ label, value, isBold, color }) => ( <div className="flex justify-between text-sm"> <span className="text-gray-500">{label}</span> <span className={`${isBold ? 'font-bold' : ''} ${color || 'text-gray-800'}`}>{value}</span> </div> );
function groupBy(xs, key) { return xs.reduce((rv, x) => { (rv[x[key]] = rv[x[key]] || []).push(x); return rv; }, {}); }