import fetch from 'node-fetch';
class ComfyUIService {
    constructor() {
        // Use the new ComfyUI URL
        this.baseUrl = process.env.RUNPOD_ANIME_CARTOON_FANTASY_URL ||
            process.env.RUNPOD_WEBUI_URL ||
            'https://4mm1jblh0l3mv2-7861.proxy.runpod.net';
        // Remove trailing slash if present
        this.baseUrl = this.baseUrl.replace(/\/$/, '');
    }
    /**
     * Generate a random seed for image generation
     */
    generateSeed() {
        return Math.floor(Math.random() * 1000000000);
    }
    /**
     * Create a ComfyUI workflow for character generation
     */
    createCharacterWorkflow(request) {
        const seed = request.seed || this.generateSeed();
        const checkpoint = request.checkpoint || 'diving.safetensors';
        const workflow = {
            prompt: {
                "0": {
                    "class_type": "CheckpointLoaderSimple",
                    "inputs": {
                        "ckpt_name": checkpoint
                    }
                }
            }
        };
        let currentNodeId = 1;
        let modelConnection = ["0", 0]; // Start with base model
        let clipConnection = ["0", 1]; // Start with base CLIP
        // Add LoRA nodes if any LoRAs are specified
        if (request.loras && request.loras.length > 0) {
            request.loras.forEach((lora, index) => {
                const loraNodeId = currentNodeId.toString();
                workflow.prompt[loraNodeId] = {
                    "class_type": "LoraLoader",
                    "inputs": {
                        "model": modelConnection,
                        "clip": clipConnection,
                        "lora_name": lora.filename,
                        "strength_model": lora.strength,
                        "strength_clip": lora.strength
                    }
                };
                // Update connections for next LoRA or subsequent nodes
                modelConnection = [loraNodeId, 0];
                clipConnection = [loraNodeId, 1];
                currentNodeId++;
            });
        }
        // Continue with the rest of the workflow
        const positivePromptNodeId = currentNodeId.toString();
        workflow.prompt[positivePromptNodeId] = {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "clip": clipConnection,
                "text": request.prompt
            }
        };
        currentNodeId++;
        const negativePromptNodeId = currentNodeId.toString();
        workflow.prompt[negativePromptNodeId] = {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "clip": clipConnection,
                "text": request.negativePrompt || "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry"
            }
        };
        currentNodeId++;
        const latentNodeId = currentNodeId.toString();
        workflow.prompt[latentNodeId] = {
            "class_type": "EmptyLatentImage",
            "inputs": {
                "width": request.width || 1024,
                "height": request.height || 1024,
                "batch_size": 1
            }
        };
        currentNodeId++;
        const ksamplerNodeId = currentNodeId.toString();
        workflow.prompt[ksamplerNodeId] = {
            "class_type": "KSampler",
            "inputs": {
                "model": modelConnection,
                "positive": [positivePromptNodeId, 0],
                "negative": [negativePromptNodeId, 0],
                "latent_image": [latentNodeId, 0],
                "steps": request.steps || 25,
                "cfg": request.cfg || 6,
                "sampler_name": request.sampler || "dpmpp_2m",
                "scheduler": request.scheduler || "karras",
                "denoise": 1.0,
                "seed": seed
            }
        };
        currentNodeId++;
        const vaeDecodeNodeId = currentNodeId.toString();
        workflow.prompt[vaeDecodeNodeId] = {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": [ksamplerNodeId, 0],
                "vae": ["0", 2]
            }
        };
        currentNodeId++;
        const saveImageNodeId = currentNodeId.toString();
        workflow.prompt[saveImageNodeId] = {
            "class_type": "SaveImage",
            "inputs": {
                "images": [vaeDecodeNodeId, 0],
                "filename_prefix": request.characterName ? `char_${request.characterName.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : "character",
                "increment_index": true
            }
        };
        return workflow;
    }
    /**
     * Submit a workflow to ComfyUI
     */
    async submitWorkflow(workflow) {
        try {
            console.log('🚀 Submitting workflow to ComfyUI:', `${this.baseUrl}/prompt`);
            const response = await fetch(`${this.baseUrl}/prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(workflow),
                timeout: 30000 // 30 seconds timeout for submission
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ ComfyUI workflow submission failed:', response.status, errorText);
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${errorText}`
                };
            }
            const result = await response.json();
            console.log('✅ ComfyUI workflow submitted successfully:', result);
            if (result.prompt_id) {
                return {
                    success: true,
                    promptId: result.prompt_id
                };
            }
            else {
                return {
                    success: false,
                    error: 'No prompt_id received from ComfyUI'
                };
            }
        }
        catch (error) {
            console.error('❌ ComfyUI workflow submission error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Wait for workflow completion and get the generated image
     */
    async waitForCompletion(promptId, characterName, maxWaitTime = 120000) {
        const startTime = Date.now();
        const pollInterval = 2000; // Poll every 2 seconds
        console.log(`⏳ Waiting for ComfyUI generation completion (prompt ID: ${promptId})`);
        while (Date.now() - startTime < maxWaitTime) {
            try {
                // Wait before polling
                await new Promise(resolve => setTimeout(resolve, pollInterval));
                // Try to get the generated image
                // ComfyUI saves images with incremental naming, we'll try to find the latest one
                const imageUrl = await this.findLatestImage(characterName);
                if (imageUrl) {
                    console.log('✅ Image generation completed!');
                    return {
                        success: true,
                        imageUrl: imageUrl
                    };
                }
                console.log(`⏳ Still waiting... (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);
            }
            catch (error) {
                console.warn('⚠️ Error while waiting for completion:', error);
            }
        }
        console.error('❌ Timeout waiting for image generation');
        return {
            success: false,
            error: 'Timeout waiting for image generation'
        };
    }
    /**
     * Find the latest generated image for a character
     */
    async findLatestImage(characterName) {
        // Try different possible filenames based on ComfyUI's naming convention
        const baseFilename = characterName ? `char_${characterName.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : 'character';
        // Try with different incremental numbers (ComfyUI uses 5-digit padding)
        for (let i = 1; i <= 10; i++) {
            const paddedNumber = i.toString().padStart(5, '0');
            const filename = `${baseFilename}_${paddedNumber}_.png`;
            try {
                const imageUrl = `${this.baseUrl}/view?filename=${filename}`;
                const response = await fetch(imageUrl, { method: 'HEAD', timeout: 5000 });
                if (response.ok) {
                    console.log(`🎯 Found generated image: ${filename}`);
                    return imageUrl;
                }
            }
            catch (error) {
                // Continue trying other numbers
            }
        }
        // Also try the generic output format from your simplified tester
        for (let i = 1; i <= 20; i++) {
            const paddedNumber = i.toString().padStart(5, '0');
            const filename = `output1_${paddedNumber}_.png`;
            try {
                const imageUrl = `${this.baseUrl}/view?filename=${filename}`;
                const response = await fetch(imageUrl, { method: 'HEAD', timeout: 5000 });
                if (response.ok) {
                    console.log(`🎯 Found generated image: ${filename}`);
                    return imageUrl;
                }
            }
            catch (error) {
                // Continue trying other numbers
            }
        }
        return null;
    }
    /**
     * Generate a character image using ComfyUI
     */
    async generateCharacterImage(request) {
        try {
            console.log('🎨 Starting ComfyUI character image generation');
            console.log('📋 Request details:', {
                characterName: request.characterName,
                prompt: request.prompt?.substring(0, 100) + '...',
                dimensions: `${request.width || 1024}x${request.height || 1024}`,
                steps: request.steps || 25,
                cfg: request.cfg || 6
            });
            // Create the workflow
            const workflow = this.createCharacterWorkflow(request);
            const seed = workflow.prompt["4"].inputs.seed;
            // Submit workflow
            const submitResult = await this.submitWorkflow(workflow);
            if (!submitResult.success) {
                return {
                    success: false,
                    error: submitResult.error,
                    workflow: workflow
                };
            }
            // Wait for completion
            const completionResult = await this.waitForCompletion(submitResult.promptId, request.characterName || 'character');
            if (!completionResult.success) {
                return {
                    success: false,
                    error: completionResult.error,
                    workflow: workflow,
                    promptId: submitResult.promptId,
                    seed: seed
                };
            }
            return {
                success: true,
                promptId: submitResult.promptId,
                imageUrl: completionResult.imageUrl,
                seed: seed,
                workflow: workflow
            };
        }
        catch (error) {
            console.error('❌ ComfyUI character generation failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Test ComfyUI connectivity
     */
    async testConnection() {
        try {
            console.log('🔍 Testing ComfyUI connection:', this.baseUrl);
            const response = await fetch(`${this.baseUrl}/`, {
                method: 'GET',
                timeout: 10000
            });
            const isConnected = response.ok;
            console.log(`${isConnected ? '✅' : '❌'} ComfyUI connection test:`, response.status);
            return isConnected;
        }
        catch (error) {
            console.error('❌ ComfyUI connection test failed:', error);
            return false;
        }
    }
    /**
     * Generate multiple images for embedding creation
     */
    async generateEmbeddingImages(request, count = 5) {
        console.log(`🧠 Generating ${count} images for embedding creation`);
        const images = [];
        const seeds = [];
        const errors = [];
        for (let i = 0; i < count; i++) {
            console.log(`📸 Generating image ${i + 1}/${count} for embedding`);
            // Use different seeds for variety
            const embeddingRequest = {
                ...request,
                seed: this.generateSeed(),
                characterName: `${request.characterName}_embed_${i + 1}`
            };
            const result = await this.generateCharacterImage(embeddingRequest);
            if (result.success && result.imageUrl) {
                images.push(result.imageUrl);
                seeds.push(result.seed);
                console.log(`✅ Embedding image ${i + 1} generated successfully`);
            }
            else {
                console.error(`❌ Embedding image ${i + 1} failed:`, result.error);
                errors.push(result.error || 'Unknown error');
            }
            // Small delay between generations
            if (i < count - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        const success = images.length > 0;
        console.log(`📊 Embedding generation completed: ${images.length}/${count} images successful`);
        return {
            success,
            images,
            seeds,
            error: errors.length > 0 ? `Some images failed: ${errors.join(', ')}` : undefined
        };
    }
}
export default ComfyUIService;
