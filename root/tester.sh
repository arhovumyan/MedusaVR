#!/bin/bash
URL=https://dwjiqw2q0cdi92-7861.proxy.runpod.net

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

echo "Generated workflow with seed $RANDOM_SEED"

if ! python3 -c "import json; json.load(open('temp_workflow.json'))" 2>/dev/null; then
    echo "❌ Generated JSON is invalid!"
    cat temp_workflow.json
    rm temp_workflow.json
    exit 1
fi

# Load last known image number from cache file
CACHE_FILE=".last_image_number"
if [ -f "$CACHE_FILE" ]; then
    LAST_KNOWN=$(cat "$CACHE_FILE")
    echo "📁 Last known image number from cache: $LAST_KNOWN"
else
    LAST_KNOWN=0
    echo "📁 No cache found, starting from 0"
fi

echo "🚀 Sending workflow..."
response=$(curl -s -X POST $URL/prompt \
     -H "Content-Type: application/json" \
     -T temp_workflow.json)

echo "Response: $response"
rm temp_workflow.json

# Extract HTTP status and prompt_id more reliably
if echo "$response" | grep -q '"prompt_id"'; then
    prompt_id=$(echo "$response" | grep -o '"prompt_id":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Workflow submitted successfully. Prompt ID: $prompt_id"
    
    # Wait for generation to complete using history endpoint
    echo "⏳ Waiting for generation to complete..."
    max_wait=60  # Maximum wait time in seconds
    wait_time=0
    generation_completed=false
    
    while [ $wait_time -lt $max_wait ]; do
        # Check history to see if our prompt completed
        history_response=$(curl -s "$URL/history/$prompt_id")
        
        # If we get a valid response with our prompt_id, generation is complete
        if echo "$history_response" | grep -q "\"status\"" && echo "$history_response" | grep -q "\"outputs\""; then
            echo "✅ Generation completed!"
            generation_completed=true
            break
        fi
        
        # Alternative: check if prompt is no longer in running queue
        queue_response=$(curl -s "$URL/queue")
        running_count=$(echo "$queue_response" | grep -o '"queue_running":\[[^]]*\]' | grep -o "$prompt_id" | wc -l)
        
        if [ "$running_count" -eq 0 ]; then
            # Double-check by waiting a bit more and checking history
            sleep 2
            history_response=$(curl -s "$URL/history/$prompt_id")
            if echo "$history_response" | grep -q "$prompt_id"; then
                echo "✅ Generation completed!"
                generation_completed=true
                break
            fi
        fi
        
        echo "⏳ Still generating... (${wait_time}s)"
        sleep 2
        wait_time=$((wait_time + 2))
    done
    
    if [ "$generation_completed" = false ]; then
        echo "⚠️ Generation taking longer than expected, proceeding with download attempt..."
    fi
    
    # Find the latest image number
    echo "🔍 Finding latest image..."
    
    find_latest_image() {
        local start=$1
        local latest=$start
        
        # Search forward from last known position (redirect output to stderr for logging)
        echo "🔍 Searching from image $start..." >&2
        for i in $(seq $((start + 1)) $((start + 100))); do
            counter=$(printf "%05d" $i)
            filename="output1_${counter}_.png"
            
            if curl -s -I "$URL/view?filename=$filename" 2>/dev/null | head -1 | grep -q "200"; then
                latest=$i
                echo "✓ Found: $filename" >&2
            else
                # If we don't find this one, check a few more in case of gaps
                local gap_count=0
                for j in $(seq $((i + 1)) $((i + 5))); do
                    gap_counter=$(printf "%05d" $j)
                    gap_filename="output1_${gap_counter}_.png"
                    if curl -s -I "$URL/view?filename=$gap_filename" 2>/dev/null | head -1 | grep -q "200"; then
                        latest=$j
                        echo "✓ Found (after gap): $gap_filename" >&2
                        i=$j  # Continue from this position
                        break
                    fi
                    gap_count=$((gap_count + 1))
                done
                
                # If we found nothing in the gap, we're probably at the end
                if [ $gap_count -eq 5 ]; then
                    break
                fi
            fi
        done
        
        # Only output the number (to stdout)
        echo $latest
    }
    
    current_latest=$(find_latest_image $LAST_KNOWN)
    
    # Since we know the generation just completed, the new image should be the next number
    expected_new=$((current_latest + 1))
    
    echo "📊 Last cached: $LAST_KNOWN"
    echo "📊 Current latest found: $current_latest"
    echo "🎯 Attempting to download: $expected_new"
    
    # Try to download the expected image and a few alternatives
    echo "⬇️ Downloading new image..."
    timestamp=$(date +"%Y%m%d_%H%M%S")
    downloaded=false
    
    # Try the expected number and several after it
    for offset in 0 1 2 3 4 5; do
        test_number=$((expected_new + offset))
        test_filename="output1_$(printf "%05d" $test_number)_.png"
        
        echo "Trying: $test_filename"
        
        # Use a more robust download method
        if curl -s --fail "$URL/view?filename=$test_filename" -o "temp_download.png"; then
            # Verify the file was downloaded and has content
            if [ -s "temp_download.png" ]; then
                # Check if it's actually a PNG file
                if file temp_download.png | grep -q "PNG image"; then
                    final_name="gens/output1_${timestamp}_seed${RANDOM_SEED}.png"
                    mv "temp_download.png" "$final_name"
                    echo "✅ Image downloaded successfully: $final_name"
                    echo "📝 Original filename: $test_filename"
                    echo "📏 File size: $(ls -lh "$final_name" | awk '{print $5}')"
                    
                    # Update cache with the new latest number
                    echo $test_number > "$CACHE_FILE"
                    downloaded=true
                    break
                else
                    echo "❌ Downloaded file is not a valid PNG"
                    rm -f "temp_download.png"
                fi
            else
                echo "❌ Downloaded file is empty"
                rm -f "temp_download.png"
            fi
        else
            echo "❌ Failed to download $test_filename"
        fi
    done
    
    # Clean up any leftover temp file
    rm -f "temp_download.png"
    
    if [ "$downloaded" = false ]; then
        echo "❌ Failed to download any image"
        echo "💡 Manual check URLs:"
        for offset in 0 1 2 3 4 5; do
            test_number=$((expected_new + offset))
            test_filename="output1_$(printf "%05d" $test_number)_.png"
            echo "   $URL/view?filename=$test_filename"
        done
        exit 1
    fi
    
else
    echo "❌ Failed to submit workflow"
    echo "Full response: $response"
    exit 1
fi