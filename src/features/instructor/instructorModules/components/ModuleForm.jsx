import React, { useState, useEffect } from "react";
import useModuleStore from "../../../../store/instructor/moduleStore";

const ModuleForm = () => {
  const { saveModule, editingModule, closeModal, isLoading } = useModuleStore();
  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    description: "",
    program: "",
  });
  const [file, setFile] = useState(null);
  const [picture, setPicture] = useState(null);

  useEffect(() => {
    if (editingModule) {
      setFormData({
        title: editingModule.title,
        topic: editingModule.topic,
        description: editingModule.description,
        program: editingModule.program,
      });
    } else {
      setFormData({ title: "", topic: "", description: "", program: "" });
    }
  }, [editingModule]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = new FormData();
    Object.keys(formData).forEach((key) =>
      submissionData.append(key, formData[key])
    );
    if (file) submissionData.append("document", file);
    if (picture) submissionData.append("picture", picture);
    saveModule(submissionData);
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        {editingModule ? "Edit Module" : "Create New Module"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Module Title"
          className="form-input"
          required
        />
        <input
          type="text"
          name="topic"
          value={formData.topic}
          onChange={handleChange}
          placeholder="Module Topic"
          className="form-input"
          required
        />
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description"
          className="form-input h-24"
          required
        />
        <select
          name="program"
          value={formData.program}
          onChange={handleChange}
          className="form-select"
          required
        >
          <option value="">Select Program</option>
          <option value="LET">LET</option>
          <option value="Nursing">Nursing</option>
          <option value="Civil Service">Civil Service</option>
        </select>
        <div>
          <label>Module Document (PDF, DOC, PPT)</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="form-file-input"
          />
        </div>
        <div>
          <label>Module Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPicture(e.target.files[0])}
            className="form-file-input"
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={closeModal}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? "Saving..." : "Save Module"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModuleForm;
