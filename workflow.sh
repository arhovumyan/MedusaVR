#!/bin/bash

# Create the workflow JSON payload
curl -X POST "https://s5v1p91zkdag0i-7861.proxy.runpod.net/prompt" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": {
      "0": {
        "class_type": "CheckpointLoaderSimple",
        "inputs": {
          "ckpt_name": "diving.safetensors"
        }
      },
      "1": {
        "class_type": "CLIPTextEncode",
        "inputs": {
          "clip": ["0", 1],
          "text": "masterpiece, ultra-HD, impressionism, high detail, best quality, very aesthetic, 8k, best quality, sharp focus, depth of field, hyper realistic, vibrant colors, film grain, 1woman, green makeup, green lips, sideways glance, facing away, mouth, half-closed eyes. messy hair. big breasts. come here, (one hand view), long nail polish. simple green background, one hand focus, knee up, fashion photo theme. shoot from side, dynamic composition, dynamic angle. blurry foreground, shiny skin, foreshortening."
        }
      },
      "2": {
        "class_type": "CLIPTextEncode",
        "inputs": {
          "clip": ["0", 1],
          "text": "worst quality, low quality, normal quality, caucasian, toon, lowres, bad anatomy, bad hands, signature, watermarks, ugly, imperfect eyes, unnatural face, unnatural body, error, extra limb, missing limbs, Child, muscular, colored skin"
        }
      },
      "3": {
        "class_type": "EmptyLatentImage",
        "inputs": {
          "width": 512,
          "height": 768,
          "batch_size": 4
        }
      },
      "4": {
        "class_type": "KSampler",
        "inputs": {
          "model": ["0", 0],
          "seed": 123456,
          "positive": ["1", 0],
          "negative": ["2", 0],
          "latent_image": ["3", 0],
          "steps": 25,
          "cfg": 8,
          "sampler_name": "dpm_2_ancestral",
          "scheduler": "normal",
          "denoise": 0.7
        }
      },
      "5": {
        "class_type": "VAEDecode",
        "inputs": {
          "samples": ["4", 0],
          "vae": ["0", 2]
        }
      },
      "6": {
        "class_type": "SaveImage",
        "inputs": {
          "images": ["5", 0],
          "filename_prefix": "%date:yyyy-MM-dd_HH-mm-ss%_diving_hr"
        }
      }
    }
  }' \
  --output response.json \
  --write-out "HTTP Status: %{http_code}\n"

# Check if the request was successful
if [ $? -eq 0 ]; then
    echo "Workflow submitted successfully!"
    echo "Response saved to response.json"
    
    # Extract the prompt_id from the response (if available)
    if command -v jq &> /dev/null; then
        PROMPT_ID=$(jq -r '.prompt_id // empty' response.json)
        if [ ! -z "$PROMPT_ID" ]; then
            echo "Prompt ID: $PROMPT_ID"
            
            # Wait a moment for processing to start
            sleep 2
            
            # Check status and download images when ready
            echo "Checking status and downloading images..."
            while true; do
                # Get queue status
                curl -s "https://s5v1p91zkdag0i-7861.proxy.runpod.net/queue" > queue_status.json
                
                # Check if our job is still in queue
                QUEUE_STATUS=$(jq -r --arg pid "$PROMPT_ID" '.queue_running[] | select(.prompt_id == $pid) // empty' queue_status.json)
                
                if [ -z "$QUEUE_STATUS" ]; then
                    echo "Job completed! Downloading images..."
                    
                    # Get history to find generated images
                    curl -s "https://s5v1p91zkdag0i-7861.proxy.runpod.net/history/$PROMPT_ID" > history.json
                    
                    # Create directory for images
                    mkdir -p "generated_images_$(date +%Y%m%d_%H%M%S)"
                    cd "generated_images_$(date +%Y%m%d_%H%M%S)"
                    
                    # Extract image filenames and download them
                    if command -v jq &> /dev/null; then
                        jq -r '.[].outputs."6".images[]?.filename // empty' ../history.json | while read filename; do
                            if [ ! -z "$filename" ]; then
                                echo "Downloading: $filename"
                                curl -o "$filename" "https://s5v1p91zkdag0i-7861.proxy.runpod.net/view?filename=$filename"
                            fi
                        done
                    fi
                    
                    cd ..
                    break
                else
                    echo "Job still processing... waiting 5 seconds"
                    sleep 5
                fi
            done
        fi
    else
        echo "jq not found. Install jq for automatic image downloading."
        echo "You can manually check the response in response.json"
    fi
else
    echo "Failed to submit workflow"
fi