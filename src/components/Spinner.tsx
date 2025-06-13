
import React from 'react';

const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg', message?: string }> = ({ size = 'md', message }) => {
  let spinnerSize = 'h-8 w-8';
  if (size === 'sm') spinnerSize = 'h-5 w-5';
  if (size === 'lg') spinnerSize = 'h-12 w-12';

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div
        className={`animate-spin rounded-full ${spinnerSize} border-b-2 border-t-2 border-green-500`}
      ></div>
      {message && <p className="text-green-700 text-sm">{message}</p>}
    </div>
  );
};

export default Spinner;
