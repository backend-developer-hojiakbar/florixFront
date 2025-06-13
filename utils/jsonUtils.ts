
export const parseGeminiJsonResponse = <T,>(responseText: string): T | null => {
  let jsonStr = responseText.trim();
  // Regex to strip ```json ... ``` or ``` ... ```
  const fenceRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);

  if (match && match[1]) {
    jsonStr = match[1].trim();
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    console.error("Initial JSON.parse failed:", error, "Attempting to parse substring. Original text:", responseText);
    // Fallback: try to find JSON object within the string if it's not perfectly formatted
    const jsonStartIndex = jsonStr.indexOf('{');
    const jsonEndIndex = jsonStr.lastIndexOf('}');

    if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) {
      const potentialJson = jsonStr.substring(jsonStartIndex, jsonEndIndex + 1);
      try {
        return JSON.parse(potentialJson) as T;
      } catch (subError) {
        console.error("Substring JSON.parse also failed:", subError, "Substring was:", potentialJson);
        return null;
      }
    }
    return null;
  }
};
