import { LoRAModel, ChatLoRAOption } from '../types/lora';

// LoRA model definitions
export const AVAILABLE_LORA_MODELS: LoRAModel[] = [
  {
    id: '3some-after',
    name: '3Some With After',
    filename: '3Some_With_After.safetensors',
    description: 'Group interaction scenarios',
    category: 'scenario',
    tags: ['group', 'interaction', 'scenarios']
  },
  {
    id: 'after-sex',
    name: 'After Sex',
    filename: 'after_sex.safetensors',
    description: 'Post-intimate moments and aftercare scenarios',
    category: 'scenario',
    tags: ['aftercare', 'intimacy', 'emotional']
  },
  {
    id: 'arm-straddling',
    name: 'Arm Supported Straddling',
    filename: 'arm-supported-straddling.safetensors',
    description: 'Physical positioning with arm support',
    category: 'position',
    tags: ['physical', 'position', 'support']
  },
  {
    id: 'ass-ripple',
    name: 'Ass Ripple V3',
    filename: 'Ass_ripple_V3.safetensors',
    description: 'Enhanced body movement and reactions',
    category: 'detail',
    tags: ['movement', 'reactions', 'dynamic']
  },
  {
    id: 'assisted-fingering',
    name: 'Assisted Fingering',
    filename: 'assisted_fingering.safetensors',
    description: 'Guidance and assistance in intimate touching',
    category: 'scenario',
    tags: ['guidance', 'touch', 'assistance']
  },
  {
    id: 'bj-comic',
    name: 'BJ Comic Part 2',
    filename: 'BjComicPart2.safetensors',
    description: 'Comic book style narrative and dialogue',
    category: 'style',
    tags: ['comic', 'narrative', 'dialogue']
  },
  {
    id: 'blowjob-comic',
    name: 'Blowjob Three Panel Comic',
    filename: 'blowjob_three_panel_comic.safetensors',
    description: 'Three-panel comic style storytelling format',
    category: 'style',
    tags: ['panels', 'storytelling', 'format']
  },
  {
    id: 'bodybend',
    name: 'Body Bend',
    filename: 'bodybend.safetensors',
    description: 'Emphasis on flexibility and body bending scenarios',
    category: 'position',
    tags: ['flexibility', 'bending', 'poses']
  },
  {
    id: 'bra-cups',
    name: 'Bra Cups Sticking Out',
    filename: 'bra_cups_sticking_out.safetensors',
    description: 'Detailed attention to clothing and wardrobe elements',
    category: 'detail',
    tags: ['clothing', 'wardrobe', 'details']
  },
  {
    id: 'breast-comparison',
    name: 'Breast Comparison',
    filename: 'Breast_comparison.safetensors',
    description: 'Comparative analysis and discussion scenarios',
    category: 'scenario',
    tags: ['comparison', 'analysis', 'discussion']
  },
  {
    id: 'cameltoe-grab',
    name: 'Cameltoe Grab',
    filename: 'cameltoe_grab_ill.safetensors',
    description: 'Detailed intimate scenarios',
    category: 'scenario',
    tags: ['intimate', 'detailed', 'scenarios']
  },
  {
    id: 'cum-mouth',
    name: 'Cum Mouth',
    filename: 'cum_mouth.safetensors',
    description: 'Post-intimate scenarios',
    category: 'scenario',
    tags: ['post-intimate', 'scenarios']
  },
  {
    id: 'deep-penetration',
    name: 'Deep Penetration Control',
    filename: 'Deep_penetration_controll.safetensors',
    description: 'Detailed penetration scenarios',
    category: 'scenario',
    tags: ['penetration', 'detailed', 'scenarios']
  },
  {
    id: 'double-handgag',
    name: 'Double Hand Gag',
    filename: 'double_handgag.safetensors',
    description: 'Restraint and control scenarios',
    category: 'scenario',
    tags: ['restraint', 'control', 'scenarios']
  },
  {
    id: 'exploding-clothes',
    name: 'Exploding Clothes',
    filename: 'exploding_clothes.safetensors',
    description: 'Dynamic clothing scenarios',
    category: 'scenario',
    tags: ['dynamic', 'clothing', 'scenarios']
  },
  {
    id: 'face-down',
    name: 'Face Down',
    filename: 'Face_Down.safetensors',
    description: 'Face down positioning scenarios',
    category: 'position',
    tags: ['position', 'face-down', 'scenarios']
  },
  {
    id: 'fondled-multiple',
    name: 'Fondled by Multiple Men',
    filename: 'Fondled_by_multiple_men.safetensors',
    description: 'Group interaction scenarios',
    category: 'scenario',
    tags: ['group', 'multiple', 'interaction']
  },
  {
    id: 'gaf-ilxl',
    name: 'GAF ILXL V1',
    filename: 'gaf_ilxl_v1.safetensors',
    description: 'Specialized art style enhancement',
    category: 'style',
    tags: ['art-style', 'enhancement']
  },
  {
    id: 'got-milk',
    name: 'Got Milk Hand Milking',
    filename: 'Got_Milk_hand_milking_consept.safetensors',
    description: 'Specialized intimate scenarios',
    category: 'scenario',
    tags: ['intimate', 'specialized', 'scenarios']
  },
  {
    id: 'gothic',
    name: 'Gothic',
    filename: 'gothic.safetensors',
    description: 'Gothic art style and themes',
    category: 'style',
    tags: ['gothic', 'art-style', 'themes']
  },
  {
    id: 'hand-panties',
    name: 'Hand Panties',
    filename: 'handPanties.safetensors',
    description: 'Clothing interaction scenarios',
    category: 'scenario',
    tags: ['clothing', 'interaction', 'scenarios']
  },
  {
    id: 'hands-table',
    name: 'Hands on Table Problems',
    filename: 'Hands_on_Table_Problems.safetensors',
    description: 'Table-based positioning scenarios',
    category: 'position',
    tags: ['table', 'position', 'scenarios']
  },
  {
    id: 'imminent-penetration',
    name: 'Imminent Penetration',
    filename: 'imminent-penetration.safetensors',
    description: 'Anticipation scenarios',
    category: 'scenario',
    tags: ['anticipation', 'scenarios']
  },
  {
    id: 'lap-pov',
    name: 'Lap POV',
    filename: 'lap-pov.safetensors',
    description: 'Lap-based point of view scenarios',
    category: 'position',
    tags: ['lap', 'pov', 'position']
  },
  {
    id: 'leg-up-spooning',
    name: 'Leg Up Spooning',
    filename: 'leg-up_spooning.safetensors',
    description: 'Spooning with leg positioning',
    category: 'position',
    tags: ['spooning', 'leg', 'position']
  },
  {
    id: 'lying-nipple',
    name: 'Lying Nipple Sucking',
    filename: 'Lying_nipple_sucking.safetensors',
    description: 'Intimate positioning scenarios',
    category: 'scenario',
    tags: ['intimate', 'positioning', 'scenarios']
  },
  {
    id: 'multiple-boys',
    name: 'Multiple Boys Hands',
    filename: 'Multiple_Boys_hands.safetensors',
    description: 'Group interaction scenarios',
    category: 'scenario',
    tags: ['group', 'multiple', 'interaction']
  },
  {
    id: 'ntr-fingering',
    name: 'NTR Fingering',
    filename: 'NTR_fingering.safetensors',
    description: 'Specialized intimate scenarios',
    category: 'scenario',
    tags: ['intimate', 'specialized', 'scenarios']
  },
  {
    id: 'on-side-missionary',
    name: 'On Side Missionary',
    filename: 'on-side-missionary.safetensors',
    description: 'Side missionary positioning',
    category: 'position',
    tags: ['missionary', 'side', 'position']
  },
  {
    id: 'pet-play-feeding',
    name: 'Pet Play Feeding',
    filename: 'pet_play_feeding_illustrious.safetensors',
    description: 'Pet play and feeding scenarios',
    category: 'scenario',
    tags: ['pet-play', 'feeding', 'scenarios']
  },
  {
    id: 'pilemating',
    name: 'Pilemating V1',
    filename: 'pilemating_v1.safetensors',
    description: 'Group mating scenarios',
    category: 'scenario',
    tags: ['group', 'mating', 'scenarios']
  },
  {
    id: 'pinching-nose',
    name: 'Pinching Another\'s Nose',
    filename: 'pinching-anothers-nose.safetensors',
    description: 'Intimate control scenarios',
    category: 'scenario',
    tags: ['control', 'intimate', 'scenarios']
  },
  {
    id: 'pole-dancing',
    name: 'Pole Dancing',
    filename: 'Pole_Dancing.safetensors',
    description: 'Dance and performance scenarios',
    category: 'scenario',
    tags: ['dance', 'performance', 'scenarios']
  },
  {
    id: 'restrained-four-arms',
    name: 'Restrained by Four Arms',
    filename: 'restrained_by_four_arms.safetensors',
    description: 'Restraint and control scenarios',
    category: 'scenario',
    tags: ['restraint', 'control', 'scenarios']
  },
  {
    id: 'see-through-silhouette',
    name: 'See Through Silhouette',
    filename: 'see-through_silhouette.safetensors',
    description: 'Transparent clothing scenarios',
    category: 'scenario',
    tags: ['transparent', 'clothing', 'scenarios']
  },
  {
    id: 'small-dom-big-sub',
    name: 'Small Dom Big Sub',
    filename: 'Small_Dom_Big_Sub_Illustrious.safetensors',
    description: 'Dominance and submission scenarios',
    category: 'scenario',
    tags: ['dominance', 'submission', 'scenarios']
  },
  {
    id: 'smooth-booster',
    name: 'Smooth Booster V3',
    filename: 'Smooth_Booster_v3.safetensors',
    description: 'Smooth art style enhancement',
    category: 'style',
    tags: ['smooth', 'art-style', 'enhancement']
  },
  {
    id: 'smooth-negative-hands',
    name: 'Smooth Negative Hands',
    filename: 'SmoothNegative_Hands.safetensors',
    description: 'Hand detail enhancement',
    category: 'detail',
    tags: ['hands', 'detail', 'enhancement']
  },
  {
    id: 'standing-sex-behind',
    name: 'Standing Sex from Behind',
    filename: 'standing_sx_from_behind_noobai_V.safetensors',
    description: 'Standing positioning scenarios',
    category: 'position',
    tags: ['standing', 'position', 'scenarios']
  }
];

