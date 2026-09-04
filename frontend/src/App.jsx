import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import "./App.css";

const API_URL = "https://truthtrace-107r.onrender.com";
function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const [cases, setCases] = useState([]);
  const [evidence, setEvidence] = useState([]);

  const [caseName, setCaseName] = useState("");
  const [description, setDescription] = useState("");

  const [selectedCase, setSelectedCase] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState({});

  const [reportCase, setReportCase] = useState("");

  // ==========================================
  // LOAD CASES
  // ==========================================

  const loadCases = async () => {
    try {
      const response = await fetch(
        `${API_URL}/cases/`
      );

      if (!response.ok) {
        throw new Error("Unable to load cases");
      }

      const data = await response.json();

      setCases(data);
    } catch (error) {
      console.error(error);
    }
  };


  // ==========================================
  // LOAD EVIDENCE
  // ==========================================

  const loadEvidence = async () => {
    try {
      const response = await fetch(
        `${API_URL}/evidence/`
      );

      if (!response.ok) {
        throw new Error("Unable to load evidence");
      }

      const data = await response.json();

      setEvidence(data);
    } catch (error) {
      console.error(error);
    }
  };


  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadCases();
    loadEvidence();
  }, []);


  // ==========================================
  // CREATE CASE
  // ==========================================

  const createCase = async (event) => {
    event.preventDefault();

    if (!caseName.trim()) {
      alert("Please enter a case name.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/cases/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            case_name: caseName,
            description: description
          })
        }
      );

      if (!response.ok) {
        throw new Error("Unable to create case");
      }

      alert("Investigation case created successfully.");

      setCaseName("");
      setDescription("");

      await loadCases();

      setCurrentPage("cases");
    } catch (error) {
      alert(
        `Unable to create case: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // UPLOAD EVIDENCE
  // ==========================================

  const uploadEvidence = async () => {
    if (!selectedCase) {
      alert("Please select an investigation case.");
      return;
    }

    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append(
        "case_id",
        selectedCase
      );

      formData.append(
        "file",
        selectedFile
      );

      const response = await fetch(
        `${API_URL}/evidence/`,
        {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Upload failed"
        );
      }

      alert(
        "Evidence uploaded successfully."
      );

      setSelectedFile(null);

      const fileInput =
        document.getElementById(
          "evidenceFile"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      await loadEvidence();
    } catch (error) {
      alert(
        `Unable to upload evidence: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // ANALYZE EVIDENCE
  // ==========================================

  const analyzeEvidence = async (
    evidenceId
  ) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/evidence/${evidenceId}/analyze`,
        {
          method: "POST"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Analysis failed"
        );
      }

      setAnalysisResults(
        (previousResults) => ({
          ...previousResults,
          [evidenceId]: data.analysis
        })
      );

    } catch (error) {
      alert(
        `Unable to analyze evidence: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // GET CASE NAME
  // ==========================================

  const getCaseName = (caseId) => {
    const foundCase = cases.find(
      (item) => item.id === caseId
    );

    if (!foundCase) {
      return `CASE #${caseId}`;
    }

    return foundCase.case_name;
  };


  // ==========================================
  // FORMAT FILE SIZE
  // ==========================================

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) {
      return "Unknown";
    }

    if (bytes === 0) {
      return "0 bytes";
    }

    if (bytes < 1024) {
      return `${bytes} bytes`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(2)} MB`;
  };


  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "Unknown";
    }

    return new Date(
      date
    ).toLocaleString();
  };


  // ==========================================
  // GENERATE PDF REPORT
  // ==========================================

  const generateReport = () => {
    if (!reportCase) {
      alert(
        "Please select an investigation case."
      );

      return;
    }

    const selectedCaseData =
      cases.find(
        (item) =>
          item.id === Number(reportCase)
      );

    if (!selectedCaseData) {
      alert("Case not found.");
      return;
    }

    const caseEvidence =
      evidence.filter(
        (item) =>
          item.case_id === Number(reportCase)
      );

    const pdf = new jsPDF();

    let y = 20;

    pdf.setFontSize(20);

    pdf.text(
      "TruthTrace Forensic Investigation Report",
      20,
      y
    );

    y += 15;

    pdf.setFontSize(13);

    pdf.text(
      `Case ID: ${selectedCaseData.id}`,
      20,
      y
    );

    y += 8;

    pdf.text(
      `Case Name: ${selectedCaseData.case_name}`,
      20,
      y
    );

    y += 8;

    pdf.text(
      `Status: ${selectedCaseData.status}`,
      20,
      y
    );

    y += 8;

    pdf.text(
      `Created: ${formatDate(
        selectedCaseData.created_at
      )}`,
      20,
      y
    );

    y += 15;

    pdf.setFontSize(16);

    pdf.text(
      "Evidence Summary",
      20,
      y
    );

    y += 10;

    pdf.setFontSize(11);

    if (caseEvidence.length === 0) {
      pdf.text(
        "No evidence files have been uploaded.",
        20,
        y
      );
    } else {
      caseEvidence.forEach(
        (item, index) => {
          const analysis =
            analysisResults[item.id];

          if (y > 260) {
            pdf.addPage();
            y = 20;
          }

          pdf.setFontSize(13);

          pdf.text(
            `Evidence #${index + 1}: ${item.file_name}`,
            20,
            y
          );

          y += 7;

          pdf.setFontSize(10);

          pdf.text(
            `File Type: ${
              item.file_type || "Unknown"
            }`,
            25,
            y
          );

          y += 6;

          pdf.text(
            `File Size: ${formatFileSize(
              item.file_size
            )}`,
            25,
            y
          );

          y += 6;

          const hashText =
            `SHA-256: ${item.sha256_hash}`;

          const hashLines =
            pdf.splitTextToSize(
              hashText,
              160
            );

          pdf.text(
            hashLines,
            25,
            y
          );

          y +=
            hashLines.length * 5 + 4;

          if (analysis) {
            pdf.text(
              `Integrity Status: ${analysis.integrity_status}`,
              25,
              y
            );

            y += 6;

            pdf.text(
              `Risk Level: ${analysis.risk_level}`,
              25,
              y
            );

            y += 6;

            pdf.text(
              `Analysis Status: ${analysis.analysis_status}`,
              25,
              y
            );

            y += 8;
          } else {
            pdf.text(
              "Analysis: Not performed",
              25,
              y
            );

            y += 8;
          }
        }
      );
    }

    pdf.save(
      `TruthTrace_Case_${selectedCaseData.id}_Report.pdf`
    );
  };


  // ==========================================
  // DASHBOARD
  // ==========================================

  const Dashboard = () => {
    const analyzedEvidenceCount =
      Object.keys(
        analysisResults
      ).length;

    const activeCases =
      cases.filter(
        (item) =>
          item.status === "Active"
      ).length;

    return (
      <div className="page-content">

        <div className="page-header">
          <div>
            <h1>
              Investigation Dashboard
            </h1>

            <p>
              Monitor cases, digital evidence
              and forensic investigation activity.
            </p>
          </div>

          <div className="system-status">
            <span className="status-dot"></span>
            System Active
          </div>
        </div>


        <div className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon">
              📁
            </div>

            <div>
              <p>Total Cases</p>

              <h2>
                {cases.length}
              </h2>
            </div>
          </div>


          <div className="stat-card">
            <div className="stat-icon">
              📄
            </div>

            <div>
              <p>Total Evidence</p>

              <h2>
                {evidence.length}
              </h2>
            </div>
          </div>


          <div className="stat-card">
            <div className="stat-icon">
              🔬
            </div>

            <div>
              <p>Analyzed Cases</p>

              <h2>
                {analyzedEvidenceCount}
              </h2>
            </div>
          </div>


          <div className="stat-card">
            <div className="stat-icon">
              ⚠️
            </div>

            <div>
              <p>Active Investigations</p>

              <h2>
                {activeCases}
              </h2>
            </div>
          </div>

        </div>


        <div className="dashboard-grid">

          <div className="dashboard-panel">

            <div className="panel-header">
              <div>
                <h2>
                  Recent Investigation Cases
                </h2>

                <p>
                  Latest cases in the forensic system
                </p>
              </div>

              <button
                className="text-button"
                onClick={() =>
                  setCurrentPage("cases")
                }
              >
                View All →
              </button>
            </div>


            {cases.slice(0, 3).map(
              (item) => (

                <div
                  className="recent-item"
                  key={item.id}
                >

                  <div className="recent-icon">
                    📁
                  </div>

                  <div className="recent-info">

                    <h3>
                      {item.case_name}
                    </h3>

                    <p>
                      CASE #{item.id}
                    </p>

                    <small>
                      Created:{" "}
                      {formatDate(
                        item.created_at
                      )}
                    </small>

                  </div>

                  <span
                    className={`status-badge ${item.status.toLowerCase()}`}
                  >
                    {item.status}
                  </span>

                </div>

              )
            )}

          </div>


          <div className="dashboard-panel">

            <div className="panel-header">
              <div>
                <h2>
                  Recent Evidence
                </h2>

                <p>
                  Latest files added to investigations
                </p>
              </div>

              <button
                className="text-button"
                onClick={() =>
                  setCurrentPage("evidence")
                }
              >
                View All →
              </button>
            </div>


            {evidence.slice(0, 3).map(
              (item) => (

                <div
                  className="recent-item"
                  key={item.id}
                >

                  <div className="recent-icon">
                    📄
                  </div>

                  <div className="recent-info">

                    <h3>
                      {item.file_name}
                    </h3>

                    <p>
                      {getCaseName(
                        item.case_id
                      )}
                    </p>

                    <small>
                      {formatFileSize(
                        item.file_size
                      )}
                    </small>

                  </div>

                  <span className="verified-badge">
                    ✓ Recorded
                  </span>

                </div>

              )
            )}

          </div>

        </div>


        <div className="overview-panel">

          <h2>
            Forensic System Overview
          </h2>

          <p>
            Current investigation activity summary
          </p>


          <div className="overview-grid">

            <div>
              <span>
                Case Records
              </span>

              <strong>
                {cases.length}
              </strong>
            </div>


            <div>
              <span>
                Evidence Files
              </span>

              <strong>
                {evidence.length}
              </strong>
            </div>


            <div>
              <span>
                Evidence Integrity
              </span>

              <strong>
                SHA-256 Enabled
              </strong>
            </div>


            <div>
              <span>
                System Status
              </span>

              <strong className="operational">
                ● Operational
              </strong>
            </div>

          </div>

        </div>

      </div>
    );
  };


  // ==========================================
  // CASES PAGE
  // ==========================================

  const CasesPage = () => {
    return (
      <div className="page-content">

        <div className="page-header">
          <div>
            <h1>
              Investigation Cases
            </h1>

            <p>
              Create and manage forensic investigations.
            </p>
          </div>
        </div>


        <div className="content-card">

          <h2>
            Create New Investigation
          </h2>


          <form
            onSubmit={createCase}
            className="case-form"
          >

            <input
              type="text"
              placeholder="Investigation case name"
              value={caseName}
              onChange={(event) =>
                setCaseName(
                  event.target.value
                )
              }
            />


            <textarea
              placeholder="Case description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
            />


            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? "Creating..."
                : "Create Investigation"
              }
            </button>

          </form>

        </div>


        <div className="content-card">

          <h2>
            Investigation Cases
          </h2>

          <p className="section-subtitle">
            {cases.length} investigations
          </p>


          <div className="cases-list">

            {cases.map(
              (item) => (

                <div
                  className="case-card"
                  key={item.id}
                >

                  <div className="case-top">

                    <span>
                      CASE #{item.id}
                    </span>

                    <span
                      className={`status-badge ${item.status.toLowerCase()}`}
                    >
                      {item.status}
                    </span>

                  </div>


                  <h3>
                    {item.case_name}
                  </h3>


                  <p>
                    {item.description ||
                      "No description provided."
                    }
                  </p>


                  <small>
                    Created:{" "}
                    {formatDate(
                      item.created_at
                    )}
                  </small>

                </div>

              )
            )}


            {cases.length === 0 && (
              <div className="empty-state">
                📁
                <h3>
                  No investigation cases yet
                </h3>

                <p>
                  Create your first forensic investigation.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    );
  };


  // ==========================================
  // EVIDENCE PAGE
  // ==========================================

  const EvidencePage = () => {
    return (
      <div className="page-content">

        <div className="page-header">

          <div>

            <h1>
              Digital Evidence
            </h1>

            <p>
              Upload, preserve and analyze
              digital forensic evidence.
            </p>

          </div>

        </div>


        {/* UPLOAD SECTION */}

        <div className="content-card">

          <h2>
            Upload New Evidence
          </h2>


          <div className="upload-form">

            <select
              value={selectedCase}
              onChange={(event) =>
                setSelectedCase(
                  event.target.value
                )
              }
            >

              <option value="">
                Select Investigation Case
              </option>


              {cases.map(
                (item) => (

                  <option
                    key={item.id}
                    value={item.id}
                  >
                    CASE #{item.id} -{" "}
                    {item.case_name}
                  </option>

                )
              )}

            </select>


            <div className="file-input-wrapper">

              <input
                id="evidenceFile"
                type="file"
                onChange={(event) =>
                  setSelectedFile(
                    event.target.files[0]
                  )
                }
              />

            </div>


            {selectedFile && (
              <div className="selected-file">

                Selected File:{" "}

                <strong>
                  {selectedFile.name}
                </strong>

              </div>
            )}


            <button
              className="primary-button"
              onClick={uploadEvidence}
              disabled={loading}
            >

              {loading
                ? "Uploading..."
                : "Upload Evidence"
              }

            </button>

          </div>

        </div>


        {/* EVIDENCE LIST */}

        <div className="content-card">

          <h2>
            Uploaded Evidence
          </h2>

          <p className="section-subtitle">
            {evidence.length} file
            {evidence.length !== 1
              ? "s"
              : ""
            }
          </p>


          {evidence.length === 0 ? (

            <div className="empty-state">

              📄

              <h3>
                No evidence uploaded
              </h3>

              <p>
                Upload a file to begin forensic analysis.
              </p>

            </div>

          ) : (

            <div className="evidence-list">

              {evidence.map(
                (item) => {

                  const analysis =
                    analysisResults[
                      item.id
                    ];

                  return (

                    <div
                      className="evidence-card"
                      key={item.id}
                    >

                      <div className="evidence-header">

                        <div>

                          <span className="evidence-number">
                            EVIDENCE #{item.id}
                          </span>

                          <h3>
                            📄 {item.file_name}
                          </h3>

                        </div>


                        <span className="case-badge">
                          CASE #{item.case_id}
                        </span>

                      </div>


                      <div className="evidence-details">

                        <p>
                          <strong>
                            File Type:
                          </strong>{" "}
                          {item.file_type ||
                            "Unknown"}
                        </p>


                        <p>
                          <strong>
                            File Size:
                          </strong>{" "}
                          {formatFileSize(
                            item.file_size
                          )}
                        </p>


                        <p className="hash-text">
                          <strong>
                            SHA-256:
                          </strong>{" "}
                          {item.sha256_hash}
                        </p>

                      </div>


                      <button
                        className="primary-button analyze-button"
                        onClick={() =>
                          analyzeEvidence(
                            item.id
                          )
                        }
                        disabled={loading}
                      >

                        🔍 {loading
                          ? "Analyzing..."
                          : "Analyze Evidence"
                        }

                      </button>


                      {/* ANALYSIS RESULT */}
                      {analysis && (
                        <div
                          className="analysis-result"
                          style={{
                            marginTop: "20px",
                            padding: "22px",
                            borderRadius: "16px",
                            border: "1px solid #d9e1ef",
                            background: "#f8fafc",
                            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)"
                          }}
                        >
                          <div
                            className="analysis-title-row"
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "12px",
                              marginBottom: "18px",
                              flexWrap: "wrap"
                            }}
                          >
                            <div>
                              <h2 style={{ margin: 0, fontSize: "22px" }}>
                                🔬 Forensic Analysis Result
                              </h2>
                              <p
                                style={{
                                  margin: "5px 0 0",
                                  color: "#64748b",
                                  fontSize: "14px"
                                }}
                              >
                                Automated evidence integrity and risk assessment
                              </p>
                            </div>

                            <span
                              className={`risk-badge ${
                                (analysis.risk_level || "unknown").toLowerCase()
                              }`}
                              style={{
                                padding: "8px 14px",
                                borderRadius: "999px",
                                fontWeight: 700,
                                background:
                                  analysis.risk_level === "Low"
                                    ? "#dcfce7"
                                    : analysis.risk_level === "Medium"
                                    ? "#fef3c7"
                                    : "#fee2e2",
                                color:
                                  analysis.risk_level === "Low"
                                    ? "#166534"
                                    : analysis.risk_level === "Medium"
                                    ? "#92400e"
                                    : "#b91c1c"
                              }}
                            >
                              {analysis.risk_level === "Low"
                                ? "🟢"
                                : analysis.risk_level === "Medium"
                                ? "🟡"
                                : "🔴"}{" "}
                              Risk: {analysis.risk_level || "Unknown"}
                            </span>
                          </div>

                          <div
                            className="analysis-grid"
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit, minmax(180px, 1fr))",
                              gap: "14px",
                              marginBottom: "20px"
                            }}
                          >
                            {[
                              {
                                label: "Analysis Status",
                                value: analysis.analysis_status || "Unknown",
                                icon: "🛡️"
                              },
                              {
                                label: "Integrity",
                                value: analysis.integrity_status || "Unknown",
                                icon:
                                  analysis.integrity_status === "Verified"
                                    ? "✓"
                                    : "⚠"
                              },
                              {
                                label: "File Category",
                                value: analysis.file_category || "Unknown",
                                icon: "📁"
                              },
                              {
                                label: "Extension",
                                value: analysis.file_extension || "Unknown",
                                icon: "📄"
                              }
                            ].map((info) => (
                              <div
                                key={info.label}
                                className="analysis-box"
                                style={{
                                  padding: "16px",
                                  borderRadius: "12px",
                                  background: "#ffffff",
                                  border: "1px solid #e2e8f0"
                                }}
                              >
                                <span
                                  style={{
                                    display: "block",
                                    color: "#64748b",
                                    fontSize: "13px",
                                    marginBottom: "7px"
                                  }}
                                >
                                  {info.icon} {info.label}
                                </span>
                                <strong
                                  className={
                                    info.label === "Integrity" &&
                                    info.value === "Verified"
                                      ? "success-text"
                                      : ""
                                  }
                                  style={{
                                    fontSize: "16px",
                                    color:
                                      info.label === "Integrity" &&
                                      info.value === "Verified"
                                        ? "#15803d"
                                        : "#1e293b"
                                  }}
                                >
                                  {info.value}
                                </strong>
                              </div>
                            ))}
                          </div>

                          <div
                            style={{
                              padding: "16px",
                              borderRadius: "12px",
                              background:
                                analysis.integrity_status === "Verified"
                                  ? "#f0fdf4"
                                  : "#fff7ed",
                              border: `1px solid ${
                                analysis.integrity_status === "Verified"
                                  ? "#bbf7d0"
                                  : "#fed7aa"
                              }`,
                              marginBottom: "20px"
                            }}
                          >
                            <strong
                              style={{
                                color:
                                  analysis.integrity_status === "Verified"
                                    ? "#166534"
                                    : "#9a3412"
                              }}
                            >
                              {analysis.integrity_status === "Verified"
                                ? "✓ Integrity Verified"
                                : "⚠ Integrity Warning"}
                            </strong>
                            <p
                              style={{
                                margin: "6px 0 0",
                                color: "#475569"
                              }}
                            >
                              {analysis.integrity_status === "Verified"
                                ? "The current SHA-256 hash matches the original evidence hash. No file modification was detected."
                                : "The current SHA-256 hash does not match the original evidence hash. The evidence may have been modified."}
                            </p>
                          </div>

                          <div
                            className="analysis-section"
                            style={{
                              background: "#ffffff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "12px",
                              padding: "18px",
                              marginBottom: "16px"
                            }}
                          >
                            <h3 style={{ marginTop: 0 }}>
                              🔐 Hash Verification
                            </h3>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit, minmax(280px, 1fr))",
                                gap: "14px"
                              }}
                            >
                              <div>
                                <strong>Original SHA-256</strong>
                                <div
                                  className="hash-text"
                                  style={{
                                    marginTop: "7px",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    background: "#f1f5f9",
                                    wordBreak: "break-all",
                                    fontFamily: "monospace",
                                    fontSize: "12px"
                                  }}
                                >
                                  {analysis.original_sha256 || "Not available"}
                                </div>
                              </div>

                              <div>
                                <strong>Current SHA-256</strong>
                                <div
                                  className="hash-text"
                                  style={{
                                    marginTop: "7px",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    background: "#f1f5f9",
                                    wordBreak: "break-all",
                                    fontFamily: "monospace",
                                    fontSize: "12px"
                                  }}
                                >
                                  {analysis.current_sha256 || "Not available"}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            className="analysis-section"
                            style={{
                              background: "#ffffff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "12px",
                              padding: "18px",
                              marginBottom: "16px"
                            }}
                          >
                            <h3 style={{ marginTop: 0 }}>
                              ⚠ Suspicious Indicators
                            </h3>

                            {Array.isArray(
                              analysis.suspicious_indicators
                            ) &&
                            analysis.suspicious_indicators.length > 0 ? (
                              <ul
                                className="indicator-list"
                                style={{
                                  margin: 0,
                                  paddingLeft: "20px"
                                }}
                              >
                                {analysis.suspicious_indicators.map(
                                  (indicator, index) => (
                                    <li
                                      key={index}
                                      style={{
                                        marginBottom: "8px",
                                        color: "#b45309"
                                      }}
                                    >
                                      ⚠ {indicator}
                                    </li>
                                  )
                                )}
                              </ul>
                            ) : (
                              <div
                                className="safe-indicator"
                                style={{
                                  padding: "12px 14px",
                                  borderRadius: "10px",
                                  background: "#f0fdf4",
                                  color: "#166534",
                                  fontWeight: 600
                                }}
                              >
                                ✓ No suspicious indicators were detected.
                              </div>
                            )}
                          </div>

                          <div
                            className="analysis-message"
                            style={{
                              padding: "16px",
                              borderRadius: "12px",
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe"
                            }}
                          >
                            <strong style={{ color: "#1d4ed8" }}>
                              📋 Analysis Summary
                            </strong>
                            <p
                              style={{
                                margin: "8px 0 0",
                                color: "#334155",
                                lineHeight: 1.6
                              }}
                            >
                              {analysis.message ||
                                "Forensic analysis completed successfully."}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                  );

                }
              )}

            </div>

          )}

        </div>

      </div>
    );
  };


  // ==========================================
  // REPORTS PAGE
  // ==========================================

  const ReportsPage = () => {
    const selectedCaseData =
      cases.find(
        (item) => item.id === Number(reportCase)
      );

    const evidenceCount =
      evidence.filter(
        (item) => item.case_id === Number(reportCase)
      ).length;

    return (
      <div
        className="page-content reports-page"
        style={{
          width: "100%",
          maxWidth: "1500px",
          margin: "0 auto"
        }}
      >

        <div className="page-header report-page-header">
          <div>
            <h1>Forensic Reports</h1>
            <p>
              Generate and download digital forensic investigation reports.
            </p>
          </div>
        </div>

        <div
          className="content-card reports-generator-card"
          style={{
            background: "#ffffff",
            borderRadius: "21px",
            padding: "28px",
            marginBottom: "25px",
            border: "1px solid #d7e0ec",
            boxShadow: "0 10px 30px rgba(32, 53, 84, 0.08)"
          }}
        >
          <div
            className="reports-card-title"
            style={{ marginBottom: "20px" }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#26364e",
                  fontSize: "21px"
                }}
              >
                Generate Investigation Report
              </h2>
              <p
                style={{
                  margin: "6px 0 0",
                  color: "#718096",
                  fontSize: "14px"
                }}
              >
                Select an investigation case to create a complete forensic report.
              </p>
            </div>
          </div>

          <div
            className="reports-form"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}
          >
            <label
              htmlFor="report-case-select"
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#344054"
              }}
            >
              Investigation Case
            </label>

            <select
              id="report-case-select"
              className="report-case-select"
              style={{
                width: "100%",
                minHeight: "48px",
                padding: "12px 15px",
                border: "1px solid #d4dce8",
                borderRadius: "11px",
                background: "#f8fafc",
                color: "#26364e",
                fontSize: "15px",
                cursor: "pointer"
              }}
              value={reportCase}
              onChange={(event) =>
                setReportCase(event.target.value)
              }
            >
              <option value="">
                Select Investigation Case
              </option>

              {cases.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  CASE #{item.id} - {item.case_name}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="primary-button report-download-button"
              style={{
                alignSelf: "flex-start",
                marginTop: "4px"
              }}
              onClick={generateReport}
            >
              📥 Generate & Download PDF Report
            </button>
          </div>
        </div>

        <div
          className="content-card report-information-card"
          style={{
            background: "#ffffff",
            borderRadius: "21px",
            padding: "28px",
            marginBottom: "25px",
            border: "1px solid #d7e0ec",
            boxShadow: "0 10px 30px rgba(32, 53, 84, 0.08)"
          }}
        >
          <div
            className="reports-card-title"
            style={{ marginBottom: "8px" }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#26364e",
                  fontSize: "21px"
                }}
              >
                Report Information
              </h2>
              <p
                style={{
                  margin: "6px 0 0",
                  color: "#718096",
                  fontSize: "14px"
                }}
              >
                Contents included in the generated forensic report.
              </p>
            </div>
          </div>

          {!reportCase ? (
            <div
              className="report-empty-state"
              style={{
                maxWidth: "900px",
                margin: "28px auto 8px",
                textAlign: "center",
                padding: "20px"
              }}
            >
              <div className="report-icon">📋</div>

              <h3>Forensic Investigation Report</h3>

              <p>
                Select a case above to generate a complete PDF report containing:
              </p>

              <div
                className="report-feature-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "12px",
                  maxWidth: "760px",
                  margin: "20px auto 0",
                  textAlign: "left"
                }}
              >
                <div className="report-feature" style={{ padding: "13px 15px", borderRadius: "10px", background: "#f7f9fc", border: "1px solid #e2e8f0", color: "#475569", fontSize: "14px" }}>📁 Case information</div>
                <div className="report-feature" style={{ padding: "13px 15px", borderRadius: "10px", background: "#f7f9fc", border: "1px solid #e2e8f0", color: "#475569", fontSize: "14px" }}>🔎 Investigation status</div>
                <div className="report-feature" style={{ padding: "13px 15px", borderRadius: "10px", background: "#f7f9fc", border: "1px solid #e2e8f0", color: "#475569", fontSize: "14px" }}>📄 Uploaded evidence</div>
                <div className="report-feature" style={{ padding: "13px 15px", borderRadius: "10px", background: "#f7f9fc", border: "1px solid #e2e8f0", color: "#475569", fontSize: "14px" }}>📊 File metadata</div>
                <div className="report-feature" style={{ padding: "13px 15px", borderRadius: "10px", background: "#f7f9fc", border: "1px solid #e2e8f0", color: "#475569", fontSize: "14px" }}>🔐 SHA-256 hashes</div>
                <div className="report-feature" style={{ padding: "13px 15px", borderRadius: "10px", background: "#f0fdf4", border: "1px solid #cfead8", color: "#166534", fontSize: "14px" }}>✓ Evidence integrity verification</div>
                <div className="report-feature" style={{ padding: "13px 15px", borderRadius: "10px", background: "#f7f9fc", border: "1px solid #e2e8f0", color: "#475569", fontSize: "14px" }}>🔬 Forensic analysis results</div>
                <div className="report-feature" style={{ padding: "13px 15px", borderRadius: "10px", background: "#fffaf0", border: "1px solid #f6e0b2", color: "#92400e", fontSize: "14px" }}>⚠ Risk level and suspicious indicators</div>
              </div>
            </div>
          ) : (
            <div
              className="report-preview"
              style={{
                marginTop: "24px",
                padding: "20px",
                borderRadius: "14px",
                background: "#f7f9fc",
                border: "1px solid #dce4ed"
              }}
            >
              <div
                className="report-preview-header"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  marginBottom: "18px"
                }}
              >
                <div className="report-preview-icon">📋</div>
                <div>
                  <h3>{selectedCaseData?.case_name}</h3>
                  <span>CASE #{reportCase}</span>
                </div>
                <span className="report-ready-badge">
                  Ready
                </span>
              </div>

              <div
                className="report-preview-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: "12px"
                }}
              >
                <div>
                  <span>Case Status</span>
                  <strong>
                    {selectedCaseData?.status || "Unknown"}
                  </strong>
                </div>

                <div>
                  <span>Evidence Files</span>
                  <strong>{evidenceCount}</strong>
                </div>

                <div>
                  <span>Report Type</span>
                  <strong>Forensic PDF</strong>
                </div>

                <div>
                  <span>Integrity</span>
                  <strong className="report-integrity">
                    SHA-256 Verified
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    );
  };

  // ==========================================
  // PAGE RENDERING
  // ==========================================

  const renderPage = () => {
    if (currentPage === "dashboard") {
      return <Dashboard />;
    }

    if (currentPage === "cases") {
      return <CasesPage />;
    }

    if (currentPage === "evidence") {
      return <EvidencePage />;
    }

    if (currentPage === "reports") {
      return <ReportsPage />;
    }

    return <Dashboard />;
  };


  // ==========================================
  // MAIN UI
  // ==========================================

  return (

    <div className="app-container">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="logo">

          <span className="logo-icon">
            🔎
          </span>

          TruthTrace

        </div>


        <nav className="navigation">

          <button
            className={
              currentPage === "dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setCurrentPage("dashboard")
            }
          >
            📊 Dashboard
          </button>


          <button
            className={
              currentPage === "cases"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setCurrentPage("cases")
            }
          >
            📁 Cases
          </button>


          <button
            className={
              currentPage === "evidence"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setCurrentPage("evidence")
            }
          >
            📄 Evidence
          </button>


          <button
            className={
              currentPage === "reports"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setCurrentPage("reports")
            }
          >
            📋 Reports
          </button>

        </nav>


        <div className="sidebar-status">

          <span className="status-dot"></span>

          System Active

        </div>

      </aside>


      {/* MAIN CONTENT */}

      <main className="main-content">

        {renderPage()}

      </main>

    </div>

  );
}

export default App;