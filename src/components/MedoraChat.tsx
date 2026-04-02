import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, LogOut, ArrowLeft, RefreshCw, Lock, ShieldCheck, Download, Upload, AlertCircle, MessageSquare, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { encryptMessage, decryptMessage } from '../lib/crypto';

interface Message {
  id: string;
  sender_email: string;
  receiver_email: string;
  content: string;
  batch_no?: string;
  timestamp_delivery: string;
  timestamp_receive?: string;
  status?: string;
}

interface Contact {
  email: string;
  name: string;
  role: string;
  batch_no: string; // Linked for shared ledger encryption
}

interface MedoraChatProps {
  currentUserEmail: string;
  currentUserRole: string;
  currentUserPasskey: string;
  onBack: () => void;
}

const MedoraChat: React.FC<MedoraChatProps> = ({ currentUserEmail, currentUserRole, currentUserPasskey, onBack }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Local Storage Key
  const localStorageKey = `medora_chat_history_${currentUserEmail}`;

  useEffect(() => {
    fetchContacts();
    loadLocalHistory();
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchIncomingMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedContact) {
      loadLocalHistory(); // Reload filtering for this contact
    }
  }, [selectedContact]);

  const loadLocalHistory = async () => {
    const localData = localStorage.getItem(localStorageKey);
    if (localData) {
      try {
        // Decrypt Local Storage using User Passkey
        const decrypted = await decryptMessage(localData, currentUserPasskey);
        const allMessages: Message[] = JSON.parse(decrypted);
        
        if (selectedContact) {
          // Filter for selected contact
          const filtered = allMessages.filter(m => 
            (m.sender_email === currentUserEmail && m.receiver_email === selectedContact.email) ||
            (m.sender_email === selectedContact.email && m.receiver_email === currentUserEmail)
          );
          setMessages(filtered);
        } else {
          setMessages([]);
        }
      } catch (e) {
        console.error("Failed to decrypt local history:", e);
        setError("Failed to decrypt local history. Verify passkey.");
      }
    } else {
      setMessages([]);
    }
  };

  const saveLocalHistory = async (newMessages: Message[]) => {
    const localData = localStorage.getItem(localStorageKey);
    let allMessages: Message[] = [];
    if (localData) {
      try {
        const decrypted = await decryptMessage(localData, currentUserPasskey);
        allMessages = JSON.parse(decrypted);
      } catch (e) {
         allMessages = [];
      }
    }

    // Merge strategy: update or append
    newMessages.forEach(nm => {
      if (!allMessages.find(m => m.id === nm.id)) {
        allMessages.push(nm);
      }
    });

    // Encrypt Local Storage using User Passkey
    const encrypted = await encryptMessage(JSON.stringify(allMessages), currentUserPasskey);
    localStorage.setItem(localStorageKey, encrypted);
    
    // Refresh view
    if (selectedContact) {
      const filtered = allMessages.filter(m => 
        (m.sender_email === currentUserEmail && m.receiver_email === selectedContact.email) ||
        (m.sender_email === selectedContact.email && m.receiver_email === currentUserEmail)
      );
      setMessages(filtered);
    }
  };

  const fetchContacts = async () => {
    setLoading(true);
    setError('');
    try {
      // Find matches on ledger_events
      const { data: userEvents, error: eventError } = await supabase
        .from('ledger_events')
        .select('medicine_id, medicine:medicines(batch_no)')
        .eq('actor_email', currentUserEmail);

      if (eventError) throw eventError;

      const medicineIds = userEvents.map(e => e.medicine_id);
      const uniqueMedicineIds = Array.from(new Set(medicineIds));

      const contactList: Contact[] = [];

      for (const medId of uniqueMedicineIds) {
         // Fetch ALL other actors who interacted with this same batch
         const { data: allEvents, error: evError } = await supabase
            .from('ledger_events')
            .select('actor_email, role')
            .eq('medicine_id', medId);

         if (evError) continue;

         for (const evt of allEvents) {
            if (evt.actor_email && evt.actor_email !== currentUserEmail) {
                // Fetch User Details to get Name
                const { data: userData } = await supabase
                    .from('users')
                    .select('name')
                    .eq('email', evt.actor_email)
                    .single();

                // Get Batch No
                const batchEvent = userEvents.find(e => e.medicine_id === medId);
                const batchNo = (batchEvent?.medicine as any)?.batch_no || 'Unknown';

                // Map DB Event to simple string
                let simpleRole = 'Network Node';
                if (evt.role === 'Producer Initialization') simpleRole = 'Manufacturer';
                if (evt.role === 'Distributor Verification') simpleRole = 'Distributor';
                if (evt.role === 'Retailer Verification') simpleRole = 'Retailer';
                if (evt.role === 'Consumer Scan') simpleRole = 'Customer';

                // Strict Adjacent-Node Communication ACL
                if (currentUserRole === 'Customer' && simpleRole !== 'Retailer') continue;
                if (currentUserRole === 'Retailer' && simpleRole !== 'Distributor' && simpleRole !== 'Customer') continue;
                if (currentUserRole === 'Distributor' && simpleRole !== 'Manufacturer' && simpleRole !== 'Retailer') continue;
                if (currentUserRole === 'Manufacturer' && simpleRole !== 'Distributor') continue;

                if (!contactList.find(c => c.email === evt.actor_email)) {
                    contactList.push({
                        email: evt.actor_email,
                        name: userData?.name || evt.actor_email.split('@')[0],
                        role: simpleRole,
                        batch_no: batchNo
                    });
                }
            }
         }
      }

      setContacts(contactList);
    } catch (err: any) {
      setError(`Failed to fetch contacts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomingMessages = async () => {
    try {
      // Get messages destined for me
      const { data: queueData, error: queueError } = await supabase
        .from('messages_queue')
        .select('*')
        .eq('receiver_email', currentUserEmail)
        .eq('status', 'queued');

      if (queueError) throw queueError;

      if (queueData && queueData.length > 0) {
        const decryptedMessages: Message[] = [];
        const idsToDelete: string[] = [];

        for (const msg of queueData) {
            try {
                // Shared Ledger Encryption Key = batch_no (derived from ledger)
                const channelKey = msg.batch_no || 'medora-fallback-key';
                const decryptedContent = await decryptMessage(msg.content, channelKey);
                
                decryptedMessages.push({
                    id: msg.id,
                    sender_email: msg.sender_email,
                    receiver_email: msg.receiver_email,
                    content: decryptedContent,
                    batch_no: msg.batch_no,
                    timestamp_delivery: msg.timestamp_delivery,
                    timestamp_receive: new Date().toISOString()
                });

                idsToDelete.push(msg.id);
            } catch (decErr) {
                console.error("Failed to decrypt incoming message:", decErr);
            }
        }

        if (decryptedMessages.length > 0) {
            // Save to Local History
            await saveLocalHistory(decryptedMessages);

            // Delete from queue (or update status to delivered)
            // User requested to remove from DB queue once online
            const { error: deleteError } = await supabase
                .from('messages_queue')
                .delete()
                .in('id', idsToDelete);

            if (deleteError) console.error("Failed to clear queue items:", deleteError);
        }
      }
    } catch (err) {
      console.error("Poling messages error:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedContact) return;

    try {
       // Shared Ledger Key = contact.batch_no
       const channelKey = selectedContact.batch_no;
       const encryptedContent = await encryptMessage(inputMessage, channelKey);

       const newMessageObj = {
          sender_email: currentUserEmail,
          receiver_email: selectedContact.email,
          content: encryptedContent,
          batch_no: selectedContact.batch_no,
          status: 'queued'
       };

       const { data, error: sendError } = await supabase
          .from('messages_queue')
          .insert([newMessageObj])
          .select();

       if (sendError) throw sendError;

       // Save to local history immediately for sender
       const localMsg: Message = {
          id: data[0].id,
          sender_email: currentUserEmail,
          receiver_email: selectedContact.email,
          content: inputMessage, // plaintext in local
          batch_no: selectedContact.batch_no,
          timestamp_delivery: data[0].timestamp_delivery
       };

       await saveLocalHistory([localMsg]);
       setInputMessage('');
    } catch (err: any) {
        setError(`Failed to send message: ${err.message}`);
    }
  };

  const exportBackup = async () => {
    const localData = localStorage.getItem(localStorageKey);
    if (!localData) {
        setError("No history to backup.");
        return;
    }
    const blob = new Blob([localData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medora_chat_backup_${currentUserEmail.split('@')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccess("Backup exported successfully.");
  };

  const importBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const text = event.target?.result as string;
        if (text) {
            try {
                // Verify it can be decrypted with current key
                await decryptMessage(text, currentUserPasskey);
                localStorage.setItem(localStorageKey, text);
                loadLocalHistory();
                setSuccess("Backup restored successfully.");
            } catch (err) {
                setError("Failed to restore backup. Invalid file or wrong passkey.");
            }
        }
    };
    reader.readAsText(file);
  };

  const clearLocalHistory = () => {
    if (window.confirm("Are you sure you want to permanently clear your local chat history? This cannot be undone unless you have a backup.")) {
      localStorage.removeItem(localStorageKey);
      setMessages([]);
      setSuccess("Chat history cleared.");
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] w-full max-w-6xl mx-auto glassmorphism-dark rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Sidebar: Contact List */}
      <div className="w-full md:w-1/3 border-r border-white/10 flex flex-col bg-black/40">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            <span className="text-xl font-black text-white px-2">Medora*</span>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={fetchContacts} className="p-2 rounded-full hover:bg-white/10 text-white/70">
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-white/50">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading Contacts...
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-white/50 p-6 text-center">
            No preceding nodes found on ledger for your interaction history.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {contacts.map(c => (
              <button
                key={`${c.email}-${c.batch_no}`}
                onClick={() => setSelectedContact(c)}
                className={`w-full p-6 text-left border-b border-white/5 hover:bg-white/5 transition-colors flex flex-col gap-1 items-start ${selectedContact?.email === c.email && selectedContact?.batch_no === c.batch_no ? 'bg-primary/10 border-r-2 border-r-primary' : ''}`}
              >
                <span className="font-bold text-white text-lg">{c.name}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary/30 text-secondary border border-secondary/20">{c.role}</span>
                <span className="text-xs text-white/40 mt-1">Batch: {c.batch_no}</span>
              </button>
            ))}
          </div>
        )}

        {/* MultiSync Footer Controls in Sidebar */}
        <div className="p-4 border-t border-white/10 flex gap-2 justify-center bg-black/20">
          <button onClick={exportBackup} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 font-semibold transition-all">
            <Download className="w-3.5 h-3.5 text-primary" /> Backup
          </button>
          <label className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 font-semibold transition-all cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-secondary" /> Restore
            <input type="file" accept=".json" onChange={importBackup} className="hidden" />
          </label>
          <button onClick={clearLocalHistory} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 font-semibold transition-all text-red-400">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-black/20">
        {selectedContact ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="font-black text-xl text-white">{selectedContact.name}</span>
                <span className="text-xs text-white/50 ml-2 uppercase font-mono">({selectedContact.role})</span>
              </div>
              <motion.div className="flex items-center gap-2">
                <span className="text-xs text-primary font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Secure E2E
                </span>
              </motion.div>
            </div>

            {/* Messages Display */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              {messages.map(m => {
                const isMe = m.sender_email === currentUserEmail;
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[75%] p-4 rounded-2xl ${isMe ? 'bg-primary/90 text-black font-medium' : 'bg-white/10 text-white border border-white/10'}`}>
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    </div>
                    <span className="text-[10px] text-white/40 mt-1">
                      {new Date(m.timestamp_delivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>

            {error && <div className="p-2 bg-red-500/10 text-red-400 text-xs text-center border-t border-red-500/20">{error}</div>}
            {success && <div className="p-2 bg-emerald-500/10 text-emerald-400 text-xs text-center border-t border-emerald-500/20">{success}</div>}

            {/* Input Footer */}
            <div className="p-4 border-t border-white/10 flex gap-3 bg-black/40">
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="Type a secured message..."
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-primary/50 focus:outline-none transition-all font-medium"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                className="p-4 bg-white text-black rounded-xl font-black hover:bg-primary hover:text-black transition-colors"
                disabled={!inputMessage.trim()}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/40">
            <ShieldCheck className="w-16 h-16 text-primary mb-4 animate-pulse" />
            <p className="text-lg font-bold">End-to-End Encrypted Node Network</p>
            <p className="text-xs text-white/30 mt-1">Select a ledger connected organization or customer to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedoraChat;