// Map each chat option to a specific LoRA model
export const CHAT_LORA_OPTIONS: ChatLoRAOption[] = [
  {
    optionId: 1,
    label: '3Some With After Mode',
    loraModel: AVAILABLE_LORA_MODELS[0], // 3some-after
    description: 'Group interaction scenarios'
  },
  {
    optionId: 2,
    label: 'After Sex Mode',
    loraModel: AVAILABLE_LORA_MODELS[1], // after-sex
    description: 'Post-intimate moments and aftercare'
  },
  {
    optionId: 3,
    label: 'Arm Straddling Mode',
    loraModel: AVAILABLE_LORA_MODELS[2], // arm-straddling
    description: 'Physical positioning with arm support'
  },
  {
    optionId: 4,
    label: 'Ass Ripple Mode',
    loraModel: AVAILABLE_LORA_MODELS[3], // ass-ripple
    description: 'Enhanced body movement and reactions'
  },
  {
    optionId: 5,
    label: 'Assisted Fingering Mode',
    loraModel: AVAILABLE_LORA_MODELS[4], // assisted-fingering
    description: 'Guidance and assistance in intimate touching'
  },
  {
    optionId: 6,
    label: 'BJ Comic Mode',
    loraModel: AVAILABLE_LORA_MODELS[5], // bj-comic
    description: 'Comic book style narrative and dialogue'
  },
  {
    optionId: 7,
    label: 'Blowjob Comic Mode',
    loraModel: AVAILABLE_LORA_MODELS[6], // blowjob-comic
    description: 'Three-panel comic style storytelling'
  },
  {
    optionId: 8,
    label: 'Body Bend Mode',
    loraModel: AVAILABLE_LORA_MODELS[7], // bodybend
    description: 'Flexibility and body bending scenarios'
  },
  {
    optionId: 9,
    label: 'Bra Cups Mode',
    loraModel: AVAILABLE_LORA_MODELS[8], // bra-cups
    description: 'Detailed clothing and wardrobe elements'
  },
  {
    optionId: 10,
    label: 'Breast Comparison Mode',
    loraModel: AVAILABLE_LORA_MODELS[9], // breast-comparison
    description: 'Comparative analysis and discussion'
  },
  {
    optionId: 11,
    label: 'Cameltoe Grab Mode',
    loraModel: AVAILABLE_LORA_MODELS[10], // cameltoe-grab
    description: 'Detailed intimate scenarios'
  },
  {
    optionId: 12,
    label: 'Cum Mouth Mode',
    loraModel: AVAILABLE_LORA_MODELS[11], // cum-mouth
    description: 'Post-intimate scenarios'
  },
  {
    optionId: 13,
    label: 'Deep Penetration Mode',
    loraModel: AVAILABLE_LORA_MODELS[12], // deep-penetration
    description: 'Detailed penetration scenarios'
  },
  {
    optionId: 14,
    label: 'Double Hand Gag Mode',
    loraModel: AVAILABLE_LORA_MODELS[13], // double-handgag
    description: 'Restraint and control scenarios'
  },
  {
    optionId: 15,
    label: 'Exploding Clothes Mode',
    loraModel: AVAILABLE_LORA_MODELS[14], // exploding-clothes
    description: 'Dynamic clothing scenarios'
  },
  {
    optionId: 16,
    label: 'Face Down Mode',
    loraModel: AVAILABLE_LORA_MODELS[15], // face-down
    description: 'Face down positioning scenarios'
  },
  {
    optionId: 17,
    label: 'Fondled Multiple Mode',
    loraModel: AVAILABLE_LORA_MODELS[16], // fondled-multiple
    description: 'Group interaction scenarios'
  },
  {
    optionId: 18,
    label: 'GAF ILXL Mode',
    loraModel: AVAILABLE_LORA_MODELS[17], // gaf-ilxl
    description: 'Specialized art style enhancement'
  },
  {
    optionId: 19,
    label: 'Got Milk Mode',
    loraModel: AVAILABLE_LORA_MODELS[18], // got-milk
    description: 'Specialized intimate scenarios'
  },
  {
    optionId: 20,
    label: 'Gothic Mode',
    loraModel: AVAILABLE_LORA_MODELS[19], // gothic
    description: 'Gothic art style and themes'
  },
  {
    optionId: 21,
    label: 'Hand Panties Mode',
    loraModel: AVAILABLE_LORA_MODELS[20], // hand-panties
    description: 'Clothing interaction scenarios'
  },
  {
    optionId: 22,
    label: 'Hands on Table Mode',
    loraModel: AVAILABLE_LORA_MODELS[21], // hands-table
    description: 'Table-based positioning scenarios'
  },
  {
    optionId: 23,
    label: 'Imminent Penetration Mode',
    loraModel: AVAILABLE_LORA_MODELS[22], // imminent-penetration
    description: 'Anticipation scenarios'
  },
  {
    optionId: 24,
    label: 'Lap POV Mode',
    loraModel: AVAILABLE_LORA_MODELS[23], // lap-pov
    description: 'Lap-based point of view scenarios'
  },
  {
    optionId: 25,
    label: 'Leg Up Spooning Mode',
    loraModel: AVAILABLE_LORA_MODELS[24], // leg-up-spooning
    description: 'Spooning with leg positioning'
  },
  {
    optionId: 26,
    label: 'Lying Nipple Mode',
    loraModel: AVAILABLE_LORA_MODELS[25], // lying-nipple
    description: 'Intimate positioning scenarios'
  },
  {
    optionId: 27,
    label: 'Multiple Boys Mode',
    loraModel: AVAILABLE_LORA_MODELS[26], // multiple-boys
    description: 'Group interaction scenarios'
  },
  {
    optionId: 28,
    label: 'NTR Fingering Mode',
    loraModel: AVAILABLE_LORA_MODELS[27], // ntr-fingering
    description: 'Specialized intimate scenarios'
  },
  {
    optionId: 29,
    label: 'On Side Missionary Mode',
    loraModel: AVAILABLE_LORA_MODELS[28], // on-side-missionary
    description: 'Side missionary positioning'
  },
  {
    optionId: 30,
    label: 'Pet Play Feeding Mode',
    loraModel: AVAILABLE_LORA_MODELS[29], // pet-play-feeding
    description: 'Pet play and feeding scenarios'
  },
  {
    optionId: 31,
    label: 'Pilemating Mode',
    loraModel: AVAILABLE_LORA_MODELS[30], // pilemating
    description: 'Group mating scenarios'
  },
  {
    optionId: 32,
    label: 'Pinching Nose Mode',
    loraModel: AVAILABLE_LORA_MODELS[31], // pinching-nose
    description: 'Intimate control scenarios'
  },
  {
    optionId: 33,
    label: 'Pole Dancing Mode',
    loraModel: AVAILABLE_LORA_MODELS[32], // pole-dancing
    description: 'Dance and performance scenarios'
  },
  {
    optionId: 34,
    label: 'Restrained Four Arms Mode',
    loraModel: AVAILABLE_LORA_MODELS[33], // restrained-four-arms
    description: 'Restraint and control scenarios'
  },
  {
    optionId: 35,
    label: 'See Through Silhouette Mode',
    loraModel: AVAILABLE_LORA_MODELS[34], // see-through-silhouette
    description: 'Transparent clothing scenarios'
  },
  {
    optionId: 36,
    label: 'Small Dom Big Sub Mode',
    loraModel: AVAILABLE_LORA_MODELS[35], // small-dom-big-sub
    description: 'Dominance and submission scenarios'
  },
  {
    optionId: 37,
    label: 'Smooth Booster Mode',
    loraModel: AVAILABLE_LORA_MODELS[36], // smooth-booster
    description: 'Smooth art style enhancement'
  },
  {
    optionId: 38,
    label: 'Smooth Negative Hands Mode',
    loraModel: AVAILABLE_LORA_MODELS[37], // smooth-negative-hands
    description: 'Hand detail enhancement'
  },
  {
    optionId: 39,
    label: 'Standing Sex Behind Mode',
    loraModel: AVAILABLE_LORA_MODELS[38], // standing-sex-behind
    description: 'Standing positioning scenarios'
  }
];
