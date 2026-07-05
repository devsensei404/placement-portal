// ManageQuestions.jsx
// Route: /assessments/:assessmentId/questions
//
// NOTE: There is no GET-all-questions endpoint on the backend.
// The question list below is built and maintained entirely from the
// responses of add/edit/delete calls — it will be empty again if you
// navigate away and come back. This is a backend limitation, not a bug.

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import "./ManageQuestions.css";
import BASE_URL from "../api";

const BASE = BASE_URL;

const EMPTY_QUESTION = {
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: "A",
  marks: "",
  difficulty: "MEDIUM",
  topic: "",
};

export default function ManageQuestions() {
  const { assessmentId } = useParams();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [headerLoading, setHeaderLoading] = useState(true);
  const [headerError, setHeaderError] = useState("");

  // Locally-maintained question list (see note above)
  const [questions, setQuestions] = useState([]);

  const [form, setForm] = useState(EMPTY_QUESTION);
  const [formMsg, setFormMsg] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);

  // If set, we're editing this question (questionId) instead of adding
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetch(`${BASE}/assessments/${assessmentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load assessment.");
        return res.json();
      })
      .then((data) => setAssessment(data))
      .catch((err) => setHeaderError(err.message))
      .finally(() => setHeaderLoading(false));
  }, [assessmentId]);

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function resetForm() {
    setForm(EMPTY_QUESTION);
    setEditingId(null);
    setFormMsg({ text: "", type: "" });
  }

  function startEdit(q) {
    setEditingId(q.questionId);
    setForm({
      questionText: q.questionText || "",
      optionA: q.optionA || "",
      optionB: q.optionB || "",
      optionC: q.optionC || "",
      optionD: q.optionD || "",
      correctOption: q.correctOption || "A",
      marks: q.marks != null ? q.marks : "",
      difficulty: q.difficulty || "MEDIUM",
      topic: q.topic || "",
    });
    setFormMsg({ text: "", type: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Error codes thrown by addQuestion/updateQuestion in AssessmentServiceImpl:
  // QUESTION_ALL_OPTIONS_REQUIRED, QUESTION_INVALID_CORRECT_OPTION,
  // QUESTION_MARKS_MUST_BE_POSITIVE, QUESTION_NOT_FOUND (update only),
  // ASSESSMENT_NOT_FOUND (add only), UNAUTHORIZED_ACTION
  function friendlyErrorMessage(code) {
    switch (code) {
      case "QUESTION_ALL_OPTIONS_REQUIRED":
        return "All four options are required.";
      case "QUESTION_INVALID_CORRECT_OPTION":
        return "Correct option must be A, B, C, or D.";
      case "QUESTION_MARKS_MUST_BE_POSITIVE":
        return "Marks must be a positive number.";
      case "QUESTION_NOT_FOUND":
        return "This question no longer exists — it may have been deleted elsewhere.";
      case "ASSESSMENT_NOT_FOUND":
        return "This assessment no longer exists.";
      case "UNAUTHORIZED_ACTION":
        return "You don't have permission to modify this question.";
      default:
        return null;
    }
  }

  async function handleSubmitQuestion() {
    if (!form.questionText || !form.optionA || !form.optionB || !form.optionC || !form.optionD) {
      setFormMsg({ text: "Question text and all four options are required.", type: "error" });
      return;
    }
    if (!form.marks || Number(form.marks) <= 0) {
      setFormMsg({ text: "Marks must be a positive number.", type: "error" });
      return;
    }

    setSaving(true);
    setFormMsg({ text: "", type: "" });

    const payload = {
      questionText: form.questionText,
      optionA: form.optionA,
      optionB: form.optionB,
      optionC: form.optionC,
      optionD: form.optionD,
      correctOption: form.correctOption,
      marks: Number(form.marks),
      difficulty: form.difficulty,
      topic: form.topic,
    };

    try {
      let res, data;
      if (editingId) {
        res = await fetch(`${BASE}/assessments/questions/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(friendlyErrorMessage(err.errorMessage) || err.errorMessage || "Failed to update question.");
        }
        data = await res.json();
        setQuestions((prev) => prev.map((q) => (q.questionId === editingId ? data : q)));
        setFormMsg({ text: "Question updated!", type: "success" });
      } else {
        res = await fetch(`${BASE}/assessments/${assessmentId}/questions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(friendlyErrorMessage(err.errorMessage) || err.errorMessage || "Failed to add question.");
        }
        data = await res.json();
        setQuestions((prev) => [...prev, data]);
        setFormMsg({ text: "Question added!", type: "success" });
      }
      setTimeout(() => resetForm(), 700);
    } catch (err) {
      setFormMsg({ text: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(questionId) {
    if (!window.confirm("Delete this question?")) return;
    try {
      const res = await fetch(`${BASE}/assessments/questions/${questionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(friendlyErrorMessage(err.errorMessage) || err.errorMessage || "Failed to delete question.");
      }
      setQuestions((prev) => prev.filter((q) => q.questionId !== questionId));
      if (editingId === questionId) resetForm();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="mq-page">
      <Navbar />
      <main className="mq-main">

        <button className="mq-btn-back" onClick={() => navigate(-1)}>
          ← Back to Assessments
        </button>

        {headerLoading && <p className="mq-loading">Loading…</p>}
        {headerError && <p className="mq-error">{headerError}</p>}

        {assessment && (
          <div className="mq-header">
            <h1 className="mq-title">{assessment.title}</h1>
            <p className="mq-subtitle">
              {assessment.durationMinutes} min · {assessment.totalMarks} marks · status: {assessment.status}
            </p>
          </div>
        )}

        <div className="mq-form-card">
          <h2 className="mq-form-heading">{editingId ? "Edit Question" : "Add Question"}</h2>

          <div className="mq-form-field">
            <label>Question Text</label>
            <textarea
              name="questionText"
              value={form.questionText}
              onChange={handleFormChange}
              rows={2}
              placeholder="Enter the question..."
            />
          </div>

          <div className="mq-form-row">
            <div className="mq-form-field">
              <label>Option A</label>
              <input name="optionA" value={form.optionA} onChange={handleFormChange} />
            </div>
            <div className="mq-form-field">
              <label>Option B</label>
              <input name="optionB" value={form.optionB} onChange={handleFormChange} />
            </div>
          </div>

          <div className="mq-form-row">
            <div className="mq-form-field">
              <label>Option C</label>
              <input name="optionC" value={form.optionC} onChange={handleFormChange} />
            </div>
            <div className="mq-form-field">
              <label>Option D</label>
              <input name="optionD" value={form.optionD} onChange={handleFormChange} />
            </div>
          </div>

          <div className="mq-form-row">
            <div className="mq-form-field">
              <label>Correct Option</label>
              <select name="correctOption" value={form.correctOption} onChange={handleFormChange}>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <div className="mq-form-field">
              <label>Marks</label>
              <input name="marks" type="number" value={form.marks} onChange={handleFormChange} placeholder="e.g. 2" />
            </div>
          </div>

          <div className="mq-form-row">
            <div className="mq-form-field">
              <label>Difficulty</label>
              <select name="difficulty" value={form.difficulty} onChange={handleFormChange}>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div className="mq-form-field">
              <label>Topic</label>
              <input name="topic" value={form.topic} onChange={handleFormChange} placeholder="e.g. Arrays" />
            </div>
          </div>

          {formMsg.text && (
            <p className={formMsg.type === "success" ? "mq-msg-success" : "mq-msg-error"}>
              {formMsg.text}
            </p>
          )}

          <div className="mq-form-actions">
            {editingId && (
              <button className="mq-btn-cancel" onClick={resetForm}>Cancel Edit</button>
            )}
            <button className="mq-btn-primary" onClick={handleSubmitQuestion} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Question"}
            </button>
          </div>
        </div>

        <div className="mq-list-section">
          <h2 className="mq-list-heading">
            Questions added this session ({questions.length})
          </h2>
          {questions.length === 0 && (
            <p className="mq-list-empty">No questions added yet in this session.</p>
          )}
          <div className="mq-question-list">
            {questions.map((q, i) => (
              <div key={q.questionId} className="mq-question-card" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="mq-question-left">
                  <p className="mq-question-text">{q.questionText}</p>
                  <p className="mq-question-meta">
                    Correct: {q.correctOption} · {q.marks} marks · {q.difficulty}
                    {q.topic ? ` · ${q.topic}` : ""}
                  </p>
                </div>
                <div className="mq-question-actions">
                  <button className="mq-btn-sm mq-btn-ghost" onClick={() => startEdit(q)}>Edit</button>
                  <button className="mq-btn-sm mq-btn-red" onClick={() => deleteQuestion(q.questionId)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
