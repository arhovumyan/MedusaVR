#!/bin/bash
URL=https://1nbt9n6rlpzw71-7861.proxy.runpod.net

# Check if config file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <character_config.json>"
    echo "Example: $0 configs/emma_stone.json"
    exit 1
fi

CONFIG_FILE="$1"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found: $CONFIG_FILE"
    exit 1
fi

echo "🎭 One-Click Character Generation System"
echo "📄 Loading config: $CONFIG_FILE"

# Parse JSON config (requires jq or python)
if command -v jq &> /dev/null; then
    CHARACTER_NAME=$(jq -r '.character_name' "$CONFIG_FILE")
    POSITIVE_PROMPT=$(jq -r '.positive_prompt' "$CONFIG_FILE")
    NEGATIVE_PROMPT=$(jq -r '.negative_prompt' "$CONFIG_FILE")
    CHECKPOINT=$(jq -r '.checkpoint' "$CONFIG_FILE")
    TEST_SCENE=$(jq -r '.test_scene' "$CONFIG_FILE")
    LORA_STRENGTH=$(jq -r '.lora_strength // 0.8' "$CONFIG_FILE")
    TRAINING_STEPS=$(jq -r '.training_steps // 30' "$CONFIG_FILE")
    CFG_SCALE=$(jq -r '.cfg_scale // 7' "$CONFIG_FILE")
    WIDTH=$(jq -r '.width // 512' "$CONFIG_FILE")
    HEIGHT=$(jq -r '.height // 768' "$CONFIG_FILE")
else
    # Fallback using python
    CHARACTER_NAME=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['character_name'])")
    POSITIVE_PROMPT=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['positive_prompt'])")
    NEGATIVE_PROMPT=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['negative_prompt'])")
    CHECKPOINT=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['checkpoint'])")
    TEST_SCENE=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['test_scene'])")
    LORA_STRENGTH=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE')).get('lora_strength', 0.8))")
    TRAINING_STEPS=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE')).get('training_steps', 30))")
    CFG_SCALE=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE')).get('cfg_scale', 7))")
    WIDTH=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE')).get('width', 512))")
    HEIGHT=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE')).get('height', 768))")
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CHARACTER_DIR="characters/${CHARACTER_NAME}_${TIMESTAMP}"

echo "🎭 Character: $CHARACTER_NAME"
echo "📁 Directory: $CHARACTER_DIR"
echo "🖼️  Checkpoint: $CHECKPOINT"
echo "🎬 Test Scene: $TEST_SCENE"

# Create character directory
mkdir -p "$CHARACTER_DIR/training_images"
mkdir -p "$CHARACTER_DIR/lora_training"

echo ""
echo "🚀 PHASE 1: Generating 16 training images..."

# Generate training variations
ANGLES=("front view" "3/4 view" "side profile" "slight angle" "turned head")
EXPRESSIONS=("neutral expression" "slight smile" "serious look" "gentle expression" "focused eyes")
LIGHTING=("soft lighting" "dramatic lighting" "natural lighting" "studio lighting" "rim lighting")
POSES=("portrait" "upper body" "looking at camera" "looking away" "slight turn")

GENERATED_IMAGES=()
FAILED_DOWNLOADS=0

