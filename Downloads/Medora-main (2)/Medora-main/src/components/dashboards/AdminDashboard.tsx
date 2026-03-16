import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Shield, Search, Building2, FileText, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface KYCData {
  companyName?: string;
  manufacturingLicense?: string;
  drugLicense?: string;
  gstNumber?: string;
  factoryAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  authorizedPerson?: string;
  phoneNumber?: string;
  emailAddress?: string;
  
  distributorCompanyName?: string;
  distributionLicense?: string;
  warehouseAddress?: string;
  contactPerson?: string;

  pharmacyName?: string;
  pharmacyLicense?: string;
  shopAddress?: string;
  ownerName?: string;
}

interface RegistrationRequest {
  id: string; // the database uuid
  email: string;
  role: string;
  status: string;
  request_id: string | null;
  kyc_data: KYCData | null;
  created_at?: string;
}

const AdminDashboard: React.FC = () => {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('role', ['Manufacturer', 'Distributor', 'Retailer'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
    } else {
      setRequests(data as RegistrationRequest[]);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } else {
      setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
    }
  };

  const filteredRequests = requests.filter(req => filter === 'All' ? true : req.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Approved': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Rejected': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getCompanyName = (req: RegistrationRequest) => {
    if (!req.kyc_data) return 'N/A';
    if (req.role === 'Manufacturer') return req.kyc_data.companyName;
    if (req.role === 'Distributor') return req.kyc_data.distributorCompanyName;
    if (req.role === 'Retailer') return req.kyc_data.pharmacyName;
    return 'N/A';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary" />
            Admin Control Panel
          </h1>
          <p className="text-white/60">Manage MedChain node registrations and KYC verifications.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Request List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            <div className="flex gap-2 p-1 bg-black/40 rounded-xl">
              {['All', 'Pending', 'Approved', 'Rejected'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === f ? 'bg-primary text-black' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text" 
                placeholder="Search Request ID..." 
                className="pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 text-white/60 text-sm">
                  <th className="p-4 font-semibold">Request ID</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Company / Store</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-white/40">Loading requests...</td></tr>
                ) : filteredRequests.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-white/40">No requests found.</td></tr>
                ) : (
                  filteredRequests.map((req) => (
                    <motion.tr 
                      key={req.id} 
                      className={`hover:bg-white/5 transition-colors cursor-pointer ${selectedRequest?.id === req.id ? 'bg-white/10' : ''}`}
                      onClick={() => setSelectedRequest(req)}
                    >
                      <td className="p-4 font-mono text-sm text-primary">{req.request_id || 'N/A'}</td>
                      <td className="p-4 text-white">{req.role}</td>
                      <td className="p-4 text-white/80">{getCompanyName(req)}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(req.status)}`}>
                          {req.status || 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-primary hover:underline text-sm font-semibold">View Details</button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-1">
          {selectedRequest ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md p-6 sticky top-24"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Request Details</h3>
                  <p className="font-mono text-sm text-primary">{selectedRequest.request_id || 'Legacy User'}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(selectedRequest.status)}`}>
                  {selectedRequest.status || 'Pending'}
                </span>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white/60 mb-2">
                    <User className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Account Info</span>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                      <div className="text-white/40">Role</div>
                      <div className="text-white font-medium">{selectedRequest.role}</div>
                      <div className="text-white/40">Email</div>
                      <div className="text-white font-medium truncate" title={selectedRequest.email}>{selectedRequest.email}</div>
                    </div>
                  </div>
                </div>

                {/* KYC Data */}
                {selectedRequest.kyc_data ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white/60 mb-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">KYC Information</span>
                    </div>
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
                      <div className="space-y-3 text-sm">
                        {Object.entries(selectedRequest.kyc_data).map(([key, value]) => {
                          if (!value) return null;
                          // Convert camelCase to Title Case
                          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                          return (
                            <div key={key}>
                              <div className="text-white/40 text-xs mb-1">{label}</div>
                              <div className="text-white font-medium break-words">{value}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200 text-sm">
                    No KYC data available for this legacy request.
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-white/10 flex gap-3">
                  <button 
                    onClick={() => updateStatus(selectedRequest.id, 'Approved')}
                    disabled={selectedRequest.status === 'Approved'}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-bold rounded-xl border border-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve
                  </button>
                  <button 
                    onClick={() => updateStatus(selectedRequest.id, 'Rejected')}
                    disabled={selectedRequest.status === 'Rejected'}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl border border-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </button>
                </div>
              </div>

            </motion.div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-white/40 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md p-8 text-center border-dashed">
              <Building2 className="w-16 h-16 mb-4 opacity-50" />
              <p>Select a registration request from the table to view details and take action.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
