import express from 'express';
import runPodService from '../services/RunPodService.js';
import CharacterGenerationService from '../services/CharacterGenerationService.js';
const router = express.Router();
// Test basic text response
router.get('/', (req, res) => {
    res.json({
        message: 'Test route is working!',
        timestamp: new Date().toISOString()
    });
});
// Test image generation with RunPod (GET version for easy browser testing)
router.get('/image-generation/:artStyle?', async (req, res) => {
    try {
        console.log('🧪 Testing image generation (GET)...');
        const artStyle = req.params.artStyle || 'anime';
        const testOptions = {
            characterName: 'Test Character',
            description: 'A beautiful anime girl with long blonde hair and blue eyes',
            artStyle: artStyle,
            selectedTags: {
                'character-type': ['female'],
                'appearance': ['blonde_hair', 'blue_eyes', 'long_hair'],
                'personality': ['confident']
            },
            width: 512,
            height: 768,
            userId: 'test-user',
            username: 'test-user'
        };
        console.log('🧪 Test options:', JSON.stringify(testOptions, null, 2));
        const result = await CharacterGenerationService.generateConsistentAvatar(testOptions);
        console.log('🧪 Generation result:', JSON.stringify(result, null, 2));
        res.json({
            success: true,
            result: result,
            testOptions: testOptions
        });
    }
    catch (error) {
        console.error('🧪 Test error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
    }
});
// Test image generation with RunPod (original POST version)
router.post('/image-generation', async (req, res) => {
    try {
        console.log('🧪 Testing image generation...');
        const testOptions = {
            characterName: 'Test Character',
            description: 'A beautiful anime girl with long blonde hair and blue eyes',
            artStyle: req.body.artStyle || 'anime',
            selectedTags: {
                'character-type': ['female'],
                'appearance': ['blonde_hair', 'blue_eyes', 'long_hair'],
                'personality': ['confident']
            },
            width: 512,
            height: 768,
            userId: 'test-user',
            username: 'test-user'
        };
        console.log('🧪 Test options:', JSON.stringify(testOptions, null, 2));
        const result = await CharacterGenerationService.generateConsistentAvatar(testOptions);
        console.log('🧪 Generation result:', JSON.stringify(result, null, 2));
        res.json({
            success: true,
            result: result,
            testOptions: testOptions
        });
    }
    catch (error) {
        console.error('🧪 Test error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
    }
});
// Test multiple API endpoints to find what works
router.get('/discover-endpoints/:artStyle?', async (req, res) => {
    try {
        const artStyle = req.params.artStyle || 'anime';
        console.log(`🔍 Discovering available endpoints for art style: ${artStyle}`);
        // Get the URL based on art style
        let testUrl;
        switch (artStyle.toLowerCase()) {
            case 'realistic':
                testUrl = process.env.RUNPOD_REALISTIC_URL;
                break;
            case 'anime':
            case 'cartoon':
            case 'fantasy':
            default:
                testUrl = process.env.RUNPOD_ANIME_CARTOON_FANTASY_URL;
                break;
        }
        if (!testUrl) {
            return res.json({
                success: false,
                error: 'URL not configured for this art style',
                artStyle: artStyle
            });
        }
        // Remove trailing slash for consistent testing
        testUrl = testUrl.replace(/\/$/, '');
        // Test various endpoint paths
        const endpointsToTest = [
            '/sdapi/v1/txt2img',
            '/api/v1/txt2img',
            '/txt2img',
            '/generate',
            '/api/txt2img',
            '/webui/api/v1/txt2img',
            '/stable-diffusion/txt2img'
        ];
        const results = [];
        for (const endpoint of endpointsToTest) {
            try {
                console.log(`🧪 Testing: ${testUrl}${endpoint}`);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                const testResponse = await fetch(`${testUrl}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: 'test',
                        steps: 1,
                        width: 64,
                        height: 64
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                results.push({
                    endpoint: endpoint,
                    status: testResponse.status,
                    statusText: testResponse.statusText,
                    success: testResponse.ok,
                    fullUrl: `${testUrl}${endpoint}`
                });
                console.log(`📊 ${endpoint}: ${testResponse.status} ${testResponse.statusText}`);
            }
            catch (error) {
                results.push({
                    endpoint: endpoint,
                    status: 'ERROR',
                    statusText: error instanceof Error ? error.message : 'Unknown error',
                    success: false,
                    fullUrl: `${testUrl}${endpoint}`
                });
            }
        }
        // Also test GET endpoints for discovery
        const getEndpoints = [
            '/sdapi/v1/options',
            '/api/v1/options',
            '/info',
            '/models',
            '/api/models',
            '/sdapi/v1/sd-models'
        ];
        for (const endpoint of getEndpoints) {
            try {
                console.log(`🔍 Testing GET: ${testUrl}${endpoint}`);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                const testResponse = await fetch(`${testUrl}${endpoint}`, {
                    method: 'GET',
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                results.push({
                    endpoint: `GET ${endpoint}`,
                    status: testResponse.status,
                    statusText: testResponse.statusText,
                    success: testResponse.ok,
                    fullUrl: `${testUrl}${endpoint}`
                });
            }
            catch (error) {
                results.push({
                    endpoint: `GET ${endpoint}`,
                    status: 'ERROR',
                    statusText: error instanceof Error ? error.message : 'Unknown error',
                    success: false,
                    fullUrl: `${testUrl}${endpoint}`
                });
            }
        }
        res.json({
            success: true,
            artStyle: artStyle,
            baseUrl: testUrl,
            results: results,
            summary: {
                workingEndpoints: results.filter(r => r.success),
                failedEndpoints: results.filter(r => !r.success),
                total: results.length
            }
        });
    }
    catch (error) {
        console.error('🔍 Endpoint discovery error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Test manual curl replication
router.post('/manual-curl/:artStyle?', async (req, res) => {
    try {
        const artStyle = req.params.artStyle || 'anime';
        console.log(`🧪 Manual curl test for art style: ${artStyle}`);
        // Get the URL based on art style
        let testUrl;
        let expectedModel;
        switch (artStyle.toLowerCase()) {
            case 'realistic':
                testUrl = process.env.RUNPOD_REALISTIC_URL;
                expectedModel = 'cyberrealistic.safetensors';
                break;
            case 'anime':
            case 'cartoon':
            case 'fantasy':
            default:
                testUrl = process.env.RUNPOD_ANIME_CARTOON_FANTASY_URL;
                expectedModel = 'diving.safetensors';
                break;
        }
        if (!testUrl) {
            return res.json({
                success: false,
                error: 'URL not configured for this art style'
            });
        }
        // Remove trailing slash
        testUrl = testUrl.replace(/\/$/, '');
        // Exact payload from user's working curl
        const payload = {
            prompt: "masterpiece, ultra-HD, impressionism, high detail, best quality, very aesthetic, 8k, sharp focus, depth of field, hyper realistic, vibrant colors, film grain. 1woman, solo, 20yo, thick lips, (gyaru girl, dark skin, detailed face), grin expression, silver ash hair, twintails, large breasts, wide hips, plump, curvy figure, thick thighs, glowing skin, wearing a yellow bikini and yellow platform boots, standing, elbow to blue floor, front bent, top-down bottom-up, legs together, simple blue background and floor, simple blue theme, shoot from behind with ass focus, dutch angle, dynamic composition, dynamic angle, foreshortening.",
            negative_prompt: "(worst quality, low quality, normal quality, caucasian, toon), lowres, bad anatomy, bad hands, signature, watermarks, ugly, imperfect eyes, unnatural face, unnatural body, error, extra limb, missing limbs, Child, muscular, colored skin",
            width: 512,
            height: 768,
            steps: 20,
            cfg_scale: 8,
            sampler_index: "Euler a",
            enable_hr: true,
            hr_upscaler: "Latent",
            denoising_strength: 0.4,
            override_settings: {
                sd_model_checkpoint: expectedModel
            }
        };
        console.log(`🌐 Making request to: ${testUrl}/sdapi/v1/txt2img`);
        console.log(`🔧 Expected model: ${expectedModel}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        const response = await fetch(`${testUrl}/sdapi/v1/txt2img`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        console.log(`📡 Response status: ${response.status}`);
        let responseData;
        try {
            responseData = await response.json();
        }
        catch (e) {
            responseData = await response.text();
        }
        res.json({
            success: response.ok,
            artStyle: artStyle,
            url: `${testUrl}/sdapi/v1/txt2img`,
            requestPayload: payload,
            response: {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                data: responseData
            }
        });
    }
    catch (error) {
        console.error('🧪 Manual curl test error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
    }
});
// Simple URL connectivity test
router.get('/runpod-ping/:artStyle?', async (req, res) => {
    try {
        const artStyle = req.params.artStyle || 'anime';
        console.log(`🏓 Pinging RunPod for art style: ${artStyle}`);
        // Get the URL based on art style
        let testUrl;
        switch (artStyle.toLowerCase()) {
            case 'realistic':
                testUrl = process.env.RUNPOD_REALISTIC_URL;
                break;
            case 'anime':
            case 'cartoon':
            case 'fantasy':
            default:
                testUrl = process.env.RUNPOD_ANIME_CARTOON_FANTASY_URL;
                break;
        }
        if (!testUrl) {
            return res.json({
                success: false,
                error: 'URL not configured for this art style',
                artStyle: artStyle,
                environmentVars: {
                    RUNPOD_ANIME_CARTOON_FANTASY_URL: process.env.RUNPOD_ANIME_CARTOON_FANTASY_URL || 'NOT SET',
                    RUNPOD_REALISTIC_URL: process.env.RUNPOD_REALISTIC_URL || 'NOT SET'
                }
            });
        }
        console.log(`🌐 Testing URL: ${testUrl}`);
        // Test basic connectivity
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
            const pingResponse = await fetch(`${testUrl}/sdapi/v1/progress`, {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            console.log(`📡 Ping response status: ${pingResponse.status}`);
            res.json({
                success: pingResponse.ok,
                artStyle: artStyle,
                testUrl: testUrl,
                responseStatus: pingResponse.status,
                responseOk: pingResponse.ok,
                message: pingResponse.ok ? 'URL is reachable' : 'URL returned error status'
            });
        }
        catch (error) {
            clearTimeout(timeoutId);
            console.error('🏓 Ping test error:', error);
            res.json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                artStyle: req.params.artStyle || 'anime'
            });
        }
    }
    catch (outerError) {
        console.error('🏓 Outer ping test error:', outerError);
        res.json({
            success: false,
            error: outerError instanceof Error ? outerError.message : 'Unknown error',
            artStyle: req.params.artStyle || 'anime'
        });
    }
});
// Test RunPod health check for specific art style
router.get('/runpod-health/:artStyle?', async (req, res) => {
    try {
        const artStyle = req.params.artStyle || 'anime';
        console.log(`🧪 Testing RunPod health for art style: ${artStyle}`);
        // Create a minimal test request to avoid timeouts
        const testResult = await runPodService.generateImage({
            prompt: 'test',
            negativePrompt: 'blurry',
            width: 256, // Smaller size for faster generation
            height: 256,
            steps: 5, // Minimal steps for quick test
            cfgScale: 7,
            artStyle: artStyle,
            characterData: {
                characterName: 'Test',
                characterPersona: 'Test character'
            }
        });
        res.json({
            success: true,
            artStyle: artStyle,
            runpodResult: testResult,
            environmentVars: {
                RUNPOD_ANIME_CARTOON_FANTASY_URL: process.env.RUNPOD_ANIME_CARTOON_FANTASY_URL || 'NOT SET',
                RUNPOD_REALISTIC_URL: process.env.RUNPOD_REALISTIC_URL || 'NOT SET',
                RUNPOD_WEBUI_URL: process.env.RUNPOD_WEBUI_URL || 'NOT SET'
            }
        });
    }
    catch (error) {
        console.error('🧪 RunPod health test error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
export default router;