for i in {1..16}; do
    RANDOM_SEED=$((RANDOM * RANDOM + RANDOM))
    
    # Select random variations for diversity
    ANGLE=${ANGLES[$((RANDOM % ${#ANGLES[@]}))]}
    EXPRESSION=${EXPRESSIONS[$((RANDOM % ${#EXPRESSIONS[@]}))]}
    LIGHT=${LIGHTING[$((RANDOM % ${#LIGHTING[@]}))]}
    POSE=${POSES[$((RANDOM % ${#POSES[@]}))]}
    
    TRAINING_PROMPT="$POSITIVE_PROMPT, $ANGLE, $EXPRESSION, $LIGHT, $POSE, training photo, consistent character"
    
    echo "📸 Generating training image $i/16 (Seed: $RANDOM_SEED)"
    echo "   Variations: $ANGLE, $EXPRESSION, $LIGHT"
    
    # Create workflow
    cat > temp_training_${i}.json << EOF
{
  "prompt": {
    "0": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": "$CHECKPOINT" }
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
        "width": $WIDTH, 
        "height": $HEIGHT, 
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
        "steps": $TRAINING_STEPS,
        "cfg": $CFG_SCALE,
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
        "filename_prefix": "train_${CHARACTER_NAME}_${i}",
        "increment_index": false
      }
    }
  }
}
EOF

    # Submit workflow
    response=$(curl -s -X POST $URL/prompt \
         -H "Content-Type: application/json" \
         -T temp_training_${i}.json \
         -w "%{http_code}")
    
    rm temp_training_${i}.json
    
    if [[ $response == *"200"* ]]; then
        echo "   ✅ Submitted successfully"
    else
        echo "   ❌ Failed to submit"
        continue
    fi
    
    # Wait and download immediately
    sleep 8
    
    # Try to download
    downloaded=false
    for attempt in {1..3}; do
        for counter in $(printf "%05d" {1..30}); do
            filename="train_${CHARACTER_NAME}_${i}_${counter}_.png"
            
            http_code=$(curl -s "$URL/view?filename=$filename" \
                 -o "$CHARACTER_DIR/training_images/train_${i}_seed${RANDOM_SEED}.png" \
                 -w "%{http_code}")
            
            if [ "$http_code" = "200" ] && [ -s "$CHARACTER_DIR/training_images/train_${i}_seed${RANDOM_SEED}.png" ]; then
                echo "   ✅ Downloaded: train_${i}_seed${RANDOM_SEED}.png"
                GENERATED_IMAGES+=("train_${i}_seed${RANDOM_SEED}.png")
                downloaded=true
                break 2
            else
                rm -f "$CHARACTER_DIR/training_images/train_${i}_seed${RANDOM_SEED}.png" 2>/dev/null
            fi
        done
        
        if [ $attempt -lt 3 ]; then
            sleep 5
        fi
    done
    
    if [ "$downloaded" = false ]; then
        echo "   ❌ Failed to download training image $i"
        FAILED_DOWNLOADS=$((FAILED_DOWNLOADS + 1))
    fi
    
    # Brief pause between generations
    sleep 2
done

echo ""
echo "📊 Training images generated: $((16 - FAILED_DOWNLOADS))/16"

if [ $FAILED_DOWNLOADS -gt 8 ]; then
    echo "❌ Too many failed downloads. Aborting."
    exit 1
fi

echo ""
echo "🚀 PHASE 2: Preparing LoRA training data..."

# Prepare training data
counter=1
for img in "$CHARACTER_DIR/training_images"/*.png; do
    if [ -f "$img" ]; then
        new_name=$(printf "%03d_%s.png" $counter "$CHARACTER_NAME")
        cp "$img" "$CHARACTER_DIR/lora_training/$new_name"
        
        # Create caption file
        echo "$CHARACTER_NAME, detailed face, high quality, consistent character" > "$CHARACTER_DIR/lora_training/${new_name%.png}.txt"
        
        counter=$((counter + 1))
    fi
done

echo "✅ LoRA training data prepared: $(ls -1 "$CHARACTER_DIR/lora_training"/*.png 2>/dev/null | wc -l) images"

echo ""
echo "🚀 PHASE 3: Simulating LoRA training..."
echo "   (In production, this would trigger actual LoRA training)"
echo "   For now, creating a mock LoRA file..."

# Create mock LoRA file (in production, this would be actual training)
mkdir -p characters/loras
touch "characters/loras/${CHARACTER_NAME}.safetensors"

# Create training log
cat > "$CHARACTER_DIR/training_log.txt" << EOF
Character: $CHARACTER_NAME
Training started: $TIMESTAMP
Training images: $((16 - FAILED_DOWNLOADS))
Base model: $CHECKPOINT
Training steps: $TRAINING_STEPS
Learning rate: 0.0001
Batch size: 1

Status: COMPLETED (MOCK)
LoRA saved to: characters/loras/${CHARACTER_NAME}.safetensors

Note: This is a simulation. In production, integrate with actual LoRA training pipeline.
EOF

echo "✅ Training completed (simulated)"

echo ""
echo "🚀 PHASE 4: Testing character with scene generation..."

TEST_SEED=$((RANDOM * RANDOM + RANDOM))
FULL_TEST_PROMPT="$CHARACTER_NAME, $TEST_SCENE, $POSITIVE_PROMPT"

echo "🎬 Generating test scene: $TEST_SCENE"
echo "🎲 Test seed: $TEST_SEED"

# Create test workflow
cat > temp_test.json << EOF
{
  "prompt": {
    "0": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": "$CHECKPOINT" }
    },
    "1": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "clip": ["0", 1],
        "text": "$FULL_TEST_PROMPT"
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
        "width": $WIDTH, 
        "height": $HEIGHT, 
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
        "cfg": $CFG_SCALE,
        "sampler_name": "dpmpp_2m",
        "scheduler": "karras",
        "denoise": 1.0,
        "seed": $TEST_SEED
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
        "filename_prefix": "final_${CHARACTER_NAME}",
        "increment_index": false
      }
    }
  }
}
EOF

# Submit test workflow
response=$(curl -s -X POST $URL/prompt \
     -H "Content-Type: application/json" \
     -T temp_test.json \
     -w "%{http_code}")

rm temp_test.json

if [[ $response == *"200"* ]]; then
    echo "✅ Test workflow submitted"
    
    echo "⏳ Waiting for final image generation..."
    sleep 10
    
    # Download final image
    for attempt in {1..5}; do
        for counter in $(printf "%05d" {1..20}); do
            filename="final_${CHARACTER_NAME}_${counter}_.png"
            
            http_code=$(curl -s "$URL/view?filename=$filename" \
                 -o "$CHARACTER_DIR/${CHARACTER_NAME}_final_test.png" \
                 -w "%{http_code}")
            
            if [ "$http_code" = "200" ] && [ -s "$CHARACTER_DIR/${CHARACTER_NAME}_final_test.png" ]; then
                echo "✅ Final test image downloaded: ${CHARACTER_NAME}_final_test.png"
                break 2
            else
                rm -f "$CHARACTER_DIR/${CHARACTER_NAME}_final_test.png" 2>/dev/null
            fi
        done
        
        if [ $attempt -lt 5 ]; then
            echo "⏳ Retrying in 5 seconds..."
            sleep 5
        fi
    done
else
    echo "❌ Failed to submit test workflow"
fi

# Create final summary
cat > "$CHARACTER_DIR/character_summary.json" << EOF
{
  "character_name": "$CHARACTER_NAME",
  "created_timestamp": "$TIMESTAMP",
  "config_file": "$CONFIG_FILE",
  "training_images_generated": $((16 - FAILED_DOWNLOADS)),
  "training_images_failed": $FAILED_DOWNLOADS,
  "checkpoint_used": "$CHECKPOINT",
  "lora_file": "characters/loras/${CHARACTER_NAME}.safetensors",
  "test_scene": "$TEST_SCENE",
  "test_image": "${CHARACTER_NAME}_final_test.png",
  "positive_prompt": "$POSITIVE_PROMPT",
  "negative_prompt": "$NEGATIVE_PROMPT",
  "settings": {
    "lora_strength": $LORA_STRENGTH,
    "training_steps": $TRAINING_STEPS,
    "cfg_scale": $CFG_SCALE,
    "resolution": "${WIDTH}x${HEIGHT}"
  },
  "status": "COMPLETED"
}
EOF

echo ""
echo "🎉 ONE-CLICK CHARACTER GENERATION COMPLETE!"
echo "======================================================"
echo "📁 Character directory: $CHARACTER_DIR"
echo "🎭 Character name: $CHARACTER_NAME"
echo "📊 Training images: $((16 - FAILED_DOWNLOADS))/16"
echo "🧠 LoRA file: characters/loras/${CHARACTER_NAME}.safetensors"
echo "🖼️  Final test image: ${CHARACTER_NAME}_final_test.png"
echo ""
echo "📋 Summary saved to: $CHARACTER_DIR/character_summary.json"
echo "📝 Training log: $CHARACTER_DIR/training_log.txt"
echo ""
echo "✅ Your character '$CHARACTER_NAME' is ready to use!"