import React, { useState } from 'react';

export default function UserForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    ethnicity: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim() && formData.ethnicity.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="card">
      <h2>Participant Registration</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>Ethnicity:</label>
          <input
            type="text"
            value={formData.ethnicity}
            onChange={(e) => setFormData({...formData, ethnicity: e.target.value})}
            required
          />
        </div>
        <button type="submit">Start Test</button>
      </form>
    </div>
  );
}