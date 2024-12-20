import { useState, useEffect } from 'react';
import ListComponent from '../common/ListComponent';
import VendorForm from './VendorForm';
import axios from 'axios';
import { Trash2, X, Pencil } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'react-toastify';
import { baseURL } from '../../utils/endpoint';
import { Modal } from 'antd';
const VendorsComponent = () => {
    const { isDarkMode } = useTheme();
    const [vendors, setVendors] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingVendor, setEditingVendor] = useState(null);
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [tempFormData, setTempFormData] = useState(null);
    const [passwordData, setPasswordData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');

    // Toast configuration
    const toastConfig = {
        position: "top-right",
        autoClose: 3000,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
            background: isDarkMode ? '#1F2937' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#1F2937',
        }
    };

    const getToken = () => localStorage.getItem('token');

    const fetchVendors = async (page = 1, limit = 5, search = '') => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await axios.get(
                `${baseURL}/vendors?page=${page}&limit=${limit}&search=${search}`,
                {
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                }
            );
            setVendors(response.data.vendors || []);
            setTotalPages(response.data.totalPages || 1);
        } catch (err) {
            const errorMessage = 'Failed to fetch vendors. Please try again later.';
            console.error('Error fetching vendors:', err);
            setError(errorMessage);
            toast.error(errorMessage, toastConfig);
            setVendors([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCloseModal();
            }
        };

        if (isModalOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    const handleCreateNew = () => {
        setEditingVendor(null);
        setIsModalOpen(true);
        setError(null);
    };

    const handleEdit = (vendor) => {
        setEditingVendor(vendor);
        setIsModalOpen(true);
        setError(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingVendor(null);
        setError(null);
    };

    const handleSubmit = async (formData) => {
        try {
            setError(null);
            
            if (editingVendor) {
                // Handle edit case directly
                setIsLoading(true);
                await axios.put(
                    `${baseURL}/vendors/${editingVendor._id}`,
                    formData,
                    {
                        headers: {
                            'Authorization': `Bearer ${getToken()}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                toast.success('Vendor updated successfully!', toastConfig);
                await fetchVendors();
                setIsModalOpen(false);
                setEditingVendor(null);
            } else {
                // For new vendor, show password modal
                setTempFormData(formData);
                setIsModalOpen(false); // Close the form modal
                setIsPasswordModalVisible(true);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || `Failed to ${editingVendor ? 'update' : 'register'} vendor`;
            setError(errorMessage);
            toast.error(errorMessage, toastConfig);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        setPasswordError('');
    };

    const handlePasswordSubmit = async () => {
        if (passwordData.password !== passwordData.confirmPassword) {
            setPasswordError("Passwords don't match");
            return;
        }
        if (passwordData.password.length < 6) {
            setPasswordError("Password must be at least 6 characters long");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const completeData = {
                ...tempFormData,
                password: passwordData.password
            };

            // Use vendor-register endpoint for creating new vendor
            await axios.post(
                `${baseURL}/auth/vendor-register`,
                completeData,
                {
                    headers: {
                        'Authorization': `Bearer ${getToken()}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            toast.success('Vendor registered successfully!', toastConfig);
            await fetchVendors();
            setIsPasswordModalVisible(false);
            setPasswordData({ password: '', confirmPassword: '' });
            setTempFormData(null);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to register vendor';
            setError(errorMessage);
            toast.error(errorMessage, toastConfig);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteVendor = (vendorId, vendorName) => {
        toast(
            ({ closeToast }) => (
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-2">
                        <Trash2 className="w-5 h-5 text-red-500" />
                        <span className="font-medium">Delete Vendor</span>
                    </div>
                    <p>Are you sure you want to delete this vendor? This action cannot be undone.</p>
                    {vendorName && (
                        <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <span className="font-medium">{vendorName}</span>
                        </div>
                    )}
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={closeToast}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
                                ${isDarkMode
                                    ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={async () => {
                                try {
                                    setIsLoading(true);
                                    await axios.delete(
                                        `${baseURL}/vendors/${vendorId}`,
                                        {
                                            headers: { 'Authorization': `Bearer ${getToken()}` }
                                        }
                                    );
                                    toast.success('Vendor deleted successfully', toastConfig);
                                    await fetchVendors();
                                } catch (err) {
                                    toast.error('Failed to delete vendor. Please try again.', toastConfig);
                                    console.error('Error deleting vendor:', err);
                                } finally {
                                    setIsLoading(false);
                                    closeToast();
                                }
                            }}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ),
            {
                position: "top-center",
                autoClose: false,
                closeOnClick: false,
                closeButton: false,
                style: {
                    background: isDarkMode ? '#1F2937' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#1F2937',
                    minWidth: '320px',
                }
            }
        );
    };

    const columns = [
        { header: 'Vendor Code', key: 'vendorCode' },
        { header: 'Name', key: 'name' },
        { header: 'Contact Person', key: 'contactPerson' },
        { header: 'Mobile', key: 'mobileNumber' },
        { header: 'City', key: 'address', render: (item) => item.address?.city || '-' },
        { header: 'State', key: 'address', render: (item) => item.address?.state || '-' },
        {
            header: 'Actions',
            key: 'actions',
            render: (item) => (
                <div className="flex items-center justify-end space-x-2">
                    <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 focus:outline-none p-1 hover:bg-blue-50 rounded-full transition-colors"
                        title="Edit Vendor"
                        disabled={isLoading}
                    >
                        <Pencil size={20} />
                    </button>
                    <button
                        onClick={() => handleDeleteVendor(item._id, item.name)}
                        className="text-red-600 hover:text-red-900 focus:outline-none p-1 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete Vendor"
                        disabled={isLoading}
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="container p-6">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                    role="alert"
                >
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}

            <ListComponent
                title="Vendors"
                data={vendors}
                columns={columns}
                onFetch={fetchVendors}
                totalPages={totalPages}
                onCreateNew={handleCreateNew}
                isLoading={isLoading}
            />

            {/* Modal */}
            {isModalOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                        onClick={handleCloseModal}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-lg shadow-xl
                                ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b shrink-0">
                                <h2 className="text-xl font-bold">
                                    {editingVendor ? 'Edit Vendor' : 'Create New Vendor'}
                                </h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-500 hover:text-gray-700 focus:outline-none p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-4 min-h-0">
                                <VendorForm
                                    onSubmit={handleSubmit}
                                    onCancel={handleCloseModal}
                                    isLoading={isLoading}
                                    initialData={editingVendor}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Password Modal */}
            <Modal
                title="Set Vendor Password"
                open={isPasswordModalVisible}
                onOk={handlePasswordSubmit}
                onCancel={() => {
                    setIsPasswordModalVisible(false);
                    setPasswordData({ password: '', confirmPassword: '' });
                    setPasswordError('');
                }}
                okText="Register Vendor"
                cancelText="Cancel"
                confirmLoading={isLoading}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Password*</label>
                        <input
                            type="password"
                            name="password"
                            value={passwordData.password}
                            onChange={handlePasswordChange}
                            className="w-full p-2 border rounded"
                            required
                            placeholder="Enter password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Confirm Password*</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className="w-full p-2 border rounded"
                            required
                            placeholder="Confirm password"
                        />
                    </div>
                    {passwordError && (
                        <div className="text-red-500 text-sm">
                            {passwordError}
                        </div>
                    )}
                    <div className="text-sm text-gray-500">
                        Password must be at least 6 characters long.
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export { VendorsComponent };