#!/bin/bash
URL=https://1nbt9n6rlpzw71-7861.proxy.runpod.net

# Check if character name is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <character_name>"
    echo "Example: $0 emma_stone"
    exit 1
fi

CHARACTER_NAME="$1"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CHARACTER_DIR="characters/${CHARACTER_NAME}_${TIMESTAMP}"

# Create character directory
mkdir -p "$CHARACTER_DIR"

echo "🎭 Creating character: $CHARACTER_NAME"
echo "📁 Character directory: $CHARACTER_DIR"

# Load character-specific prompts
CHAR_POSITIVE_FILE="character_positive_prompt.txt"
CHAR_NEGATIVE_FILE="character_negative_prompt.txt"

if [ ! -f "$CHAR_POSITIVE_FILE" ]; then
    echo "❌ $CHAR_POSITIVE_FILE not found!"
    exit 1
fi

if [ ! -f "$CHAR_NEGATIVE_FILE" ]; then
    echo "❌ $CHAR_NEGATIVE_FILE not found!"
    exit 1
fi

POSITIVE_PROMPT=$(cat "$CHAR_POSITIVE_FILE")
NEGATIVE_PROMPT=$(cat "$CHAR_NEGATIVE_FILE")

# Generate 16 training images with different angles, expressions, lighting
ANGLES=("front view" "3/4 view" "side profile" "slight angle")
EXPRESSIONS=("neutral expression" "slight smile" "serious look" "gentle expression")
LIGHTING=("soft lighting" "dramatic lighting" "natural lighting" "studio lighting")

echo "🚀 Generating 16 training images for character consistency..."

# Load last known image number from cache
CACHE_FILE=".last_image_number"
if [ -f "$CACHE_FILE" ]; then
    LAST_KNOWN=$(cat "$CACHE_FILE")
else
    LAST_KNOWN=0
fi

GENERATED_IMAGES=()

