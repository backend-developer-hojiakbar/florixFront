import { Chat } from "@google/genai";

export interface FertilizerRecommendation {
  needed_uz: boolean;
  description_uz: string;
  types_uz: string[];
  application_methods_uz: string[];
  timing_and_frequency_uz: string[];
}

export interface PestControlRecommendations {
  preventive_measures_uz: string[];
  biological_control_uz: string[];
  cultural_control_uz: string[];
  chemical_treatments_uz: string[];
}

export interface PestIdentification {
  is_pest_identified_uz: boolean;
  pest_name_uz: string | null;
  pest_description_uz: string | null;
  damage_symptoms_uz: string | null;
  control_recommendations_uz: PestControlRecommendations;
}

export interface PlantDiagnosis {
  diagnosis_uz: string;
  observed_symptoms_uz: string;
  probable_causes_uz: string;
  severity_assessment_uz: string; 
  description_uz: string;
  confidence_score: number;
  recommendations_uz: { // These are primarily for diseases
    preventive_measures_uz: string[];
    organic_treatments_uz: string[];
    chemical_treatments_uz: string[];
  };
  fertilizer_recommendations_uz: FertilizerRecommendation;
  pest_identification_uz: PestIdentification | null; // Added for pests
  clarifying_question_uz: string | null;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export type ImageSourceType = 'gallery' | 'camera';

export interface AppState {
  uploadedImageFiles: File[];
  uploadedImagePreviews: string[];
  analysisResult: PlantDiagnosis | null;
  chatMessages: ChatMessage[];
  userInput: string;
  isLoadingImageAnalysis: boolean;
  isLoadingChatResponse: boolean;
  error: string | null;
  chatSession: Chat | null;
}

export enum AppStatus {
  IDLE,
  IMAGE_UPLOADING,
  ANALYZING,
  SHOWING_RESULT,
  CHATTING,
  ERROR,
}

export const getDefaultPestIdentification = (): PestIdentification => ({
  is_pest_identified_uz: false,
  pest_name_uz: null,
  pest_description_uz: null,
  damage_symptoms_uz: null,
  control_recommendations_uz: {
    preventive_measures_uz: [],
    biological_control_uz: [],
    cultural_control_uz: [],
    chemical_treatments_uz: []
  }
});