import { useState, useEffect } from "react";
import API from "../api/axios";
import {
  Trash2,
  Plus,
  Edit3,
  Save,
  X,
  BookOpen,
  Layers,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const STREAMS = [
  "Physical Science",
  "Biological Science",
  "Commerce",
  "Technology",
  "Arts",
  "General",
];

const AdminAcademic = () => {
  const [academic, setAcademics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    grade: "A/L",
    stream: "Physical Science",
    subject: "",
    units: [
      {
        unitNumber: 1,
        title: "",
        topics: [{ name: "", desciption: "" }],
      },
    ],
  });

  const loadData = async () => {
    try {
      const res = await API.get("/academic");
      setAcademics(res.data);
    } catch (err) {
      setError("Failed to load academic hierarchy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeedSyllabus = async () => {
    try {
      const res = await API.post("/academic/seed");
      setMessage(res.data.message);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to seed syllabus");
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setError("");
    setFormData({
      grade: "A/L",
      stream: "Physical Science",
      subject: "",
      units: [
        {
          unitNumber: 1,
          title: "Unit 1",
          topics: [{ name: "", desciption: "" }],
        },
      ],
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setError("");
    setFormData({
      grade: item.grade || "A/L",
      stream: item.stream || "General",
      subject: item.subject || "",
      units:
        item.units && item.units.length > 0
          ? item.units.map((u, idx) => ({
              unitNumber: u.unitNumber || idx + 1,
              title: u.title || "",
              topics:
                u.topics && u.topics.length > 0
                  ? u.topics.map((t) => ({
                      name: t.name || "",
                      desciption: t.desciption || t.description || "",
                    }))
                  : [{ name: "", desciption: "" }],
            }))
          : [
              {
                unitNumber: 1,
                title: "",
                topics: [{ name: "", desciption: "" }],
              },
            ],
    });
    setShowModal(true);
  };

  const handleAddUnit = () => {
    setFormData((prev) => ({
      ...prev,
      units: [
        ...prev.units,
        {
          unitNumber: prev.units.length + 1,
          title: "",
          topics: [{ name: "", desciption: "" }],
        },
      ],
    }));
  };

  const handleRemoveUnit = (uIdx) => {
    setFormData((prev) => {
      const updated = prev.units
        .filter((_, idx) => idx !== uIdx)
        .map((u, idx) => ({ ...u, unitNumber: idx + 1 }));
      return { ...prev, units: updated };
    });
  };

  const handleUnitChange = (uIdx, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.units];
      updated[uIdx] = { ...updated[uIdx], [field]: value };
      return { ...prev, units: updated };
    });
  };

  const handleAddTopic = (uIdx) => {
    setFormData((prev) => {
      const updated = [...prev.units];
      updated[uIdx] = {
        ...updated[uIdx],
        topics: [...updated[uIdx].topics, { name: "", desciption: "" }],
      };
      return { ...prev, units: updated };
    });
  };

  const handleRemoveTopic = (uIdx, tIdx) => {
    setFormData((prev) => {
      const updated = [...prev.units];
      updated[uIdx] = {
        ...updated[uIdx],
        topics: updated[uIdx].topics.filter((_, idx) => idx !== tIdx),
      };
      return { ...prev, units: updated };
    });
  };

  const handleTopicChange = (uIdx, tIdx, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.units];
      const updatedTopics = [...updated[uIdx].topics];
      updatedTopics[tIdx] = { ...updatedTopics[tIdx], [field]: value };
      updated[uIdx] = { ...updated[uIdx], topics: updatedTopics };
      return { ...prev, units: updated };
    });
  };

  const handleSaveHierarchy = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!formData.grade.trim() || !formData.subject.trim()) {
      setError("Grade and Subject name are required.");
      return;
    }

    const cleanedUnits = formData.units
      .filter((u) => u.title && u.title.trim())
      .map((u, idx) => ({
        unitNumber: Number(u.unitNumber) || idx + 1,
        title: u.title.trim(),
        topics: (u.topics || [])
          .filter((t) => t.name && t.name.trim())
          .map((t) => ({
            name: t.name.trim(),
            desciption: (t.desciption || "").trim(),
            description: (t.desciption || "").trim(),
          })),
      }));

    setSaving(true);
    try {
      const payload = {
        grade: formData.grade.trim(),
        stream: formData.stream,
        subject: formData.subject.trim(),
        units: cleanedUnits,
      };

      if (editingId) {
        await API.put(`/academic/${editingId}`, payload);
        setMessage(`Updated "${payload.subject}" (${payload.grade}) hierarchy successfully!`);
      } else {
        await API.post("/academic", payload);
        setMessage(`Added new subject "${payload.subject}" (${payload.grade}) successfully!`);
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save academic hierarchy");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, subjectName) => {
    if (!window.confirm(`Are you sure you want to delete ${subjectName}?`))
      return;

    try {
      await API.delete(`/academic/${id}`);
      setMessage(`Deleted ${subjectName} successfully`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading academic structure ...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Academic Hierarchy Management
          </h2>
          <p className="text-sm text-slate-500">
            Add, edit, or delete Grade → Stream → Subject → Unit → Topics
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSeedSyllabus}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            <Layers className="w-4 h-4" />
            <span>Seed Default Syllabus</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-blue hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Subject &amp; Units</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {academic.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
            No academic subjects found. Click &quot;Add New Subject &amp; Units&quot; or
            &quot;Seed Default Syllabus&quot; to begin.
          </div>
        ) : (
          academic.map((item) => {
            const totalTopics = item.units.reduce(
              (sum, unit) => sum + (unit.topics ? unit.topics.length : 0),
              0
            );
            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue">
                        {item.grade}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                        {item.stream}
                      </span>
                      <span className="text-xs text-slate-500">
                        {item.units.length} Units • {totalTopics} Topics
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-slate-700" />
                      {item.subject}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Hierarchy (Units &amp; Topics)</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item._id, item.subject)}
                      className="inline-flex items-center gap-1 px-3 py-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-semibold transition-colors"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {item.units.map((u, uIdx) => (
                    <div
                      key={uIdx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Unit {u.unitNumber}: {u.title}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {u.topics?.length || 0} Topics
                        </span>
                      </div>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {u.topics?.map((t, tIdx) => (
                          <li
                            key={tIdx}
                            className="bg-white px-3 py-1.5 rounded-lg border border-slate-100 flex justify-between items-center gap-2"
                          >
                            <span className="font-semibold text-slate-800">
                              {t.name}
                            </span>
                            {(t.desciption || t.description) && (
                              <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                                {t.desciption || t.description}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Subject, Units & Topics Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto my-8">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingId
                    ? "Edit Academic Hierarchy (Subject, Units & Topics)"
                    : "Add New Subject Hierarchy"}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure Grade, Stream, Subject, Units, and Topics
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHierarchy} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Grade Level *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.grade}
                    onChange={(e) =>
                      setFormData({ ...formData, grade: e.target.value })
                    }
                    placeholder="e.g. A/L or Grade 11 (O/L)"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Stream *
                  </label>
                  <select
                    value={formData.stream}
                    onChange={(e) =>
                      setFormData({ ...formData, stream: e.target.value })
                    }
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
                  >
                    {STREAMS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    placeholder="e.g. Combined Mathematics"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-slate-900">
                    Units &amp; Topics
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddUnit}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Unit</span>
                  </button>
                </div>

                {formData.units.map((unit, uIdx) => (
                  <div
                    key={uIdx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-bold bg-slate-200 text-slate-800 px-2.5 py-1.5 rounded-lg shrink-0">
                          Unit {uIdx + 1}
                        </span>
                        <input
                          type="text"
                          required
                          value={unit.title}
                          onChange={(e) =>
                            handleUnitChange(uIdx, "title", e.target.value)
                          }
                          placeholder="Unit Title (e.g. Pure Mathematics)"
                          className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAddTopic(uIdx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20 text-xs font-semibold rounded-lg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Topic</span>
                        </button>
                        {formData.units.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveUnit(uIdx)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Remove Unit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 pl-2 border-l-2 border-slate-200">
                      {unit.topics.map((topic, tIdx) => (
                        <div
                          key={tIdx}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                        >
                          <div className="sm:col-span-5">
                            <input
                              type="text"
                              required
                              value={topic.name}
                              onChange={(e) =>
                                handleTopicChange(
                                  uIdx,
                                  tIdx,
                                  "name",
                                  e.target.value
                                )
                              }
                              placeholder="Topic Name (e.g. Integration)"
                              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                            />
                          </div>
                          <div className="sm:col-span-6">
                            <input
                              type="text"
                              value={topic.desciption}
                              onChange={(e) =>
                                handleTopicChange(
                                  uIdx,
                                  tIdx,
                                  "desciption",
                                  e.target.value
                                )
                              }
                              placeholder="Topic Description (optional)"
                              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                            />
                          </div>
                          <div className="sm:col-span-1 text-right">
                            {unit.topics.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTopic(uIdx, tIdx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600"
                                title="Remove Topic"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-brand-blue hover:bg-blue-700 rounded-xl shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Save Hierarchy Changes"
                      : "Create Subject Hierarchy"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAcademic;