for i in {1..16}; do
    # Generate random seed for variety
    RANDOM_SEED=$((RANDOM * RANDOM + RANDOM))
    
    # Select random variations
    ANGLE=${ANGLES[$((RANDOM % ${#ANGLES[@]}))]}
    EXPRESSION=${EXPRESSIONS[$((RANDOM % ${#EXPRESSIONS[@]}))]}
    LIGHT=${LIGHTING[$((RANDOM % ${#LIGHTING[@]}))]}
    
    # Create varied prompt for training diversity
    TRAINING_PROMPT="$POSITIVE_PROMPT, $ANGLE, $EXPRESSION, $LIGHT, training photo, high resolution, detailed face, consistent character"
    
    echo "📸 Generating image $i/16 - Seed: $RANDOM_SEED"
    echo "   Variations: $ANGLE, $EXPRESSION, $LIGHT"
    
    # Create workflow for this variation
    cat > temp_workflow_${i}.json << EOF
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
        "text": "$TRAINING_PROMPT"
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
        "width": 512, 
        "height": 768, 
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
        "steps": 30,
        "cfg": 7,
        "sampler_name": "dpmpp_2m",
        "scheduler": "karras",
        "denoise": 1.0,
        "seed": $RANDOM_SEED
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
        "filename_prefix": "char_${CHARACTER_NAME}_${i}",
        "increment_index": false
      }
    }
  }
}
EOF

    # Send workflow
    response=$(curl -s -X POST $URL/prompt \
         -H "Content-Type: application/json" \
         -T temp_workflow_${i}.json \
         -w "%{http_code}")
    
    rm temp_workflow_${i}.json
    
    if [[ $response == *"200"* ]]; then
        prompt_id=$(echo "$response" | grep -o '"prompt_id":"[^"]*"' | cut -d'"' -f4)
        echo "   ✅ Submitted (ID: $prompt_id)"
    else
        echo "   ❌ Failed to submit image $i"
    fi
    
    # Small delay to avoid overwhelming the server
    sleep 2
done

echo "⏳ Waiting for all images to generate..."
sleep 60

echo "⬇️ Downloading training images..."

# Download all generated images
for i in {1..16}; do
    echo "Downloading image $i/16..."
    
    # Try different possible filenames
    for attempt in {1..5}; do
        for counter in $(printf "%05d" {1..50}); do
            filename="char_${CHARACTER_NAME}_${i}_${counter}_.png"
            
            http_code=$(curl -s "$URL/view?filename=$filename" \
                 -o "$CHARACTER_DIR/training_${i}_seed${RANDOM_SEED}.png" \
                 -w "%{http_code}")
            
            if [ "$http_code" = "200" ] && [ -s "$CHARACTER_DIR/training_${i}_seed${RANDOM_SEED}.png" ]; then
                echo "   ✅ Downloaded: training_${i}_seed${RANDOM_SEED}.png"
                GENERATED_IMAGES+=("$CHARACTER_DIR/training_${i}_seed${RANDOM_SEED}.png")
                break 2
            else
                rm -f "$CHARACTER_DIR/training_${i}_seed${RANDOM_SEED}.png" 2>/dev/null
            fi
        done
        
        if [ $attempt -lt 5 ]; then
            echo "   ⏳ Retrying in 10 seconds..."
            sleep 10
        fi
    done
done

# Create character info file
cat > "$CHARACTER_DIR/character_info.json" << EOF
{
  "character_name": "$CHARACTER_NAME",
  "created_timestamp": "$TIMESTAMP",
  "training_images_count": ${#GENERATED_IMAGES[@]},
  "training_images": [
$(printf '    "%s",\n' "${GENERATED_IMAGES[@]}" | sed '$ s/,$//')
  ],
  "base_prompt": "$POSITIVE_PROMPT",
  "negative_prompt": "$NEGATIVE_PROMPT",
  "recommended_lora_settings": {
    "learning_rate": 0.0001,
    "batch_size": 1,
    "epochs": 10,
    "resolution": "512x768"
  }
}
EOF

# Create training preparation script
cat > "$CHARACTER_DIR/prepare_training.sh" << 'EOF'
#!/bin/bash
# This script prepares the images for LoRA training

CHARACTER_DIR=$(dirname "$0")
CHARACTER_NAME=$(basename "$CHARACTER_DIR" | cut -d'_' -f1)

echo "🎭 Preparing LoRA training for character: $CHARACTER_NAME"
echo "📁 Working directory: $CHARACTER_DIR"

# Create training structure
mkdir -p "$CHARACTER_DIR/lora_training/images"
mkdir -p "$CHARACTER_DIR/lora_training/captions"

# Copy and rename images for training
counter=1
for img in "$CHARACTER_DIR"/training_*.png; do
    if [ -f "$img" ]; then
        new_name=$(printf "%03d_%s.png" $counter "$CHARACTER_NAME")
        cp "$img" "$CHARACTER_DIR/lora_training/images/$new_name"
        
        # Create caption file
        echo "$CHARACTER_NAME, detailed face, high quality" > "$CHARACTER_DIR/lora_training/captions/${new_name%.png}.txt"
        
        counter=$((counter + 1))
    fi
done

echo "✅ Training data prepared in: $CHARACTER_DIR/lora_training/"
echo "📊 Images: $(ls -1 "$CHARACTER_DIR/lora_training/images" | wc -l)"
echo "📝 Captions: $(ls -1 "$CHARACTER_DIR/lora_training/captions" | wc -l)"

echo ""
echo "🚀 Next steps:"
echo "1. Upload the lora_training folder to your LoRA training environment"
echo "2. Use the settings from character_info.json"
echo "3. Train for 10-15 epochs"
echo "4. Test with: '$CHARACTER_NAME, [your prompt here]'"
EOF

chmod +x "$CHARACTER_DIR/prepare_training.sh"

echo ""
echo "🎉 Character generation complete!"
echo "📁 Character saved to: $CHARACTER_DIR"
echo "📊 Generated images: ${#GENERATED_IMAGES[@]}/16"
echo ""
echo "🚀 Next steps:"
echo "1. cd '$CHARACTER_DIR'"
echo "2. ./prepare_training.sh"
echo "3. Train LoRA with the prepared data"
echo "4. Use '$CHARACTER_NAME' in future prompts"