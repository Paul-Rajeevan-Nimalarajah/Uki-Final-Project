import { useState, useEffect } from "react";
import API from "../api/axios";
import { Trash2, Plus } from "lucide-react";

const AdminAcademic = () => {
  const [academic, setAcademics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      const res = await API.get("/academic");
      setAcademics(res.data);
    } catch (err) {
      console.error(err);
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
      alert(err.response?.data?.message || "Failed to seed syllabus");
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
      alert(err.response?.data?.message || "Failed to delete");
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Academic Hierarchy Management
          </h2>
          <p className="text-sm text-slate-500">
            Manage Grade → Stream → Subject → Unit → Topics
          </p>
        </div>
        <button
          onClick={handleSeedSyllabus}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-blue hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Seed Default Syllabus</span>
        </button>
      </div>
      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl">
          {message}
        </div>
      )}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3.5 px-4">Grade &amp; Stream</th>
              <th className="py-3.5 px-4">Subject</th>
              <th className="py-3.5 px-4">Total Units</th>
              <th className="py-3.5 px-4">Total Topics</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {academic.map((item) => {
              const totalTopics = item.units.reduce(
                (sum, unit) => sum + (unit.topics ? unit.topics.length : 0),
                0
              );
              return (
                <tr
                  key={item._id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800">
                      {item.grade}
                    </span>
                    <span className="text-xs text-slate-400 block">
                      {item.stream}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    {item.subject}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {item.units.length} Units
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {totalTopics} Topics
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(item._id, item.subject)}
                      className="text-rose-600 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAcademic;
