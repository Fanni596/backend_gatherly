export const generateEventWithGemini = async (prompt) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const apiUrl = `${import.meta.env.VITE_GEMINI_API_URL}?key=${apiKey}`;
  
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });
  
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }
  
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  };