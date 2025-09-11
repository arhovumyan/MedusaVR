#!/bin/bash
URL=https://4mm1jblh0l3mv2-7861.proxy.runpod.net/

# Create gens directory if it doesn't exist
mkdir -p gens

# Load prompts from external files
if [ ! -f "positive_prompt.txt" ]; then
    echo "❌ positive_prompt.txt not found!"
    exit 1
fi

if [ ! -f "negative_prompt.txt" ]; then
    echo "❌ negative_prompt.txt not found!"
    exit 1
fi

POSITIVE_PROMPT=$(cat positive_prompt.txt)
NEGATIVE_PROMPT=$(cat negative_prompt.txt)

# Generate random seed
RANDOM_SEED=$((RANDOM * RANDOM + RANDOM))
echo "Using random seed: $RANDOM_SEED"

# Load last known image number from cache file
CACHE_FILE=".last_image_number"
if [ -f "$CACHE_FILE" ]; then
    LAST_KNOWN=$(cat "$CACHE_FILE")
    echo "📁 Last known image number from cache: $LAST_KNOWN"
else
    LAST_KNOWN=0
    echo "📁 No cache found, starting from 0"
fi

# Create workflow with random seed and external prompts
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
        "text": "$POSITIVE_PROMPT"
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
        "filename_prefix": "output1",
        "increment_index": false
      }
    }
  }
}
EOF

echo "🚀 Sending workflow..."
response=$(curl -s -X POST $URL/prompt \
     -H "Content-Type: application/json" \
     -T temp_workflow.json)

echo "Response: $response"
rm temp_workflow.json

# Extract prompt_id
if echo "$response" | grep -q '"prompt_id"'; then
    prompt_id=$(echo "$response" | grep -o '"prompt_id":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Workflow submitted successfully. Prompt ID: $prompt_id"
    
    # Simple wait - we know it takes about 7 seconds
    echo "⏳ Waiting for generation (7.5 seconds)..."
    sleep 7.5
    echo "✅ Generation should be complete!"
    
    # The new image should be the next number after the last known
    new_image_number=$((LAST_KNOWN + 1))
    new_filename="output1_$(printf "%05d" $new_image_number)_.png"
    
    echo "🎯 Expected new image: $new_filename"
    
    echo "📊 Expected image: $new_filename (number: $new_image_number)"
    echo "⬇️ Downloading..."
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    final_name="gens/output1_${timestamp}_seed${RANDOM_SEED}.png"
    
    if curl -s --fail "$URL/view?filename=$new_filename" -o "$final_name"; then
        if [ -s "$final_name" ] && file "$final_name" | grep -q "PNG image"; then
            echo "✅ Image downloaded successfully: $final_name"
            echo "📏 File size: $(ls -lh "$final_name" | awk '{print $5}')"
            
            # Update cache
            echo $new_image_number > "$CACHE_FILE"
        else
            echo "❌ Downloaded file is invalid"
            rm -f "$final_name"
            exit 1
        fi
    else
        echo "❌ Failed to download $new_filename"
        echo "💡 Manual check: $URL/view?filename=$new_filename"
        exit 1
    fi
    
else
    echo "❌ Failed to submit workflow"
    echo "Full response: $response"
    exit 1
fi