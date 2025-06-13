import React from 'react';
import { PlantDiagnosis, PestIdentification } from '../types';
import { LightBulbIcon, CheckCircleIcon, XCircleIcon, SparklesIcon, ShieldCheckIcon, BeakerIcon, SunIcon, LeafDropletIcon, BugAntIcon } from './icons'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DiagnosisResultProps {
  diagnosis: PlantDiagnosis;
  imagePreviewUrls: string[];
}

const RecommendationItem: React.FC<{items: string[], title: string, Icon: React.FC<{className?:string}>, iconClassName: string, bgColor: string, borderColor: string, titleColor:string}> = 
  ({items, title, Icon, iconClassName, bgColor, borderColor, titleColor }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className={`p-4 ${bgColor} rounded-lg border ${borderColor}`}>
      <h4 className={`text-md font-semibold ${titleColor} mb-2 flex items-center`}>
        <Icon className={`w-5 h-5 mr-2 ${iconClassName}`} />
        {title}
      </h4>
      <ul className="list-disc list-inside space-y-1.5 text-gray-700 pl-2">
        {items.map((rec, index) => (
          <li key={`${title}-${index}`} className="text-sm leading-relaxed whitespace-pre-wrap">{rec}</li>
        ))}
      </ul>
    </div>
  );
}


