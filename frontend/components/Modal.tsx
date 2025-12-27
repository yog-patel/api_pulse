'use client';

import { useState, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Modal({ isOpen, title, message, type = 'info', onClose }: ModalProps) {
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    setVisible(isOpen);
  }, [isOpen]);

  if (!visible) return null;

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  }[type];

  const titleColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
  }[type];

  const buttonColor = {
    success: 'bg-green-600 hover:bg-green-700',
    error: 'bg-red-600 hover:bg-red-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  }[type];

  const handleClose = () => {
    setVisible(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${bgColor} border rounded-lg shadow-lg p-6 max-w-sm mx-4`}>
        {title && <h2 className={`text-lg font-semibold ${titleColor} mb-2`}>{title}</h2>}
        <p className="text-gray-700 mb-6">{message}</p>
        <button
          onClick={handleClose}
          className={`${buttonColor} text-white px-4 py-2 rounded transition w-full font-medium`}
        >
          OK
        </button>
      </div>
    </div>
  );
}
