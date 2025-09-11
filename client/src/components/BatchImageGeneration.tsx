// Frontend Integration Example for Batch Image Generation

/**
 * React component example for batch image generation
 */

import React, { useState, useEffect } from 'react';

interface ImageGenerationProps {
  characterId: string;
  authToken: string;
}

interface GeneratedImage {
  url: string;
  filename: string;
  createdAt: string;
}

export const BatchImageGeneration: React.FC<ImageGenerationProps> = ({ characterId, authToken }) => {
  const [prompt, setPrompt] = useState('');
  const [numImages, setNumImages] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [allCharacterImages, setAllCharacterImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Batch generation handler
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/image-generation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          characterId,
          prompt,
          quantity: numImages, // Use 'quantity' instead of 'numImages' to match backend
          width: 1024,
          height: 1536,
          steps: 25
        })
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Handle the async job response
        const jobId = result.data.jobId;
        console.log(`✅ Image generation job started: ${jobId}`);
        
        // Poll for job completion
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/image-generation/jobs/${jobId}`, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });
            const statusResult = await statusResponse.json();
            
            if (statusResult.success) {
              const jobData = statusResult.data;
              
              if (jobData.status === 'completed' && jobData.result) {
                clearInterval(pollInterval);
                
                // Add generated images to the list
                const imageUrls = jobData.result.imageUrls || [jobData.result.imageUrl];
                setGeneratedImages(imageUrls);
                console.log(`✅ Generated ${imageUrls.length} images successfully`);
                
                setIsGenerating(false);
                
                // Refresh the character images gallery
                loadCharacterImages();
              } else if (jobData.status === 'failed') {
                clearInterval(pollInterval);
                console.error('❌ Image generation failed:', jobData.error);
                setError(jobData.error || 'Generation failed');
                setIsGenerating(false);
              }
              // If job is still in progress, continue polling
            }
          } catch (pollError) {
            console.error('❌ Error polling job status:', pollError);
          }
        }, 2000); // Poll every 2 seconds
        
        // Set a timeout to stop polling after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (isGenerating) {
            console.error('❌ Job polling timeout');
            setError('Generation timeout - please try again');
            setIsGenerating(false);
          }
        }, 300000);
        
      } else {
        setError(result.error || 'Generation failed');
        setIsGenerating(false);
      }
    } catch (err) {
      setError('Network error occurred');
      setIsGenerating(false);
    }
  };

  // Load all character images for the workshop
  const loadCharacterImages = async () => {
    try {
      const response = await fetch(`/api/image-generation/character/${characterId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setAllCharacterImages(result.data.images || []);
      }
    } catch (err) {
      console.error('Failed to load character images:', err);
    }
  };

  // Load character images on component mount
  useEffect(() => {
    loadCharacterImages();
  }, [characterId, authToken]);

  return (
    <div className="batch-image-generation">
      <h2>Generate Images</h2>
      
      {/* Generation Controls */}
      <div className="generation-controls">
        <div className="prompt-input">
          <label htmlFor="prompt">Prompt:</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to generate..."
            rows={3}
          />
        </div>

        <div className="num-images-selector">
          <label htmlFor="numImages">Number of Images:</label>
          <select
            id="numImages"
            value={numImages}
            onChange={(e) => setNumImages(parseInt(e.target.value))}
          >
            <option value={1}>1 Image</option>
            <option value={2}>2 Images</option>
            <option value={4}>4 Images</option>
            <option value={8}>8 Images</option>
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="generate-btn"
        >
          {isGenerating ? `Generating ${numImages} image(s)...` : `Generate ${numImages} Image(s)`}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* Recently Generated Images */}
      {generatedImages.length > 0 && (
        <div className="recent-generation">
          <h3>Recently Generated ({generatedImages.length} images)</h3>
          <div className="image-grid">
            {generatedImages.map((imageUrl, index) => (
              <div key={index} className="image-item">
                <img 
                  src={imageUrl} 
                  alt={`Generated ${index + 1}`}
                  loading="lazy"
                />
                <p>Image {index + 1}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Character Image Gallery/Workshop */}
      <div className="character-workshop">
        <h3>Character Workshop ({allCharacterImages.length} total images)</h3>
        <div className="image-gallery">
          {allCharacterImages.map((image, index) => (
            <div key={image.filename} className="gallery-item">
              <img 
                src={image.url} 
                alt={image.filename}
                loading="lazy"
              />
              <div className="image-info">
                <p className="filename">{image.filename}</p>
                <p className="date">{new Date(image.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>

        {allCharacterImages.length === 0 && (
          <p className="no-images">No images generated yet. Create some above!</p>
        )}
      </div>
    </div>
  );
};

/* CSS Styles */
const styles = `
.batch-image-generation {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.generation-controls {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.prompt-input {
  margin-bottom: 15px;
}

.prompt-input textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
}

.num-images-selector {
  margin-bottom: 15px;
}

.num-images-selector select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.generate-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.generate-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  color: #c00;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.image-grid, .image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.image-item, .gallery-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.image-item img, .gallery-item img {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.image-info {
  padding: 10px;
}

.filename {
  font-weight: bold;
  margin: 0 0 5px 0;
}

.date {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.no-images {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 40px;
}
`;

export default BatchImageGeneration;
