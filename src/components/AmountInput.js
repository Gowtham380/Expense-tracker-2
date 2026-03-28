import React, { useState } from 'react';

export default function AmountInput({ 
  value, 
  onChange, 
  className = '', 
  ...props 
}) {
  const [error, setError] = useState(false);

  const triggerError = () => {
    setError(true);
    setTimeout(() => setError(false), 2000);
  };

  const handleKeyDown = (e) => {
    if (['-', '+', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
      triggerError();
    }
    if (props.onKeyDown) props.onKeyDown(e);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (val < 0) {
      triggerError();
      e.target.value = '';
      onChange(e);
    } else {
      onChange(e);
      setError(false);
    }
  };

  const handlePaste = (e) => {
    const pasteData = e.clipboardData.getData('text');
    if (pasteData.includes('-')) {
      e.preventDefault();
      triggerError();
      const positiveVal = pasteData.replace(/-/g, '');
      const numVal = parseFloat(positiveVal);
      if (!isNaN(numVal)) {
         setTimeout(() => {
           onChange({ target: { value: numVal }});
         }, 0);
      } else {
         setTimeout(() => {
           onChange({ target: { value: '' }});
         }, 0);
      }
    }
    if (props.onPaste) props.onPaste(e);
  };

  return (
    <input
      type="number"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={`${className} transition-all duration-300 ${
        error ? '!border-red-500 !shadow-[0_0_15px_rgba(239,68,68,0.8)]' : ''
      }`}
      {...props}
    />
  );
}
