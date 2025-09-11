#!/bin/bash

# Improved Character Creation Script
# Usage: bash characterGen.sh "character_name" "character_description"

URL=https://dwjiqw2q0cdi92-7861.proxy.runpod.net

if [ $# -ne 2 ]; then
    echo "Usage: $0 \"character_name\" \"character_description\""
    echo "Example: $0 \"TestCharacter1\" \"beautiful woman with long red hair, green eyes, fair skin\""
    exit 1
fi

CHARACTER_NAME="$1"
CHARACTER_DESC="$2"
TIMESTAMP=$(date +"%Y%m%dT%H%M%S")

# Create proper directory structure
BASE_DIR="/root/characters/$CHARACTER_NAME"
IMAGES_DIR="$BASE_DIR/training_images"
EMB_DIR="$BASE_DIR/embeddings"
CACHE_DIR="$BASE_DIR/cache"
CONFIG_DIR="/root/config"

mkdir -p "$IMAGES_DIR" "$EMB_DIR" "$CACHE_DIR" "$CONFIG_DIR"

echo "🎭 Creating character: $CHARACTER_NAME"
echo "📁 Base directory: $BASE_DIR"

# Create/load configuration files
if [ ! -f "$CONFIG_DIR/negative_prompt.txt" ]; then
    echo "Creating default negative prompt..."
    cat > "$CONFIG_DIR/negative_prompt.txt" << 'EOF'
lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, multiple faces, duplicate, extra limbs, deformed, ugly, distorted face
EOF
fi

if [ ! -f "$CONFIG_DIR/positive_base.txt" ]; then
    echo "Creating default positive prompt base..."
    cat > "$CONFIG_DIR/positive_base.txt" << 'EOF'
high quality, detailed, masterpiece, best quality, sharp focus, professional photography
EOF
fi

NEGATIVE_PROMPT=$(cat "$CONFIG_DIR/negative_prompt.txt")
POSITIVE_BASE=$(cat "$CONFIG_DIR/positive_base.txt")

# Training variations for comprehensive character learning
declare -a TRAINING_VARIATIONS=(
    "portrait, front view, looking at camera, neutral expression"
    "portrait, side profile, elegant pose, soft lighting"
    "portrait, three quarter view, slight smile, natural lighting"
    "upper body shot, arms crossed, confident pose, studio lighting"
    "full body shot, standing pose, neutral expression, full figure"
    "portrait, looking over shoulder, dramatic lighting"
    "close-up face, detailed eyes and skin, soft expression"
    "portrait, different hairstyle, same facial features"
    "upper body, casual outfit, relaxed pose"
    "portrait, professional lighting, serious expression"
    "full body, dynamic pose, action shot"
    "portrait, laughing expression, joyful mood, bright lighting"
    "portrait, contemplative expression, moody lighting"
    "upper body, different angle, three quarter view"
    "portrait, wind effect, hair movement, outdoor lighting"
)

TOTAL_IMAGES=${#TRAINING_VARIATIONS[@]}
echo "🎨 Will generate $TOTAL_IMAGES training images"

# Initialize tracking
GENERATED_FILES=()
FAILED_GENERATIONS=0
GENERATION_LOG="$CACHE_DIR/generation_log_$TIMESTAMP.txt"

echo "Starting character generation for: $CHARACTER_NAME" > "$GENERATION_LOG"
echo "Timestamp: $TIMESTAMP" >> "$GENERATION_LOG"
echo "Description: $CHARACTER_DESC" >> "$GENERATION_LOG"
echo "----------------------------------------" >> "$GENERATION_LOG"

# Function to check job completion using prompt_id
check_job_completion() {
    local prompt_id=$1
    local max_wait=120
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        # Check if job is still in queue
        queue_response=$(curl -s "$URL/queue" 2>/dev/null)
        if [ $? -ne 0 ]; then
            echo "⚠️ Queue check failed, continuing..."
            return 0
        fi
        
        # Check if prompt_id is still in running queue
        if ! echo "$queue_response" | grep -q "$prompt_id"; then
            echo "✅ Generation completed!"
            return 0
        fi
        
        echo "⏳ Still generating... (${wait_time}s)"
        sleep 3
        wait_time=$((wait_time + 3))
    done
    
    echo "⚠️ Generation timeout, proceeding anyway..."
    return 1
}

# Function to find and download generated images by prompt_id pattern
download_by_prompt_pattern() {
    local prompt_id=$1
    local variation_num=$2
    local seed=$3
    local downloaded=0
    
    # Try to find images with various naming patterns
    local patterns=(
        "${CHARACTER_NAME}_${prompt_id:0:8}"
        "output1_*_${prompt_id:0:8}"
        "${CHARACTER_NAME}_$(printf "%05d" $variation_num)"
        "output1_$(printf "%05d" $((variation_num + $(cat "$CACHE_DIR/last_index" 2>/dev/null || echo 0))))"
    )
    
    for pattern in "${patterns[@]}"; do
        # This is a simplified approach - in practice you'd need ComfyUI API to list files
        echo "Trying pattern: $pattern" >> "$GENERATION_LOG"
    done
    
    # Fallback: try sequential numbering from a reasonable starting point
    local base_num=$(cat "$CACHE_DIR/last_index" 2>/dev/null || echo 0)
    local test_num=$((base_num + variation_num))
    local filename="output1_$(printf "%05d" $test_num)_.png"
    
    echo "Attempting download: $filename"
    local output_file="$IMAGES_DIR/${CHARACTER_NAME}_v$(printf "%02d" $variation_num)_${TIMESTAMP}_seed${seed}.png"
    
    if curl -s --fail "$URL/view?filename=$filename" -o "$output_file" 2>/dev/null; then
        if [ -s "$output_file" ] && file "$output_file" 2>/dev/null | grep -q "PNG image"; then
            echo "✅ Downloaded: $(basename "$output_file")"
            echo "SUCCESS: $filename -> $(basename "$output_file")" >> "$GENERATION_LOG"
            GENERATED_FILES+=("$output_file")
            echo $test_num > "$CACHE_DIR/last_index"
            return 0
        else
            rm -f "$output_file"
        fi
    fi
    
    echo "❌ Download failed for variation $variation_num"
    echo "FAIL: Could not download for prompt_id $prompt_id" >> "$GENERATION_LOG"
    return 1
}

# Generate training images
echo ""
echo "🚀 Starting batch generation..."

for i in "${!TRAINING_VARIATIONS[@]}"; do
    variation="${TRAINING_VARIATIONS[$i]}"
    variation_num=$((i + 1))
    
    echo ""
    echo "🎨 Generating image $variation_num/$TOTAL_IMAGES"
    echo "📝 Variation: $variation"
    
    # Create full prompt
    full_prompt="$CHARACTER_DESC, $variation, $POSITIVE_BASE"
    
    # Generate unique seed
    seed=$((RANDOM * RANDOM + RANDOM))
    echo "🎲 Seed: $seed"
    
    # Create workflow with character-specific filename prefix
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
        "text": "$full_prompt"
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
        "seed": $seed
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
        "filename_prefix": "${CHARACTER_NAME}_v$(printf "%02d" $variation_num)",
        "increment_index": true
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
        
        # Wait for completion
        if check_job_completion "$prompt_id"; then
            # Try to download the generated image
            if download_by_prompt_pattern "$prompt_id" "$variation_num" "$seed"; then
                echo "✅ Successfully generated and downloaded variation $variation_num"
            else
                echo "❌ Generated but failed to download variation $variation_num"
                FAILED_GENERATIONS=$((FAILED_GENERATIONS + 1))
            fi
        else
            echo "❌ Generation timeout for variation $variation_num"
            FAILED_GENERATIONS=$((FAILED_GENERATIONS + 1))
        fi
    else
        echo "❌ Failed to submit workflow for variation $variation_num"
        echo "Response: $response"
        FAILED_GENERATIONS=$((FAILED_GENERATIONS + 1))
    fi
    
    # Brief pause between generations
    sleep 2
done

# Generation summary
successful_count=${#GENERATED_FILES[@]}
echo ""
echo "📊 Generation Summary:"
echo "✅ Successful: $successful_count/$TOTAL_IMAGES"
echo "❌ Failed: $FAILED_GENERATIONS/$TOTAL_IMAGES"
echo "📁 Images saved in: $IMAGES_DIR"

# Create character manifest
cat > "$BASE_DIR/character_manifest.json" << EOF
{
  "character_name": "$CHARACTER_NAME",
  "description": "$CHARACTER_DESC",
  "created_timestamp": "$TIMESTAMP",
  "training_stats": {
    "total_variations": $TOTAL_IMAGES,
    "successful_generations": $successful_count,
    "failed_generations": $FAILED_GENERATIONS,
    "success_rate": "$(echo "scale=2; $successful_count * 100 / $TOTAL_IMAGES" | bc -l)%"
  },
  "directories": {
    "base": "$BASE_DIR",
    "training_images": "$IMAGES_DIR",
    "embeddings": "$EMB_DIR",
    "cache": "$CACHE_DIR"
  },
  "generated_files": [
$(printf '    "%s"' "${GENERATED_FILES[@]}" | sed 's/$/,/' | sed '$s/,$//')
  ],
  "training_variations": [
$(printf '    "%s"' "${TRAINING_VARIATIONS[@]}" | sed 's/$/,/' | sed '$s/,$//')
  ]
}
EOF

# Create embedding training preparation
if [ $successful_count -ge 5 ]; then
    echo ""
    echo "🧠 Preparing embedding training..."
    
    # Create embedding training config
    cat > "$EMB_DIR/training_config.json" << EOF
{
  "embedding_name": "emb_$CHARACTER_NAME",
  "character_name": "$CHARACTER_NAME",
  "training_images_path": "$IMAGES_DIR",
  "output_path": "$EMB_DIR/emb_${CHARACTER_NAME}.pt",
  "parameters": {
    "init_word": "person",
    "num_vectors_per_token": 1,
    "learning_rate": 0.005,
    "steps": 2000,
    "batch_size": 1,
    "save_every": 500
  },
  "training_images": [
$(printf '    "%s"' "${GENERATED_FILES[@]}" | sed 's/$/,/' | sed '$s/,$//')
  ]
}
EOF

    echo "✅ Embedding training config created: $EMB_DIR/training_config.json"
    echo "💡 Use this config with your embedding training tool"
else
    echo "⚠️ Only $successful_count images generated - need at least 5 for quality embedding training"
    echo "💡 Consider running the script again or fixing download issues"
fi

# Create usage README
cat > "$BASE_DIR/README.md" << EOF
# Character: $CHARACTER_NAME

## Description
$CHARACTER_DESC

## Statistics
- **Created**: $TIMESTAMP
- **Training Images**: $successful_count/$TOTAL_IMAGES generated
- **Success Rate**: $(echo "scale=1; $successful_count * 100 / $TOTAL_IMAGES" | bc -l)%

## Directory Structure
\`\`\`
$BASE_DIR/
├── training_images/     # Generated character images
├── embeddings/          # Trained embedding files
├── cache/              # Generation logs and indices
├── character_manifest.json
└── README.md
\`\`\`

## Usage
Once embedding is trained, use in prompts as:
\`\`\`
emb_$CHARACTER_NAME, [your scene description here]
\`\`\`

## Training Images
$(for file in "${GENERATED_FILES[@]}"; do echo "- $(basename "$file")"; done)

## Next Steps
1. Review generated images in \`training_images/\`
2. Train embedding using \`embeddings/training_config.json\`
3. Test embedding with new scene generations
4. Adjust training parameters if needed

Generated by characterGen.sh on $TIMESTAMP
EOF

echo ""
echo "🎉 Character creation completed!"
echo "📁 Character directory: $BASE_DIR"
echo "📖 Full details: $BASE_DIR/README.md"
echo "📊 Manifest: $BASE_DIR/character_manifest.json"

if [ $successful_count -ge 10 ]; then
    echo "✨ Excellent! $successful_count images should create a high-quality embedding"
elif [ $successful_count -ge 5 ]; then
    echo "👍 Good! $successful_count images should create a decent embedding"
else
    echo "⚠️ Warning: Only $successful_count images - consider generating more"
fi

echo ""
echo "🔮 Next: Train your embedding using the config in $EMB_DIR/"