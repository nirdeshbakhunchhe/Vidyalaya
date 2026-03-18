import { useEffect, useMemo, useState } from 'react';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import AdminLayout from '../components/AdminLayout';
import AdminTable from '../components/AdminTable';
import AdminFormModal from '../components/AdminFormModal';
import { adminAPI } from '../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const list = await adminAPI.getUsers();
        setUsers(list);
      } catch (err) {
        console.error('Failed to load users', err);
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            'Failed to load users',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const fields = useMemo(
    () => [
      { name: 'name', label: 'Name', type: 'text', required: true, fullWidth: true },
      { name: 'email', label: 'Email', type: 'email', required: true, fullWidth: true },
      {
        name: 'role',
        label: 'Role',
        type: 'select',
        required: true,
        options: [
          { label: 'Student', value: 'student' },
          { label: 'Teacher', value: 'teacher' },
          { label: 'Admin', value: 'admin' },
        ],
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
      { name: 'password', label: 'Password', type: 'password', required: !editingUser, fullWidth: true },
    ],
    [editingUser],
  );

  const handleCreateClick = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleSave = async (values) => {
    try {
      setError('');

      if (editingUser) {
        const payload = {
          name: values.name,
          email: values.email,
          role: values.role,
          status: values.status,
        };
        if (values.password) {
          payload.password = values.password;
        }

        const updated = await adminAPI.updateUser(editingUser.id, payload);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      } else {
        const payload = {
          name: values.name,
          email: values.email,
          role: values.role,
          status: values.status || 'active',
        };
        if (values.password) {
          payload.password = values.password;
        }

        const created = await adminAPI.createUser(payload);
        setUsers((prev) => [created, ...prev]);
      }

      setModalOpen(false);
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to save user', err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Failed to save user',
      );
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmingDelete) return;

    try {
      setError('');
      await adminAPI.deleteUser(confirmingDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== confirmingDelete.id));
    } catch (err) {
      console.error('Failed to delete user', err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Failed to delete user',
      );
    } finally {
      setConfirmingDelete(null);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 capitalize">
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            value === 'active'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {value === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Users</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage all registered users.
            </p>
          </div>
          <button
            onClick={handleCreateClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-sm"
          >
            <FaPlus className="text-xs" />
            <span>Add User</span>
          </button>
        </div>

        {error && (
          <div className="px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
        <AdminTable
          columns={columns}
          data={users}
          searchPlaceholder="Search users..."
          searchKeys={['name', 'email', 'role', 'status']}
          renderActions={(row) => (
            <div className="inline-flex items-center gap-1">
              <button
                onClick={() => handleEditClick(row)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <FaEdit className="text-xs" />
              </button>
              <button
                onClick={() => setConfirmingDelete(row)}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <FaTrash className="text-xs" />
              </button>
            </div>
          )}
        />
        )}
      </div>

      {modalOpen && (
        <AdminFormModal
          title={editingUser ? 'Edit User' : 'Add User'}
          fields={fields}
          initialValues={
            editingUser || {
              name: '',
              email: '',
              role: 'student',
              status: 'active',
              password: '',
            }
          }
          onClose={() => {
            setModalOpen(false);
            setEditingUser(null);
          }}
          onSubmit={handleSave}
          submitLabel={editingUser ? 'Update User' : 'Create User'}
        />
      )}

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Delete user?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete{' '}
              <span className="font-semibold">{confirmingDelete.name}</span>? This action cannot
              be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmingDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;

