const EM = "Elemental Mastery";
const ER = "Energy Recharge";
const CRate = "Crit RATE";
const CDMG = "Crit DMG";
const ATK_ = "ATK%";
const DEF_ = "DEF%";
const HP_ = "HP%";
const ATK = "Flat ATK";
const DEF = "Flat DEF";
const HP = "Flat HP";

const anemoRvList = {
  Sayu: [EM, ER],
  Venti: [CRate, CDMG, ATK_, EM, ER],
  Xiao: [CRate, CDMG, ATK_, ER],
  Jean: [CRate, CDMG, ATK_, ER, EM],
  Faruzan: [CRate, CDMG, ATK_, ER, EM],
  Wanderer: [CRate, CDMG, ATK_, ER, EM],
  "Kaedehara Kazuha": [CRate, CDMG, ATK_, EM, ER],
};

const pyroRvList = {
  Klee: [CRate, CDMG, ATK_, EM],
  Diluc: [CRate, CDMG, ATK_, EM],
  Dehya: [CRate, CDMG, ATK_, ER, HP_],
  Bennett: [ER, HP_, CRate, CDMG],
  Yanfei: [CRate, CDMG, ATK_, EM, ER],
  Yoimiya: [CRate, CDMG, ATK_, EM],
  Xiangling: [CRate, CDMG, ATK_, EM, ER],
  "Hu Tao": [CRate, CDMG, HP_, EM],
  Lyney: [CRate, CDMG, ATK_, ER],
};

const hydroRvList = {
  Nilou: [CRate, EM, ER, CDMG, HP_, HP],
  Xingqiu: [CRate, CDMG, ATK_, ER],
  Mona: [CRate, CDMG, ER, EM, ATK_],
  Tartaglia: [CRate, CDMG, ATK_, EM],
  "Sangonomiya Kokomi": [HP, HP_, ER],
  "Kamisato Ayato": [CRate, CDMG, ER, ATK_],
  Yelan: [CRate, CDMG, HP_, ER],
  Neuvillette: [CRate, CDMG, HP_, ER],
};

const cryoRvList = {
  Diona: [HP_, ER],
  Qiqi: [CRate, CDMG, ATK_],
  Eula: [CRate, CDMG, ER, ATK_],
  Ganyu: [CRate, CDMG, ATK_, EM],
  Shenhe: [ER, ATK, ATK_, CRate, CDMG],
  "Kamisato Ayaka": [CRate, CDMG, ER, ATK_],
};

const geoRvList = {
  Albedo: [CRate, CDMG, DEF_],
  Noelle: [CRate, CDMG, DEF_, ATK_, ER],
  Zhongli: [CRate, CDMG, ATK_, HP_],
  "Yun Jin": [CRate, ER, DEF, DEF_],
  "Arataki Itto": [CRate, CDMG, ER, DEF_, ATK_],
};

const electroRvList = {
  Razor: [CRate, CDMG, ATK_],
  Lisa: [CRate, CDMG, ATK_, EM],
  Fischl: [ATK_, EM, CRate, CDMG],
  Keqing: [CRate, CDMG, ATK_],
  Beidou: [ER, ATK_, CRate, CDMG],
  "Yae Miko": [ER, ATK_, CRate, CDMG, EM],
  "Raiden Shogun": [CRate, CDMG, ATK_, ER],
  "Kuki Shinobu": [CRate, CDMG, ATK_, EM, ER],
  Cyno: [CRate, CDMG, ATK_, EM, ER],
};

const dendroRvList = {
  Nahida: [CRate, CDMG, ATK_, EM],
  Alhaitham: [CRate, CDMG, ATK_, EM, ER],
};

const defaultRvFilter = [CRate, CDMG];

export const getDefaultRvFilters = (character: string) => {
  return (
    {
      ...anemoRvList,
      ...pyroRvList,
      ...hydroRvList,
      ...cryoRvList,
      ...geoRvList,
      ...electroRvList,
      ...dendroRvList,
    }[character] || defaultRvFilter
  );
};
