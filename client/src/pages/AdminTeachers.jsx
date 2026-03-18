import { useEffect, useMemo, useState } from 'react';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import AdminLayout from '../components/AdminLayout';
import AdminTable from '../components/AdminTable';
import AdminFormModal from '../components/AdminFormModal';
import { adminAPI } from '../services/api';

const AdminTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const list = await adminAPI.getUsers({ role: 'teacher' });
        // Map API users into local teacher row shape
        setTeachers(
          list.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            subject: u.degree || 'N/A',
            yearsOfExperience: u.yearsOfTeaching ?? 0,
            status: u.status || 'active',
          })),
        );
      } catch (err) {
        console.error('Failed to load teachers', err);
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            'Failed to load teachers',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const fields = useMemo(
    () => [
      { name: 'name', label: 'Name', type: 'text', required: true, fullWidth: true },
      { name: 'email', label: 'Email', type: 'email', required: true, fullWidth: true },
      { name: 'subject', label: 'Subject', type: 'text', required: true },
      {
        name: 'yearsOfExperience',
        label: 'Years of Experience',
        type: 'number',
        required: true,
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
      { name: 'password', label: 'Password', type: 'password', required: !editingTeacher, fullWidth: true },
    ],
    [editingTeacher],
  );

  const handleCreateClick = () => {
    setEditingTeacher(null);
    setModalOpen(true);
  };

  const handleEditClick = (teacher) => {
    setEditingTeacher(teacher);
    setModalOpen(true);
  };

  const handleSave = async (values) => {
    try {
      setError('');

      const payload = {
        name: values.name,
        email: values.email,
        role: 'teacher',
        status: values.status,
        degree: values.subject,
        yearsOfTeaching: Number(values.yearsOfExperience) || 0,
      };
      if (values.password) {
        payload.password = values.password;
      }

      if (editingTeacher) {
        const updated = await adminAPI.updateUser(editingTeacher.id, payload);
        setTeachers((prev) =>
          prev.map((t) =>
            t.id === updated.id
              ? {
                  id: updated.id,
                  name: updated.name,
                  email: updated.email,
                  subject: updated.degree || 'N/A',
                  yearsOfExperience: updated.yearsOfTeaching ?? 0,
                  status: updated.status || 'active',
                }
              : t,
          ),
        );
      } else {
        const created = await adminAPI.createUser(payload);
        setTeachers((prev) => [
          {
            id: created.id,
            name: created.name,
            email: created.email,
            subject: created.degree || 'N/A',
            yearsOfExperience: created.yearsOfTeaching ?? 0,
            status: created.status || 'active',
          },
          ...prev,
        ]);
      }

      setModalOpen(false);
      setEditingTeacher(null);
    } catch (err) {
      console.error('Failed to save teacher', err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Failed to save teacher',
      );
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmingDelete) return;

    try {
      setError('');
      await adminAPI.deleteUser(confirmingDelete.id);
      setTeachers((prev) => prev.filter((t) => t.id !== confirmingDelete.id));
    } catch (err) {
      console.error('Failed to delete teacher', err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Failed to delete teacher',
      );
    } finally {
      setConfirmingDelete(null);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'subject', label: 'Subject' },
    {
      key: 'yearsOfExperience',
      label: 'Experience',
      render: (value) => `${value} yr${value === 1 ? '' : 's'}`,
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Teachers</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage teacher profiles, subjects, and experience.
            </p>
          </div>
          <button
            onClick={handleCreateClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-sm"
          >
            <FaPlus className="text-xs" />
            <span>Add Teacher</span>
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
          data={teachers}
          searchPlaceholder="Search teachers..."
          searchKeys={['name', 'email', 'subject', 'status']}
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
          title={editingTeacher ? 'Edit Teacher' : 'Add Teacher'}
          fields={fields}
          initialValues={
            editingTeacher || {
              name: '',
              email: '',
              subject: '',
              yearsOfExperience: '',
              status: 'active',
              password: '',
            }
          }
          onClose={() => {
            setModalOpen(false);
            setEditingTeacher(null);
          }}
          onSubmit={handleSave}
          submitLabel={editingTeacher ? 'Update Teacher' : 'Create Teacher'}
        />
      )}

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Delete teacher?
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

export default AdminTeachers;

