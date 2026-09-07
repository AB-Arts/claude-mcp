// GENERATED FILE — DO NOT EDIT BY HAND.
// Produced by scripts/generate-model-catalog.mjs from src/config/models/**/*.json.
// Re-run `npm run build:model-catalogue` after changing any model JSON;
// src/config/models/catalog.test.ts fails when this file is out of date.
//
// Disabled models are omitted: the server must never resolve one.

export interface CatalogParameter {
  key: string;
  /** Absent on parameters that never reach the provider (UI-only controls). */
  apiParam?: string;
  type: string;
  default?: unknown;
  options?: unknown[];
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  tooltip?: string;
}

export interface CatalogModel {
  id: string;
  name: string;
  type: string;
  provider: string;
  category: string | null;
  description: string | null;
  apiModel: string | null;
  defaultOutputFormat: string;
  supportsOutputQuality: boolean;
  supportsMultiOutput: boolean;
  apiMapping: Record<string, unknown> | null;
  capabilities: Record<string, unknown>;
  duration?: Record<string, unknown>;
  pricing?: Record<string, unknown>;
  parameters: {
    basic: CatalogParameter[];
    advanced: CatalogParameter[];
    images: Array<Record<string, unknown>>;
  };
  parameterKeys: Array<{ key: string; apiParam?: string; default?: unknown }>;
}

export const MODEL_CATALOG: CatalogModel[] = [
  {
    "id": "hunyuan-3d-3.1",
    "name": "Hunyuan 3D 3.1",
    "type": "3d",
    "provider": "replicate",
    "category": "3D",
    "description": "Generate a textured 3D model (GLB) from a prompt or a reference image. Hidden from public catalog · used through the 3D Generator session.",
    "apiModel": "tencent/hunyuan-3d-3.1",
    "defaultOutputFormat": "glb",
    "supportsOutputQuality": false,
    "supportsMultiOutput": false,
    "apiMapping": {
      "customMappings": {
        "comment": "Defaults forced server-side: enable_pbr=false, face_count=500000, generate_type=Normal. Either 'prompt' or 'image' is sent, never both."
      }
    },
    "capabilities": {
      "maxResolution": "n/a",
      "resolutionBehavior": "fixed",
      "supportsReferenceImage": true,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": false,
      "requiresPrompt": false
    },
    "pricing": {
      "apiCostEur": 0.16,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [],
      "images": []
    },
    "parameterKeys": []
  },
  {
    "id": "elevenlabs-v3",
    "name": "ElevenLabs v3",
    "type": "audio",
    "provider": "replicate",
    "category": "Text to Speech",
    "description": "The most expressive TTS model with 70+ languages, audio tags like [whispers] and [excited], and multi-speaker dialogue support.",
    "apiModel": "elevenlabs/v3",
    "defaultOutputFormat": "mp3",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "prompt": "prompt"
    },
    "capabilities": {
      "maxResolution": "n/a",
      "resolutionBehavior": "fixed",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "requiresAudio": false
    },
    "pricing": {
      "apiCostEur": 0.046,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [
        {
          "key": "voice",
          "apiParam": "voice",
          "type": "select",
          "default": "Rachel",
          "options": [
            "Rachel",
            "Drew",
            "Clyde",
            "Paul",
            "Aria",
            "Domi",
            "Dave",
            "Roger",
            "Fin",
            "Sarah",
            "James",
            "Jane",
            "Juniper",
            "Arabella",
            "Hope",
            "Bradford",
            "Reginald",
            "Gaming",
            "Austin",
            "Kuon",
            "Blondie",
            "Priyanka",
            "Alexandra",
            "Monika",
            "Mark",
            "Grimblewood"
          ],
          "label": "Voice",
          "tooltip": "Select a voice for speech synthesis"
        },
        {
          "key": "speed",
          "apiParam": "speed",
          "type": "slider",
          "default": 1,
          "min": 0.7,
          "max": 1.2,
          "step": 0.05,
          "label": "Speed",
          "tooltip": "Speech speed multiplier (0.7 = slower, 1.2 = faster)"
        },
        {
          "key": "stability",
          "apiParam": "stability",
          "type": "slider",
          "default": 0.5,
          "min": 0,
          "max": 1,
          "step": 0.05,
          "label": "Stability",
          "tooltip": "Lower = more expressive/variable, higher = more consistent"
        },
        {
          "key": "similarityBoost",
          "apiParam": "similarity_boost",
          "type": "slider",
          "default": 0.75,
          "min": 0,
          "max": 1,
          "step": 0.05,
          "label": "Similarity Boost",
          "tooltip": "How closely to match original voice characteristics"
        },
        {
          "key": "style",
          "apiParam": "style",
          "type": "slider",
          "default": 0,
          "min": 0,
          "max": 1,
          "step": 0.05,
          "label": "Style",
          "tooltip": "Style exaggeration (0 = neutral, 1 = highly stylized)"
        },
        {
          "key": "languageCode",
          "apiParam": "language_code",
          "type": "select",
          "default": "en",
          "options": [
            "en",
            "es",
            "fr",
            "de",
            "it",
            "pt",
            "nl",
            "pl",
            "ru",
            "ja",
            "ko",
            "zh",
            "ar",
            "hi",
            "tr",
            "sv",
            "no",
            "da",
            "fi"
          ],
          "label": "Language",
          "tooltip": "Language code for speech generation"
        }
      ],
      "images": []
    },
    "parameterKeys": [
      {
        "key": "voice",
        "apiParam": "voice",
        "default": "Rachel"
      },
      {
        "key": "speed",
        "apiParam": "speed",
        "default": 1
      },
      {
        "key": "stability",
        "apiParam": "stability",
        "default": 0.5
      },
      {
        "key": "similarityBoost",
        "apiParam": "similarity_boost",
        "default": 0.75
      },
      {
        "key": "style",
        "apiParam": "style",
        "default": 0
      },
      {
        "key": "languageCode",
        "apiParam": "language_code",
        "default": "en"
      }
    ]
  },
  {
    "id": "minimax-speech-28-hd",
    "name": "Minimax Speech 2.8 HD",
    "type": "audio",
    "provider": "replicate",
    "category": "Text to Speech",
    "description": "Top-ranked text-to-speech with studio-grade quality, expressive emotion control, 17+ voices, and 32 language support.",
    "apiModel": "minimax/speech-2.8-hd",
    "defaultOutputFormat": "mp3",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "prompt": "text"
    },
    "capabilities": {
      "maxResolution": "n/a",
      "resolutionBehavior": "fixed",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "requiresAudio": false
    },
    "pricing": {
      "apiCostEur": 0.046,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [
        {
          "key": "voiceId",
          "apiParam": "voice_id",
          "type": "select",
          "default": "English_Wiselady",
          "options": [
            "English_Wiselady",
            "Wise_Woman",
            "Deep_Voice_Man",
            "Lively_Girl",
            "Casual_Guy",
            "Friendly_Person",
            "Imposing_Manner",
            "Mature_Partner",
            "Captivating_Storyteller",
            "Young_Knight",
            "Abbess",
            "Serene_Woman",
            "Confident_Woman",
            "Patient_Man",
            "Comedian",
            "Bossy_Leader",
            "Anime_Character",
            "Whimsical_Girl",
            "Kind-hearted_Girl"
          ],
          "label": "Voice",
          "tooltip": "Pick a preset voice or use a cloned voice_id from minimax/voice-cloning"
        },
        {
          "key": "emotion",
          "apiParam": "emotion",
          "type": "select",
          "default": "auto",
          "options": [
            "auto",
            "happy",
            "calm",
            "sad",
            "angry",
            "fearful",
            "disgusted",
            "surprised"
          ],
          "label": "Emotion",
          "tooltip": "Emotional delivery style. Use 'auto' to let the model choose based on text context."
        },
        {
          "key": "speed",
          "apiParam": "speed",
          "type": "slider",
          "default": 1,
          "min": 0.5,
          "max": 2,
          "step": 0.1,
          "label": "Speed",
          "tooltip": "Speech speed multiplier (0.5 = slow, 2.0 = fast)"
        },
        {
          "key": "volume",
          "apiParam": "volume",
          "type": "slider",
          "default": 1,
          "min": 0,
          "max": 10,
          "step": 0.5,
          "label": "Volume",
          "tooltip": "Relative loudness (1.0 = default)"
        },
        {
          "key": "pitch",
          "apiParam": "pitch",
          "type": "slider",
          "default": 0,
          "min": -12,
          "max": 12,
          "step": 1,
          "label": "Pitch",
          "tooltip": "Semitone offset (-12 to +12)"
        },
        {
          "key": "audioFormat",
          "apiParam": "audio_format",
          "type": "select",
          "default": "mp3",
          "options": [
            "mp3",
            "wav",
            "flac"
          ],
          "label": "Audio Format",
          "tooltip": "Output file format"
        },
        {
          "key": "languageBoost",
          "apiParam": "language_boost",
          "type": "select",
          "default": "None",
          "options": [
            "None",
            "English",
            "Chinese",
            "Spanish",
            "French",
            "German",
            "Japanese",
            "Korean",
            "Portuguese",
            "Russian",
            "Arabic",
            "Italian",
            "Dutch",
            "Turkish",
            "Vietnamese",
            "Indonesian",
            "Thai",
            "Polish",
            "Romanian",
            "Greek",
            "Czech",
            "Finnish",
            "Hindi",
            "Ukrainian",
            "Swedish",
            "Norwegian",
            "Danish",
            "Hungarian"
          ],
          "label": "Language Hint",
          "tooltip": "Optional language hint to improve pronunciation"
        },
        {
          "key": "englishNormalization",
          "apiParam": "english_normalization",
          "type": "switch",
          "default": false,
          "label": "English Normalization",
          "tooltip": "Improve number/date reading for English text (adds slight latency)"
        }
      ],
      "images": []
    },
    "parameterKeys": [
      {
        "key": "voiceId",
        "apiParam": "voice_id",
        "default": "English_Wiselady"
      },
      {
        "key": "emotion",
        "apiParam": "emotion",
        "default": "auto"
      },
      {
        "key": "speed",
        "apiParam": "speed",
        "default": 1
      },
      {
        "key": "volume",
        "apiParam": "volume",
        "default": 1
      },
      {
        "key": "pitch",
        "apiParam": "pitch",
        "default": 0
      },
      {
        "key": "audioFormat",
        "apiParam": "audio_format",
        "default": "mp3"
      },
      {
        "key": "languageBoost",
        "apiParam": "language_boost",
        "default": "None"
      },
      {
        "key": "englishNormalization",
        "apiParam": "english_normalization",
        "default": false
      }
    ]
  },
  {
    "id": "minimax-voice-cloning",
    "name": "Minimax Voice Cloning",
    "type": "audio",
    "provider": "replicate",
    "category": "Voice Cloning",
    "description": "Clone voices from 5s–5min audio samples for use with Minimax speech-02-hd and speech-02-turbo TTS models.",
    "apiModel": "minimax/voice-cloning",
    "defaultOutputFormat": "json",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "audioFile": "voice_file"
    },
    "capabilities": {
      "maxResolution": "n/a",
      "resolutionBehavior": "fixed",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "requiresAudio": true,
      "requiresPrompt": false
    },
    "pricing": {
      "apiCostEur": 2.75,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [
        {
          "key": "model",
          "apiParam": "model",
          "type": "select",
          "default": "speech-02-turbo",
          "options": [
            "speech-02-hd",
            "speech-02-turbo"
          ],
          "label": "TTS Model",
          "tooltip": "Target TTS model to train the voice for"
        },
        {
          "key": "accuracy",
          "apiParam": "accuracy",
          "type": "slider",
          "default": 0.7,
          "min": 0,
          "max": 1,
          "step": 0.05,
          "label": "Accuracy Threshold",
          "tooltip": "Text validation accuracy threshold (0-1). Higher = stricter validation."
        },
        {
          "key": "needNoiseReduction",
          "apiParam": "need_noise_reduction",
          "type": "switch",
          "default": false,
          "label": "Noise Reduction",
          "tooltip": "Enable if the voice file has background noise"
        },
        {
          "key": "needVolumeNormalization",
          "apiParam": "need_volume_normalization",
          "type": "switch",
          "default": false,
          "label": "Volume Normalization",
          "tooltip": "Normalize audio volume levels"
        }
      ],
      "images": []
    },
    "parameterKeys": [
      {
        "key": "model",
        "apiParam": "model",
        "default": "speech-02-turbo"
      },
      {
        "key": "accuracy",
        "apiParam": "accuracy",
        "default": 0.7
      },
      {
        "key": "needNoiseReduction",
        "apiParam": "need_noise_reduction",
        "default": false
      },
      {
        "key": "needVolumeNormalization",
        "apiParam": "need_volume_normalization",
        "default": false
      }
    ]
  },
  {
    "id": "avatar",
    "name": "Avatar Generator",
    "type": "avatar",
    "provider": "lovable-ai",
    "category": "Avatar",
    "description": "AI-generated profile avatars with professional portrait style",
    "apiModel": null,
    "defaultOutputFormat": "png",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {},
    "capabilities": {
      "maxResolution": "512px",
      "resolutionBehavior": "fixed",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": false
    },
    "pricing": {
      "apiCostEur": 0.01,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [],
      "images": []
    },
    "parameterKeys": []
  },
  {
    "id": "flux",
    "name": "Flux Schnell",
    "type": "image",
    "provider": "replicate",
    "category": "Fast & Efficient",
    "description": "Lightning-fast generation with efficient quality. Max 1 megapixel (~1024x1024). Ideal for high-volume production workflows.",
    "apiModel": "black-forest-labs/flux-schnell",
    "defaultOutputFormat": "webp",
    "supportsOutputQuality": true,
    "supportsMultiOutput": true,
    "apiMapping": {
      "aspectRatio": "aspect_ratio",
      "customMappings": {
        "comment": "Flux Schnell uses aspect_ratio string format, not width/height"
      }
    },
    "capabilities": {
      "maxResolution": "1k",
      "resolutionBehavior": "aspect-only",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true
    },
    "pricing": {
      "apiCostEur": 0.003,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [
        {
          "key": "fluxAspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "16:9",
          "options": [
            "1:1",
            "16:9",
            "9:16",
            "4:3",
            "3:4",
            "21:9",
            "9:21"
          ],
          "label": "Aspect Ratio"
        },
        {
          "key": "fluxNumOutputs",
          "apiParam": "num_outputs",
          "type": "slider",
          "default": 1,
          "min": 1,
          "max": 4,
          "label": "Number of Images"
        },
        {
          "key": "fluxSteps",
          "apiParam": "num_inference_steps",
          "type": "slider",
          "default": 4,
          "min": 1,
          "max": 4,
          "label": "Inference Steps",
          "tooltip": "More steps = higher quality but slower"
        },
        {
          "key": "fluxSeed",
          "apiParam": "seed",
          "type": "seed"
        },
        {
          "key": "fluxOutputFormat",
          "apiParam": "output_format",
          "type": "select",
          "default": "webp",
          "options": [
            "webp",
            "jpg",
            "png"
          ],
          "label": "Output Format"
        },
        {
          "key": "fluxOutputQuality",
          "apiParam": "output_quality",
          "type": "slider",
          "default": 80,
          "min": 0,
          "max": 100,
          "label": "Output Quality"
        },
        {
          "key": "fluxDisableSafetyChecker",
          "apiParam": "disable_safety_checker",
          "type": "switch",
          "label": "Disable Safety Checker"
        },
        {
          "key": "fluxGoFast",
          "apiParam": "go_fast",
          "type": "switch",
          "label": "Turbo Mode"
        },
        {
          "key": "fluxMegapixels",
          "apiParam": "megapixels",
          "type": "select",
          "default": "1",
          "options": [
            "0.25",
            "1"
          ],
          "label": "Megapixels"
        }
      ],
      "images": []
    },
    "parameterKeys": [
      {
        "key": "fluxAspectRatio",
        "apiParam": "aspect_ratio",
        "default": "16:9"
      },
      {
        "key": "fluxNumOutputs",
        "apiParam": "num_outputs",
        "default": 1
      },
      {
        "key": "fluxSteps",
        "apiParam": "num_inference_steps",
        "default": 4
      },
      {
        "key": "fluxSeed",
        "apiParam": "seed"
      },
      {
        "key": "fluxOutputFormat",
        "apiParam": "output_format",
        "default": "webp"
      },
      {
        "key": "fluxOutputQuality",
        "apiParam": "output_quality",
        "default": 80
      },
      {
        "key": "fluxDisableSafetyChecker",
        "apiParam": "disable_safety_checker"
      },
      {
        "key": "fluxGoFast",
        "apiParam": "go_fast"
      },
      {
        "key": "fluxMegapixels",
        "apiParam": "megapixels",
        "default": "1"
      }
    ]
  },
  {
    "id": "flux-dev",
    "name": "Flux 2 DEV",
    "type": "image",
    "provider": "replicate",
    "category": "Image Editing",
    "description": "Fast image editing with multi-image input (up to 5). Optimized for speed with go_fast mode.",
    "apiModel": "black-forest-labs/flux-2-dev",
    "defaultOutputFormat": "webp",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "aspectRatio": "aspect_ratio",
      "referenceImage": "input_images"
    },
    "capabilities": {
      "maxResolution": "1k",
      "resolutionBehavior": "aspect-only",
      "supportsReferenceImage": true,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "supportsMultipleImages": true,
      "maxReferenceImages": 5
    },
    "pricing": {
      "apiCostEur": 0.025,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [
        {
          "key": "fluxDevGoFast",
          "apiParam": "go_fast",
          "type": "toggle",
          "default": true,
          "label": "Go Fast",
          "tooltip": "Run faster predictions with additional optimizations"
        }
      ],
      "advanced": [
        {
          "key": "fluxDevAspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "1:1",
          "options": [
            "1:1",
            "16:9",
            "9:16",
            "3:2",
            "2:3",
            "4:5",
            "5:4",
            "4:3",
            "3:4",
            "match_input_image",
            "custom"
          ],
          "label": "Aspect Ratio"
        },
        {
          "key": "fluxSeed",
          "apiParam": "seed",
          "type": "seed"
        },
        {
          "key": "fluxDevWidth",
          "apiParam": "width",
          "type": "slider",
          "default": 1024,
          "min": 256,
          "max": 1440,
          "step": 32,
          "label": "Width",
          "tooltip": "Only used when aspect_ratio is custom"
        },
        {
          "key": "fluxDevHeight",
          "apiParam": "height",
          "type": "slider",
          "default": 1024,
          "min": 256,
          "max": 1440,
          "step": 32,
          "label": "Height",
          "tooltip": "Only used when aspect_ratio is custom"
        },
        {
          "key": "fluxOutputFormat",
          "apiParam": "output_format",
          "type": "select",
          "default": "webp",
          "options": [
            "webp",
            "jpg",
            "png"
          ],
          "label": "Output Format"
        },
        {
          "key": "fluxOutputQuality",
          "apiParam": "output_quality",
          "type": "slider",
          "default": 80,
          "min": 0,
          "max": 100,
          "label": "Output Quality"
        },
        {
          "key": "fluxDevDisableSafety",
          "apiParam": "disable_safety_checker",
          "type": "toggle",
          "default": false,
          "label": "Disable Safety Checker"
        }
      ],
      "images": [
        {
          "key": "fluxDevInputImages",
          "apiParam": "input_images",
          "label": "Reference Images"
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "fluxDevGoFast",
        "apiParam": "go_fast",
        "default": true
      },
      {
        "key": "fluxDevAspectRatio",
        "apiParam": "aspect_ratio",
        "default": "1:1"
      },
      {
        "key": "fluxSeed",
        "apiParam": "seed"
      },
      {
        "key": "fluxDevWidth",
        "apiParam": "width",
        "default": 1024
      },
      {
        "key": "fluxDevHeight",
        "apiParam": "height",
        "default": 1024
      },
      {
        "key": "fluxOutputFormat",
        "apiParam": "output_format",
        "default": "webp"
      },
      {
        "key": "fluxOutputQuality",
        "apiParam": "output_quality",
        "default": 80
      },
      {
        "key": "fluxDevDisableSafety",
        "apiParam": "disable_safety_checker",
        "default": false
      }
    ]
  },
  {
    "id": "flux-kontext-pro",
    "name": "FLUX Kontext Pro",
    "type": "image",
    "provider": "replicate",
    "category": "Image Editing",
    "description": "Context-aware image editing and generation. Edit images with text instructions while preserving context. Ideal for object replacement, style transfer, and creative edits.",
    "apiModel": "black-forest-labs/flux-kontext-pro",
    "defaultOutputFormat": "png",
    "supportsOutputQuality": false,
    "supportsMultiOutput": false,
    "apiMapping": {
      "aspectRatio": "aspect_ratio",
      "referenceImage": "input_image",
      "slots": {
        "refImage": "input_image"
      }
    },
    "capabilities": {
      "maxResolution": "2k",
      "resolutionBehavior": "aspect-only",
      "supportsReferenceImage": true,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "supportsMultipleImages": false,
      "maxReferenceImages": 1
    },
    "pricing": {
      "apiCostEur": 0.037,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [
        {
          "key": "fluxKontextAspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "match_input_image",
          "options": [
            "match_input_image",
            "1:1",
            "16:9",
            "9:16",
            "4:3",
            "3:4",
            "3:2",
            "2:3",
            "4:5",
            "5:4",
            "21:9",
            "9:21",
            "2:1",
            "1:2"
          ],
          "label": "Aspect Ratio"
        },
        {
          "key": "fluxKontextSafetyTolerance",
          "apiParam": "safety_tolerance",
          "type": "slider",
          "default": 2,
          "min": 0,
          "max": 6,
          "label": "Safety Tolerance",
          "tooltip": "0 = strict, 6 = permissive. Max 2 when using reference images."
        },
        {
          "key": "fluxKontextPromptUpsampling",
          "apiParam": "prompt_upsampling",
          "type": "switch",
          "default": false,
          "label": "Prompt Upsampling",
          "tooltip": "Automatically improve prompt quality"
        },
        {
          "key": "fluxKontextSeed",
          "apiParam": "seed",
          "type": "seed"
        },
        {
          "key": "fluxKontextOutputFormat",
          "apiParam": "output_format",
          "type": "select",
          "default": "png",
          "options": [
            "png",
            "jpg"
          ],
          "label": "Output Format"
        }
      ],
      "images": [
        {
          "key": "fluxKontextInputImage",
          "apiParam": "input_image",
          "label": "Reference Image",
          "single": true
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "fluxKontextAspectRatio",
        "apiParam": "aspect_ratio",
        "default": "match_input_image"
      },
      {
        "key": "fluxKontextSafetyTolerance",
        "apiParam": "safety_tolerance",
        "default": 2
      },
      {
        "key": "fluxKontextPromptUpsampling",
        "apiParam": "prompt_upsampling",
        "default": false
      },
      {
        "key": "fluxKontextSeed",
        "apiParam": "seed"
      },
      {
        "key": "fluxKontextOutputFormat",
        "apiParam": "output_format",
        "default": "png"
      }
    ]
  },
  {
    "id": "flux-max",
    "name": "Flux 2 MAX",
    "type": "image",
    "provider": "replicate",
    "category": "Premium",
    "description": "Next-generation Flux with multi-image input (up to 8). Max 2K resolution. Premium quality for creative work.",
    "apiModel": "black-forest-labs/flux-2-max",
    "defaultOutputFormat": "webp",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "aspectRatio": "aspect_ratio",
      "referenceImage": "input_images",
      "resolution": "resolution"
    },
    "capabilities": {
      "maxResolution": "2k",
      "resolutionBehavior": "aspect-only",
      "supportsReferenceImage": true,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "supportsMultipleImages": true,
      "maxReferenceImages": 8
    },
    "pricing": {
      "apiCostEur": 0.1,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [
        {
          "key": "fluxMaxResolution",
          "apiParam": "resolution",
          "type": "select",
          "default": "1 MP",
          "options": [
            "0.5 MP",
            "1 MP",
            "2 MP",
            "4 MP"
          ],
          "label": "Resolution"
        }
      ],
      "advanced": [
        {
          "key": "fluxMaxAspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "1:1",
          "options": [
            "1:1",
            "16:9",
            "9:16",
            "3:2",
            "2:3",
            "4:5",
            "5:4",
            "4:3",
            "3:4",
            "match_input_image",
            "custom"
          ],
          "label": "Aspect Ratio"
        },
        {
          "key": "fluxSeed",
          "apiParam": "seed",
          "type": "seed"
        },
        {
          "key": "fluxMaxWidth",
          "apiParam": "width",
          "type": "slider",
          "default": 1024,
          "min": 256,
          "max": 2048,
          "step": 32,
          "label": "Width",
          "tooltip": "Only used when aspect_ratio is custom"
        },
        {
          "key": "fluxMaxHeight",
          "apiParam": "height",
          "type": "slider",
          "default": 1024,
          "min": 256,
          "max": 2048,
          "step": 32,
          "label": "Height",
          "tooltip": "Only used when aspect_ratio is custom"
        },
        {
          "key": "fluxOutputFormat",
          "apiParam": "output_format",
          "type": "select",
          "default": "webp",
          "options": [
            "webp",
            "jpg",
            "png"
          ],
          "label": "Output Format"
        },
        {
          "key": "fluxOutputQuality",
          "apiParam": "output_quality",
          "type": "slider",
          "default": 80,
          "min": 0,
          "max": 100,
          "label": "Output Quality"
        },
        {
          "key": "fluxSafetyTolerance",
          "apiParam": "safety_tolerance",
          "type": "slider",
          "default": 2,
          "min": 1,
          "max": 5,
          "label": "Safety Tolerance",
          "tooltip": "Higher = more permissive content"
        }
      ],
      "images": [
        {
          "key": "fluxMaxInputImages",
          "apiParam": "input_images",
          "label": "Reference Images"
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "fluxMaxResolution",
        "apiParam": "resolution",
        "default": "1 MP"
      },
      {
        "key": "fluxMaxAspectRatio",
        "apiParam": "aspect_ratio",
        "default": "1:1"
      },
      {
        "key": "fluxSeed",
        "apiParam": "seed"
      },
      {
        "key": "fluxMaxWidth",
        "apiParam": "width",
        "default": 1024
      },
      {
        "key": "fluxMaxHeight",
        "apiParam": "height",
        "default": 1024
      },
      {
        "key": "fluxOutputFormat",
        "apiParam": "output_format",
        "default": "webp"
      },
      {
        "key": "fluxOutputQuality",
        "apiParam": "output_quality",
        "default": 80
      },
      {
        "key": "fluxSafetyTolerance",
        "apiParam": "safety_tolerance",
        "default": 2
      }
    ]
  },
  {
    "id": "flux-pro",
    "name": "Flux 2 Pro",
    "type": "image",
    "provider": "replicate",
    "category": "High Quality",
    "description": "Next-generation Flux model with multi-image input. Max 2K (4MP) resolution. Best for professional creative work.",
    "apiModel": "black-forest-labs/flux-2-pro",
    "defaultOutputFormat": "webp",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "aspectRatio": "aspect_ratio",
      "referenceImage": "input_images",
      "resolution": "resolution",
      "customMappings": {
        "comment": "Flux 2 Pro supports multi-image input and resolution parameter"
      }
    },
    "capabilities": {
      "maxResolution": "2k",
      "resolutionBehavior": "aspect-only",
      "supportsReferenceImage": true,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "supportsMultipleImages": true,
      "maxReferenceImages": 8
    },
    "pricing": {
      "apiCostEur": 0.03,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [
        {
          "key": "fluxResolution",
          "apiParam": "resolution",
          "type": "select",
          "default": "1 MP",
          "options": [
            "0.5 MP",
            "1 MP",
            "2 MP",
            "4 MP"
          ],
          "label": "Resolution"
        }
      ],
      "advanced": [
        {
          "key": "fluxProAspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "1:1",
          "options": [
            "1:1",
            "16:9",
            "9:16",
            "4:3",
            "3:4",
            "2:3",
            "3:2",
            "custom"
          ],
          "label": "Aspect Ratio"
        },
        {
          "key": "fluxSeed",
          "apiParam": "seed",
          "type": "seed"
        },
        {
          "key": "fluxWidth",
          "apiParam": "width",
          "type": "slider",
          "default": 1024,
          "min": 256,
          "max": 2048,
          "step": 32,
          "label": "Width",
          "tooltip": "Only used when aspect_ratio is custom"
        },
        {
          "key": "fluxHeight",
          "apiParam": "height",
          "type": "slider",
          "default": 768,
          "min": 256,
          "max": 2048,
          "step": 32,
          "label": "Height",
          "tooltip": "Only used when aspect_ratio is custom"
        },
        {
          "key": "fluxOutputQuality",
          "apiParam": "output_quality",
          "type": "slider",
          "default": 80,
          "min": 0,
          "max": 100,
          "label": "Output Quality"
        },
        {
          "key": "fluxSafetyTolerance",
          "apiParam": "safety_tolerance",
          "type": "slider",
          "default": 2,
          "min": 1,
          "max": 5,
          "label": "Safety Tolerance",
          "tooltip": "Higher = more permissive content"
        }
      ],
      "images": [
        {
          "key": "fluxInputImages",
          "apiParam": "input_images",
          "label": "Reference Images"
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "fluxResolution",
        "apiParam": "resolution",
        "default": "1 MP"
      },
      {
        "key": "fluxProAspectRatio",
        "apiParam": "aspect_ratio",
        "default": "1:1"
      },
      {
        "key": "fluxSeed",
        "apiParam": "seed"
      },
      {
        "key": "fluxWidth",
        "apiParam": "width",
        "default": 1024
      },
      {
        "key": "fluxHeight",
        "apiParam": "height",
        "default": 768
      },
      {
        "key": "fluxOutputQuality",
        "apiParam": "output_quality",
        "default": 80
      },
      {
        "key": "fluxSafetyTolerance",
        "apiParam": "safety_tolerance",
        "default": 2
      }
    ]
  },
  {
    "id": "gpt-image-2",
    "name": "GPT Image 2",
    "type": "image",
    "provider": "replicate",
    "category": "Premium",
    "description": "OpenAI's image model. Excellent instruction following and composite layouts — the best fit for character sheets and multi-view boards.",
    "apiModel": "openai/gpt-image-2",
    "defaultOutputFormat": "png",
    "supportsOutputQuality": false,
    "supportsMultiOutput": false,
    "apiMapping": {
      "aspectRatio": "aspect_ratio",
      "referenceImages": "input_images",
      "slots": {
        "refImage": "input_images"
      }
    },
    "capabilities": {
      "maxResolution": "2k",
      "resolutionBehavior": "aspect-only",
      "supportsReferenceImage": true,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "supportsMultipleImages": true,
      "maxReferenceImages": 10,
      "supportsMultilingualPrompts": true
    },
    "pricing": {
      "apiCostEur": 0.1178,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": true,
      "variants": [
        {
          "condition": {
            "quality": "low"
          },
          "apiCostEur": 0.011
        },
        {
          "condition": {
            "quality": "medium"
          },
          "apiCostEur": 0.0432
        },
        {
          "condition": {
            "quality": "high"
          },
          "apiCostEur": 0.1178
        },
        {
          "condition": {
            "quality": "auto"
          },
          "apiCostEur": 0.1178
        }
      ]
    },
    "parameters": {
      "basic": [],
      "advanced": [
        {
          "key": "gptImageQuality",
          "apiParam": "quality",
          "type": "select",
          "default": "auto",
          "options": [
            "low",
            "medium",
            "high",
            "auto"
          ],
          "label": "Quality",
          "tooltip": "Drives both fidelity and price: low is roughly a tenth of high. 'auto' bills at the high rate."
        },
        {
          "key": "gptImageBackground",
          "apiParam": "background",
          "type": "select",
          "default": "auto",
          "options": [
            "auto",
            "transparent",
            "opaque"
          ],
          "label": "Background",
          "tooltip": "Transparent requires a png or webp output format."
        },
        {
          "key": "gptImageOutputFormat",
          "apiParam": "output_format",
          "type": "select",
          "default": "png",
          "options": [
            "png",
            "jpeg",
            "webp"
          ],
          "label": "Output Format"
        },
        {
          "key": "gptImageCompression",
          "apiParam": "output_compression",
          "type": "slider",
          "default": 90,
          "min": 0,
          "max": 100,
          "step": 5,
          "label": "Compression",
          "tooltip": "Only applies to jpeg and webp."
        }
      ],
      "images": [
        {
          "key": "gptImageInputImages",
          "apiParam": "input_images",
          "label": "Reference Images (up to 10)",
          "single": false,
          "max": 10
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "gptImageQuality",
        "apiParam": "quality",
        "default": "auto"
      },
      {
        "key": "gptImageBackground",
        "apiParam": "background",
        "default": "auto"
      },
      {
        "key": "gptImageOutputFormat",
        "apiParam": "output_format",
        "default": "png"
      },
      {
        "key": "gptImageCompression",
        "apiParam": "output_compression",
        "default": 90
      }
    ]
  },
  {
    "id": "imagen-4",
    "name": "Imagen 4",
    "type": "image",
    "provider": "replicate",
    "category": "High Quality",
    "description": "Google's advanced model with photorealistic output. Strong at natural scenes and human subjects.",
    "apiModel": "google/imagen-4",
    "defaultOutputFormat": "jpg",
    "supportsOutputQuality": false,
    "supportsMultiOutput": false,
    "apiMapping": {
      "aspectRatio": "aspect_ratio",
      "referenceImage": "image"
    },
    "capabilities": {
      "maxResolution": "2k",
      "resolutionBehavior": "aspect-only",
      "supportsReferenceImage": true,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true
    },
    "pricing": {
      "apiCostEur": 0.04,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [
        {
          "key": "imagenAspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "16:9",
          "options": [
            "1:1",
            "16:9",
            "9:16",
            "4:3",
            "3:4"
          ],
          "label": "Aspect Ratio"
        },
        {
          "key": "imagenSafetyLevel",
          "apiParam": "safety_filter_level",
          "type": "select",
          "default": "block_only_high",
          "options": [
            "block_only_high",
            "block_medium_and_above",
            "block_low_and_above"
          ],
          "label": "Safety Filter"
        },
        {
          "key": "imagenOutputFormat",
          "apiParam": "output_format",
          "type": "select",
          "default": "jpg",
          "options": [
            "jpg",
            "png"
          ],
          "label": "Output Format"
        }
      ],
      "images": []
    },
    "parameterKeys": [
      {
        "key": "imagenAspectRatio",
        "apiParam": "aspect_ratio",
        "default": "16:9"
      },
      {
        "key": "imagenSafetyLevel",
        "apiParam": "safety_filter_level",
        "default": "block_only_high"
      },
      {
        "key": "imagenOutputFormat",
        "apiParam": "output_format",
        "default": "jpg"
      }
    ]
  },
  {
    "id": "imagen-4-ultra",
    "name": "Imagen 4 Ultra",
    "type": "image",
    "provider": "replicate",
    "category": "Premium",
    "description": "Google's flagship with unmatched realism. Premium quality for marketing and professional photography.",
    "apiModel": "google/imagen-4-ultra",
    "defaultOutputFormat": "jpg",
    "supportsOutputQuality": false,
    "supportsMultiOutput": false,
    "apiMapping": {
      "aspectRatio": "aspect_ratio",
      "referenceImage": "image"
    },
    "capabilities": {
      "maxResolution": "2k",
      "resolutionBehavior": "aspect-only",
      "supportsReferenceImage": true,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true
    },
    "pricing": {
      "apiCostEur": 0.056,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [
        {
          "key": "imagenAspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "16:9",
          "options": [
            "1:1",
            "16:9",
            "9:16",
            "4:3",
            "3:4"
          ],
          "label": "Aspect Ratio"
        },
        {
          "key": "imagenSafetyLevel",
          "apiParam": "safety_filter_level",
          "type": "select",
          "default": "block_only_high",
          "options": [
            "block_only_high",
            "block_medium_and_above",
            "block_low_and_above"
          ],
          "label": "Safety Filter"
        },
        {
          "key": "imagenOutputFormat",
          "apiParam": "output_format",
          "type": "select",
          "default": "jpg",
          "options": [
            "jpg",
            "png"
          ],
          "label": "Output Format"
        }
      ],
      "images": []
    },
    "parameterKeys": [
      {
        "key": "imagenAspectRatio",
        "apiParam": "aspect_ratio",
        "default": "16:9"
      },
      {
        "key": "imagenSafetyLevel",
        "apiParam": "safety_filter_level",
        "default": "block_only_high"
      },
      {
        "key": "imagenOutputFormat",
        "apiParam": "output_format",
        "default": "jpg"
      }
    ]
  },
  {
    "id": "nano-banana",
    "name": "Nano Banana",
    "type": "image",
    "provider": "replicate",
    "category": "Fast & Efficient",
    "description": "Fast generation with aspect ratio control. Supports up to 4 reference images.",
    "apiModel": "google/nano-banana",
    "defaultOutputFormat": "jpg",
    "supportsOutputQuality": false,
    "supportsMultiOutput": false,
    "apiMapping": {
      "aspectRatio": "aspect_ratio",
      "outputFormat": "output_format",
      "referenceImages": "image_input",
      "customMappings": {
        "comment": "Nano Banana via Replicate accepts aspect_ratio and image_input array"
      }
    },
    "capabilities": {
      "maxResolution": "1k",
      "resolutionBehavior": "aspect-only",
      "supportsReferenceImage": true,
      "requiresReferenceImage": false,
      "supportsMultipleImages": true,
      "maxReferenceImages": 4,
      "supportsAdvancedOptions": true
    },
    "pricing": {
      "apiCostEur": 0.036,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [
        {
          "key": "nanoBananaAspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "match_input_image",
          "options": [
            "match_input_image",
            "1:1",
            "2:3",
            "3:2",
            "3:4",
            "4:3",
            "4:5",
            "5:4",
            "9:16",
            "16:9",
            "21:9"
          ],
          "label": "Aspect Ratio"
        },
        {
          "key": "nanoBananaOutputFormat",
          "apiParam": "output_format",
          "type": "select",
          "default": "jpg",
          "options": [
            "jpg",
            "png"
          ],
          "label": "Output Format"
        }
      ],
      "images": [
        {
          "key": "imageInput",
          "apiParam": "image_input",
          "label": "Reference Images"
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "nanoBananaAspectRatio",
        "apiParam": "aspect_ratio",
        "default": "match_input_image"
      },
      {
        "key": "nanoBananaOutputFormat",
        "apiParam": "output_format",
        "default": "jpg"
      }
    ]
  },
  {
    "id": "nano-banana-2",
    "name": "Nano Banana 2",
    "type": "image",
    "provider": "replicate",
    "category": "Fast & Efficient",
    "description": "Next-gen fast generation with selectable resolution (1K–4K), Google Search grounding, and up to 14 reference images.",
    "apiModel": "google/nano-banana-2",
    "defaultOutputFormat": "jpg",
    "supportsOutputQuality": false,
    "supportsMultiOutput": false,
    "apiMapping": {
      "aspectRatio": "aspect_ratio",
      "resolution": "resolution",
      "outputFormat": "output_format",
      "referenceImages": "image_input",
      "customMappings": {
        "comment": "Nano Banana 2 via Replicate with resolution, search grounding, and safety controls"
      }
    },
    "capabilities": {
      "maxResolution": "4k",
      "resolutionBehavior": "selectable",
      "allowedResolutions": [
        "1K",
        "2K",
        "4K"
      ],
      "supportsReferenceImage": true,
      "requiresReferenceImage": false,
      "supportsMultipleImages": true,
      "maxReferenceImages": 14,
      "supportsAdvancedOptions": true
    },
    "pricing": {
      "apiCostEur": 0.036,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [
        {
          "key": "nanoBananaResolution",
          "apiParam": "resolution",
          "type": "select",
          "default": "2K",
          "options": [
            "1K",
            "2K",
            "4K"
          ],
          "label": "Resolution"
        }
      ],
      "advanced": [
        {
          "key": "nanoBanana2AspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "match_input_image",
          "options": [
            "match_input_image",
            "1:1",
            "1:4",
            "2:3",
            "3:2",
            "3:4",
            "4:1",
            "4:3",
            "4:5",
            "5:4",
            "8:1",
            "1:8",
            "9:16",
            "16:9",
            "21:9"
          ],
          "label": "Aspect Ratio"
        },
        {
          "key": "nanoBanana2OutputFormat",
          "apiParam": "output_format",
          "type": "select",
          "default": "jpg",
          "options": [
            "jpg",
            "png"
          ],
          "label": "Output Format"
        },
        {
          "key": "nanoBanana2GoogleSearch",
          "apiParam": "google_search",
          "type": "switch",
          "default": false,
          "label": "Google Search Grounding"
        },
        {
          "key": "nanoBanana2ImageSearch",
          "apiParam": "image_search",
          "type": "switch",
          "default": false,
          "label": "Image Search Grounding"
        }
      ],
      "images": [
        {
          "key": "imageInput",
          "apiParam": "image_input",
          "label": "Reference Images"
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "nanoBananaResolution",
        "apiParam": "resolution",
        "default": "2K"
      },
      {
        "key": "nanoBanana2AspectRatio",
        "apiParam": "aspect_ratio",
        "default": "match_input_image"
      },
      {
        "key": "nanoBanana2OutputFormat",
        "apiParam": "output_format",
        "default": "jpg"
      },
      {
        "key": "nanoBanana2GoogleSearch",
        "apiParam": "google_search",
        "default": false
      },
      {
        "key": "nanoBanana2ImageSearch",
        "apiParam": "image_search",
        "default": false
      }
    ]
  },
  {
    "id": "nano-banana-pro",
    "name": "Nano Banana Pro",
    "type": "image",
    "provider": "replicate",
    "category": "Image Editing",
    "description": "Enhanced quality with selectable resolution (1K/2K/4K). Supports up to 14 reference images.",
    "apiModel": "google/nano-banana-pro",
    "defaultOutputFormat": "jpg",
    "supportsOutputQuality": false,
    "supportsMultiOutput": false,
    "apiMapping": {
      "aspectRatio": "aspect_ratio",
      "resolution": "resolution",
      "outputFormat": "output_format",
      "safetyFilterLevel": "safety_filter_level",
      "referenceImages": "image_input",
      "customMappings": {
        "comment": "Nano Banana Pro via Replicate with resolution and safety controls"
      }
    },
    "capabilities": {
      "maxResolution": "4k",
      "resolutionBehavior": "selectable",
      "allowedResolutions": [
        "1K",
        "2K",
        "4K"
      ],
      "supportsReferenceImage": true,
      "requiresReferenceImage": false,
      "supportsMultipleImages": true,
      "maxReferenceImages": 14,
      "supportsAdvancedOptions": true
    },
    "pricing": {
      "apiCostEur": null,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false,
      "variants": [
        {
          "suffix": "",
          "apiCostEur": 0.138,
          "condition": {
            "nanoBananaResolution": [
              "1K",
              "2K"
            ]
          }
        },
        {
          "suffix": "-4K",
          "apiCostEur": 0.276,
          "condition": {
            "nanoBananaResolution": "4K"
          }
        }
      ]
    },
    "parameters": {
      "basic": [
        {
          "key": "nanoBananaResolution",
          "apiParam": "resolution",
          "type": "select",
          "default": "2K",
          "options": [
            "1K",
            "2K",
            "4K"
          ],
          "label": "Resolution"
        }
      ],
      "advanced": [
        {
          "key": "nanoBananaProAspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "match_input_image",
          "options": [
            "match_input_image",
            "1:1",
            "2:3",
            "3:2",
            "3:4",
            "4:3",
            "4:5",
            "5:4",
            "9:16",
            "16:9",
            "21:9"
          ],
          "label": "Aspect Ratio"
        },
        {
          "key": "nanoBananaProOutputFormat",
          "apiParam": "output_format",
          "type": "select",
          "default": "jpg",
          "options": [
            "jpg",
            "png"
          ],
          "label": "Output Format"
        },
        {
          "key": "nanoBananaSafetyLevel",
          "apiParam": "safety_filter_level",
          "type": "select",
          "default": "block_only_high",
          "options": [
            "block_only_high",
            "block_medium_and_above",
            "block_low_and_above"
          ],
          "label": "Safety Filter"
        }
      ],
      "images": [
        {
          "key": "imageInput",
          "apiParam": "image_input",
          "label": "Reference Images"
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "nanoBananaResolution",
        "apiParam": "resolution",
        "default": "2K"
      },
      {
        "key": "nanoBananaProAspectRatio",
        "apiParam": "aspect_ratio",
        "default": "match_input_image"
      },
      {
        "key": "nanoBananaProOutputFormat",
        "apiParam": "output_format",
        "default": "jpg"
      },
      {
        "key": "nanoBananaSafetyLevel",
        "apiParam": "safety_filter_level",
        "default": "block_only_high"
      }
    ]
  },
  {
    "id": "qwen-multi-angle",
    "name": "Multi-Angle Camera",
    "type": "image",
    "provider": "replicate",
    "category": "Image Editing",
    "description": "Regenerate any image from a different camera angle using 3D camera controls. Upload a reference image and position the virtual camera.",
    "apiModel": "qwen/qwen-edit-multiangle",
    "defaultOutputFormat": "webp",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "slots": {
        "refImage": "image"
      }
    },
    "capabilities": {
      "supportsReferenceImage": true,
      "requiresReferenceImage": true,
      "maxReferenceImages": 1,
      "supportsAdvancedOptions": true,
      "supportsMultiOutput": false,
      "supportsOutputQuality": false
    },
    "pricing": {
      "apiCostEur": 0.03,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [
        {
          "key": "qwenRotate",
          "apiParam": "rotate_degrees",
          "type": "slider",
          "default": 0,
          "min": -90,
          "max": 90,
          "step": 1,
          "label": "Rotation (Left/Right)"
        },
        {
          "key": "qwenMoveForward",
          "apiParam": "move_forward",
          "type": "slider",
          "default": 0,
          "min": 0,
          "max": 10,
          "step": 1,
          "label": "Distance (Close-up)"
        },
        {
          "key": "qwenVerticalAngle",
          "apiParam": "vertical_tilt",
          "type": "slider",
          "default": 0,
          "min": -1,
          "max": 1,
          "step": 1,
          "label": "Vertical Tilt"
        }
      ],
      "advanced": [
        {
          "key": "qwenWideAngle",
          "apiParam": "use_wide_angle",
          "type": "switch",
          "default": false,
          "label": "Wide-Angle Lens"
        },
        {
          "key": "qwenGoFast",
          "apiParam": "go_fast",
          "type": "switch",
          "default": true,
          "label": "Go Fast"
        },
        {
          "key": "qwenLoraScale",
          "apiParam": "lora_scale",
          "type": "slider",
          "default": 1.25,
          "min": 0,
          "max": 4,
          "step": 0.05,
          "label": "Effect Strength"
        },
        {
          "key": "qwenGuidanceScale",
          "apiParam": "true_guidance_scale",
          "type": "slider",
          "default": 1,
          "min": 0,
          "max": 10,
          "step": 0.5,
          "label": "Guidance Scale"
        },
        {
          "key": "qwenInferenceSteps",
          "apiParam": "num_inference_steps",
          "type": "slider",
          "default": null,
          "min": 1,
          "max": 40,
          "step": 1,
          "label": "Inference Steps"
        },
        {
          "key": "qwenSeed",
          "apiParam": "seed",
          "type": "seed",
          "label": "Seed"
        }
      ],
      "images": [
        {
          "key": "qwenSourceImage",
          "apiParam": "image",
          "label": "Source Image"
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "qwenRotate",
        "apiParam": "rotate_degrees",
        "default": 0
      },
      {
        "key": "qwenMoveForward",
        "apiParam": "move_forward",
        "default": 0
      },
      {
        "key": "qwenVerticalAngle",
        "apiParam": "vertical_tilt",
        "default": 0
      },
      {
        "key": "qwenWideAngle",
        "apiParam": "use_wide_angle",
        "default": false
      },
      {
        "key": "qwenGoFast",
        "apiParam": "go_fast",
        "default": true
      },
      {
        "key": "qwenLoraScale",
        "apiParam": "lora_scale",
        "default": 1.25
      },
      {
        "key": "qwenGuidanceScale",
        "apiParam": "true_guidance_scale",
        "default": 1
      },
      {
        "key": "qwenInferenceSteps",
        "apiParam": "num_inference_steps",
        "default": null
      },
      {
        "key": "qwenSeed",
        "apiParam": "seed"
      }
    ]
  },
  {
    "id": "seedream-4-edit",
    "name": "SeeDream 4 Edit",
    "type": "image",
    "provider": "fal-ai",
    "category": "Image Editing",
    "description": "Advanced multi-image editing. Combine, transform, and edit up to 10 images with a single prompt. Ideal for complex scene compositions.",
    "apiModel": "fal-ai/bytedance/seedream/v4/edit",
    "defaultOutputFormat": "png",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "slots": {
        "refImage": "image_urls"
      },
      "customMappings": {}
    },
    "capabilities": {
      "maxResolution": "4k",
      "resolutionBehavior": "custom",
      "supportsReferenceImage": true,
      "requiresReferenceImage": true,
      "supportsAdvancedOptions": true,
      "supportsMultipleImages": true,
      "maxReferenceImages": 10
    },
    "pricing": {
      "apiCostEur": 0.028,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [
        {
          "key": "seedreamImageSize",
          "apiParam": "image_size",
          "type": "select",
          "default": "auto",
          "options": [
            "auto",
            "square_hd",
            "square",
            "portrait_4_3",
            "portrait_16_9",
            "landscape_4_3",
            "landscape_16_9",
            "auto_2K",
            "auto_4K"
          ],
          "label": "Image Size",
          "tooltip": "Output image size preset"
        },
        {
          "key": "seedreamEnhanceMode",
          "apiParam": "enhance_prompt_mode",
          "type": "select",
          "default": "standard",
          "options": [
            "standard",
            "fast"
          ],
          "label": "Enhance Mode",
          "tooltip": "Standard = higher quality, Fast = quicker results"
        },
        {
          "key": "seedreamNumImages",
          "apiParam": "num_images",
          "type": "slider",
          "default": 1,
          "min": 1,
          "max": 4,
          "label": "Number of Outputs"
        },
        {
          "key": "seedreamSeed",
          "apiParam": "seed",
          "type": "seed"
        },
        {
          "key": "seedreamSafetyChecker",
          "apiParam": "enable_safety_checker",
          "type": "switch",
          "default": true,
          "label": "Safety Checker"
        }
      ],
      "images": [
        {
          "key": "seedreamInputImages",
          "apiParam": "image_urls",
          "label": "Input Images",
          "max": 10
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "seedreamImageSize",
        "apiParam": "image_size",
        "default": "auto"
      },
      {
        "key": "seedreamEnhanceMode",
        "apiParam": "enhance_prompt_mode",
        "default": "standard"
      },
      {
        "key": "seedreamNumImages",
        "apiParam": "num_images",
        "default": 1
      },
      {
        "key": "seedreamSeed",
        "apiParam": "seed"
      },
      {
        "key": "seedreamSafetyChecker",
        "apiParam": "enable_safety_checker",
        "default": true
      }
    ]
  },
  {
    "id": "seedream-5-lite",
    "name": "Seedream 5 Lite",
    "type": "image",
    "provider": "replicate",
    "category": "High Quality",
    "description": "High quality generation with built-in reasoning, example-based editing, and up to 14 reference images for multi-reference blending.",
    "apiModel": "bytedance/seedream-5-lite",
    "defaultOutputFormat": "png",
    "supportsOutputQuality": false,
    "supportsMultiOutput": false,
    "apiMapping": {
      "aspectRatio": "aspect_ratio",
      "resolution": "size",
      "outputFormat": "output_format",
      "referenceImages": "image_input",
      "allowedResolutions": [
        "2K",
        "3K"
      ],
      "customMappings": {
        "comment": "Seedream 5 Lite via Replicate with reasoning, sequential generation, and multi-reference blending"
      }
    },
    "capabilities": {
      "maxResolution": "3k",
      "resolutionBehavior": "selectable",
      "allowedResolutions": [
        "2K",
        "3K"
      ],
      "supportsReferenceImage": true,
      "requiresReferenceImage": false,
      "supportsMultipleImages": true,
      "maxReferenceImages": 14,
      "supportsAdvancedOptions": true
    },
    "pricing": {
      "apiCostEur": 0.032,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [
        {
          "key": "seedreamResolution",
          "apiParam": "size",
          "type": "select",
          "default": "2K",
          "options": [
            "2K",
            "3K"
          ],
          "label": "Resolution"
        }
      ],
      "advanced": [
        {
          "key": "seedreamAspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "1:1",
          "options": [
            "1:1",
            "4:3",
            "3:4",
            "16:9",
            "9:16",
            "3:2",
            "2:3",
            "21:9"
          ],
          "label": "Aspect Ratio"
        },
        {
          "key": "seedreamSequential",
          "apiParam": "sequential_image_generation",
          "type": "select",
          "default": "disabled",
          "options": [
            "disabled",
            "auto"
          ],
          "label": "Sequential Generation"
        },
        {
          "key": "seedreamMaxImages",
          "apiParam": "max_images",
          "type": "slider",
          "default": 1,
          "min": 1,
          "max": 15,
          "step": 1,
          "label": "Max Images"
        },
        {
          "key": "seedreamOutputFormat",
          "apiParam": "output_format",
          "type": "select",
          "default": "png",
          "options": [
            "png",
            "jpeg"
          ],
          "label": "Output Format"
        }
      ],
      "images": [
        {
          "key": "imageInput",
          "apiParam": "image_input",
          "label": "Reference Images"
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "seedreamResolution",
        "apiParam": "size",
        "default": "2K"
      },
      {
        "key": "seedreamAspectRatio",
        "apiParam": "aspect_ratio",
        "default": "1:1"
      },
      {
        "key": "seedreamSequential",
        "apiParam": "sequential_image_generation",
        "default": "disabled"
      },
      {
        "key": "seedreamMaxImages",
        "apiParam": "max_images",
        "default": 1
      },
      {
        "key": "seedreamOutputFormat",
        "apiParam": "output_format",
        "default": "png"
      }
    ]
  },
  {
    "id": "seedream-v4-5",
    "name": "Seedream v4.5",
    "type": "image",
    "provider": "fal-ai",
    "category": "Fast & Efficient",
    "description": "Fast text-to-image generation with high quality. Supports up to 4K resolution. Ideal for rapid creative iterations.",
    "apiModel": "fal-ai/bytedance/seedream/v4.5/text-to-image",
    "defaultOutputFormat": "png",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "aspectRatio": "image_size",
      "customMappings": {
        "resolutionTierToImageSize": {
          "1K": "square",
          "2K": "auto_2K",
          "4K": "auto_4K"
        }
      }
    },
    "capabilities": {
      "minResolution": "2k",
      "maxResolution": "4k",
      "resolutionBehavior": "aspect-only",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "maxReferenceImages": 0,
      "supportsAdvancedOptions": true
    },
    "pricing": {
      "apiCostEur": 0.037,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [
        {
          "key": "seedreamV45ImageSize",
          "apiParam": "image_size",
          "type": "select",
          "default": "auto_2K",
          "options": [
            "square_hd",
            "square",
            "portrait_4_3",
            "portrait_16_9",
            "landscape_4_3",
            "landscape_16_9",
            "auto_2K",
            "auto_4K"
          ],
          "label": "Image Size"
        },
        {
          "key": "seedreamV45NumImages",
          "apiParam": "num_images",
          "type": "slider",
          "default": 1,
          "min": 1,
          "max": 4,
          "label": "Number of Images"
        },
        {
          "key": "seedreamV45Seed",
          "apiParam": "seed",
          "type": "seed",
          "label": "Seed"
        },
        {
          "key": "seedreamV45SafetyChecker",
          "apiParam": "enable_safety_checker",
          "type": "switch",
          "default": true,
          "label": "Safety Checker"
        }
      ],
      "images": []
    },
    "parameterKeys": [
      {
        "key": "seedreamV45ImageSize",
        "apiParam": "image_size",
        "default": "auto_2K"
      },
      {
        "key": "seedreamV45NumImages",
        "apiParam": "num_images",
        "default": 1
      },
      {
        "key": "seedreamV45Seed",
        "apiParam": "seed"
      },
      {
        "key": "seedreamV45SafetyChecker",
        "apiParam": "enable_safety_checker",
        "default": true
      }
    ]
  },
  {
    "id": "gemini-3-pro",
    "name": "Gemini 3 Pro",
    "type": "llm",
    "provider": "lovable-ai",
    "category": "Chat",
    "description": "Next-generation Gemini with enhanced reasoning capabilities.",
    "apiModel": null,
    "defaultOutputFormat": "webp",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {},
    "capabilities": {
      "maxResolution": "N/A",
      "resolutionBehavior": "fixed",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": false,
      "streaming": true,
      "contextWindow": 2000000,
      "supportsImages": true,
      "supportsSearch": false,
      "returnsCitations": false
    },
    "pricing": {
      "apiCostEur": 0.005,
      "pricingType": "per_request",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [],
      "images": []
    },
    "parameterKeys": []
  },
  {
    "id": "gemini-flash",
    "name": "Gemini Flash",
    "type": "llm",
    "provider": "lovable-ai",
    "category": "Chat",
    "description": "Balanced speed and quality. Great for most tasks.",
    "apiModel": null,
    "defaultOutputFormat": "webp",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {},
    "capabilities": {
      "maxResolution": "N/A",
      "resolutionBehavior": "fixed",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": false,
      "streaming": true,
      "contextWindow": 1000000,
      "supportsImages": true,
      "supportsSearch": false,
      "returnsCitations": false
    },
    "pricing": {
      "apiCostEur": 0.0008,
      "pricingType": "per_request",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [],
      "images": []
    },
    "parameterKeys": []
  },
  {
    "id": "gemini-flash-lite",
    "name": "Gemini Flash Lite",
    "type": "llm",
    "provider": "lovable-ai",
    "category": "Chat",
    "description": "Fastest and most cost-effective. Great for simple tasks.",
    "apiModel": null,
    "defaultOutputFormat": "webp",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {},
    "capabilities": {
      "maxResolution": "N/A",
      "resolutionBehavior": "fixed",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": false,
      "streaming": true,
      "contextWindow": 1000000,
      "supportsImages": false,
      "supportsSearch": false,
      "returnsCitations": false
    },
    "pricing": {
      "apiCostEur": 0.0003,
      "pricingType": "per_request",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [],
      "images": []
    },
    "parameterKeys": []
  },
  {
    "id": "gemini-pro",
    "name": "Gemini Pro",
    "type": "llm",
    "provider": "lovable-ai",
    "category": "Chat",
    "description": "Top-tier reasoning and complex tasks. Best for demanding use cases.",
    "apiModel": null,
    "defaultOutputFormat": "webp",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {},
    "capabilities": {
      "maxResolution": "N/A",
      "resolutionBehavior": "fixed",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": false,
      "streaming": true,
      "contextWindow": 2000000,
      "supportsImages": true,
      "supportsSearch": false,
      "returnsCitations": false
    },
    "pricing": {
      "apiCostEur": 0.004,
      "pricingType": "per_request",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [],
      "images": []
    },
    "parameterKeys": []
  },
  {
    "id": "perplexity-deep-research",
    "name": "Deep Research",
    "type": "llm",
    "provider": "perplexity",
    "category": "Research",
    "description": "Comprehensive multi-step research with extensive citations. Best for in-depth analysis.",
    "apiModel": null,
    "defaultOutputFormat": "webp",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {},
    "capabilities": {
      "maxResolution": "N/A",
      "resolutionBehavior": "fixed",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": false,
      "streaming": true,
      "contextWindow": 200000,
      "supportsImages": false,
      "supportsSearch": true,
      "returnsCitations": true
    },
    "pricing": {
      "apiCostEur": 0.6,
      "pricingType": "per_request",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [],
      "images": []
    },
    "parameterKeys": []
  },
  {
    "id": "perplexity-sonar",
    "name": "Perplexity Sonar",
    "type": "llm",
    "provider": "perplexity",
    "category": "Research",
    "description": "Real-time web search with citations. Great for current information.",
    "apiModel": null,
    "defaultOutputFormat": "webp",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {},
    "capabilities": {
      "maxResolution": "N/A",
      "resolutionBehavior": "fixed",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": false,
      "streaming": true,
      "contextWindow": 128000,
      "supportsImages": false,
      "supportsSearch": true,
      "returnsCitations": true
    },
    "pricing": {
      "apiCostEur": 0.01,
      "pricingType": "per_request",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [],
      "images": []
    },
    "parameterKeys": []
  },
  {
    "id": "perplexity-sonar-pro",
    "name": "Perplexity Sonar Pro",
    "type": "llm",
    "provider": "perplexity",
    "category": "Research",
    "description": "Advanced search with deeper analysis and more citations.",
    "apiModel": null,
    "defaultOutputFormat": "webp",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {},
    "capabilities": {
      "maxResolution": "N/A",
      "resolutionBehavior": "fixed",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": false,
      "streaming": true,
      "contextWindow": 200000,
      "supportsImages": false,
      "supportsSearch": true,
      "returnsCitations": true
    },
    "pricing": {
      "apiCostEur": 0.03,
      "pricingType": "per_request",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [],
      "images": []
    },
    "parameterKeys": []
  },
  {
    "id": "topaz-upscaler",
    "name": "Topaz Image Upscaler",
    "type": "upscale",
    "provider": "replicate",
    "category": "Utility",
    "description": "Premium AI upscaling with face enhancement and detail preservation",
    "apiModel": "topazlabs/image-upscale",
    "defaultOutputFormat": "webp",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": null,
    "capabilities": {
      "maxUpscale": "6x",
      "upscaleFactors": [
        "x2",
        "x4"
      ],
      "requiresReferenceImage": true,
      "supportsFaceEnhancement": true
    },
    "pricing": {
      "apiCostEur": 0.075,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [
        {
          "key": "enhanceModel",
          "type": "select",
          "default": "Standard V2",
          "options": [
            {
              "value": "Standard V2",
              "label": "Standard V2",
              "description": "General purpose enhancement"
            },
            {
              "value": "Low Resolution V2",
              "label": "Low Resolution V2",
              "description": "Best for low-res images"
            },
            {
              "value": "CGI",
              "label": "CGI",
              "description": "Optimized for digital art"
            },
            {
              "value": "High Fidelity V2",
              "label": "High Fidelity V2",
              "description": "Preserves fine details"
            },
            {
              "value": "Text Refine",
              "label": "Text Refine",
              "description": "Optimized for text in images"
            }
          ],
          "label": "Enhancement Model"
        }
      ],
      "advanced": [],
      "images": []
    },
    "parameterKeys": [
      {
        "key": "enhanceModel",
        "default": "Standard V2"
      }
    ]
  },
  {
    "id": "topaz-video-upscaler",
    "name": "Topaz Video Upscaler",
    "type": "upscale",
    "provider": "replicate",
    "category": "Utility",
    "description": "AI video upscaling with frame interpolation",
    "apiModel": "topazlabs/video-upscale",
    "defaultOutputFormat": "webp",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": null,
    "capabilities": {
      "maxResolution": "4K",
      "resolutionBehavior": "selectable",
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true
    },
    "pricing": {
      "apiCostEur": 0.086,
      "pricingType": "per_second",
      "baseDuration": 5,
      "useVariantPricing": false,
      "variants": [
        {
          "suffix": "720p-25fps",
          "apiCostEur": 0.025,
          "condition": {
            "resolution": "720p",
            "fps": 25
          }
        },
        {
          "suffix": "720p-30fps",
          "apiCostEur": 0.025,
          "condition": {
            "resolution": "720p",
            "fps": 30
          }
        },
        {
          "suffix": "720p-50fps",
          "apiCostEur": 0.049,
          "condition": {
            "resolution": "720p",
            "fps": 50
          }
        },
        {
          "suffix": "720p-60fps",
          "apiCostEur": 0.049,
          "condition": {
            "resolution": "720p",
            "fps": 60
          }
        },
        {
          "suffix": "1080p-25fps",
          "apiCostEur": 0.086,
          "condition": {
            "resolution": "1080p",
            "fps": 25
          }
        },
        {
          "suffix": "1080p-30fps",
          "apiCostEur": 0.086,
          "condition": {
            "resolution": "1080p",
            "fps": 30
          }
        },
        {
          "suffix": "1080p-50fps",
          "apiCostEur": 0.173,
          "condition": {
            "resolution": "1080p",
            "fps": 50
          }
        },
        {
          "suffix": "1080p-60fps",
          "apiCostEur": 0.173,
          "condition": {
            "resolution": "1080p",
            "fps": 60
          }
        },
        {
          "suffix": "4k-25fps",
          "apiCostEur": 0.345,
          "condition": {
            "resolution": "4k",
            "fps": 25
          }
        },
        {
          "suffix": "4k-30fps",
          "apiCostEur": 0.345,
          "condition": {
            "resolution": "4k",
            "fps": 30
          }
        },
        {
          "suffix": "4k-50fps",
          "apiCostEur": 0.69,
          "condition": {
            "resolution": "4k",
            "fps": 50
          }
        },
        {
          "suffix": "4k-60fps",
          "apiCostEur": 0.69,
          "condition": {
            "resolution": "4k",
            "fps": 60
          }
        }
      ]
    },
    "parameters": {
      "basic": [
        {
          "key": "targetResolution",
          "type": "select",
          "default": "1080p",
          "options": [
            "720p",
            "1080p",
            "4k"
          ],
          "label": "Resolution"
        },
        {
          "key": "targetFps",
          "type": "select",
          "default": 30,
          "options": [
            25,
            30,
            50,
            60
          ],
          "label": "Frame Rate"
        }
      ],
      "advanced": [],
      "images": []
    },
    "parameterKeys": [
      {
        "key": "targetResolution",
        "default": "1080p"
      },
      {
        "key": "targetFps",
        "default": 30
      }
    ]
  },
  {
    "id": "recraft-vectorize",
    "name": "Recraft Vectorize",
    "type": "vectorize",
    "provider": "replicate",
    "category": "Utility",
    "description": "Convert raster images to high-quality SVG format with clean vector paths",
    "apiModel": "recraft-ai/recraft-vectorize",
    "defaultOutputFormat": "webp",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {},
    "capabilities": {
      "maxResolution": "4096x4096",
      "resolutionBehavior": "input-based",
      "requiresReferenceImage": true,
      "supportsReferenceImage": true,
      "supportsAdvancedOptions": false
    },
    "pricing": {
      "apiCostEur": 0.01,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [],
      "images": []
    },
    "parameterKeys": []
  },
  {
    "id": "bria-video-remove-bg",
    "name": "Video Remove Background",
    "type": "video",
    "provider": "replicate",
    "category": "Video Editing",
    "description": "Remove the background from any video with AI. Supports transparent, solid color, or custom backgrounds.",
    "apiModel": "bria/video-remove-background",
    "defaultOutputFormat": "webm",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "slots": {
        "videoRef": "video_url"
      }
    },
    "capabilities": {
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "requiresReferenceVideo": true,
      "maxReferenceImages": 0,
      "supportsAdvancedOptions": true,
      "supportsMultiOutput": false,
      "supportsOutputQuality": false,
      "requiresPrompt": false
    },
    "pricing": {
      "apiCostEur": 0.129,
      "pricingType": "per_second",
      "baseDuration": 5,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [
        {
          "key": "briaPreserveAudio",
          "apiParam": "preserve_audio",
          "type": "switch",
          "default": true,
          "label": "Preserve Audio"
        },
        {
          "key": "briaBackgroundColor",
          "apiParam": "background_color",
          "type": "select",
          "default": "Transparent",
          "options": [
            "Transparent",
            "Black",
            "White",
            "Gray",
            "Red",
            "Green",
            "Blue",
            "Yellow",
            "Cyan",
            "Magenta",
            "Brown",
            "Orange",
            "Purple",
            "Pink"
          ],
          "label": "Background Color"
        },
        {
          "key": "briaOutputCodec",
          "apiParam": "output_container_and_codec",
          "type": "select",
          "default": "webm_vp9",
          "options": [
            "mp4_h264",
            "mp4_h265",
            "webm_vp9",
            "mov_h265",
            "mov_proresks",
            "mkv_h264",
            "mkv_h265",
            "mkv_vp9",
            "gif"
          ],
          "label": "Output Format"
        }
      ],
      "images": [
        {
          "key": "briaVideoInput",
          "apiParam": "video_url",
          "label": "Source Video"
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "briaPreserveAudio",
        "apiParam": "preserve_audio",
        "default": true
      },
      {
        "key": "briaBackgroundColor",
        "apiParam": "background_color",
        "default": "Transparent"
      },
      {
        "key": "briaOutputCodec",
        "apiParam": "output_container_and_codec",
        "default": "webm_vp9"
      }
    ]
  },
  {
    "id": "heygen-video-translate",
    "name": "HeyGen Video Translate",
    "type": "video",
    "provider": "replicate",
    "category": "Professional",
    "description": "Translate videos into 150+ languages while preserving the original speaker's voice.",
    "apiModel": "heygen/video-translate",
    "defaultOutputFormat": "mp4",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "videoRef": "video",
      "slots": {
        "videoRef": "video"
      }
    },
    "capabilities": {
      "maxResolution": "1080p",
      "resolutionBehavior": "fixed",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "requiresAudio": false,
      "requiresPrompt": false,
      "supportsReferenceVideo": true,
      "requiresReferenceVideo": true
    },
    "duration": {
      "behavior": "auto",
      "sendToApi": false
    },
    "pricing": {
      "apiCostEur": 0.069,
      "pricingType": "per_second",
      "baseDuration": 10,
      "useVariantPricing": false,
      "variants": [
        {
          "suffix": "-speed",
          "apiCostEur": 0.0345,
          "condition": {
            "mode": "speed"
          }
        },
        {
          "suffix": "-precision",
          "apiCostEur": 0.069,
          "condition": {
            "mode": "precision"
          }
        }
      ]
    },
    "parameters": {
      "basic": [],
      "advanced": [
        {
          "key": "outputLanguage",
          "apiParam": "output_language",
          "type": "select",
          "default": "English",
          "options": [
            "English",
            "Spanish",
            "French",
            "German",
            "Portuguese",
            "Italian",
            "Dutch",
            "Polish",
            "Russian",
            "Japanese",
            "Korean",
            "Chinese",
            "Arabic",
            "Hindi",
            "Turkish",
            "Swedish",
            "Norwegian Bokmål (Norway)",
            "Danish",
            "Finnish",
            "Czech",
            "Romanian",
            "Hungarian (Hungary)",
            "Greek",
            "Thai (Thailand)",
            "Vietnamese (Vietnam)",
            "Indonesian",
            "Malay",
            "Hebrew (Israel)",
            "Ukrainian"
          ],
          "label": "Output Language",
          "tooltip": "Target language for translation"
        },
        {
          "key": "mode",
          "apiParam": "mode",
          "type": "select",
          "default": "precision",
          "options": [
            "speed",
            "precision"
          ],
          "label": "Translation Mode",
          "tooltip": "Speed: fast turnaround. Precision: higher quality output."
        }
      ],
      "images": []
    },
    "parameterKeys": [
      {
        "key": "outputLanguage",
        "apiParam": "output_language",
        "default": "English"
      },
      {
        "key": "mode",
        "apiParam": "mode",
        "default": "precision"
      }
    ]
  },
  {
    "id": "kling-v2.1",
    "name": "Kling v2.1",
    "type": "video",
    "provider": "replicate",
    "category": "High Quality",
    "description": "Image-to-video with standard (720p) or pro (1080p) modes. Requires start image. 24fps output.",
    "apiModel": "kwaivgi/kling-v2.1",
    "defaultOutputFormat": "mp4",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "duration": "duration",
      "aspectRatio": "aspect_ratio",
      "referenceImage": "start_image",
      "slots": {
        "startImage": "start_image",
        "lastImage": "end_image"
      }
    },
    "capabilities": {
      "maxResolution": "1080p",
      "resolutionBehavior": "mode-based",
      "supportsReferenceImage": false,
      "requiresReferenceImage": true,
      "supportsAdvancedOptions": true,
      "supportsAspectRatioWithStartImage": false
    },
    "duration": {
      "behavior": "selectable",
      "allowedDurations": [
        5,
        10
      ],
      "defaultDuration": 5,
      "maxDuration": 10,
      "sendToApi": true
    },
    "pricing": {
      "apiCostEur": null,
      "pricingType": "per_second",
      "baseDuration": 5,
      "useVariantPricing": false,
      "variants": [
        {
          "suffix": "-standard",
          "apiCostEur": 0.046,
          "condition": {
            "mode": "standard"
          }
        },
        {
          "suffix": "-pro",
          "apiCostEur": 0.0828,
          "condition": {
            "mode": "pro"
          }
        }
      ]
    },
    "parameters": {
      "basic": [
        {
          "key": "klingMode",
          "apiParam": "mode",
          "type": "select",
          "default": "standard",
          "options": [
            "standard",
            "pro"
          ],
          "label": "Quality Mode",
          "tooltip": "Standard: 720p at $0.05/sec. Pro: 1080p at $0.09/sec"
        }
      ],
      "advanced": [
        {
          "key": "klingNegativePrompt",
          "apiParam": "negative_prompt",
          "type": "textarea",
          "default": "",
          "label": "Negative Prompt",
          "tooltip": "Describe what you don't want to see in the video"
        }
      ],
      "images": [
        {
          "key": "startImage",
          "apiParam": "start_image",
          "label": "Start Image",
          "single": true
        },
        {
          "key": "lastImage",
          "apiParam": "end_image",
          "label": "End Image (requires start image)",
          "single": true
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "klingMode",
        "apiParam": "mode",
        "default": "standard"
      },
      {
        "key": "klingNegativePrompt",
        "apiParam": "negative_prompt",
        "default": ""
      }
    ]
  },
  {
    "id": "kling-v2.5-turbo-pro",
    "name": "Kling 2.5 Turbo Pro",
    "type": "video",
    "provider": "replicate",
    "category": "Premium",
    "description": "Fast 1080p video generation. Optional reference image for guided generation. Dynamic pricing based on duration.",
    "apiModel": "kwaivgi/kling-v2.5-turbo-pro",
    "defaultOutputFormat": "mp4",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "duration": "duration",
      "aspectRatio": "aspect_ratio",
      "negativePrompt": "negative_prompt",
      "referenceImage": "start_image",
      "slots": {
        "startImage": "start_image"
      }
    },
    "capabilities": {
      "maxResolution": "1080p",
      "resolutionBehavior": "fixed",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "supportsAspectRatioWithStartImage": false
    },
    "duration": {
      "behavior": "selectable",
      "allowedDurations": [
        5,
        10
      ],
      "defaultDuration": 5,
      "maxDuration": 10,
      "sendToApi": true
    },
    "pricing": {
      "apiCostEur": 0.0644,
      "pricingType": "per_second",
      "baseDuration": 5,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [
        {
          "key": "klingAspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "16:9",
          "options": [
            "16:9",
            "9:16",
            "1:1"
          ],
          "label": "Aspect Ratio"
        },
        {
          "key": "klingNegativePrompt",
          "apiParam": "negative_prompt",
          "type": "textarea",
          "label": "Negative Prompt"
        }
      ],
      "images": [
        {
          "key": "startImage",
          "apiParam": "start_image",
          "label": "Start Image"
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "klingAspectRatio",
        "apiParam": "aspect_ratio",
        "default": "16:9"
      },
      {
        "key": "klingNegativePrompt",
        "apiParam": "negative_prompt"
      }
    ]
  },
  {
    "id": "kling-v3",
    "name": "Kling 3.0",
    "type": "video",
    "provider": "replicate",
    "category": "Premium",
    "description": "Cinematic videos up to 15s. Multi-shot control, native audio with lip sync. Standard (720p) or Pro (1080p).",
    "apiModel": "kwaivgi/kling-v3-video",
    "defaultOutputFormat": "mp4",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "duration": "duration",
      "aspectRatio": "aspect_ratio",
      "negativePrompt": "negative_prompt",
      "referenceImage": "start_image",
      "slots": {
        "startImage": "start_image",
        "lastImage": "end_image"
      }
    },
    "capabilities": {
      "maxResolution": "1080p",
      "resolutionBehavior": "mode-based",
      "supportsReferenceImage": true,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "supportsAspectRatioWithStartImage": false
    },
    "duration": {
      "behavior": "selectable",
      "allowedDurations": [
        5,
        10,
        15
      ],
      "defaultDuration": 5,
      "maxDuration": 15,
      "sendToApi": true
    },
    "pricing": {
      "apiCostEur": null,
      "pricingType": "per_second",
      "baseDuration": 5,
      "useVariantPricing": false,
      "variants": [
        {
          "suffix": "-standard",
          "apiCostEur": 0.1546,
          "condition": {
            "mode": "standard",
            "generate_audio": false
          }
        },
        {
          "suffix": "-standard-audio",
          "apiCostEur": 0.2318,
          "condition": {
            "mode": "standard",
            "generate_audio": true
          }
        },
        {
          "suffix": "-pro",
          "apiCostEur": 0.2061,
          "condition": {
            "mode": "pro",
            "generate_audio": false
          }
        },
        {
          "suffix": "-pro-audio",
          "apiCostEur": 0.3091,
          "condition": {
            "mode": "pro",
            "generate_audio": true
          }
        }
      ]
    },
    "parameters": {
      "basic": [
        {
          "key": "klingMode",
          "apiParam": "mode",
          "type": "select",
          "default": "standard",
          "options": [
            "standard",
            "pro"
          ],
          "label": "Quality Mode",
          "tooltip": "Standard: 720p. Pro: 1080p"
        },
        {
          "key": "klingGenerateAudio",
          "apiParam": "generate_audio",
          "type": "switch",
          "default": true,
          "label": "Generate Audio",
          "tooltip": "Generate native audio including dialogue with lip sync"
        }
      ],
      "advanced": [
        {
          "key": "klingAspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "16:9",
          "options": [
            "16:9",
            "9:16",
            "1:1"
          ],
          "label": "Aspect Ratio"
        },
        {
          "key": "klingNegativePrompt",
          "apiParam": "negative_prompt",
          "type": "textarea",
          "default": "",
          "label": "Negative Prompt",
          "tooltip": "Describe what you don't want to see in the video. Max 2500 characters."
        }
      ],
      "images": [
        {
          "key": "startImage",
          "apiParam": "start_image",
          "label": "Start Image",
          "single": true
        },
        {
          "key": "lastImage",
          "apiParam": "end_image",
          "label": "End Image",
          "single": true
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "klingMode",
        "apiParam": "mode",
        "default": "standard"
      },
      {
        "key": "klingGenerateAudio",
        "apiParam": "generate_audio",
        "default": true
      },
      {
        "key": "klingAspectRatio",
        "apiParam": "aspect_ratio",
        "default": "16:9"
      },
      {
        "key": "klingNegativePrompt",
        "apiParam": "negative_prompt",
        "default": ""
      }
    ]
  },
  {
    "id": "latentsync",
    "name": "LatentSync",
    "type": "video",
    "provider": "replicate",
    "category": "Professional",
    "description": "Generate high-quality lip sync animations from video + audio input.",
    "apiModel": "bytedance/latentsync:637ce1919f807ca20da3a448ddc2743535d2853649574cd52a933120e9b9e293",
    "defaultOutputFormat": "mp4",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "videoRef": "video",
      "audioFile": "audio"
    },
    "capabilities": {
      "maxResolution": "1080p",
      "resolutionBehavior": "fixed",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "requiresAudio": true,
      "requiresPrompt": false
    },
    "duration": {
      "behavior": "auto",
      "sendToApi": false
    },
    "pricing": {
      "apiCostEur": 0.075,
      "pricingType": "fixed",
      "baseDuration": null,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [
        {
          "key": "guidanceScale",
          "apiParam": "guidance_scale",
          "type": "slider",
          "default": 1,
          "min": 0.5,
          "max": 5,
          "step": 0.1,
          "label": "Guidance Scale",
          "tooltip": "Controls how closely the output follows the audio guidance"
        },
        {
          "key": "seed",
          "apiParam": "seed",
          "type": "seed",
          "label": "Seed"
        }
      ],
      "images": []
    },
    "parameterKeys": [
      {
        "key": "guidanceScale",
        "apiParam": "guidance_scale",
        "default": 1
      },
      {
        "key": "seed",
        "apiParam": "seed"
      }
    ]
  },
  {
    "id": "minimax-fast",
    "name": "Hailuo 2.3 Fast",
    "type": "video",
    "provider": "replicate",
    "category": "Fast & Efficient",
    "description": "Fast image-to-video. Requires a first frame image (defines aspect ratio). 768p supports 6s/10s, 1080p only 6s.",
    "apiModel": "minimax/hailuo-2.3-fast",
    "defaultOutputFormat": "mp4",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "referenceImage": "first_frame_image",
      "duration": "duration",
      "resolution": "resolution",
      "slots": {
        "startImage": "first_frame_image"
      }
    },
    "capabilities": {
      "maxResolution": "1080p",
      "resolutionBehavior": "selectable",
      "supportsReferenceImage": true,
      "requiresReferenceImage": true,
      "supportsAdvancedOptions": true,
      "supportsAspectRatioWithStartImage": false
    },
    "duration": {
      "behavior": "selectable",
      "allowedDurations": [
        6,
        10
      ],
      "defaultDuration": 6,
      "maxDuration": 10,
      "sendToApi": true
    },
    "pricing": {
      "apiCostEur": 0.175,
      "pricingType": "fixed",
      "baseDuration": 6,
      "useVariantPricing": false,
      "variants": [
        {
          "condition": {
            "resolution": "768p",
            "duration": 6
          },
          "apiCostEur": 0.175
        },
        {
          "condition": {
            "resolution": "768p",
            "duration": 10
          },
          "apiCostEur": 0.295
        },
        {
          "condition": {
            "resolution": "1080p",
            "duration": 6
          },
          "apiCostEur": 0.305
        }
      ]
    },
    "parameters": {
      "basic": [
        {
          "key": "minimaxFastResolution",
          "apiParam": "resolution",
          "type": "select",
          "default": "768p",
          "options": [
            "768p",
            "1080p"
          ],
          "label": "Resolution",
          "tooltip": "768p supports 6s or 10s. 1080p supports only 6s."
        }
      ],
      "advanced": [
        {
          "key": "minimaxFastPromptOptimizer",
          "apiParam": "prompt_optimizer",
          "type": "switch",
          "default": true,
          "label": "Prompt Optimizer",
          "tooltip": "Automatically enhance your prompt"
        }
      ],
      "images": [
        {
          "key": "minimaxFastFirstFrame",
          "apiParam": "first_frame_image",
          "label": "First Frame (REQUIRED - defines aspect ratio)",
          "single": true
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "minimaxFastResolution",
        "apiParam": "resolution",
        "default": "768p"
      },
      {
        "key": "minimaxFastPromptOptimizer",
        "apiParam": "prompt_optimizer",
        "default": true
      }
    ]
  },
  {
    "id": "minimax-video",
    "name": "Minimax Hailuo 2.3",
    "type": "video",
    "provider": "replicate",
    "category": "High Quality",
    "description": "Selectable resolution and duration. 768p supports up to 10s, 1080p limited to 6s.",
    "apiModel": "minimax/hailuo-2.3",
    "defaultOutputFormat": "mp4",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "referenceImage": "first_frame_image",
      "duration": "duration",
      "resolution": "resolution",
      "slots": {
        "startImage": "first_frame_image"
      }
    },
    "capabilities": {
      "maxResolution": "1080p",
      "resolutionBehavior": "selectable",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "supportsAspectRatioWithStartImage": false
    },
    "duration": {
      "behavior": "selectable",
      "allowedDurations": [
        6,
        10
      ],
      "defaultDuration": 6,
      "maxDuration": 10,
      "sendToApi": true
    },
    "pricing": {
      "apiCostEur": 0.2576,
      "pricingType": "fixed",
      "baseDuration": 6,
      "useVariantPricing": false,
      "variants": [
        {
          "condition": {
            "resolution": "768p",
            "duration": 6
          },
          "apiCostEur": 0.2576
        },
        {
          "condition": {
            "resolution": "768p",
            "duration": 10
          },
          "apiCostEur": 0.5152
        },
        {
          "condition": {
            "resolution": "1080p",
            "duration": 6
          },
          "apiCostEur": 0.4508
        }
      ]
    },
    "parameters": {
      "basic": [
        {
          "key": "minimaxResolution",
          "apiParam": "resolution",
          "type": "select",
          "default": "768p",
          "options": [
            "768p",
            "1080p"
          ],
          "label": "Resolution",
          "tooltip": "768p supports 6s or 10s. 1080p supports only 6s."
        }
      ],
      "advanced": [
        {
          "key": "minimaxPromptOptimizer",
          "apiParam": "prompt_optimizer",
          "type": "switch",
          "default": true,
          "label": "Prompt Optimizer",
          "tooltip": "Automatically enhance your prompt"
        }
      ],
      "images": [
        {
          "key": "minimaxFirstFrame",
          "apiParam": "first_frame_image",
          "label": "First Frame (optional - defines aspect ratio)",
          "single": true
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "minimaxResolution",
        "apiParam": "resolution",
        "default": "768p"
      },
      {
        "key": "minimaxPromptOptimizer",
        "apiParam": "prompt_optimizer",
        "default": true
      }
    ]
  },
  {
    "id": "omni-human-1.5",
    "name": "OmniHuman",
    "type": "video",
    "provider": "replicate",
    "category": "Specialized",
    "description": "Audio-driven human animation. Requires image + audio (max 15s). Best quality under 15s.",
    "apiModel": "bytedance/omni-human",
    "defaultOutputFormat": "mp4",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "referenceImage": "image",
      "audioFile": "audio",
      "slots": {
        "startImage": "image"
      }
    },
    "capabilities": {
      "maxResolution": "1080p",
      "resolutionBehavior": "input-based",
      "supportsReferenceImage": false,
      "requiresReferenceImage": true,
      "supportsAdvancedOptions": false,
      "requiresAudio": true,
      "requiresPrompt": false,
      "supportsAspectRatioWithStartImage": false
    },
    "duration": {
      "behavior": "audio-based",
      "maxDuration": 15,
      "sendToApi": false
    },
    "pricing": {
      "apiCostEur": 0.1472,
      "pricingType": "per_second",
      "baseDuration": 10,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [],
      "advanced": [],
      "images": []
    },
    "parameterKeys": []
  },
  {
    "id": "runway-aleph",
    "name": "Runway Gen4 Aleph",
    "type": "video",
    "provider": "replicate",
    "category": "Video Editing",
    "description": "Transform existing videos with AI-powered editing. Upload a video and describe the transformation you want.",
    "apiModel": "runwayml/gen4-aleph",
    "defaultOutputFormat": "mp4",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "prompt": "prompt",
      "aspectRatio": "aspect_ratio",
      "seed": "seed",
      "slots": {
        "videoRef": "video",
        "refImage": "reference_image"
      }
    },
    "capabilities": {
      "maxResolution": "1080p",
      "resolutionBehavior": "input-based",
      "supportsReferenceImage": true,
      "requiresReferenceImage": false,
      "supportsReferenceVideo": true,
      "requiresReferenceVideo": true,
      "supportsAdvancedOptions": true,
      "supportsMultipleImages": false,
      "maxReferenceImages": 1
    },
    "duration": {
      "behavior": "fixed",
      "fixedDuration": 5,
      "maxDuration": 5,
      "sendToApi": false
    },
    "pricing": {
      "apiCostEur": 0.166,
      "pricingType": "per_second",
      "baseDuration": 5,
      "useVariantPricing": false
    },
    "parameters": {
      "basic": [
        {
          "key": "runwayAspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "16:9",
          "options": [
            "16:9",
            "9:16",
            "4:3",
            "3:4",
            "1:1",
            "21:9"
          ],
          "label": "Aspect Ratio"
        }
      ],
      "advanced": [
        {
          "key": "runwaySeed",
          "apiParam": "seed",
          "type": "seed",
          "label": "Seed",
          "tooltip": "Set for reproducible generation"
        }
      ],
      "images": []
    },
    "parameterKeys": [
      {
        "key": "runwayAspectRatio",
        "apiParam": "aspect_ratio",
        "default": "16:9"
      },
      {
        "key": "runwaySeed",
        "apiParam": "seed"
      }
    ]
  },
  {
    "id": "seedance-1-lite",
    "name": "Seedance 1 Lite",
    "type": "video",
    "provider": "replicate",
    "category": "Fast & Efficient",
    "description": "Budget-friendly with 480p/720p/1080p options. Flexible 2-12s duration. Supports 1-4 reference images (not with 1080p).",
    "apiModel": "bytedance/seedance-1-lite",
    "defaultOutputFormat": "mp4",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "duration": "duration",
      "resolution": "resolution",
      "aspectRatio": "aspect_ratio",
      "slots": {
        "refImage": "reference_images",
        "startImage": "image",
        "lastImage": "last_frame_image"
      },
      "customMappings": {
        "fps": "24"
      }
    },
    "capabilities": {
      "maxResolution": "1080p",
      "resolutionBehavior": "selectable",
      "supportsReferenceImage": true,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "supportsMultipleImages": true,
      "maxReferenceImages": 4,
      "supportsAspectRatioWithStartImage": false,
      "mutuallyExclusiveSlots": [
        "startImage",
        "refImage"
      ]
    },
    "duration": {
      "behavior": "selectable",
      "minDuration": 4,
      "maxDuration": 12,
      "defaultDuration": 5,
      "sendToApi": true
    },
    "pricing": {
      "apiCostEur": 0.03312,
      "pricingType": "per_second",
      "baseDuration": 5,
      "useVariantPricing": false,
      "variants": [
        {
          "condition": {
            "resolution": "480p"
          },
          "apiCostEur": 0.01656
        },
        {
          "condition": {
            "resolution": "720p"
          },
          "apiCostEur": 0.03312
        },
        {
          "condition": {
            "resolution": "1080p"
          },
          "apiCostEur": 0.06624
        }
      ]
    },
    "parameters": {
      "basic": [
        {
          "key": "seedanceResolution",
          "apiParam": "resolution",
          "type": "select",
          "default": "720p",
          "options": [
            "480p",
            "720p",
            "1080p"
          ],
          "label": "Resolution",
          "tooltip": "Note: Reference images cannot be used with 1080p"
        },
        {
          "key": "seedanceAspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "16:9",
          "options": [
            "16:9",
            "4:3",
            "1:1",
            "3:4",
            "9:16",
            "21:9",
            "9:21"
          ],
          "label": "Aspect Ratio",
          "tooltip": "Ignored if a start image is provided"
        }
      ],
      "advanced": [
        {
          "key": "seedanceCameraFixed",
          "apiParam": "camera_fixed",
          "type": "switch",
          "default": false,
          "label": "Fixed Camera",
          "tooltip": "Whether to fix camera position"
        },
        {
          "key": "seedanceSeed",
          "apiParam": "seed",
          "type": "seed",
          "tooltip": "Random seed for reproducible generation"
        }
      ],
      "images": [
        {
          "key": "seedanceStartImage",
          "apiParam": "image",
          "label": "Start Frame (optional)",
          "single": true
        },
        {
          "key": "seedanceLastImage",
          "apiParam": "last_frame_image",
          "label": "Last Frame (requires start frame)",
          "single": true
        },
        {
          "key": "seedanceReferenceImages",
          "apiParam": "reference_images",
          "label": "Reference Images (1-4 images, not with 1080p or start/last frames)",
          "single": false,
          "max": 4
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "seedanceResolution",
        "apiParam": "resolution",
        "default": "720p"
      },
      {
        "key": "seedanceAspectRatio",
        "apiParam": "aspect_ratio",
        "default": "16:9"
      },
      {
        "key": "seedanceCameraFixed",
        "apiParam": "camera_fixed",
        "default": false
      },
      {
        "key": "seedanceSeed",
        "apiParam": "seed"
      }
    ]
  },
  {
    "id": "seedance-1-pro",
    "name": "Seedance 1 Pro",
    "type": "video",
    "provider": "replicate",
    "category": "Premium",
    "description": "Professional quality with 480p/720p/1080p options. Flexible 2-12s duration. Start and last frame support.",
    "apiModel": "bytedance/seedance-1-pro",
    "defaultOutputFormat": "mp4",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "duration": "duration",
      "resolution": "resolution",
      "aspectRatio": "aspect_ratio",
      "slots": {
        "startImage": "image",
        "lastImage": "last_frame_image"
      },
      "customMappings": {
        "fps": "24"
      }
    },
    "capabilities": {
      "maxResolution": "1080p",
      "resolutionBehavior": "selectable",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "supportsAspectRatioWithStartImage": false
    },
    "duration": {
      "behavior": "selectable",
      "minDuration": 2,
      "maxDuration": 12,
      "defaultDuration": 5,
      "sendToApi": true
    },
    "pricing": {
      "apiCostEur": 0.138,
      "pricingType": "per_second",
      "baseDuration": 5,
      "useVariantPricing": false,
      "variants": [
        {
          "condition": {
            "resolution": "480p"
          },
          "apiCostEur": 0.0276
        },
        {
          "condition": {
            "resolution": "720p"
          },
          "apiCostEur": 0.0552
        },
        {
          "condition": {
            "resolution": "1080p"
          },
          "apiCostEur": 0.138
        }
      ]
    },
    "parameters": {
      "basic": [
        {
          "key": "seedanceResolution",
          "apiParam": "resolution",
          "type": "select",
          "default": "1080p",
          "options": [
            "480p",
            "720p",
            "1080p"
          ],
          "label": "Resolution"
        },
        {
          "key": "seedanceAspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "16:9",
          "options": [
            "16:9",
            "4:3",
            "1:1",
            "3:4",
            "9:16",
            "21:9",
            "9:21"
          ],
          "label": "Aspect Ratio",
          "tooltip": "Ignored if a start image is provided"
        }
      ],
      "advanced": [
        {
          "key": "seedanceCameraFixed",
          "apiParam": "camera_fixed",
          "type": "switch",
          "default": false,
          "label": "Fixed Camera",
          "tooltip": "Whether to fix camera position"
        },
        {
          "key": "seedanceSeed",
          "apiParam": "seed",
          "type": "seed",
          "tooltip": "Random seed for reproducible generation"
        }
      ],
      "images": [
        {
          "key": "seedanceStartImage",
          "apiParam": "image",
          "label": "Start Frame (optional)",
          "single": true
        },
        {
          "key": "seedanceLastImage",
          "apiParam": "last_frame_image",
          "label": "Last Frame (requires start frame)",
          "single": true
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "seedanceResolution",
        "apiParam": "resolution",
        "default": "1080p"
      },
      {
        "key": "seedanceAspectRatio",
        "apiParam": "aspect_ratio",
        "default": "16:9"
      },
      {
        "key": "seedanceCameraFixed",
        "apiParam": "camera_fixed",
        "default": false
      },
      {
        "key": "seedanceSeed",
        "apiParam": "seed"
      }
    ]
  },
  {
    "id": "seedance-1-pro-fast",
    "name": "Seedance 1 Pro Fast",
    "type": "video",
    "provider": "replicate",
    "category": "Fast & Efficient",
    "description": "Fast version ~50% cheaper. 480p/720p/1080p, 2-12s duration. No last frame or reference images.",
    "apiModel": "bytedance/seedance-1-pro-fast",
    "defaultOutputFormat": "mp4",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "duration": "duration",
      "resolution": "resolution",
      "aspectRatio": "aspect_ratio",
      "slots": {
        "startImage": "image"
      },
      "customMappings": {
        "fps": "24"
      }
    },
    "capabilities": {
      "maxResolution": "1080p",
      "resolutionBehavior": "selectable",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "supportsAspectRatioWithStartImage": false
    },
    "duration": {
      "behavior": "selectable",
      "minDuration": 2,
      "maxDuration": 12,
      "defaultDuration": 5,
      "sendToApi": true
    },
    "pricing": {
      "apiCostEur": 0.055,
      "pricingType": "per_second",
      "baseDuration": 5,
      "useVariantPricing": false,
      "variants": [
        {
          "condition": {
            "resolution": "480p"
          },
          "apiCostEur": 0.014
        },
        {
          "condition": {
            "resolution": "720p"
          },
          "apiCostEur": 0.023
        },
        {
          "condition": {
            "resolution": "1080p"
          },
          "apiCostEur": 0.055
        }
      ]
    },
    "parameters": {
      "basic": [
        {
          "key": "seedanceFastResolution",
          "apiParam": "resolution",
          "type": "select",
          "default": "1080p",
          "options": [
            "480p",
            "720p",
            "1080p"
          ],
          "label": "Resolution"
        },
        {
          "key": "seedanceFastAspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "16:9",
          "options": [
            "16:9",
            "4:3",
            "1:1",
            "3:4",
            "9:16",
            "21:9",
            "9:21"
          ],
          "label": "Aspect Ratio",
          "tooltip": "Ignored if a start image is provided"
        }
      ],
      "advanced": [
        {
          "key": "seedanceFastCameraFixed",
          "apiParam": "camera_fixed",
          "type": "switch",
          "default": false,
          "label": "Fixed Camera",
          "tooltip": "Whether to fix camera position"
        },
        {
          "key": "seedanceFastSeed",
          "apiParam": "seed",
          "type": "seed",
          "tooltip": "Random seed for reproducible generation"
        }
      ],
      "images": [
        {
          "key": "seedanceFastStartImage",
          "apiParam": "image",
          "label": "Start Frame (optional)",
          "single": true
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "seedanceFastResolution",
        "apiParam": "resolution",
        "default": "1080p"
      },
      {
        "key": "seedanceFastAspectRatio",
        "apiParam": "aspect_ratio",
        "default": "16:9"
      },
      {
        "key": "seedanceFastCameraFixed",
        "apiParam": "camera_fixed",
        "default": false
      },
      {
        "key": "seedanceFastSeed",
        "apiParam": "seed"
      }
    ]
  },
  {
    "id": "seedance-2.0",
    "name": "Seedance 2.0",
    "type": "video",
    "provider": "replicate",
    "category": "Premium",
    "description": "Multimodal video with native audio. Up to 9 reference images, start/last frame, selectable 3-10s duration, 480p/720p.",
    "apiModel": "bytedance/seedance-2.0",
    "defaultOutputFormat": "mp4",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "duration": "duration",
      "resolution": "resolution",
      "aspectRatio": "aspect_ratio",
      "slots": {
        "startImage": "image",
        "lastImage": "last_frame_image",
        "refImage": "reference_images"
      }
    },
    "capabilities": {
      "maxResolution": "720p",
      "resolutionBehavior": "selectable",
      "supportsReferenceImage": true,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "supportsMultipleImages": true,
      "maxReferenceImages": 9,
      "supportsAspectRatioWithStartImage": false,
      "supportsMultilingualPrompts": true,
      "mutuallyExclusiveSlots": [
        "startImage",
        "refImage"
      ]
    },
    "duration": {
      "behavior": "selectable",
      "allowedDurations": [
        3,
        5,
        7,
        8,
        10
      ],
      "defaultDuration": 5,
      "maxDuration": 10,
      "minDuration": 3,
      "sendToApi": true
    },
    "pricing": {
      "apiCostEur": 0.166,
      "pricingType": "per_second",
      "baseDuration": 5,
      "useVariantPricing": false,
      "variants": [
        {
          "condition": {
            "resolution": "480p"
          },
          "apiCostEur": 0.074
        },
        {
          "condition": {
            "resolution": "720p"
          },
          "apiCostEur": 0.166
        },
        {
          "condition": {
            "resolution": "1080p"
          },
          "apiCostEur": 0.414
        }
      ]
    },
    "parameters": {
      "basic": [
        {
          "key": "seedance2Resolution",
          "apiParam": "resolution",
          "type": "select",
          "default": "720p",
          "options": [
            "480p",
            "720p"
          ],
          "label": "Resolution"
        },
        {
          "key": "seedance2AspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "16:9",
          "options": [
            "16:9",
            "4:3",
            "1:1",
            "3:4",
            "9:16",
            "21:9",
            "adaptive"
          ],
          "label": "Aspect Ratio",
          "tooltip": "Use 'adaptive' to let the model choose based on inputs. Ignored if a start image is provided."
        }
      ],
      "advanced": [
        {
          "key": "seedance2GenerateAudio",
          "apiParam": "generate_audio",
          "type": "switch",
          "default": false,
          "label": "Generate Audio",
          "tooltip": "Generate synchronized audio (dialogue in double quotes, SFX, music). Off by default to reduce safety filter false-positives."
        },
        {
          "key": "seedance2Seed",
          "apiParam": "seed",
          "type": "seed",
          "tooltip": "Random seed for reproducible generation"
        }
      ],
      "images": [
        {
          "key": "seedance2StartImage",
          "apiParam": "image",
          "label": "Start Frame (optional)",
          "single": true
        },
        {
          "key": "seedance2LastImage",
          "apiParam": "last_frame_image",
          "label": "Last Frame (requires start frame)",
          "single": true
        },
        {
          "key": "seedance2ReferenceImages",
          "apiParam": "reference_images",
          "label": "Reference Images (up to 9, exclusive with start/last frame)",
          "single": false,
          "max": 9
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "seedance2Resolution",
        "apiParam": "resolution",
        "default": "720p"
      },
      {
        "key": "seedance2AspectRatio",
        "apiParam": "aspect_ratio",
        "default": "16:9"
      },
      {
        "key": "seedance2GenerateAudio",
        "apiParam": "generate_audio",
        "default": false
      },
      {
        "key": "seedance2Seed",
        "apiParam": "seed"
      }
    ]
  },
  {
    "id": "seedance-2.5",
    "name": "Seedance 2.5",
    "type": "video",
    "provider": "replicate",
    "category": "Premium",
    "description": "Flagship multimodal video with native audio and native 30s generation. Up to 30 reference images, start/last frame, 4-30s, 480p/720p.",
    "apiModel": "bytedance/seedance-2.5",
    "defaultOutputFormat": "mp4",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "duration": "duration",
      "resolution": "resolution",
      "aspectRatio": "aspect_ratio",
      "videoRef": "reference_videos",
      "audioFile": "reference_audios",
      "slots": {
        "startImage": "image",
        "lastImage": "last_frame_image",
        "refImage": "reference_images",
        "videoRef": "reference_videos",
        "audioRef": "reference_audios"
      }
    },
    "capabilities": {
      "maxResolution": "720p",
      "resolutionBehavior": "selectable",
      "supportsReferenceImage": true,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "supportsMultipleImages": true,
      "maxReferenceImages": 30,
      "supportsAspectRatioWithStartImage": false,
      "supportsMultilingualPrompts": true,
      "supportsReferenceVideo": true,
      "requiresReferenceVideo": false,
      "supportsReferenceAudio": true,
      "requiresReferenceAudio": false,
      "audioRefDependsOnReference": true,
      "mutuallyExclusiveSlots": [
        "startImage",
        "refImage"
      ]
    },
    "duration": {
      "behavior": "selectable",
      "allowedDurations": [
        4,
        5,
        6,
        8,
        10,
        12,
        15,
        20,
        25,
        30
      ],
      "defaultDuration": 5,
      "maxDuration": 30,
      "minDuration": 4,
      "sendToApi": true
    },
    "pricing": {
      "apiCostEur": 0.2127,
      "pricingType": "per_second",
      "baseDuration": 1,
      "useVariantPricing": true,
      "variants": [
        {
          "condition": {
            "resolution": "480p",
            "videoIn": false
          },
          "apiCostEur": 0.0946
        },
        {
          "condition": {
            "resolution": "720p",
            "videoIn": false
          },
          "apiCostEur": 0.2127
        },
        {
          "condition": {
            "resolution": "480p",
            "videoIn": true
          },
          "apiCostEur": 0.396
        },
        {
          "condition": {
            "resolution": "720p",
            "videoIn": true
          },
          "apiCostEur": 0.8902
        }
      ]
    },
    "parameters": {
      "basic": [],
      "advanced": [
        {
          "key": "seedance25Resolution",
          "apiParam": "resolution",
          "type": "select",
          "default": "720p",
          "options": [
            "480p",
            "720p"
          ],
          "label": "Resolution",
          "tooltip": "480p renders faster and cheaper. 720p is the default quality tier."
        },
        {
          "key": "seedance25AspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "16:9",
          "options": [
            "16:9",
            "4:3",
            "1:1",
            "3:4",
            "9:16",
            "21:9",
            "adaptive"
          ],
          "label": "Aspect Ratio",
          "tooltip": "Handled by the Format pill in the chat bar. 'adaptive' lets the model choose based on inputs. Ignored when a start frame is provided."
        },
        {
          "key": "seedance25GenerateAudio",
          "apiParam": "generate_audio",
          "type": "switch",
          "default": false,
          "label": "Generate Audio",
          "tooltip": "Generate synchronized audio (dialogue in double quotes, SFX, music). Off by default to reduce safety filter false-positives."
        },
        {
          "key": "seedance25Watermark",
          "apiParam": "watermark",
          "type": "switch",
          "default": false,
          "label": "Watermark",
          "tooltip": "Add a provider watermark to the generated video. Off by default."
        },
        {
          "key": "seedance25Seed",
          "apiParam": "seed",
          "type": "seed",
          "label": "Seed",
          "tooltip": "Random seed for reproducible generation (reproducibility is not guaranteed by the provider)"
        }
      ],
      "images": [
        {
          "key": "seedance25StartImage",
          "apiParam": "image",
          "label": "Start Frame (optional)",
          "single": true
        },
        {
          "key": "seedance25LastImage",
          "apiParam": "last_frame_image",
          "label": "Last Frame (requires start frame)",
          "single": true
        },
        {
          "key": "seedance25ReferenceImages",
          "apiParam": "reference_images",
          "label": "Reference Images (up to 30, exclusive with start/last frame)",
          "single": false,
          "max": 30
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "seedance25Resolution",
        "apiParam": "resolution",
        "default": "720p"
      },
      {
        "key": "seedance25AspectRatio",
        "apiParam": "aspect_ratio",
        "default": "16:9"
      },
      {
        "key": "seedance25GenerateAudio",
        "apiParam": "generate_audio",
        "default": false
      },
      {
        "key": "seedance25Watermark",
        "apiParam": "watermark",
        "default": false
      },
      {
        "key": "seedance25Seed",
        "apiParam": "seed"
      }
    ]
  },
  {
    "id": "veo-3.1",
    "name": "Veo 3.1",
    "type": "video",
    "provider": "replicate",
    "category": "Premium",
    "description": "Premium cinematic quality. Selectable 4/6/8s duration. Optional audio. Supports 1-3 reference images (16:9, 8s only).",
    "apiModel": "google/veo-3.1",
    "defaultOutputFormat": "mp4",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "duration": "duration",
      "resolution": "resolution",
      "aspectRatio": "aspect_ratio",
      "slots": {
        "refImage": "reference_images",
        "startImage": "image",
        "lastImage": "last_frame"
      }
    },
    "capabilities": {
      "maxResolution": "1080p",
      "resolutionBehavior": "selectable",
      "supportsReferenceImage": true,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "supportsMultipleImages": true,
      "maxReferenceImages": 3,
      "supportsAspectRatioWithStartImage": false,
      "mutuallyExclusiveSlots": [
        "startImage",
        "refImage"
      ]
    },
    "duration": {
      "behavior": "selectable",
      "allowedDurations": [
        4,
        6,
        8
      ],
      "defaultDuration": 8,
      "maxDuration": 8,
      "sendToApi": true
    },
    "pricing": {
      "apiCostEur": 0.184,
      "pricingType": "per_second",
      "baseDuration": 8,
      "useVariantPricing": false,
      "variants": [
        {
          "condition": {
            "generate_audio": false
          },
          "apiCostEur": 0.184
        },
        {
          "condition": {
            "generate_audio": true
          },
          "apiCostEur": 0.368
        }
      ]
    },
    "parameters": {
      "basic": [
        {
          "key": "veoResolution",
          "apiParam": "resolution",
          "type": "select",
          "default": "1080p",
          "options": [
            "720p",
            "1080p"
          ],
          "label": "Resolution"
        },
        {
          "key": "veoAspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "16:9",
          "options": [
            "16:9",
            "9:16"
          ],
          "label": "Aspect Ratio",
          "tooltip": "Reference images only work with 16:9"
        }
      ],
      "advanced": [
        {
          "key": "veoGenerateAudio",
          "apiParam": "generate_audio",
          "type": "switch",
          "default": true,
          "label": "Generate Audio",
          "tooltip": "Generate audio with the video (affects pricing)"
        },
        {
          "key": "veoNegativePrompt",
          "apiParam": "negative_prompt",
          "type": "textarea",
          "label": "Negative Prompt",
          "tooltip": "Description of what to exclude from the video"
        },
        {
          "key": "veoSeed",
          "apiParam": "seed",
          "type": "seed",
          "tooltip": "Random seed for reproducible generation"
        }
      ],
      "images": [
        {
          "key": "veoStartImage",
          "apiParam": "image",
          "label": "Start Frame (optional - ideal 1280x720 or 720x1280)",
          "single": true
        },
        {
          "key": "veoLastFrame",
          "apiParam": "last_frame",
          "label": "Last Frame (requires start frame)",
          "single": true
        },
        {
          "key": "veoReferenceImages",
          "apiParam": "reference_images",
          "label": "Reference Images (1-3 images, 16:9 & 8s only)",
          "single": false,
          "max": 3
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "veoResolution",
        "apiParam": "resolution",
        "default": "1080p"
      },
      {
        "key": "veoAspectRatio",
        "apiParam": "aspect_ratio",
        "default": "16:9"
      },
      {
        "key": "veoGenerateAudio",
        "apiParam": "generate_audio",
        "default": true
      },
      {
        "key": "veoNegativePrompt",
        "apiParam": "negative_prompt"
      },
      {
        "key": "veoSeed",
        "apiParam": "seed"
      }
    ]
  },
  {
    "id": "veo-3.1-fast",
    "name": "Veo 3.1 Fast",
    "type": "video",
    "provider": "replicate",
    "category": "High Quality",
    "description": "Fast Google model with 4/6/8s duration. Optional audio generation. Supports 720p/1080p.",
    "apiModel": "google/veo-3.1-fast",
    "defaultOutputFormat": "mp4",
    "supportsOutputQuality": true,
    "supportsMultiOutput": false,
    "apiMapping": {
      "duration": "duration",
      "resolution": "resolution",
      "aspectRatio": "aspect_ratio",
      "slots": {
        "startImage": "image",
        "lastImage": "last_frame"
      }
    },
    "capabilities": {
      "maxResolution": "1080p",
      "resolutionBehavior": "selectable",
      "supportsReferenceImage": false,
      "requiresReferenceImage": false,
      "supportsAdvancedOptions": true,
      "supportsAspectRatioWithStartImage": false,
      "mutuallyExclusiveSlots": [
        "startImage",
        "refImage"
      ]
    },
    "duration": {
      "behavior": "selectable",
      "allowedDurations": [
        4,
        6,
        8
      ],
      "defaultDuration": 8,
      "maxDuration": 8,
      "sendToApi": true
    },
    "pricing": {
      "apiCostEur": 0.092,
      "pricingType": "per_second",
      "baseDuration": 8,
      "useVariantPricing": false,
      "variants": [
        {
          "condition": {
            "generate_audio": false
          },
          "apiCostEur": 0.092
        },
        {
          "condition": {
            "generate_audio": true
          },
          "apiCostEur": 0.138
        }
      ]
    },
    "parameters": {
      "basic": [
        {
          "key": "veoResolution",
          "apiParam": "resolution",
          "type": "select",
          "default": "1080p",
          "options": [
            "720p",
            "1080p"
          ],
          "label": "Resolution"
        },
        {
          "key": "veoAspectRatio",
          "apiParam": "aspect_ratio",
          "type": "select",
          "default": "16:9",
          "options": [
            "16:9",
            "9:16"
          ],
          "label": "Aspect Ratio"
        }
      ],
      "advanced": [
        {
          "key": "veoGenerateAudio",
          "apiParam": "generate_audio",
          "type": "switch",
          "default": true,
          "label": "Generate Audio",
          "tooltip": "Generate audio with the video (affects pricing)"
        },
        {
          "key": "veoNegativePrompt",
          "apiParam": "negative_prompt",
          "type": "textarea",
          "label": "Negative Prompt",
          "tooltip": "Description of what to exclude from the video"
        },
        {
          "key": "veoSeed",
          "apiParam": "seed",
          "type": "seed",
          "tooltip": "Random seed for reproducible generation"
        }
      ],
      "images": [
        {
          "key": "veoStartImage",
          "apiParam": "image",
          "label": "Start Frame (optional - ideal 1280x720 or 720x1280)",
          "single": true
        },
        {
          "key": "veoLastFrame",
          "apiParam": "last_frame",
          "label": "Last Frame (requires start frame)",
          "single": true
        }
      ]
    },
    "parameterKeys": [
      {
        "key": "veoResolution",
        "apiParam": "resolution",
        "default": "1080p"
      },
      {
        "key": "veoAspectRatio",
        "apiParam": "aspect_ratio",
        "default": "16:9"
      },
      {
        "key": "veoGenerateAudio",
        "apiParam": "generate_audio",
        "default": true
      },
      {
        "key": "veoNegativePrompt",
        "apiParam": "negative_prompt"
      },
      {
        "key": "veoSeed",
        "apiParam": "seed"
      }
    ]
  }
];

const BY_ID = new Map<string, CatalogModel>(MODEL_CATALOG.map((m) => [m.id, m]));

/** The model, or undefined when the id is unknown or the model is disabled. */
export function getCatalogModel(id: string): CatalogModel | undefined {
  return BY_ID.get(id);
}

export function listCatalogModels(type?: string): CatalogModel[] {
  return type && type !== 'all'
    ? MODEL_CATALOG.filter((m) => m.type === type)
    : MODEL_CATALOG;
}
