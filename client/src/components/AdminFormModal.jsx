import { useEffect, useState } from 'react';

const AdminFormModal = ({
  title,
  fields,
  initialValues,
  onClose,
  onSubmit,
  submitLabel = 'Save',
}) => {
  const [values, setValues] = useState(initialValues || {});

  useEffect(() => {
    setValues(initialValues || {});
  }, [initialValues]);

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };

  const allRequiredFilled = fields.every((field) => {
    if (!field.required) return true;
    const v = values[field.name];
    return v !== undefined && v !== null && String(v).trim() !== '';
  });

  const inputBase =
    'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800"
          >
            <span className="sr-only">Close</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((field) => {
              const value = values[field.name] ?? '';
              const labelText = field.label + (field.required ? ' *' : '');

              if (field.type === 'select') {
                return (
                  <div key={field.name} className={field.fullWidth ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 mb-1.5">
                      {labelText}
                    </label>
                    <select
                      value={value}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className={inputBase}
                    >
                      <option value="">Select...</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (field.type === 'textarea') {
                return (
                  <div key={field.name} className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 mb-1.5">
                      {labelText}
                    </label>
                    <textarea
                      rows={3}
                      value={value}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className={`${inputBase} resize-none`}
                    />
                  </div>
                );
              }

              return (
                <div key={field.name} className={field.fullWidth ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 mb-1.5">
                    {labelText}
                  </label>
                  <input
                    type={field.type || 'text'}
                    value={value}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className={inputBase}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!allRequiredFilled}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminFormModal;

