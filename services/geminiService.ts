import { GoogleGenAI, Chat, GenerateContentResponse, Content, Part } from "@google/genai";
import { PlantDiagnosis, getDefaultPestIdentification } from '../types';
import { INITIAL_IMAGE_ANALYSIS_PROMPT_UZ, GEMINI_MODEL_NAME, CHAT_SYSTEM_PROMPT_UZ } from '../constants';
import { parseGeminiJsonResponse } from '../utils/jsonUtils';
import { convertFileToBase64 } from '../utils/fileUtils';

const getApiKey = (): string => {
  return "AIzaSyBbzhuYpbao8d4YBXXMumKsfOUSoIreHf8";
};

let ai: GoogleGenAI | null = null;

const getAIInstance = (): GoogleGenAI => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: getApiKey() });
  }
  return ai;
};

const getDefaultFertilizerRecommendation = (): PlantDiagnosis['fertilizer_recommendations_uz'] => ({
    needed_uz: false,
    description_uz: "O'g'itlash bo'yicha tavsiyalar berilmadi.",
    types_uz: [],
    application_methods_uz: [],
    timing_and_frequency_uz: [],
});


export const analyzePlantImage = async (files: File[]): Promise<PlantDiagnosis | null> => {
  try {
    const localAI = getAIInstance(); 
    
    const imageParts: Part[] = await Promise.all(files.map(async (file) => {
      const base64Data = await convertFileToBase64(file);
      return {
        inlineData: {
          mimeType: file.type,
          data: base64Data,
        },
      };
    }));

    const textPart: Part = { text: INITIAL_IMAGE_ANALYSIS_PROMPT_UZ };
    const allParts: Part[] = [...imageParts, textPart];

    const response: GenerateContentResponse = await localAI.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts: allParts }, // Send all images and text in one user turn
      config: {
        responseMimeType: "application/json",
      }
    });
    
    let diagnosis = parseGeminiJsonResponse<PlantDiagnosis>(response.text);
    if (!diagnosis) {
      console.error("Failed to parse JSON response from Gemini:", response.text);
      return {
          diagnosis_uz: "Xatolik",
          observed_symptoms_uz: "Tahlil natijasini qayta ishlashda xatolik yuz berdi (JSON formatda emas).",
          probable_causes_uz: "Ma'lumot yo'q.",
          severity_assessment_uz: "Baholanmadi.",
          description_uz: "Gemini javobi: " + response.text.substring(0, 200) + "...",
          confidence_score: 0,
          recommendations_uz: {
            preventive_measures_uz: [],
            organic_treatments_uz: [],
            chemical_treatments_uz: [],
          },
          fertilizer_recommendations_uz: getDefaultFertilizerRecommendation(),
          pest_identification_uz: getDefaultPestIdentification(),
          clarifying_question_uz: null,
      };
    }
    // Ensure fertilizer_recommendations_uz is present, even if model forgets
    if (!diagnosis.fertilizer_recommendations_uz) {
        diagnosis.fertilizer_recommendations_uz = getDefaultFertilizerRecommendation();
    }
    // Ensure pest_identification_uz is present
    if (!diagnosis.pest_identification_uz) {
        diagnosis.pest_identification_uz = getDefaultPestIdentification();
    }
    return diagnosis;

  } catch (error) {
    console.error("Error analyzing plant image(s) in geminiService:", error);
    let errorMessage = error instanceof Error ? error.message : "O'simlik rasmlarini tahlil qilishda noma'lum xatolik.";
    
    if (typeof errorMessage === 'string' && (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("Invalid API key") || (error as any)?.status === "INVALID_ARGUMENT")) {
      errorMessage = "Gemini API XATOSI: Taqdim etilgan API kaliti yaroqsiz yoki noto'g'ri.\n\n" +
                     "Iltimos, quyidagilarni diqqat bilan tekshiring:\n" +
                     "1. API kalitining qiymati to'g'riligiga ishonch hosil qiling (Google Cloud Console yoki kalitni olgan joyingizdan qayta nusxalang).\n" +
                     "2. Ilovangiz joylashtirilgan muhitda (masalan, Google Cloud Run xizmati sozlamalarida) `process.env.API_KEY` muhit o'zgaruvchisi aniq shu yaroqli kalitga o'rnatilganligini tekshiring.\n" +
                     "3. Google Cloud loyihangizda 'Generative Language API' (yoki 'AI Platform unified API') yoqilganligini tekshiring.\n" +
                     "4. API kalitingiz ushbu xizmatdan foydalanish uchun cheklovlarga ega emasligiga amin bo'ling.\n\n" +
                     "Ushbu muammo ilova kodida emas, balki API kalitining konfiguratsiyasida. Agar muammo davom etsa, platforma administratoriga murojaat qiling.\n\n" +
                     "Asl xatolik: " + (error instanceof Error ? error.message : JSON.stringify(error));
    } else if (typeof errorMessage === 'string' && errorMessage.includes("ReadableStream uploading is not supported")) {
      errorMessage += "\n\nMaslahat: Bu xatolik odatda serverdagi proksi (api-proxy) sozlamalari bilan bog'liq bo'lib, u oqimli fayl yuklanishlarini qo'llab-quvvatlamasligi mumkin. Iltimos, server konfiguratsiyasini tekshiring yoki platforma administratoriga murojaat qiling.";
    }

    return {
        diagnosis_uz: "Xatolik",
        observed_symptoms_uz: "Ma'lumot yo'q.",
        probable_causes_uz: "Ma'lumot yo'q.",
        severity_assessment_uz: "Baholanmadi.",
        description_uz: `Tahlil qilishda xatolik yuz berdi: ${errorMessage}`,
        confidence_score: 0,
        recommendations_uz: {
            preventive_measures_uz: [],
            organic_treatments_uz: [],
            chemical_treatments_uz: [],
        },
        fertilizer_recommendations_uz: getDefaultFertilizerRecommendation(),
        pest_identification_uz: getDefaultPestIdentification(),
        clarifying_question_uz: null,
    };
  }
};

