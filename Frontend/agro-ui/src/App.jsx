import { useState } from "react";

export default function App() {

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
  };

  const analyze = async () => {

    if (!file) {
      alert("Upload image first");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {

      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      setResult(data);

    } catch (err) {
      alert("Backend error. Make sure server is running.");
      console.log(err);
    }

    setLoading(false);
  };

  const severity = result ? Math.round(result.confidence * 100) : 0;

  const getColor = (value) => {
    if (value < 20) return "#22c55e";
    if (value <= 50) return "#eab308";
    return "#ef4444";
  };

  return (

    <div style={styles.page}>

      {/* LEFT PANEL */}
      <div style={styles.left}>

        <h1>🌿 AgroDetect AI</h1>

        <label style={styles.uploadBox}>
          <input type="file" hidden onChange={handleFile} />

          {preview ?
            <img src={preview} alt="preview" style={styles.preview} />
            :
            <p style={{ opacity: 0.8 }}>
              📁 Click or Drop Leaf Image Here
            </p>
          }
        </label>

        <button style={styles.button} onClick={analyze}>
          Analyze Plant
        </button>

      </div>

      {/* RIGHT PANEL */}
      <div style={styles.right}>

        {!loading && !result && (

  <div style={styles.introBox}>

    <h2>🌿 Welcome to AgroDetect AI</h2>

    <p>
      AgroDetect AI is an intelligent plant disease detection system powered by
      deep learning and explainable AI techniques.
    </p>

    <ul style={{textAlign:"left"}}>
      <li>📸 Upload plant leaf image</li>
      <li>🤖 AI detects disease instantly</li>
      <li>🔥 Heatmap shows infected regions</li>
      <li>📊 Severity meter explains risk level</li>
    </ul>

    <p style={{opacity:0.7}}>
      Upload a leaf image and click Analyze to begin.
    </p>

  </div>
)}


        {loading && (
          <>
            <h2>🤖 AI scanning leaf...</h2>
            <div style={styles.scan}></div>
          </>
        )}

        {result && (

          <>
            <h2>{result.disease}</h2>

            <img
              src={`data:image/jpeg;base64,${result.heatmap}`}
              alt="heatmap"
              style={styles.heatmap}
            />

            <h3>Disease Severity</h3>

            <div style={styles.barOuter}>
              <div
                style={{
                  ...styles.barInner,
                  width: `${severity}%`,
                  background: getColor(severity)
                }}
              />
            </div>

            <p style={{ marginTop: "10px", fontWeight: "bold" }}>
              Severity: {severity}%
            </p>

            <div style={styles.precautionBox}>
              {result.ai_text}
            </div>

          </>
        )}

      </div>

    </div>
  );
}

const styles = {

  page: {
    display: "flex",
    height: "100vh",
    background: "#020617",
    color: "white",
    fontFamily: "sans-serif"
  },

  left: {
    width: "35%",
    padding: "40px",
    borderRight: "1px solid #1e293b",
    textAlign: "center"
  },

  right: {
    width: "65%",
    padding: "40px",
    overflowY: "auto"
  },

  uploadBox: {
    border: "2px dashed #38bdf8",
    borderRadius: "14px",
    height: "260px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    cursor: "pointer",
    margin: "25px 0",
    background: "rgba(56,189,248,0.05)"
  },

  preview: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "12px"
  },

  button: {
    padding: "12px 20px",
    background: "#38bdf8",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  heatmap: {
    width: "300px",
    borderRadius: "12px",
    marginBottom: "20px"
  },

  barOuter: {
    height: "20px",
    background: "#1e293b",
    borderRadius: "20px",
    overflow: "hidden"
  },

  barInner: {
    height: "100%",
    borderRadius: "20px",
    transition: "width 0.5s ease"
  },

  precautionBox: {
    marginTop: "20px",
    padding: "15px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "10px"
  },

  scan: {
    height: "4px",
    background: "linear-gradient(90deg,transparent,cyan,transparent)",
    animation: "scan 2s infinite"
  },
  introBox:{
  background:"rgba(255,255,255,0.05)",
  padding:"25px",
  borderRadius:"14px",
  lineHeight:"1.6"
},

};