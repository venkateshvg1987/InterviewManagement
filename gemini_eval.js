async function evaluateWithGemini(cvText, jdText, role, isBulk = false) {
  const apiKey = localStorage.getItem("GEMINI_API_KEY");
  if (!apiKey) {
    alert("Please enter a Gemini API Key in the settings sidebar first.");
    return null;
  }

  // Guard Rail: Always scrub PII before sending to Gemini
  const maskedCV = typeof maskPII === "function" ? maskPII(cvText) : cvText;

  const baseKit = PRESETS[role] || {};

  const prompt = `
You are an expert technical interviewer and HR screener.
You are evaluating a candidate's CV against a Job Description.

Job Description:
${jdText}

Candidate CV (Anonymized):
${maskedCV}

Analyze the candidate strictly against the Job Description.

SCORING RULES:
- CRITICAL: If the candidate lacks direct hands-on experience in the primary technologies required by the JD (e.g. they have NO Python, NO RAG, NO Vector DB, NO Gen AI experience for an AI Lead Role), you MUST fail them immediately with a score of 20% or lower.
- It is UNACCEPTABLE to give a passing score (>60%) to a candidate who only knows Java/Spring Boot if the job is explicitly for an AI engineer. 
- You are a ruthless technical gatekeeper. Do not give points for unrelated seniority.

Respond ONLY with a valid, parsable JSON object using this exact schema:
{
  "score": <number between 0 and 100 based on true semantic match of skills and experience>,
  "verdict": "<Strong Match | Potential | Reject>",
  "candidateInsight": {
    "track": "<expert | intermediate | junior>",
    "rationale": "<2-sentence rationale for the score>"
  },
  "summary": "<2-sentence analysis of the candidate's alignment>",
  "skills": {
    "Matched": ["skill1", "skill2"],
    "Missing": ["skill3", "skill4"]
  },
  "gaps": [
    { "skill": "<Skill Category>", "status": "<risk | match>", "notes": "<Explanation of why it is a gap or match>" }
  ],
  "experienceYears": <number of years extracted from CV>,
  "seniority": "<expert | intermediate | junior>",
  "name": "Candidate"
}
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errTxt = await response.text();
      console.error("Gemini API Error:", errTxt);
      alert("Error contacting Gemini API. Check console or API key.");
      return null;
    }

    const data = await response.json();
    const rawJson = data.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(rawJson);

    // Merge with baseKit for the UI layout
    const kit = JSON.parse(JSON.stringify(baseKit));
    kit.summary = parsedData.summary;
    kit.gaps = parsedData.gaps;
    kit.candidateInsight = parsedData.candidateInsight;
    kit.candidateInsight.score = parsedData.score;
    kit.candidateInsight.verdict = parsedData.verdict;
    kit.skills = parsedData.skills;
    
    // Pass the parsed data back
    return {
      kit: kit,
      matchMetrics: {
        score: parsedData.score,
        experienceYears: parsedData.experienceYears,
        seniority: parsedData.seniority,
        name: parsedData.name
      }
    };
  } catch (err) {
    console.error("Error evaluating with Gemini:", err);
    alert("Failed to parse Gemini response.");
    return null;
  }
}
