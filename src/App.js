import React, { useState, useEffect } from 'react';
import { Calendar, Search, MessageSquare, Users, Book, Plus, Edit2, Trash2, X, Send, LogIn, LogOut, User } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// Firebase configuration - YOU NEED TO REPLACE THIS WITH YOUR OWN
const firebaseConfig = {
  apiKey: "AIzaSyBWR0BiaqlrhtUHlQWEQfP8gBzhuhYaIqI",
  authDomain: "team1755-nuclear.firebaseapp.com",
  projectId: "team1755-nuclear",
  storageBucket: "team1755-nuclear.firebasestorage.app",
  messagingSenderId: "1076267796238",
  appId: "1:1076267796238:web:1692ac29caa0007ba1f95f",
  measurementId: "G-LFPG9MDVE8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const CATEGORIES = [
  { id: 'code', label: 'Code Development', color: 'bg-blue-500' },
  { id: 'testing', label: 'Testing Results', color: 'bg-green-500' },
  { id: 'meetings', label: 'Team Meetings', color: 'bg-purple-500' },
  { id: 'building', label: 'Building', color: 'bg-orange-500' },
  { id: 'gameplan', label: 'Game Plan', color: 'bg-red-500' },
  { id: 'competitions', label: 'Competitions', color: 'bg-yellow-500' }
];

// Sample team members - CUSTOMIZE THIS!
const TEAM_MEMBERS = [
  {
    name: 'Yatharth Gohel',
    role: 'Lead Builder',
    bio: 'Main Buildier of 1755N. ',
    image: 'https://via.placeholder.com/300x300/4B5563/FFFFFF?text=JS',
  },
  {
    name: 'Krithik Sentilkumar',
    role: 'Lead Programmer',
    bio: 'One of the Lead Programmers of 1755N.',
    image: 'https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=SJ',
  },
  {
    name: 'Pranshu Nautiyal',
    role: 'Notebook Manager, CAD, Builder',
    bio: 'Documentation Manager and CAD specialist.',
    image: 'https://via.placeholder.com/300x300/10B981/FFFFFF?text=MC',
  },
  {
    name: 'Ajay Srinivasan',
    role: 'Lead Programmer',
    bio: 'One of the Lead Programmers of 1755N.',
    image: 'https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=ER',
  },
  {
    name: 'Vidhan Jain',
    role: 'Builder, CAD',
    bio: 'Builder and CAD specialist.',
    image: 'https://via.placeholder.com/300x300/EF4444/FFFFFF?text=DP',
  },
];