export const startChatSession = (initialHistory?: Content[]): Chat => {
  const localAI = getAIInstance(); 
  return localAI.chats.create({
    model: GEMINI_MODEL_NAME,
    config: {
      systemInstruction: CHAT_SYSTEM_PROMPT_UZ,
    },
    history: initialHistory || [],
  });
};

export const sendMessageToChatStream = async (
  chatSession: Chat,
  messageText: string
): Promise<AsyncIterable<GenerateContentResponse>> => {
  try {
    const result = await chatSession.sendMessageStream({
      message: messageText, 
    });
    return result;
  } catch (error) {
    console.error("Error sending message to chat in geminiService:", error);
    let errorMessage = error instanceof Error ? error.message : "Suhbatda noma'lum xatolik.";
    
    if (typeof errorMessage === 'string' && (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("Invalid API key") || (error as any)?.status === "INVALID_ARGUMENT")) {
      errorMessage = "Gemini API XATOSI (Suhbat): Taqdim etilgan API kaliti yaroqsiz yoki noto'g'ri.\n\n" +
                     "Iltimos, quyidagilarni diqqat bilan tekshiring:\n" +
                     "1. API kalitining qiymati to'g'riligiga ishonch hosil qiling.\n" +
                     "2. Ilovangiz joylashtirilgan muhitda `process.env.API_KEY` muhit o'zgaruvchisi yaroqli kalitga o'rnatilganligini tekshiring.\n" +
                     "3. Google Cloud loyihangizda tegishli API'lar yoqilganligini tekshiring.\n\n" +
                     "Asl xatolik: " + (error instanceof Error ? error.message : JSON.stringify(error));
    } else if (typeof errorMessage === 'string' && errorMessage.includes("ReadableStream") && errorMessage.includes("not supported")) {
        errorMessage += "\n\nMaslahat: Bu xatolik serverdagi proksi sozlamalari bilan bog'liq bo'lishi mumkin.";
    }
    throw new Error(errorMessage);
  }
};