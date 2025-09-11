#!/bin/bash

# Simple Character Generation Script
# Usage: bash simple_character_gen.sh "character_name" "character_description"

URL=https://dwjiqw2q0cdi92-7861.proxy.runpod.net

if [ $# -ne 2 ]; then
    echo "Usage: $0 \"character_name\" \"character_description\""
    echo "Example: $0 \"TestCharacter1\" \"beautiful woman with long red hair, green eyes, fair skin\""
    exit 1
fi

CHARACTER_NAME="$1"
CHARACTER_DESC="$2"
TIMESTAMP=$(date +"%Y%m%dT%H%M%S")

# Create directories in current location
BASE_DIR="./characters/$CHARACTER_NAME"
IMAGES_DIR="$BASE_DIR/training_images"
mkdir -p "$IMAGES_DIR"

echo "🎭 Creating character: $CHARACTER_NAME"
echo "📁 Directory: $BASE_DIR"

# Use existing negative prompt or create default
if [ -f "negative_prompt.txt" ]; then
    NEGATIVE_PROMPT=$(cat negative_prompt.txt)
    echo "✅ Using existing negative_prompt.txt"
else
    NEGATIVE_PROMPT="lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, multiple faces, duplicate, extra limbs, deformed"
    echo "⚠️ Using default negative prompt (create negative_prompt.txt for custom)"
fi

# Get last known image number (from your existing cache)
CACHE_FILE=".last_image_number"
if [ -f "$CACHE_FILE" ]; then
    LAST_KNOWN=$(cat "$CACHE_FILE")
    echo "📊 Starting from image: $LAST_KNOWN"
else
    LAST_KNOWN=0
    echo "📊 Starting from image: 0"
fi

# Training variations (reduced set for faster testing)
declare -a VARIATIONS=(
    "portrait, front view, looking at camera, neutral expression"
    "portrait, side profile, elegant pose"
    "portrait, three quarter view, slight smile"
    "upper body shot, confident pose"
    "full body shot, standing pose"
)

TOTAL_IMAGES=${#VARIATIONS[@]}
echo "🎨 Will generate $TOTAL_IMAGES training images"

GENERATED_COUNT=0
CURRENT_INDEX=$LAST_KNOWN

for i in "${!VARIATIONS[@]}"; do
    VARIATION="${VARIATIONS[$i]}"
    IMAGE_NUM=$((i + 1))
    
    echo ""
    echo "🎨 Generating image $IMAGE_NUM/$TOTAL_IMAGES"
    echo "📝 Variation: $VARIATION"
    
    # Create full prompt
    FULL_PROMPT="$CHARACTER_DESC, $VARIATION, high quality, detailed, masterpiece, best quality"
    
    # Generate seed
    SEED=$((RANDOM * RANDOM + RANDOM))
    echo "🎲 Seed: $SEED"
    
    # Create workflow
    cat > temp_workflow.json << EOF
{
  "prompt": {
    "0": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": "diving.safetensors" }
    },
    "1": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "clip": ["0", 1],
        "text": "$FULL_PROMPT"
      }
    },
    "2": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "clip": ["0", 1],
        "text": "$NEGATIVE_PROMPT"
      }
    },
    "3": {
      "class_type": "EmptyLatentImage",
      "inputs": { 
        "width": 1024, 
        "height": 1024, 
        "batch_size": 1 
      }
    },
    "4": {
      "class_type": "KSampler",
      "inputs": {
        "model": ["0", 0],
        "positive": ["1", 0],
        "negative": ["2", 0],
        "latent_image": ["3", 0],
        "steps": 25,
        "cfg": 6,
        "sampler_name": "dpmpp_2m",
        "scheduler": "karras",
        "denoise": 1.0,
        "seed": $SEED
      }
    },
    "5": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["4", 0], "vae": ["0", 2] }
    },
    "6": {
      "class_type": "SaveImage",
      "inputs": {
        "images": ["5", 0],
        "filename_prefix": "output1",
        "increment_index": false
      }
    }
  }
}
EOF

    # Submit workflow
    echo "🚀 Submitting workflow..."
    response=$(curl -s -X POST "$URL/prompt" \
         -H "Content-Type: application/json" \
         -T temp_workflow.json)
    
    rm -f temp_workflow.json
    
    if echo "$response" | grep -q '"prompt_id"'; then
        prompt_id=$(echo "$response" | grep -o '"prompt_id":"[^"]*"' | cut -d'"' -f4)
        echo "✅ Submitted - Prompt ID: $prompt_id"
        
        # Simple wait
        echo "⏳ Waiting 8 seconds for generation..."
        sleep 8
        
        # Try to download
        EXPECTED_NUM=$((CURRENT_INDEX + 1))
        EXPECTED_FILENAME="output1_$(printf "%05d" $EXPECTED_NUM)_.png"
        OUTPUT_FILENAME="${CHARACTER_NAME}_v$(printf "%02d" $IMAGE_NUM)_${TIMESTAMP}_seed${SEED}.png"
        
        echo "🎯 Trying to download: $EXPECTED_FILENAME"
        
        if curl -s --fail "$URL/view?filename=$EXPECTED_FILENAME" -o "$IMAGES_DIR/$OUTPUT_FILENAME"; then
            if [ -s "$IMAGES_DIR/$OUTPUT_FILENAME" ] && file "$IMAGES_DIR/$OUTPUT_FILENAME" 2>/dev/null | grep -q "PNG image"; then
                echo "✅ Downloaded: $OUTPUT_FILENAME"
                GENERATED_COUNT=$((GENERATED_COUNT + 1))
                CURRENT_INDEX=$EXPECTED_NUM
                echo $CURRENT_INDEX > "$CACHE_FILE"
            else
                echo "❌ Downloaded file is invalid"
                rm -f "$IMAGES_DIR/$OUTPUT_FILENAME"
            fi
        else
            echo "❌ Download failed - trying alternative..."
            # Try a few more numbers in case of gaps
            for offset in 2 3 4 5; do
                ALT_NUM=$((CURRENT_INDEX + offset))
                ALT_FILENAME="output1_$(printf "%05d" $ALT_NUM)_.png"
                echo "🔍 Trying alternative: $ALT_FILENAME"
                
                if curl -s --fail "$URL/view?filename=$ALT_FILENAME" -o "$IMAGES_DIR/$OUTPUT_FILENAME"; then
                    if [ -s "$IMAGES_DIR/$OUTPUT_FILENAME" ] && file "$IMAGES_DIR/$OUTPUT_FILENAME" 2>/dev/null | grep -q "PNG image"; then
                        echo "✅ Downloaded (alternative): $OUTPUT_FILENAME"
                        GENERATED_COUNT=$((GENERATED_COUNT + 1))
                        CURRENT_INDEX=$ALT_NUM
                        echo $CURRENT_INDEX > "$CACHE_FILE"
                        break
                    else
                        rm -f "$IMAGES_DIR/$OUTPUT_FILENAME"
                    fi
                fi
            done
        fi
    else
        echo "❌ Failed to submit workflow"
        echo "Response: $response"
    fi
    
    # Brief pause between generations
    echo "💤 Pausing 3 seconds before next generation..."
    sleep 3
done

echo ""
echo "📊 Generation Summary:"
echo "✅ Successfully generated: $GENERATED_COUNT/$TOTAL_IMAGES images"
echo "📁 Images saved in: $IMAGES_DIR"

if [ $GENERATED_COUNT -gt 0 ]; then
    echo ""
    echo "📋 Generated files:"
    ls -la "$IMAGES_DIR"
    
    # Create simple character info
    cat > "$BASE_DIR/character_info.txt" << EOF
Character: $CHARACTER_NAME
Description: $CHARACTER_DESC
Created: $TIMESTAMP
Generated Images: $GENERATED_COUNT/$TOTAL_IMAGES
Directory: $IMAGES_DIR

Next steps:
1. Review the generated images
2. Use them for embedding training
3. Create embedding with name: emb_$CHARACTER_NAME

Images can be used for training textual inversion embeddings
for consistent character generation in future prompts.
EOF

    echo "📝 Character info saved: $BASE_DIR/character_info.txt"
    echo ""
    echo "🎉 Character creation completed!"
    echo "🔮 Next: Train an embedding using these images for consistent character generation"
else
    echo "❌ No images were successfully generated"
    echo "💡 Check your ComfyUI server and try again"
fi