export default function RoboticsWebsite() {
  const [activeTab, setActiveTab] = useState('about');
  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [user, setUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    category: 'code',
    content: '',
    images: []
  });

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener for entries
  useEffect(() => {
    const q = query(collection(db, 'entries'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entriesData = [];
      snapshot.forEach((doc) => {
        entriesData.push({ id: doc.id, ...doc.data() });
      });
      setEntries(entriesData);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (error) {
      setLoginError('Invalid email or password');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadingImages(true);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, reader.result]
        }));
        setUploadingImages(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('Please log in to create entries');
      return;
    }

    if (!formData.title || !formData.date || !formData.content) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingEntry) {
        const entryRef = doc(db, 'entries', editingEntry.id);
        await updateDoc(entryRef, {
          title: formData.title,
          date: formData.date,
          category: formData.category,
          content: formData.content,
          images: formData.images,
          updatedAt: new Date().toISOString(),
          updatedBy: user.email
        });
      } else {
        await addDoc(collection(db, 'entries'), {
          ...formData,
          createdAt: new Date().toISOString(),
          createdBy: user.email
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Error saving entry. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      category: 'code',
      content: '',
      images: []
    });
    setEditingEntry(null);
    setShowModal(false);
  };

  const handleEdit = (entry) => {
    if (!user) {
      alert('Please log in to edit entries');
      return;
    }
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      date: entry.date,
      category: entry.category,
      content: entry.content,
      images: entry.images || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!user) {
      alert('Please log in to delete entries');
      return;
    }
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteDoc(doc(db, 'entries', id));
      } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Error deleting entry. Please try again.');
      }
    }
  };

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getEntriesForDate = (date) => {
    return entries.filter(entry => entry.date === date);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsLoading(true);

    try {
      const notebookContext = entries.map(entry => {
        const category = CATEGORIES.find(c => c.id === entry.category)?.label || entry.category;
        return `Date: ${entry.date}\nCategory: ${category}\nTitle: ${entry.title}\nContent: ${entry.content}`;
      }).join('\n\n---\n\n');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `You are an AI assistant for Team 1755 Nuclear, a robotics team. Answer questions based on the following notebook entries. If the information isn't in the notebook entries, say so politely and offer general robotics knowledge if helpful.

Notebook Entries:
${notebookContext}

User Question: ${currentInput}`
            }
          ]
        })
      });

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.content[0].text
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.'
      }]);
    }
    setIsLoading(false);
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEntries = getEntriesForDate(dateStr);
      const hasEntries = dayEntries.length > 0;
      const categoryColor = hasEntries ? CATEGORIES.find(c => c.id === dayEntries[0].category)?.color : '';
      
      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-2 relative cursor-pointer hover:bg-gray-50 ${hasEntries ? categoryColor : ''}`}
          onMouseEnter={() => setHoveredDate(dateStr)}
          onMouseLeave={() => setHoveredDate(null)}
        >
          <div className={`font-semibold ${hasEntries ? 'text-white' : 'text-gray-700'}`}>{day}</div>
          {hoveredDate === dateStr && dayEntries.length > 0 && (
            <div className="absolute z-10 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-3 mt-2 w-64 left-0">
              {dayEntries.map(entry => (
                <div key={entry.id} className="mb-2">
                  <div className="font-bold text-gray-800">{entry.title}</div>
                  <div className="text-sm text-gray-600">{entry.content.substring(0, 100)}...</div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold">Team 1755 Nuclear</h1>
              <p className="text-gray-300 mt-2">Robotics Excellence</p>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <User size={20} />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <LogIn size={18} />
                  <span>Team Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { id: 'about', label: 'About', icon: Users },
              { id: 'team', label: 'Meet the Team', icon: Users },
              { id: 'notebook', label: 'Notebook', icon: Book },
              { id: 'calendar', label: 'Calendar', icon: Calendar },
              { id: 'chat', label: 'AI Assistant', icon: MessageSquare }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon size={20} />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        {activeTab === 'about' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">About Team 1755 Nuclear</h2>
            <div className="prose max-w-none text-gray-700">
              <p className="text-lg mb-4">
                Team 1755 Nuclear is a competitive robotics team dedicated to excellence in engineering, 
                programming, and teamwork. We participate in FIRST Robotics Competition, where we design, 
                build, and program robots to compete in challenging games against teams from around the world.
              </p>
              <p className="text-lg mb-4">
                Our team fosters innovation, collaboration, and technical skills while building lasting 
                friendships and professional relationships. We believe in inspiring young people to pursue 
                careers in science, technology, engineering, and mathematics through hands-on learning and 
                real-world problem solving.
              </p>
              <p className="text-lg">
                Through rigorous testing, strategic planning, and continuous improvement, Team 1755 Nuclear 
                strives to push the boundaries of what's possible in competitive robotics. Our notebook 
                documents our journey, capturing every meeting, build session, code iteration, and competition 
                experience.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Meet the Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {TEAM_MEMBERS.map((member, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="text-xl font-bold text-gray-900 text-center">{member.name}</h3>
                  <p className="text-blue-600 text-center font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600 text-center text-sm">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notebook' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex-1 mr-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search notebook entries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                onClick={() => user ? setShowModal(true) : setShowLoginModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                <span>New Entry</span>
              </button>
            </div>

            <div className="grid gap-6">
              {filteredEntries.map(entry => {
                const category = CATEGORIES.find(c => c.id === entry.category);
                return (
                  <div key={entry.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className={`h-2 ${category?.color}`}></div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{entry.title}</h3>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-sm text-gray-500">{entry.date}</span>
                            <span className={`text-sm px-3 py-1 rounded-full text-white ${category?.color}`}>
                              {category?.label}
                            </span>
                          </div>
                        </div>
                        {user && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap mb-4">{entry.content}</p>
                      {entry.images && entry.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          {entry.images.map((img, idx) => (
                            <img key={idx} src={img} alt={`Entry ${idx + 1}`} className="rounded-lg w-full h-48 object-cover" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Previous
              </button>
              <h2 className="text-2xl font-bold">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Next
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-bold text-gray-700 py-2">{day}</div>
              ))}
              {renderCalendar()}
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              {CATEGORIES.map(cat => (
                <div key={cat.id} className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded ${cat.color}`}></div>
                  <span className="text-sm text-gray-700">{cat.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white rounded-lg shadow-md p-6 h-[600px] flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">AI Assistant</h2>
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>Ask me anything about Team 1755 Nuclear's robot!</p>
                  <p className="text-sm mt-2">I can answer based on the team's notebook entries.</p>
                </div>
              )}
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-lg p-4 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-900'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-900 rounded-lg p-4">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about our robot..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        )}
      </main>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Team Member Login</h3>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="team@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              {loginError && (
                <p className="text-red-600 text-sm">{loginError}</p>
              )}
              <button
                onClick={handleLogin}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingEntry ? 'Edit Entry' : 'New Notebook Entry'}
                </h3>
                <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Images (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  {uploadingImages && <p className="text-sm text-blue-600 mt-2">Processing images...</p>}
                  <p className="text-xs text-gray-500 mt-1">Images stored as base64 (free tier compatible)</p>
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img src={img} alt={`Preview ${idx + 1}`} className="rounded-lg w-full h-32 object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              images: formData.images.filter((_, i) => i !== idx)
                            })}
                            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {editingEntry ? 'Update Entry' : 'Create Entry'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );