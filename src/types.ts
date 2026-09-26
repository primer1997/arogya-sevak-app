export interface SubCentreConfig {
  stateDepartment: string;
  district: string;
  taluka: string;
  phcName: string;
  subCentreName: string;
  workerName: string;
  workerDesignation: string;
  reportingMonth: string;
  subCentrePopulation: number;
  totalHouseholds: number;
}

export interface ContainerSurveyData {
  // 1. Container Survey
  inspHouses: number; // तपासलेली घरे
  posHouses: number; // दूषित घरे
  inspCont: number; // तपासलेली भांडी
  posCont: number; // दूषित भांडी
  temephosCont: number; // अबेट / टेमीफॉस टाकलेली भांडी
  emptiedCont: number; // रिकामी / नष्ट केलेली भांडी
  guppySites: number; // गप्पी मासे सोडलेली ठिकाणे
  dryDayHouses?: number; // (वगळले)
  foggingHouses?: number; // (वगळले)

  // 2. Water & Salt Surveillance
  waterBioSent: number; // पाणी जैविक तपासणीसाठी पाठवलेले नमुने (नग)
  waterBioSentStatus: 'होय' | 'नाही'; // पाणी जैविक पाठवले की नाही
  waterChemSent: number; // पाणी रासायनिक तपासणीसाठी पाठवलेले नमुने (नग)
  waterChemSentStatus: 'होय' | 'नाही'; // पाणी रासायनिक पाठवले की नाही
  saltSampleSent: number; // मीठ नमुना तपासणीसाठी पाठवले (नग)
  saltSampleSentStatus: 'होय' | 'नाही'; // मीठ नमुना पाठवला की नाही
  tclUsedKg: number; // टी.सी.एल. पावडर वापर (किलो)
  chlorineTests: number; // ओटी टेस्ट केलेले पाणी नमुने

  // 3. National Health Programs Statistics (राष्ट्रीय आरोग्य कार्यक्रम आकडेवारी)
  // क्षयरोग (TB - NTEP)
  tbTotal: number; // एकूण क्षयरुग्ण संख्या
  tbSuspected: number; // संशयित क्षयरुग्ण संख्या
  tbUnderTreatment: number; // उपचाराखालील क्षयरुग्ण संख्या

  // कुष्ठरोग (Leprosy - NLEP)
  leprosySuspected: number; // संशयित कुष्ठरुग्ण
  leprosyUnderTreatment: number; // उपचाराखालील कुष्ठरुग्ण

  // मोतीबिंदू (Cataract - NPCB)
  cataractSuspected: number; // संशयित मोतीबिंदू
  cataractOperated: number; // ऑपरेशन झालेले मोतीबिंदू
  villageMarriages: number; // गावात झालेली एकूण लग्ने
  bloodSamplesTaken: number; // घेतलेले एकूण रक्तनमुने

  notes?: string;
}

export type DiseaseType =
  | 'कॉलरा'
  | 'गॅस्ट्रो'
  | 'अतिसार'
  | 'हगवण'
  | 'मेंदुज्वर'
  | 'सांधेदुखी'
  | 'मलेरिया'
  | 'डेंग्यू'
  | 'इतर आजार';

export interface PatientRecord {
  id: string;
  regNo: string; // नोंदणी क्र.
  date: string; // तारीख YYYY-MM-DD
  name: string; // रुग्णाचे नाव
  age: number; // वय
  gender: 'पुरुष' | 'स्त्री' | 'इतर';
  village: string; // गाव / वस्ती
  contact: string; // संपर्क क्र.
  symptoms: string[]; // लक्षणे
  suspectedDisease: DiseaseType; // संशयित आजार: कॉलरा, गॅस्ट्रो, अतिसार, इत्यादी
  tclStatus: 'होय' | 'नाही'; // TCL (टी.सी.एल. पावडर वापर / क्लोरीनेशन केले का?)
  tclDetails?: string; // TCL शेरा / मात्रा
  bloodSlideTaken: boolean; // रक्त नमुना / स्टूल सॅम्पल घेतले का?
  rdtResult: string; // चाचणी निकाल (निगेटिव्ह / पॉझिटिव्ह / चाचणी केली नाही)
  treatment: string; // दिलेले औषधोपचार
  referred: boolean; // प्राथमिक आरोग्य केंद्रास संदर्भ
  referralCenter?: string; // संदर्भ रुग्णालय नाव
  status: 'उपचार चालू' | 'पूर्ण बरा झाला' | 'रेफर केले';
  remarks?: string;
}

// १. क्षयरुग्ण लाईनलिस्ट (Tuberculosis Linelist - NTEP)
export interface TbPatientRecord {
  id: string;
  regNo: string; // निक्षय आयडी / TB नोंदणी क्र.
  date: string; // नोंदणी तारीख YYYY-MM-DD
  name: string; // रुग्णाचे नाव
  age: number; // वय
  gender: 'पुरुष' | 'स्त्री' | 'इतर';
  village: string; // गाव / वस्ती
  contact: string; // मोबाईल क्र.
  tbType: 'फुफ्फुसीय (Pulmonary)' | 'फुफ्फुसेतर (Extra-Pulmonary)'; // TB प्रकार
  category: 'संशयित (Suspected)' | 'उपचाराखालील (Under Treatment)' | 'उपचार पूर्ण (Cured)'; // स्थिती
  treatmentStartDate: string; // डॉट्स उपचार सुरू तारीख
  dotsProvider: string; // डॉट्स प्रदाता (उदा. आशा, आरोग्य सेवक, कुटुंबिय)
  hivStatus: 'निगेटिव्ह' | 'पॉझिटिव्ह' | 'तपासणी केली नाही / अज्ञात'; // एचआयव्ही तपासणी
  bankDetailsAdded: 'होय' | 'नाही'; // निक्षय पोषण योजना बँक खाते जोडले का?
  remarks?: string; // शेरा
}

// २. कुष्ठरुग्ण लाईनलिस्ट (Leprosy Linelist - NLEP)
export interface LeprosyPatientRecord {
  id: string;
  regNo: string; // कुष्ठरोग नोंदणी क्र.
  date: string; // शोधमोहीम / तपासणी तारीख YYYY-MM-DD
  name: string; // रुग्णाचे नाव
  age: number; // वय
  gender: 'पुरुष' | 'स्त्री' | 'इतर';
  village: string; // गाव / वस्ती
  contact: string; // मोबाईल क्र.
  leprosyType: 'PB (Pauci-Bacillary)' | 'MB (Multi-Bacillary)'; // कुष्ठरोग प्रकार
  category: 'संशयित (Suspected)' | 'उपचाराखालील (Under Treatment)' | 'उपचार पूर्ण (RFT)'; // स्थिती
  lesionsCount: number; // त्वचेवरील चट्टे / डागांची संख्या
  lesionLocation?: string; // चट्टा कोठे आहे (शरीरावरील स्थान)
  deformityGrade: 'Grade 0 (व्यंग नाही)' | 'Grade 1 (संवेदना नष्ट)' | 'Grade 2 (दिसणारे व्यंग)'; // व्यंग प्रत
  mdtStartDate: string; // MDT औषधोपचार सुरुवात तारीख
  remarks?: string; // शेरा
}

// ३. मोतीबिंदू रुग्ण लाईनलिस्ट (Cataract Linelist - NPCB)
export interface DeathRecord {
  id: string;
  date: string;
  name: string;
  age: number;
  gender: 'पुरुष' | 'स्त्री' | 'इतर';
  village: string;
  place: 'गावात' | 'गावाबाहेर';
  deathPlace: string;
  cause: string;
  remarks?: string;
}

export interface CataractPatientRecord {
  id: string;
  regNo: string; // नेत्र तपासणी नोंदणी क्र.
  date: string; // तपासणी तारीख YYYY-MM-DD
  name: string; // रुग्णाचे नाव
  age: number; // वय
  gender: 'पुरुष' | 'स्त्री' | 'इतर';
  village: string; // गाव / वस्ती
  contact: string; // मोबाईल क्र.
  affectedEye: 'दोन्ही डोळे' | 'उजवा डोळा' | 'डावा डोळा'; // बाधित डोळा
  visualAcuity: string; // दृष्टी (उदा. < 6/60, बोटे मोजणे, प्रकाशाची जाणीव)
  screeningSite: string; // तपासणी ठिकाण (उपकेंद्र / नेत्र तपासणी शिबिर / PHC)
  surgeryStatus: 'संशयित / प्रलंबित' | 'शस्त्रक्रिया पूर्ण झाली' | 'शस्त्रक्रियेस नकार / अनफिट'; // शस्त्रक्रिया स्थिती
  surgeryDate?: string; // शस्त्रक्रिया दिनांक
  hospitalName?: string; // शस्त्रक्रिया रुग्णालय (उदा. जिल्हा रुग्णालय / ट्रस्ट हॉस्पिटल)
  remarks?: string; // शेरा
}

