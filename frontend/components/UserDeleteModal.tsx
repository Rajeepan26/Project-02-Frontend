import React from "react";

interface UserDeleteModalProps {
  open: boolean;
  userName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const UserDeleteModal: React.FC<UserDeleteModalProps> = ({
  open,
  userName,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full border-t-8 border-red-600 relative animate-fadeIn">
        <div className="flex flex-col items-center">
          <div className="mb-4">
            {/* Trash Icon */}
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
              <rect width="24" height="24" rx="12" fill="#fee2e2"/>
              <path d="M9 10v6M12 10v6M15 10v6M4 7h16M10 7V5a2 2 0 0 1 4 0v2" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-700 mb-2 text-center">Delete User?</h2>
          <p className="text-gray-700 text-center mb-6">
            Are you sure you want to <span className="font-semibold text-red-600">permanently delete</span>
            {userName ? ` ${userName}` : " this user"}? <br />
            This action <span className="font-bold text-red-700">cannot be undone</span>.
          </p>
          <div className="flex justify-center gap-4 w-full">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
};

export default UserDeleteModal;