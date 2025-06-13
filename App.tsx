import React, { useState, useEffect, useCallback } from 'react';
import { Chat, Content } from '@google/genai';
import { PlantDiagnosis, ChatMessage, AppState, FertilizerRecommendation, getDefaultPestIdentification } from './types';
import ImageUpload from './components/ImageUpload';
import DiagnosisResult from './components/DiagnosisResult';
import ChatWindow from './components/ChatWindow';
import Spinner from './components/Spinner';
import Advertisement from './components/Advertisement';
import { XCircleIcon, PhoneIcon } from './components/icons';
import * as GeminiService from './services/geminiService';
import axios from 'axios';
import florixLogo from './florix.png';

const getDefaultFertilizerRec = (description?: string): FertilizerRecommendation => ({
  needed_uz: false,
  description_uz: description || "O'g'itlash bo'yicha ma'lumotlar hozircha mavjud emas.",
  types_uz: [],
  application_methods_uz: [],
  timing_and_frequency_uz: [],
});

const getInitialState = (): AppState => ({
  uploadedImageFiles: [],
  uploadedImagePreviews: [],
  analysisResult: null,
  chatMessages: [],
  userInput: '',
  isLoadingImageAnalysis: false,
  isLoadingChatResponse: false,
  error: null,
  chatSession: null,
});

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(getInitialState());
  const [ads, setAds] = useState<any[]>([]);

  const handleError = (message: string) => {
    setState(prev => ({ ...prev, error: message, isLoadingImageAnalysis: false, isLoadingChatResponse: false }));
  };
  
  const resetState = useCallback((preserveApiKeyError = false) => {
    if (state.uploadedImagePreviews.length > 0) {
        state.uploadedImagePreviews.forEach(URL.revokeObjectURL);
    }
    const initial = getInitialState();
    if (preserveApiKeyError && state.error && (state.error.includes("API KALITI") || state.error.includes("KRITIK MUHITO XATOSI") || state.error.includes("NOTO'G'RI API KALITI"))) {
        initial.error = state.error;
    }
    setState(initial);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },[state.uploadedImagePreviews, state.error]);

  useEffect(() => {
    let apiKeyProblem: string | null = null;
    try {
      // API key checks removed since we're using hardcoded key
    } catch (e) {
      console.error("API kalitini tekshirishda kutilmagan xatolik:", e);
      apiKeyProblem = "API kalitini tekshirishda kutilmagan texnik xatolik yuz berdi. Qo'shimcha ma'lumot uchun konsolni tekshiring.";
    }
  
    if (apiKeyProblem) {
      handleError(apiKeyProblem);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await axios.get('http://api.florix.uz/api/ads/');
        setAds(Array.isArray(response.data) ? response.data.filter((ad) => ad.is_active) : []);
      } catch (error) {
        console.error("Reklamalarni yuklashda xatolik:", error);
        setAds([]);
      }
    };
    fetchAds();
  }, []);

  let topAd = null;
  let bottomAd = null;
  let randomAd = null;

  if (ads.length === 1) {
    topAd = ads[0];
  } else if (ads.length >= 2) {
    topAd = ads[0];
    bottomAd = ads[1];
    if (ads.length > 2) {
      const rest = ads.slice(2);
      randomAd = rest[Math.floor(Math.random() * rest.length)];
    }
  }

  const handleAnalysisStart = useCallback(async (files: File[]) => {
    if (state.error && (state.error.includes("API KALITI") || state.error.includes("KRITIK MUHITO XATOSI") || state.error.includes("NOTO'G'RI API KALITI"))) {
        return;
    }
    if (state.uploadedImagePreviews.length > 0) {
        state.uploadedImagePreviews.forEach(URL.revokeObjectURL);
    }

    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    setState(prev => ({
      ...getInitialState(), 
      error: prev.error?.includes("API KALITI") || prev.error?.includes("KRITIK MUHITO XATOSI") || prev.error?.includes("NOTO'G'RI API KALITI") ? prev.error : null,
      uploadedImageFiles: files,
      uploadedImagePreviews: newPreviews,
      isLoadingImageAnalysis: true,
    }));

    try {
      let diagnosis = await GeminiService.analyzePlantImage(files);
      if (diagnosis) {
        if (!diagnosis.fertilizer_recommendations_uz) {
            diagnosis.fertilizer_recommendations_uz = getDefaultFertilizerRec("Model o'g'itlash bo'yicha ma'lumot qaytarmadi.");
        }
        if (!diagnosis.pest_identification_uz) {
            diagnosis.pest_identification_uz = getDefaultPestIdentification();
        }

        if (diagnosis.diagnosis_uz.toLowerCase() === "xatolik" || diagnosis.diagnosis_uz.toLowerCase() === "rasmlar mos kelmadi") {
            setState(prev => ({ ...prev, analysisResult: diagnosis, isLoadingImageAnalysis: false, error: diagnosis.diagnosis_uz.toLowerCase() === "xatolik" ? diagnosis.description_uz : null }));
            return;
        }

        const initialMessages: ChatMessage[] = [];
        let chatHistoryForSession: Content[] = [];

        if (diagnosis.clarifying_question_uz) {
          const aiClarifyingMsg: ChatMessage = {
            id: crypto.randomUUID(),
            sender: 'ai',
            text: diagnosis.clarifying_question_uz,
            timestamp: Date.now(),
          };
          initialMessages.push(aiClarifyingMsg);
          chatHistoryForSession.push({ role: "model", parts: [{ text: diagnosis.clarifying_question_uz }] });
        }
        
        const chat = GeminiService.startChatSession(chatHistoryForSession);

        setState(prev => ({
          ...prev,
          analysisResult: diagnosis,
          chatMessages: initialMessages,
          isLoadingImageAnalysis: false,
          chatSession: chat,
          error: null, 
        }));
      } else {
        const errorMsg = "O'simlik tahlilidan kutilmagan natija (null). Bunday bo'lmasligi kerak edi.";
        handleError(errorMsg);
         setState(prev => ({
            ...prev,
            analysisResult: {
                diagnosis_uz: "Xatolik",
                observed_symptoms_uz: "Ma'lumot yo'q.",
                probable_causes_uz: "Ma'lumot yo'q.",
                severity_assessment_uz: "Baholanmadi.",
                description_uz: errorMsg,
                confidence_score: 0,
                recommendations_uz: { preventive_measures_uz: [], organic_treatments_uz: [], chemical_treatments_uz: [] },
                fertilizer_recommendations_uz: getDefaultFertilizerRec(errorMsg),
                pest_identification_uz: getDefaultPestIdentification(),
                clarifying_question_uz: null,
            },
            isLoadingImageAnalysis: false,
        }));
      }
    } catch (err) {
      console.error("Image analysis error in App.tsx:", err);
      const errorMsg = err instanceof Error ? err.message : "Rasm tahlilida noma'lum xatolik.";
      setState(prev => ({
        ...prev, 
        analysisResult: { 
            diagnosis_uz: "Xatolik",
            observed_symptoms_uz: "Ma'lumot yo'q.",
            probable_causes_uz: "Ma'lumot yo'q.",
            severity_assessment_uz: "Baholanmadi.",
            description_uz: `Tahlil xatoligi: ${errorMsg}`,
            confidence_score: 0,
            recommendations_uz: { preventive_measures_uz: [], organic_treatments_uz: [], chemical_treatments_uz: [] },
            fertilizer_recommendations_uz: getDefaultFertilizerRec(`Tahlil xatoligi: ${errorMsg}`),
            pest_identification_uz: getDefaultPestIdentification(),
            clarifying_question_uz: null,
        },
        isLoadingImageAnalysis: false,
        error: null, 
      }));
    }
  }, [state.error, state.uploadedImagePreviews]);

  const handleSendMessage = useCallback(async () => {
    if (!state.userInput.trim() || !state.chatSession || state.isLoadingChatResponse) return;
    if (state.error && (state.error.includes("API KALITI") || state.error.includes("KRITIK MUHITO XATOSI") || state.error.includes("NOTO'G'RI API KALITI"))) {
        return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: state.userInput,
      timestamp: Date.now(),
    };

    setState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, userMsg],
      userInput: '',
      isLoadingChatResponse: true,
      error: null, 
    }));
    
    const currentAiMsgId = crypto.randomUUID();

    try {
      const stream = await GeminiService.sendMessageToChatStream(state.chatSession, userMsg.text);
      let aiResponseText = '';
      let aiMessageExists = false;
      
      for await (const chunk of stream) {
        aiResponseText += chunk.text; 
        if (!aiMessageExists) {
          setState(prev => ({
            ...prev,
            chatMessages: [
              ...prev.chatMessages,
              { id: currentAiMsgId, sender: 'ai', text: aiResponseText, timestamp: Date.now() }
            ]
          }));
          aiMessageExists = true;
        } else {
          setState(prev => ({
            ...prev,
            chatMessages: prev.chatMessages.map(msg => 
              msg.id === currentAiMsgId ? { ...msg, text: aiResponseText, timestamp: Date.now() } : msg
            )
          }));
        }
      }
      
      if (aiMessageExists) {
           setState(prev => ({
            ...prev,
            chatMessages: prev.chatMessages.map(msg => 
                msg.id === currentAiMsgId ? { ...msg, text: aiResponseText, timestamp: Date.now() } : msg
            ),
            isLoadingChatResponse: false,
          }));
      } else { 
           console.warn("AI response stream was empty.");
           setState(prev => ({ ...prev, isLoadingChatResponse: false }));
      }

    } catch (err) {
      console.error("Chat error in App.tsx handleSendMessage:", err);
      const errorMsgText = err instanceof Error ? err.message : "Suhbatda noma'lum xatolik.";
      const aiErrorMsg: ChatMessage = {
        id: crypto.randomUUID(), 
        sender: 'ai',
        text: `Xatolik: ${errorMsgText}. Iltimos keyinroq qayta urinib ko'ring.`,
        timestamp: Date.now(),
      };

      setState(prev => {
        const updatedMessages = prev.chatMessages.filter(msg => msg.id !== currentAiMsgId);
        updatedMessages.push(aiErrorMsg); 
        return { ...prev, chatMessages: updatedMessages, isLoadingChatResponse: false };
      });
    }
  }, [state.userInput, state.chatSession, state.chatMessages, state.error, state.isLoadingChatResponse]); 
  
  const isApiKeyErrorActive = state.error && (state.error.includes("API KALITI") || state.error.includes("KRITIK MUHITO XATOSI") || state.error.includes("NOTO'G'RI API KALITI"));

  return (
    <div className="app-container">
      <div className="main-content">
        <header className="mb-4 text-center">
          <div className="inline-block p-3 bg-white rounded-full shadow-md mb-3">
              <img src={florixLogo} alt="Florix Logo" style={{ width: '5rem', height: '5rem' }} className="object-contain" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-green-700">O'simlik Tashxis Tizimi: Kasalliklar va Zararkunandalar</h1>
          <p className="text-gray-600 mt-2 text-md sm:text-lg max-w-2xl mx-auto">
            O'simlikingizning bir nechta (2-4) rasmini yuklang va uning kasalliklari yoki zararkunandalari haqida AI asosida ma'lumotlar va ekspert tavsiyalarini oling.
          </p>
        </header>

        <div className="my-4 w-full max-w-5xl mx-auto flex flex-col sm:flex-row justify-center items-center gap-3 px-4">
          <a href="tel:+998911116014" className="flex items-center justify-center w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm sm:text-base">
            <PhoneIcon className="w-5 h-5 mr-2" /> Dasturchilar bilan bog'lanish
          </a>
          <a href="tel:+998910574905" className="flex items-center justify-center w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-sm sm:text-base">
            <PhoneIcon className="w-5 h-5 mr-2" /> Karantin boshqarmasi
          </a>
        </div>

        {topAd && (
          <div className="my-6 w-full px-4 flex justify-center">
            <Advertisement ad={topAd} />
          </div>
        )}

        {state.error && !state.analysisResult?.description_uz.includes(state.error) && ( 
          <div className="bg-red-50 border-l-4 border-red-600 text-red-800 p-5 rounded-lg shadow-md card-shadow" role="alert">
            <div className="flex">
              <div className="py-1"><XCircleIcon className="h-6 w-6 text-red-600 mr-3"/></div>
              <div>
                <p className="font-bold">Xatolik!</p>
                <p className="text-sm whitespace-pre-wrap">{state.error}</p>
              </div>
            </div>
          </div>
        )}

        {!state.analysisResult && !state.isLoadingImageAnalysis && !isApiKeyErrorActive && (
          <ImageUpload onAnalysisStart={handleAnalysisStart} disabled={state.isLoadingImageAnalysis} />
        )}
        
        {state.isLoadingImageAnalysis && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-xl card-shadow border border-gray-100">
            <Spinner size="lg" message="Rasmlar chuqur tahlil qilinmoqda, iltimos kuting..." />
            {state.uploadedImagePreviews.length > 0 && (
                <div className="mt-4 text-sm text-gray-600">Yuklangan rasmlar: {state.uploadedImagePreviews.length} ta</div>
            )}
          </div>
        )}
        
        {state.uploadedImagePreviews.length > 0 && state.analysisResult && !state.isLoadingImageAnalysis && (
          <DiagnosisResult diagnosis={state.analysisResult} imagePreviewUrls={state.uploadedImagePreviews} />
        )}

        {state.analysisResult && randomAd && (
          <div className="my-6 w-full px-4 flex justify-center">
            <Advertisement ad={randomAd} />
          </div>
        )}

        {state.analysisResult && !state.isLoadingImageAnalysis && !isApiKeyErrorActive && (
          state.analysisResult.diagnosis_uz.toLowerCase() !== "xatolik" && state.analysisResult.diagnosis_uz.toLowerCase() !== "rasmlar mos kelmadi" ? (
            <>
              <ChatWindow
                  messages={state.chatMessages}
                  userInput={state.userInput}
                  onUserInput={(input) => setState(prev => ({ ...prev, userInput: input }))}
                  onSendMessage={handleSendMessage}
                  isLoading={state.isLoadingChatResponse}
                  isDisabled={!state.chatSession}
              />
              <div className="text-center mt-8 mb-4">
                <button 
                    onClick={() => resetState(true)} 
                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                    Yangi Tahlil Olish
                </button>
              </div>
            </>
          ) : (
            state.uploadedImageFiles.length > 0 && 
            <div className="text-center mt-6">
              <button 
                onClick={() => resetState(true)} 
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Qaytadan urinib ko'rish
              </button>
            </div>
          )
        )}
      </div>
      {bottomAd && (
        <div className="my-6 w-full px-4 flex justify-center">
          <Advertisement ad={bottomAd} />
        </div>
      )}
      <footer className="bg-gray-100 text-gray-700 py-8 mt-12 border-t border-gray-200 w-full">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4">
            <img src={florixLogo} alt="Florix Logo" className="w-10 h-10 object-contain inline-block" />
            <p className="text-xl font-semibold mt-1 text-green-700">O'simlik Tashxis Tizimi</p>
            <p className="text-sm mt-2 max-w-xl mx-auto text-gray-600">
              O'simliklaringiz salomatligini sun'iy intellekt yordamida tez va aniq baholang. Kasalliklar va zararkunandalarni aniqlang, tavsiyalar oling va hosildorlikni oshiring.
            </p>
          </div>
          <p className="text-sm text-gray-600">© {new Date().getFullYear()} Barcha huquqlar himoyalangan.</p>
          <p className="text-xs mt-2 text-gray-500">
            <a href="https://cdcdecaravan.uz" target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">CDCGroup</a> Tomonidan Yaratildi | <a href="https://github.com/JamshidbekAkhmadjonov" target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">CraDev Company</a> Qo'llab-Quvvatlashi Bilan (2019-yildan beri)
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;