const DiagnosisResult: React.FC<DiagnosisResultProps> = ({ diagnosis, imagePreviewUrls }) => {
  const isHealthy = diagnosis.diagnosis_uz.toLowerCase().includes("sog'lom"); 
  const isError = diagnosis.diagnosis_uz.toLowerCase() === "xatolik";
  const isUnidentified = diagnosis.diagnosis_uz.toLowerCase().startsWith("aniqlanmadi");
  const isMismatch = diagnosis.diagnosis_uz.toLowerCase() === "rasmlar mos kelmadi";
  
  let titleColor = 'text-yellow-700';
  let MainIconComponent = LightBulbIcon;

  if (isHealthy) {
    titleColor = 'text-green-700';
    MainIconComponent = CheckCircleIcon;
  } else if (isError || isMismatch) {
    titleColor = 'text-red-700';
    MainIconComponent = XCircleIcon;
  } else if (isUnidentified) {
    titleColor = 'text-gray-700'; 
    MainIconComponent = SparklesIcon; 
  }

  const diseaseRecs = diagnosis.recommendations_uz;
  const hasPreventiveDisease = diseaseRecs?.preventive_measures_uz?.length > 0;
  const hasOrganicDisease = diseaseRecs?.organic_treatments_uz?.length > 0;
  const hasChemicalDisease = diseaseRecs?.chemical_treatments_uz?.length > 0;
  const hasAnyDiseaseTreatmentRecommendations = hasPreventiveDisease || hasOrganicDisease || hasChemicalDisease;

  const fertilizerRec = diagnosis.fertilizer_recommendations_uz;
  const showFertilizerRecs = fertilizerRec && fertilizerRec.needed_uz;

  const pestInfo = diagnosis.pest_identification_uz;
  const isPestIdentified = pestInfo?.is_pest_identified_uz === true && pestInfo?.pest_name_uz;
  
  const pestControlRecs = pestInfo?.control_recommendations_uz;
  const hasPreventivePest = pestControlRecs?.preventive_measures_uz?.length > 0;
  const hasBiologicalPest = pestControlRecs?.biological_control_uz?.length > 0;
  const hasCulturalPest = pestControlRecs?.cultural_control_uz?.length > 0;
  const hasChemicalPest = pestControlRecs?.chemical_treatments_uz?.length > 0;
  const hasAnyPestControlRecommendations = hasPreventivePest || hasBiologicalPest || hasCulturalPest || hasChemicalPest;

  // Sahifa balandligi va y koordinatasini boshqarish uchun yordamchi funksiya
  const addTextWithPageBreak = (doc: jsPDF, text: string, x: number, y: number, options: any = {}) => {
    const pageHeight = doc.internal.pageSize.height || 297;
    const lines = doc.splitTextToSize(text, options.maxWidth || 180);
    lines.forEach((line: string) => {
      if (y > pageHeight - 15) {
        doc.addPage();
        y = 10;
      }
      doc.text(line, x, y, options);
      y += 7;
    });
    return y;
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    let y = 10;
    y = addTextWithPageBreak(doc, "O'simlik Tashxis Natijasi", 14, y);
    doc.setFontSize(12);
    y += 2;
    y = addTextWithPageBreak(doc, `Tashxis: ${diagnosis.diagnosis_uz}`, 14, y);
    y = addTextWithPageBreak(doc, `Aniqlik darajasi: ${(diagnosis.confidence_score * 100).toFixed(0)}%`, 14, y);
    y = addTextWithPageBreak(doc, `Tavsif: ${diagnosis.description_uz}`, 14, y);
    if (diagnosis.observed_symptoms_uz) {
      y = addTextWithPageBreak(doc, 'Kuzatilgan simptomlar:', 14, y);
      y = addTextWithPageBreak(doc, diagnosis.observed_symptoms_uz, 18, y);
    }
    if (diagnosis.probable_causes_uz) {
      y = addTextWithPageBreak(doc, 'Ehtimoliy sabablar:', 14, y);
      y = addTextWithPageBreak(doc, diagnosis.probable_causes_uz, 18, y);
    }
    if (diagnosis.severity_assessment_uz) {
      y = addTextWithPageBreak(doc, 'Jiddiylik darajasi:', 14, y);
      y = addTextWithPageBreak(doc, diagnosis.severity_assessment_uz, 18, y);
    }
    // Kasallik tavsiyalari
    if (diseaseRecs) {
      if (diseaseRecs.preventive_measures_uz?.length) {
        y = addTextWithPageBreak(doc, 'Oldini olish choralari:', 14, y);
        diseaseRecs.preventive_measures_uz.forEach((item) => {
          y = addTextWithPageBreak(doc, `- ${item}`, 18, y);
        });
      }
      if (diseaseRecs.organic_treatments_uz?.length) {
        y = addTextWithPageBreak(doc, 'Organik davolash usullari:', 14, y);
        diseaseRecs.organic_treatments_uz.forEach((item) => {
          y = addTextWithPageBreak(doc, `- ${item}`, 18, y);
        });
      }
      if (diseaseRecs.chemical_treatments_uz?.length) {
        y = addTextWithPageBreak(doc, 'Kimyoviy davolash usullari:', 14, y);
        diseaseRecs.chemical_treatments_uz.forEach((item) => {
          y = addTextWithPageBreak(doc, `- ${item}`, 18, y);
        });
      }
    }
    // O'g'it tavsiyalari
    if (fertilizerRec && fertilizerRec.needed_uz) {
      y = addTextWithPageBreak(doc, "O'g'itlash bo'yicha tavsiyalar:", 14, y);
      y = addTextWithPageBreak(doc, fertilizerRec.description_uz, 18, y);
      if (fertilizerRec.types_uz?.length) {
        y = addTextWithPageBreak(doc, "O'g'it turlari:", 18, y);
        fertilizerRec.types_uz.forEach((item) => {
          y = addTextWithPageBreak(doc, `- ${item}`, 22, y);
        });
      }
      if (fertilizerRec.application_methods_uz?.length) {
        y = addTextWithPageBreak(doc, "Qo'llash usullari:", 18, y);
        fertilizerRec.application_methods_uz.forEach((item) => {
          y = addTextWithPageBreak(doc, `- ${item}`, 22, y);
        });
      }
      if (fertilizerRec.timing_and_frequency_uz?.length) {
        y = addTextWithPageBreak(doc, 'Vaqti va tezligi:', 18, y);
        fertilizerRec.timing_and_frequency_uz.forEach((item) => {
          y = addTextWithPageBreak(doc, `- ${item}`, 22, y);
        });
      }
    }
    // Zararkunanda
    if (pestInfo && pestInfo.is_pest_identified_uz && pestInfo.pest_name_uz) {
      y = addTextWithPageBreak(doc, 'Aniqlangan zararkunanda:', 14, y);
      y = addTextWithPageBreak(doc, pestInfo.pest_name_uz, 18, y);
      if (pestInfo.pest_description_uz) {
        y = addTextWithPageBreak(doc, 'Tavsif:', 18, y);
        y = addTextWithPageBreak(doc, pestInfo.pest_description_uz, 22, y);
      }
      if (pestInfo.damage_symptoms_uz) {
        y = addTextWithPageBreak(doc, 'Zarar yetkazish belgilari:', 18, y);
        y = addTextWithPageBreak(doc, pestInfo.damage_symptoms_uz, 22, y);
      }
      if (pestControlRecs) {
        if (pestControlRecs.preventive_measures_uz?.length) {
          y = addTextWithPageBreak(doc, 'Oldini olish choralari:', 18, y);
          pestControlRecs.preventive_measures_uz.forEach((item) => {
            y = addTextWithPageBreak(doc, `- ${item}`, 22, y);
          });
        }
        if (pestControlRecs.biological_control_uz?.length) {
          y = addTextWithPageBreak(doc, 'Biologik nazorat:', 18, y);
          pestControlRecs.biological_control_uz.forEach((item) => {
            y = addTextWithPageBreak(doc, `- ${item}`, 22, y);
          });
        }
        if (pestControlRecs.cultural_control_uz?.length) {
          y = addTextWithPageBreak(doc, 'Agrotexnik usullar:', 18, y);
          pestControlRecs.cultural_control_uz.forEach((item) => {
            y = addTextWithPageBreak(doc, `- ${item}`, 22, y);
          });
        }
        if (pestControlRecs.chemical_treatments_uz?.length) {
          y = addTextWithPageBreak(doc, 'Kimyoviy davolash usullari:', 18, y);
          pestControlRecs.chemical_treatments_uz.forEach((item) => {
            y = addTextWithPageBreak(doc, `- ${item}`, 22, y);
          });
        }
      }
    }
    doc.save('tashxis-natijasi.pdf');
  };

  return (
    <div className="bg-white p-6 sm:p-8 shadow-xl rounded-2xl border border-gray-100 w-full card-shadow">
      <div className="flex justify-end mb-2">
        <button
          onClick={handleDownloadPDF}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all text-sm"
        >
          PDF yuklab olish
        </button>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {imagePreviewUrls && imagePreviewUrls.length > 0 && (
          <div className="lg:w-1/3 flex-shrink-0">
            {imagePreviewUrls.length === 1 ? (
              <img 
                src={imagePreviewUrls[0]} 
                alt="O'simlik rasmi" 
                className="rounded-xl object-cover w-full h-64 lg:h-auto lg:max-h-[450px] shadow-lg border border-gray-200" 
              />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 font-medium">Tahlil uchun yuklangan rasmlar ({imagePreviewUrls.length}):</p>
                <div className={'grid grid-cols-2 gap-2'}>
                  {imagePreviewUrls.map((url, index) => (
                     <img 
                        key={index}
                        src={url} 
                        alt={`O'simlik rasmi ${index + 1}`}
                        className="rounded-lg object-cover w-full h-32 sm:h-40 shadow-md border border-gray-200" 
                      />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="lg:w-2/3 space-y-5"> 
          <div>
            <div className="flex items-start mb-2">
              <MainIconComponent className={`w-8 h-8 sm:w-10 sm:h-10 mr-3 flex-shrink-0 mt-1 ${titleColor}`} />
              <div>
                <h2 className={`text-2xl sm:text-3xl font-bold ${titleColor}`}>
                  {isError ? "Tahlil Xatoligi" : isMismatch ? "Rasmlar Mos Kelmadi": `Tashxis: ${diagnosis.diagnosis_uz}`}
                </h2>
                {!isError && !isUnidentified && !isHealthy && !isMismatch && (
                  <p className="text-sm text-gray-500 mt-1">
                    Aniqlik darajasi: <span className="font-semibold text-green-600">{(diagnosis.confidence_score * 100).toFixed(0)}%</span>
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {!isHealthy && !isError && !isMismatch && diagnosis.observed_symptoms_uz && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <SparklesIcon className="w-5 h-5 mr-2 text-gray-600" />
                    Kuzatilgan Simptomlar (Kasallik/Zararkunanda)
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{diagnosis.observed_symptoms_uz}</p>
            </div>
          )}
          
          <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">{diagnosis.description_uz}</p>

          {!isHealthy && !isError && !isMismatch && diagnosis.probable_causes_uz && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
                    <LightBulbIcon className="w-5 h-5 mr-2 text-blue-700" />
                    Ehtimoliy Sabablar
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{diagnosis.probable_causes_uz}</p>
            </div>
          )}

          {!isHealthy && !isError && !isMismatch && diagnosis.severity_assessment_uz && diagnosis.severity_assessment_uz.toLowerCase() !== 'baholanmadi' && diagnosis.severity_assessment_uz.toLowerCase() !== 'baholanmadi.' && (
             <div className={`p-4 rounded-lg border ${
                diagnosis.severity_assessment_uz.toLowerCase().includes('yuqori') || diagnosis.severity_assessment_uz.toLowerCase().includes('jiddiy') ? 'bg-red-50 border-red-200' : 
                diagnosis.severity_assessment_uz.toLowerCase().includes('o\'rta') ? 'bg-yellow-50 border-yellow-200' : 
                'bg-green-50 border-green-200' 
             }`}>
                <h3 className={`text-lg font-semibold mb-1 flex items-center ${
                    diagnosis.severity_assessment_uz.toLowerCase().includes('yuqori') || diagnosis.severity_assessment_uz.toLowerCase().includes('jiddiy') ? 'text-red-800' :
                    diagnosis.severity_assessment_uz.toLowerCase().includes('o\'rta') ? 'text-yellow-800' :
                    'text-green-800'
                }`}>
                    <ShieldCheckIcon className="w-5 h-5 mr-2" />
                    Jiddiylik Darajasi
                </h3>
                <p className={`text-sm leading-relaxed ${
                    diagnosis.severity_assessment_uz.toLowerCase().includes('yuqori') || diagnosis.severity_assessment_uz.toLowerCase().includes('jiddiy') ? 'text-red-700' :
                    diagnosis.severity_assessment_uz.toLowerCase().includes('o\'rta') ? 'text-yellow-700' :
                    'text-green-700'
                }`}>{diagnosis.severity_assessment_uz}</p>
            </div>
          )}


          {hasAnyDiseaseTreatmentRecommendations && !isError && !isMismatch && !isHealthy && (
            <div className="space-y-4 pt-3">
              <h3 className="text-xl font-semibold text-green-800 mb-1 flex items-center">
                <LightBulbIcon className="w-6 h-6 mr-2 text-green-700" />
                Kasalliklarga Qarshi Davolash Tavsiyalari
              </h3>
              <RecommendationItem items={diseaseRecs.preventive_measures_uz} title="Oldini Olish Choralari" Icon={SunIcon} iconClassName="text-green-600" bgColor="bg-green-50" borderColor="border-green-200" titleColor="text-green-700" />
              <RecommendationItem items={diseaseRecs.organic_treatments_uz} title="Organik Davolash Usullari" Icon={SparklesIcon} iconClassName="text-emerald-600" bgColor="bg-emerald-50" borderColor="border-emerald-200" titleColor="text-emerald-700" />
              {hasChemicalDisease && (
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="text-md font-semibold text-orange-700 mb-2 flex items-center">
                    <BeakerIcon className="w-5 h-5 mr-2 text-orange-600" />
                    Kimyoviy Davolash Usullari (Kasalliklar)
                  </h4>
                   <p className="text-xs text-orange-600 mb-2">DIQQAT: Kimyoviy vositalarni ishlatishdan oldin yo'riqnomani diqqat bilan o'qing va xavfsizlik choralariga rioya qiling!</p>
                  <ul className="list-disc list-inside space-y-1.5 text-gray-700 pl-2">
                    {diseaseRecs.chemical_treatments_uz.map((rec, index) => (
                      <li key={`disease-chem-${index}`} className="text-sm leading-relaxed whitespace-pre-wrap">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {isPestIdentified && pestInfo && !isError && !isMismatch && (
            <div className="space-y-4 pt-5 mt-5 border-t border-gray-200">
                 <h3 className="text-xl font-semibold text-amber-800 mb-3 flex items-center">
                    <BugAntIcon className="w-6 h-6 mr-2 text-amber-700" />
                    Aniqlangan Zararkunanda: {pestInfo.pest_name_uz}
                </h3>

                {pestInfo.pest_description_uz && (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <h4 className="text-md font-semibold text-amber-700 mb-1">Zararkunanda Tavsifi</h4>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{pestInfo.pest_description_uz}</p>
                    </div>
                )}
                {pestInfo.damage_symptoms_uz && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <h4 className="text-md font-semibold text-red-700 mb-1">Zarar Yetkazish Belglari</h4>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{pestInfo.damage_symptoms_uz}</p>
                    </div>
                )}
                
                {hasAnyPestControlRecommendations && pestControlRecs && (
                    <div className="space-y-3 pt-2">
                        <h4 className="text-lg font-semibold text-amber-800 mb-2">Zararkunandaga Qarshi Kurash Choralar</h4>
                        <RecommendationItem items={pestControlRecs.preventive_measures_uz} title="Profilaktik Choralar" Icon={ShieldCheckIcon} iconClassName="text-sky-600" bgColor="bg-sky-50" borderColor="border-sky-200" titleColor="text-sky-700" />
                        <RecommendationItem items={pestControlRecs.biological_control_uz} title="Biologik Kurash" Icon={SparklesIcon} iconClassName="text-teal-600" bgColor="bg-teal-50" borderColor="border-teal-200" titleColor="text-teal-700" />
                        <RecommendationItem items={pestControlRecs.cultural_control_uz} title="Agrotexnik Kurash" Icon={SunIcon} iconClassName="text-lime-600" bgColor="bg-lime-50" borderColor="border-lime-200" titleColor="text-lime-700" />
                        
                        {hasChemicalPest && (
                             <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                                <h4 className="text-md font-semibold text-rose-700 mb-2 flex items-center">
                                    <BeakerIcon className="w-5 h-5 mr-2 text-rose-600" />
                                    Kimyoviy Kurash (Zararkunandalar)
                                </h4>
                                <p className="text-xs text-rose-600 mb-2">DIQQAT: Kimyoviy vositalarni (insektitsid, akaritsid) ishlatishdan oldin yo'riqnomani diqqat bilan o'qing va xavfsizlik choralariga (shaxsiy himoya vositalari, ishlov berish muddati, kutish muddati) qat'iy rioya qiling! Atrof-muhit va foydali hasharotlarga zarar keltirmaslikka harakat qiling.</p>
                                <ul className="list-disc list-inside space-y-1.5 text-gray-700 pl-2">
                                    {pestControlRecs.chemical_treatments_uz.map((rec, index) => (
                                    <li key={`pest-chem-${index}`} className="text-sm leading-relaxed whitespace-pre-wrap">{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
          )}
          
          {showFertilizerRecs && fertilizerRec && !isError && !isMismatch && !isHealthy && (
            <div className="space-y-4 pt-3 mt-5 border-t border-gray-200">
              <div className="p-4 bg-lime-50 rounded-lg border border-lime-200">
                <h3 className="text-xl font-semibold text-lime-800 mb-3 flex items-center">
                  <LeafDropletIcon className="w-6 h-6 mr-2 text-lime-700" />
                  O'g'itlash bo'yicha Tavsiyalar
                </h3>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed whitespace-pre-wrap">{fertilizerRec.description_uz}</p>
                
                {fertilizerRec.types_uz && fertilizerRec.types_uz.length > 0 && (
                  <div className="mb-2">
                    <h4 className="text-md font-semibold text-lime-700 mb-1">Tavsiya etilgan o'g'it turlari:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 pl-2">
                      {fertilizerRec.types_uz.map((rec, index) => (
                        <li key={`fert-type-${index}`} className="text-sm leading-relaxed whitespace-pre-wrap">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {fertilizerRec.application_methods_uz && fertilizerRec.application_methods_uz.length > 0 && (
                  <div className="mb-2">
                    <h4 className="text-md font-semibold text-lime-700 mb-1 mt-2">Qo'llash usullari:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 pl-2">
                      {fertilizerRec.application_methods_uz.map((rec, index) => (
                        <li key={`fert-method-${index}`} className="text-sm leading-relaxed whitespace-pre-wrap">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {fertilizerRec.timing_and_frequency_uz && fertilizerRec.timing_and_frequency_uz.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-lime-700 mb-1 mt-2">Qo'llash vaqti va davriyligi:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 pl-2">
                      {fertilizerRec.timing_and_frequency_uz.map((rec, index) => (
                        <li key={`fert-time-${index}`} className="text-sm leading-relaxed whitespace-pre-wrap">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DiagnosisResult;