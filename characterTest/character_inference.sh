#!/bin/bash
URL=https://1nbt9n6rlpzw71-7861.proxy.runpod.net

# Check if character name and scene prompt are provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <character_name> <scene_prompt>"
    echo "Example: $0 emma_stone 'sitting in a cafe, drinking coffee, warm lighting'"
    exit 1
fi

CHARACTER_NAME="$1"
SCENE_PROMPT="$2"

# Check if character LoRA exists
LORA_PATH="characters/${CHARACTER_NAME}.safetensors"
if [ ! -f "$LORA_PATH" ]; then
    echo "❌ LoRA file not found: $LORA_PATH"
    echo "💡 Make sure you've trained the LoRA and placed it in the characters/ directory"
    exit 1
fi

echo "🎭 Generating image with character: $CHARACTER_NAME"
echo "🎬 Scene: $SCENE_PROMPT"

# Generate random seed
RANDOM_SEED=$((RANDOM * RANDOM + RANDOM))
echo "🎲 Using random seed: $RANDOM_SEED"

# Load cache for image numbering
CACHE_FILE=".last_image_number"
if [ -f "$CACHE_FILE" ]; then
    LAST_KNOWN=$(cat "$CACHE_FILE")
else
    LAST_KNOWN=0
fi

# Create enhanced prompt with character trigger
FULL_PROMPT="$CHARACTER_NAME, $SCENE_PROMPT, masterpiece, best quality, ultra detailed, 8k, photorealistic, detailed face, consistent character"

# Create workflow with LoRA
cat > temp_char_workflow.json << EOF
{
  "prompt": {
    "0": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": "diving.safetensors" }
    },
    "1": {
      "class_type": "LoraLoader",
      "inputs": {
        "model": ["0", 0],
        "clip": ["0", 1],
        "lora_name": "${CHARACTER_NAME}.safetensors",
        "strength_model": 0.8,
        "strength_clip": 0.8
      }
    },
    "2": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "clip": ["1", 1],
        "text": "$FULL_PROMPT"
      }
    },
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "clip": ["1", 1],
        "text": "worst quality, low quality, blurry, deformed, disfigured, bad anatomy, bad hands, long neck, child, childish"
      }
    },
    "4": {
      "class_type": "EmptyLatentImage",
      "inputs": { 
        "width": 512, 
        "height": 768, 
        "batch_size": 1 
      }
    },
    "5": {
      "class_type": "KSampler",
      "inputs": {
        "model": ["1", 0],
        "positive": ["2", 0],
        "negative": ["3", 0],
        "latent_image": ["4", 0],
        "steps": 25,
        "cfg": 7,
        "sampler_name": "dpmpp_2m",
        "scheduler": "karras",
        "denoise": 1.0,
        "seed": $RANDOM_SEED
      }
    },
    "6": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["5", 0], "vae": ["0", 2] }
    },
    "7": {
      "class_type": "SaveImage",
      "inputs": {
        "images": ["6", 0],
        "filename_prefix": "${CHARACTER_NAME}_scene",
        "increment_index": false
      }
    }
  }
}
EOF

echo "🚀 Sending workflow..."
response=$(curl -s -X POST $URL/prompt \
     -H "Content-Type: application/json" \
     -T temp_char_workflow.json \
     -w "%{http_code}")

echo "Response: $response"
rm temp_char_workflow.json

if [[ $response == *"200"* ]]; then
    prompt_id=$(echo "$response" | grep -o '"prompt_id":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Workflow submitted successfully. Prompt ID: $prompt_id"
    
    echo "⏳ Waiting for generation..."
    sleep 10
    
    echo "⬇️ Downloading character scene..."
    timestamp=$(date +"%Y%m%d_%H%M%S")
    
    # Try to download the generated image
    for attempt in {1..10}; do
        for counter in $(printf "%05d" {1..20}); do
            filename="${CHARACTER_NAME}_scene_${counter}_.png"
            
            http_code=$(curl -s "$URL/view?filename=$filename" \
                 -o "temp_download.png" \
                 -w "%{http_code}")
            
            if [ "$http_code" = "200" ] && [ -s "temp_download.png" ]; then
                final_name="${CHARACTER_NAME}_${timestamp}_seed${RANDOM_SEED}.png"
                mv "temp_download.png" "$final_name"
                echo "✅ Image downloaded: $final_name"
                ls -la "$final_name"
                exit 0
            else
                rm -f "temp_download.png" 2>/dev/null
            fi
        done
        
        if [ $attempt -lt 10 ]; then
            echo "⏳ Retrying in 5 seconds..."
            sleep 5
        fi
    done
    
    echo "❌ Image download failed"
    
else
    echo "❌ Failed to submit workflow"
    echo "Full response: $response"
fi